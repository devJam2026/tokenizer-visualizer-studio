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


class LlamaTokenizer:
    """
    Sub-engine responsible for Meta's SentencePiece algorithm (LLaMA).
    Treats whitespace as an explicit character (U+2581 ' ') and retains full layouts.
    """
    
    def __init__(self):
        self.tokenizer = None
        self._load_failed = False

    @staticmethod
    def hash_token(token: str) -> int:
        """Generates stable, reproducible numeric Token IDs for visual chip rendering."""
        hasher = hashlib.md5(token.encode('utf-8'))
        return 1000 + (int(hasher.hexdigest(), 16) % 49000)

    def _load_tokenizer(self):
        """Loads a public mock LLaMA tokenizer from Hugging Face to avoid login gates."""
        if self.tokenizer is not None or self._load_failed or not HAS_TRANSFORMERS:
            return
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                "hf-internal-testing/llama-tokenizer",
                local_files_only=False
            )
        except Exception as e:
            print(f"LLaMA tokenizer initialization failed: {e}. Activating fallback...")
            self._load_failed = True

    def tokenize(self, text: str) -> Dict[str, Any]:
        """
        Slices text using LLaMA's SentencePiece token maps.
        Filters out initial BOS start-of-sentence tokens (1) for cleaner rendering.
        """
        self._load_tokenizer()

        # Offline safety fallback
        if self.tokenizer is None or not HAS_TRANSFORMERS:
            ids, tokens, offsets = self.simulate_llama_sentencepiece(text)
            return {"tokenIds": ids, "tokens": tokens, "offsets": offsets, "isFallback": True}

        try:
            encoded = self.tokenizer(text, return_offsets_mapping=True)
            ids = encoded["input_ids"]
            raw_tokens = self.tokenizer.convert_ids_to_tokens(ids)
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
            print(f"Error in LLaMA tokenizer run: {e}")
            ids, tokens, offsets = self.simulate_llama_sentencepiece(text)
            return {"tokenIds": ids, "tokens": tokens, "offsets": offsets, "isFallback": True}

    @classmethod
    def simulate_llama_sentencepiece(cls, text: str) -> Tuple[List[int], List[str], List[List[int]]]:
        """
        Pure-Python local simulation of SentencePiece splitting.
        Preserves spacing boundaries using the explicit block character U+2581 ' '.
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

            # Calculate character coordinates based on the original string
            start_idx = current_idx
            end_idx = current_idx + len(part)
            current_idx = end_idx

            # SentencePiece replaces standard spaces with block characters ' '
            sp_token = part.replace(" ", " ")
            if not sp_token:
                sp_token = " "

            # Slices long terms in half to mimic SentencePiece sub-vocabulary splits
            if len(part.strip()) > 6:
                strip_part = part.lstrip()
                space_len = len(part) - len(strip_part)
                split_point = space_len + (len(strip_part) // 2)

                # First slice contains the leading spacing block
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
