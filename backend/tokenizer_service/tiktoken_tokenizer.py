import re
import hashlib
import traceback
from typing import Dict, Any

# =====================================================================
# LIBRARY IMPORTS WITH GRACEFUL DEGRADATION
# =====================================================================
try:
    import tiktoken
    HAS_TIKTOKEN = True
except ImportError:
    HAS_TIKTOKEN = False


class TiktokenTokenizer:
    """
    Sub-engine responsible for OpenAI's Byte-Pair Encoding (BPE) algorithms.
    Supports both cl100k_base (GPT-4) and o200k_base (GPT-4o) vocabularies.
    Implements high-fidelity byte-to-character offset alignment and a fallback simulator.
    """
    
    def __init__(self):
        self.encodings = {}
        self._warmup_done = False

    def warmup(self):
        """
        Pre-loads the tiktoken encodings to prevent layout latency on the first API call.
        Works entirely offline using cached tiktoken dictionary registries.
        """
        if self._warmup_done or not HAS_TIKTOKEN:
            return
        try:
            self.encodings["cl100k_base"] = tiktoken.get_encoding("cl100k_base")
            try:
                self.encodings["o200k_base"] = tiktoken.get_encoding("o200k_base")
            except Exception:
                # Fallback to cl100k if o200k is missing in older library installations
                self.encodings["o200k_base"] = self.encodings["cl100k_base"]
            self._warmup_done = True
        except Exception as e:
            print(f"Warning: tiktoken pre-initialization failed: {e}")

    def tokenize(self, text: str, model_name: str = "cl100k_base") -> Dict[str, Any]:
        """
        Tokenizes the input text using OpenAI BPE.
        Performs byte-to-character alignment to ensure character highlight chips are accurate.
        """
        self.warmup()
        encoding = self.encodings.get(model_name)

        # Trigger pure-Python simulation fallback if tiktoken library is missing
        if not encoding or not HAS_TIKTOKEN:
            return self.simulate_bpe_fallback(text)

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
            return self.simulate_bpe_fallback(text)

    def simulate_bpe_fallback(self, text: str) -> Dict[str, Any]:
        """
        Pure-Python fallback simulation for BPE tokenizers when tiktoken is unavailable.
        Uses regex word-boundary patterns and hashes to create consistent token divisions.
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
