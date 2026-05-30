from typing import Dict, Any

# =====================================================================
# MODULAR PACKAGED RELATIVE IMPORTS
# =====================================================================
# We load package sub-modules using standard Python relative syntax.
# =====================================================================
from .tiktoken_tokenizer import TiktokenTokenizer
from .bert_tokenizer import BertTokenizer
from .llama_tokenizer import LlamaTokenizer
from .heuristic_analyzer import HeuristicAnalyzer


class TokenizerService:
    """
    Unified coordination service serving as the single gateway for tokenization.
    Exposes cl100k_base, o200k_base, BERT, LLaMA, and local heuristic analysis.
    Delegates parsing tasks to segregated, specialized sub-engines.
    """
    
    def __init__(self):
        # Initialize the modular tokenizer sub-engines
        self.tiktoken_engine = TiktokenTokenizer()
        self.bert_engine = BertTokenizer()
        self.llama_engine = LlamaTokenizer()

    def tokenize_tiktoken(self, text: str, model_name: str = "cl100k_base") -> Dict[str, Any]:
        """
        Tokenizes input using OpenAI's tiktoken BPE (cl100k_base or o200k_base).
        Delegates decoding and byte character offset alignment to TiktokenTokenizer.
        """
        return self.tiktoken_engine.tokenize(text, model_name)

    def tokenize_bert(self, text: str) -> Dict[str, Any]:
        """
        Tokenizes text using Google's WordPiece algorithm.
        Delegates dictionary loading and CLS/SEP boundary mapping to BertTokenizer.
        """
        return self.bert_engine.tokenize(text)

    def tokenize_llama(self, text: str) -> Dict[str, Any]:
        """
        Tokenizes text using Meta's SentencePiece algorithm.
        Delegates spacing preservation and BOS token filtering to LlamaTokenizer.
        """
        return self.llama_engine.tokenize(text)

    def analyze_text_heuristics(self, text: str) -> str:
        """
        Compiles a text profiling report using offline heuristic rules.
        Delegates whitespace and multi-byte calculations to HeuristicAnalyzer.
        """
        return HeuristicAnalyzer.analyze(text)
