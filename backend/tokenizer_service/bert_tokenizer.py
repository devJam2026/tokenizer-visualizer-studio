import re
import hashlib
from typing import Dict, Any, Tuple, List

# =====================================================================
# LIBRARY IMPORTS WITH GRACEFUL DEGRADATION
# =====================================================================
try:
    from transformers import AutoTokenizer
    HAS_TRANSFORMERS = True
except ImportError:
    HAS_TRANSFORMERS = False


class BertTokenizer:
    """
    Sub-engine responsible for Google's WordPiece algorithm (BERT).
    Integrates with HuggingFace pre-trained weights and includes a robust local simulator.
    """
    
    def __init__(self):
        self.tokenizer = None
        self._load_failed = False

    @staticmethod
    def hash_token(token: str) -> int:
        """
        Generates a repeatable, deterministic numeric ID for subword strings.
        Ensures the same subword chip yields identical IDs without dictionary storage.
        """
        hasher = hashlib.md5(token.encode('utf-8'))
        return 1000 + (int(hasher.hexdigest(), 16) % 49000)

    def _load_tokenizer(self):
        """Attempts to load the uncased BERT tokenizer. Handles offline errors gracefully."""
        if self.tokenizer is not None or self._load_failed or not HAS_TRANSFORMERS:
            return
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                "bert-base-uncased", 
                local_files_only=False
            )
        except Exception as e:
            print(f"BERT tokenizer initialization failed: {e}. Activating fallback...")
            self._load_failed = True

    def tokenize(self, text: str) -> Dict[str, Any]:
        """
        Slices input text using WordPiece boundaries.
        Strips structural [CLS]/[SEP] markers to allow clean character highlight alignment.
        """
        self._load_tokenizer()

        # Fallback immediately if transformers packages or model caches are unavailable
        if self.tokenizer is None or not HAS_TRANSFORMERS:
            ids, tokens, offsets = self.simulate_bert_wordpiece(text)
            return {"tokenIds": ids, "tokens": tokens, "offsets": offsets, "isFallback": True}

        try:
            # Hugging Face fast tokenizers provide native character offset maps!
            encoded = self.tokenizer(text, return_offsets_mapping=True)
            ids = encoded["input_ids"]
            raw_tokens = self.tokenizer.convert_ids_to_tokens(ids)
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
            print(f"Error in BERT tokenizer run: {e}")
            ids, tokens, offsets = self.simulate_bert_wordpiece(text)
            return {"tokenIds": ids, "tokens": tokens, "offsets": offsets, "isFallback": True}

    @classmethod
    def simulate_bert_wordpiece(cls, text: str) -> Tuple[List[int], List[str], List[List[int]]]:
        """
        Pure-Python local simulation of BERT WordPiece segmentation.
        Segments long words into semantic roots and continuations prefixed with '##'.
        """
        # Split text into letters, numbers, spaces, and punctuation blocks
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
            if part.isspace():
                continue

            # Simulate lowercase dictionary checking
            word = part.lower()

            # Short words or symbols are kept intact
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
                # Part 2: Continuation of word (prefixed with '##')
                part2 = "##" + word[split_point:]

                token_ids.append(cls.hash_token(part1))
                tokens.append(part1)
                offsets.append([start_idx, start_idx + split_point])

                token_ids.append(cls.hash_token(part2))
                tokens.append(part2)
                offsets.append([start_idx + split_point, end_idx])

        return token_ids, tokens, offsets
