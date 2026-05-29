import re
import hashlib
import traceback
from typing import List, Tuple, Dict, Any

# =====================================================================
# LIBRARY IMPORTS WITH GRACEFUL DEGRADATION
# =====================================================================
# We attempt to import tiktoken (OpenAI's high-speed BPE tokenizer) and 
# Hugging Face's transformers. If the libraries are missing or if the 
# system is running offline, we toggle flag indicators to activate our
# pure-Python high-fidelity fallback simulators.
# =====================================================================
try:
    import tiktoken
    HAS_TIKTOKEN = True
except ImportError:
    HAS_TIKTOKEN = False

try:
    from transformers import AutoTokenizer
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False


class FallbackTokenizer:
    """
    A didactic, pure-Python subword tokenization simulation engine.
    Used when running offline or in restricted environments, this class
    implements local rule-based models of BPE, WordPiece, and SentencePiece
    to visually demonstrate how sub-word splitting handles unseen words,
    spacing preservation, and structural prefixes.
    """
    
    @staticmethod
    def hash_token(token: str) -> int:
        """
        Generates a stable, deterministic numeric Token ID for any string.
        By hashing the token, we guarantee that the same subword chunk (e.g. ' bank')
        will ALWAYS yield the identical ID throughout the session, matching the
        behavior of real vocabularies. The IDs are mapped between 1000 and 50000.
        """
        # We use MD5 to get a cryptographic, repeatable hash of the UTF-8 bytes
        hasher = hashlib.md5(token.encode('utf-8'))
        # Convert hex digest to integer and bound it to a standard vocabulary range
        return 1000 + (int(hasher.hexdigest(), 16) % 49000)

    @classmethod
    def simulate_bert_wordpiece(cls, text: str) -> Tuple[List[int], List[str], List[List[int]]]:
        """
        Simulates WordPiece tokenization (Google BERT style).
        
        WordPiece split mechanics:
        1. Text is split into words (punctuation is separated).
        2. Uppercasing is stripped (simulating an 'uncased' vocabulary).
        3. If a word is recognized, it's kept whole.
        4. If a word is long or unrecognized, it's sliced into subwords.
        5. Subwords that are NOT the start of a word are prefixed with '##'
           (e.g., 'blocking' -> ['block', '##ing']).
        6. Character indices are mapped precisely to original spans.
        """
        # Find all alphanumeric sequences, individual symbols, or whitespaces
        words_and_spaces = re.findall(r'\w+|[^\w\s]|\s+', text)
        token_ids = []
        tokens = []
        offsets = []
        
        current_idx = 0
        for part in words_and_spaces:
            if not part:
                continue
            
            # Record current character span locations
            start_idx = current_idx
            end_idx = current_idx + len(part)
            current_idx = end_idx
            
            # WordPiece discards raw spacing characters in token outputs
            # (spaces act merely as word boundary delimiters)
            if part.isspace():
                continue
                
            # Simulate lowercase dictionary checking
            word = part.lower()
            
            # Short words or symbols are kept intact (no subword splitting needed)
            if len(word) <= 4 or part in [".", ",", "!", "?", "-", "_", "@", "/", "\\"]:
                token_ids.append(cls.hash_token(word))
                tokens.append(word)
                offsets.append([start_idx, end_idx])
            else:
                # Simulate sub-word segmentation at common morpheme boundaries
                split_point = len(word) // 2
                if word.endswith("ing") and len(word) > 5:
                    split_point = len(word) - 3
                elif word.endswith("tion") and len(word) > 6:
                    split_point = len(word) - 4
                elif word.endswith("er") and len(word) > 4:
                    split_point = len(word) - 2
                elif word.endswith("s") and not word.endswith("ss"):
                    split_point = len(word) - 1
                
                # Part 1: Start of word (no prefix)
                part1 = word[:split_point]
                # Part 2: Continuation of word (prefixed with '##' to indicate attachment)
                part2 = "##" + word[split_point:]
                
                # Append first slice
                token_ids.append(cls.hash_token(part1))
                tokens.append(part1)
                offsets.append([start_idx, start_idx + split_point])
                
                # Append second slice
                token_ids.append(cls.hash_token(part2))
                tokens.append(part2)
                offsets.append([start_idx + split_point, end_idx])
                
        return token_ids, tokens, offsets

    @classmethod
    def simulate_llama_sentencepiece(cls, text: str) -> Tuple[List[int], List[str], List[List[int]]]:
        """
        Simulates SentencePiece tokenization (Meta LLaMA style).
        
        SentencePiece split mechanics:
        1. Unlike WordPiece, spaces are treated as explicit characters.
        2. Spaces are replaced by U+2581 (lower half block ' ').
        3. Spacing U+2581 is pre-pended to the succeeding word.
        4. Long words are sliced into subword chunks without prefixes.
        5. All characters, including whitespaces, are preserved in the stream.
        """
        token_ids = []
        tokens = []
        offsets = []
        
        # Match words with optional leading spacing, standalone spaces, or symbols
        words_or_symbols = re.findall(r'\s*\w+|\s+|[^\w\s]', text)
        
        current_idx = 0
        for part in words_or_symbols:
            if not part:
                continue
            
            # Calculate char offsets based on original text indexes
            start_idx = current_idx
            end_idx = current_idx + len(part)
            current_idx = end_idx
            
            # SentencePiece replaces standard spaces with block characters ' '
            sp_token = part.replace(" ", " ")
            if not sp_token:
                sp_token = " "
                
            # If word is long, simulate BPE-style split
            if len(part.strip()) > 6:
                strip_part = part.lstrip()
                space_len = len(part) - len(strip_part)
                split_point = space_len + (len(strip_part) // 2)
                
                # Slices preserve the leading U+2581 spacing indicator in the first part
                t1 = part[:split_point].replace(" ", " ")
                t2 = part[split_point:].replace(" ", " ")
                
                token_ids.append(cls.hash_token(t1))
                tokens.append(t1)
                offsets.append([start_idx, start_idx + split_point])
                
                token_ids.append(cls.hash_token(t2))
                tokens.append(t2)
                offsets.append([start_idx + split_point, end_idx])
            else:
                token_ids.append(cls.hash_token(sp_token))
                tokens.append(sp_token)
                offsets.append([start_idx, end_idx])
                
        return token_ids, tokens, offsets


class TokenizerService:
    """
    Orchestration layer that interfaces with standard Python packages
    (tiktoken, transformers) and manages fail-safe fallback simulations.
    Provides precise character offset coordinates for interactive UI chip highlights.
    """
    
    def __init__(self):
        # Cache loaded tokenizer structures to prevent redundant disk reads
        self.tiktoken_encodings = {}
        self.hf_tokenizers = {}
        self.warmup_attempted = False

    def warmup(self):
        """
        Pre-initializes the lightweight models during idle periods.
        Avoids blockages during the first API query.
        """
        if self.warmup_attempted:
            return
        self.warmup_attempted = True
        
        # Tiktoken loading is extremely fast and works 100% offline
        if HAS_TIKTOKEN:
            try:
                self.tiktoken_encodings["cl100k_base"] = tiktoken.get_encoding("cl100k_base")
                try:
                    self.tiktoken_encodings["o200k_base"] = tiktoken.get_encoding("o200k_base")
                except Exception:
                    # Fallback to cl100k if o200k is missing in older library installations
                    self.tiktoken_encodings["o200k_base"] = self.tiktoken_encodings["cl100k_base"]
            except Exception as e:
                print(f"Warning: tiktoken pre-initialization failed: {e}")

    def tokenize_tiktoken(self, text: str, model_name: str = "cl100k_base") -> Dict[str, Any]:
        """
        Tokenizes input using tiktoken (BPE).
        Performs high-fidelity byte-to-character offset alignment.
        """
        self.warmup()
        encoding = self.tiktoken_encodings.get(model_name)
        
        # If library import failed, we trigger the fallback simulation immediately
        if not encoding or not HAS_TIKTOKEN:
            return self.simulate_bpe_fallback(text, model_name)
            
        try:
            ids = encoding.encode(text)
            offsets = []
            tokens_decoded = []
            
            # Align token byte slices with original character boundaries
            text_bytes = text.encode('utf-8')
            current_byte_idx = 0
            
            for token_id in ids:
                # 1. Decode token back to its raw UTF-8 byte stream
                token_byte_piece = encoding.decode_single_token_bytes(token_id)
                length = len(token_byte_piece)
                
                start_byte = current_byte_idx
                end_byte = current_byte_idx + length
                current_byte_idx = end_byte
                
                # 2. Map raw byte indices back to valid string character coordinates
                # (We slice the prefix bytes and count the decoded character lengths)
                start_char = len(text_bytes[:start_byte].decode('utf-8', errors='ignore'))
                end_char = len(text_bytes[:end_byte].decode('utf-8', errors='ignore'))
                
                # 3. Retrieve the precise characters from the original string
                token_str = text[start_char:end_char]
                tokens_decoded.append(token_str)
                offsets.append([start_char, end_char])
                
            return {
                "tokenIds": ids,
                "tokens": tokens_decoded,
                "offsets": offsets,
                "isFallback": False
            }
        except Exception as e:
            print(f"Error in tiktoken tokenization: {e}")
            traceback.print_exc()
            return self.simulate_bpe_fallback(text, model_name)

    def simulate_bpe_fallback(self, text: str, model_name: str) -> Dict[str, Any]:
        """
        Fallback simulation for tiktoken BPE tokenizer when tiktoken package is unavailable.
        Uses spacing splits and hashes to mirror BPE structures.
        """
        token_ids = []
        tokens = []
        offsets = []
        
        # Match words with leading space, spaces, or individual special characters
        parts = re.findall(r'\s*\w+|\s+|[^\w\s]', text)
        current_idx = 0
        for p in parts:
            if not p:
                continue
            start = current_idx
            end = current_idx + len(p)
            current_idx = end
            
            # Slices long strings in half to simulate subword merge configurations
            if len(p.strip()) > 5:
                w = p.lstrip()
                space_len = len(p) - len(w)
                split = space_len + (len(w) // 2)
                
                p1 = p[:split]
                p2 = p[split:]
                
                tokens.append(p1)
                token_ids.append(1000 + (hash(p1) % 49000))
                offsets.append([start, start + split])
                
                tokens.append(p2)
                token_ids.append(1000 + (hash(p2) % 49000))
                offsets.append([start + split, end])
            else:
                tokens.append(p)
                token_ids.append(1000 + (hash(p) % 49000))
                offsets.append([start, end])
                
        return {
            "tokenIds": token_ids,
            "tokens": tokens,
            "offsets": offsets,
            "isFallback": True
        }

    def tokenize_bert(self, text: str) -> Dict[str, Any]:
        """
        Tokenizes text using BERT WordPiece.
        Falls back to local fallback simulation if transformers package is unavailable
        or if offline model download fails.
        """
        if not HAS_TRANSFORMERS:
            # Trigger pure-Python fallback WordPiece simulator
            ids, tokens, offsets = FallbackTokenizer.simulate_bert_wordpiece(text)
            return {"tokenIds": ids, "tokens": tokens, "offsets": offsets, "isFallback": True}
            
        try:
            if "bert" not in self.hf_tokenizers:
                try:
                    # Attempt to load the fast BERT tokenizer locally or download it
                    self.hf_tokenizers["bert"] = AutoTokenizer.from_pretrained(
                        "bert-base-uncased", 
                        local_files_only=False
                    )
                except Exception:
                    print("BERT model files not found. Initializing local fallback...")
                    ids, tokens, offsets = FallbackTokenizer.simulate_bert_wordpiece(text)
                    return {"tokenIds": ids, "tokens": tokens, "offsets": offsets, "isFallback": True}
                    
            tokenizer = self.hf_tokenizers["bert"]
            
            # Hugging Face fast tokenizers provide native character offset maps!
            encoded = tokenizer(text, return_offsets_mapping=True)
            ids = encoded["input_ids"]
            raw_tokens = tokenizer.convert_ids_to_tokens(ids)
            raw_offsets = encoded["offset_mapping"]
            
            filtered_ids = []
            filtered_tokens = []
            filtered_offsets = []
            
            # Filter out BERT structural markers [CLS] (101) and [SEP] (102) 
            # to let the user focus strictly on character-aligned sub-word chips
            for token_id, tok, offset in zip(ids, raw_tokens, raw_offsets):
                if token_id in [101, 102]:
                    continue
                filtered_ids.append(token_id)
                filtered_tokens.append(tok)
                filtered_offsets.append(list(offset))
                
            return {
                "tokenIds": filtered_ids,
                "tokens": filtered_tokens,
                "offsets": filtered_offsets,
                "isFallback": False
            }
        except Exception as e:
            print(f"Error in BERT tokenizer load/run: {e}")
            ids, tokens, offsets = FallbackTokenizer.simulate_bert_wordpiece(text)
            return {"tokenIds": ids, "tokens": tokens, "offsets": offsets, "isFallback": True}

    def tokenize_llama(self, text: str) -> Dict[str, Any]:
        """
        Tokenizes text using LLaMA SentencePiece.
        Falls back to local fallback simulation if transformers package is unavailable
        or if offline model download fails.
        """
        if not HAS_TRANSFORMERS:
            # Trigger pure-Python fallback SentencePiece simulator
            ids, tokens, offsets = FallbackTokenizer.simulate_llama_sentencepiece(text)
            return {"tokenIds": ids, "tokens": tokens, "offsets": offsets, "isFallback": True}
            
        try:
            if "llama" not in self.hf_tokenizers:
                try:
                    # Public test LLaMA tokenizer avoids strict HuggingFace gated locks
                    self.hf_tokenizers["llama"] = AutoTokenizer.from_pretrained(
                        "hf-internal-testing/llama-tokenizer",
                        local_files_only=False
                    )
                except Exception:
                    print("LLaMA model files not found. Initializing local fallback...")
                    ids, tokens, offsets = FallbackTokenizer.simulate_llama_sentencepiece(text)
                    return {"tokenIds": ids, "tokens": tokens, "offsets": offsets, "isFallback": True}
                    
            tokenizer = self.hf_tokenizers["llama"]
            encoded = tokenizer(text, return_offsets_mapping=True)
            ids = encoded["input_ids"]
            
            raw_tokens = tokenizer.convert_ids_to_tokens(ids)
            raw_offsets = encoded["offset_mapping"]
            
            filtered_ids = []
            filtered_tokens = []
            filtered_offsets = []
            
            # Filter out start-of-sentence (BOS) token (1) for clean visual chip mapping
            for token_id, tok, offset in zip(ids, raw_tokens, raw_offsets):
                if token_id in [1, 2]:
                    continue
                filtered_ids.append(token_id)
                filtered_tokens.append(tok)
                filtered_offsets.append(list(offset))
                
            return {
                "tokenIds": filtered_ids,
                "tokens": filtered_tokens,
                "offsets": filtered_offsets,
                "isFallback": False
            }
        except Exception as e:
            print(f"Error in LLaMA tokenizer load/run: {e}")
            ids, tokens, offsets = FallbackTokenizer.simulate_llama_sentencepiece(text)
            return {"tokenIds": ids, "tokens": tokens, "offsets": offsets, "isFallback": True}
