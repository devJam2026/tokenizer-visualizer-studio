import os
from typing import Optional
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from tokenizer_service import TokenizerService, HAS_TIKTOKEN, HAS_TRANSFORMERS
from openai_service import OpenAIService

app = FastAPI(
    title="Tokenizer Visualizer Studio API",
    description="Backend service providing tokenization offsets, IDs, and financial metrics.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize tokenizer service
tokenizer_service = TokenizerService()

class TokenizeRequest(BaseModel):
    text: str = Field(..., description="The input text to analyze and slice into token chips.")

# Model pricing structures (Cost per 1M tokens in USD)
MODEL_PRICING = {
    "cl100k_base": 5.00,  # GPT-4 pricing level
    "o200k_base": 2.50,   # GPT-4o pricing level
    "llama": 0.20,        # Open-source host pricing (e.g. Groq/Meta)
    "bert": 0.05          # Local host representation
}

@app.post("/api/tokenize")
async def tokenize_all(request: TokenizeRequest):
    """
    Tokenizes the input text across all 4 tokenizer engines in parallel
    to deliver instant comparisons and financial estimation reports.
    """
    text = request.text
    if not text:
        # Return empty structures if text is empty
        empty_res = {"tokens": [], "tokenIds": [], "offsets": [], "isFallback": False, "tokenCount": 0, "ratio": 0.0, "costPerRequest": 0.0, "costPerMillionRequests": 0.0}
        return {
            "text": "",
            "charCount": 0,
            "tokenizers": {
                "cl100k_base": empty_res,
                "o200k_base": empty_res,
                "llama": empty_res,
                "bert": empty_res
            }
        }
    
    char_count = len(text)
    
    try:
        # Tokenize using Tiktoken cl100k_base
        cl100_data = tokenizer_service.tokenize_tiktoken(text, "cl100k_base")
        cl100_count = len(cl100_data["tokenIds"])
        cl100_ratio = round(cl100_count / char_count, 3) if char_count > 0 else 0
        cl100_cost_per_req = round((cl100_count / 1_000_000) * MODEL_PRICING["cl100k_base"], 6)
        cl100_cost_per_million = round(cl100_count * MODEL_PRICING["cl100k_base"], 2)
        
        # Tokenize using Tiktoken o200k_base
        o200_data = tokenizer_service.tokenize_tiktoken(text, "o200k_base")
        o200_count = len(o200_data["tokenIds"])
        o200_ratio = round(o200_count / char_count, 3) if char_count > 0 else 0
        o200_cost_per_req = round((o200_count / 1_000_000) * MODEL_PRICING["o200k_base"], 6)
        o200_cost_per_million = round(o200_count * MODEL_PRICING["o200k_base"], 2)
        
        # Tokenize using LLaMA SentencePiece
        llama_data = tokenizer_service.tokenize_llama(text)
        llama_count = len(llama_data["tokenIds"])
        llama_ratio = round(llama_count / char_count, 3) if char_count > 0 else 0
        llama_cost_per_req = round((llama_count / 1_000_000) * MODEL_PRICING["llama"], 6)
        llama_cost_per_million = round(llama_count * MODEL_PRICING["llama"], 2)
        
        # Tokenize using BERT WordPiece
        bert_data = tokenizer_service.tokenize_bert(text)
        bert_count = len(bert_data["tokenIds"])
        bert_ratio = round(bert_count / char_count, 3) if char_count > 0 else 0
        bert_cost_per_req = round((bert_count / 1_000_000) * MODEL_PRICING["bert"], 6)
        bert_cost_per_million = round(bert_count * MODEL_PRICING["bert"], 2)
        
        return {
            "text": text,
            "charCount": char_count,
            "tokenizers": {
                "cl100k_base": {
                    **cl100_data,
                    "tokenCount": cl100_count,
                    "ratio": cl100_ratio,
                    "costPerRequest": cl100_cost_per_req,
                    "costPerMillionRequests": cl100_cost_per_million,
                    "unitPrice": MODEL_PRICING["cl100k_base"]
                },
                "o200k_base": {
                    **o200_data,
                    "tokenCount": o200_count,
                    "ratio": o200_ratio,
                    "costPerRequest": o200_cost_per_req,
                    "costPerMillionRequests": o200_cost_per_million,
                    "unitPrice": MODEL_PRICING["o200k_base"]
                },
                "llama": {
                    **llama_data,
                    "tokenCount": llama_count,
                    "ratio": llama_ratio,
                    "costPerRequest": llama_cost_per_req,
                    "costPerMillionRequests": llama_cost_per_million,
                    "unitPrice": MODEL_PRICING["llama"]
                },
                "bert": {
                    **bert_data,
                    "tokenCount": bert_count,
                    "ratio": bert_ratio,
                    "costPerRequest": bert_cost_per_req,
                    "costPerMillionRequests": bert_cost_per_million,
                    "unitPrice": MODEL_PRICING["bert"]
                }
            }
        }
    except Exception as e:
        print(f"Tokenization exception raised: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health diagnostic ping for backend processes."""
    return {
        "status": "online",
        "has_tiktoken": HAS_TIKTOKEN,
        "has_transformers": HAS_TRANSFORMERS
    }

class AIRequest(BaseModel):
    text: str = Field(..., description="The prompt text to analyze or optimize.")

@app.post("/api/ai/explain")
async def explain_text(request: AIRequest, x_openai_api_key: Optional[str] = Header(None)):
    """
    Diagnoses token inflation. If an API key is available, calls GPT-4o-mini,
    otherwise runs local rule-based heuristics to identify whitespace or byte-expansion.
    """
    text = request.text
    if not text:
        return {"explanation": "No text provided."}

    # Check for API key (header or environment variable)
    api_key = x_openai_api_key or os.environ.get("OPENAI_API_KEY")
    
    if api_key and api_key.strip():
        try:
            explanation = OpenAIService.explain_token_inflation(text, api_key)
            return {"explanation": explanation, "isAI": True}
        except Exception as e:
            # Fall back to heuristics if API call fails
            print(f"OpenAI Explain failed, falling back to heuristics: {e}")
            
    # Fallback to local heuristics
    explanation = tokenizer_service.analyze_text_heuristics(text)
    return {"explanation": explanation, "isAI": False}

@app.post("/api/ai/optimize")
async def optimize_text(request: AIRequest, x_openai_api_key: Optional[str] = Header(None)):
    """
    Rewrites the prompt to reduce its token footprint using gpt-4o-mini.
    Then tokenizes the optimized text to calculate precise character and token metrics.
    """
    text = request.text
    if not text:
        return {"optimizedText": "", "explanation": [], "savingsPercent": 0.0}

    api_key = x_openai_api_key or os.environ.get("OPENAI_API_KEY")
    if not api_key or not api_key.strip():
        raise HTTPException(
            status_code=400,
            detail="OpenAI API Key is required for prompt optimization. Please configure it in settings."
        )

    try:
        optimized_data = OpenAIService.optimize_prompt(text, api_key)
        opt_text = optimized_data["optimizedText"]
        
        # Tokenize both original and optimized to calculate accurate savings
        orig_cl100 = tokenizer_service.tokenize_tiktoken(text, "cl100k_base")
        orig_tokens = len(orig_cl100["tokenIds"])
        
        opt_cl100 = tokenizer_service.tokenize_tiktoken(opt_text, "cl100k_base")
        opt_tokens = len(opt_cl100["tokenIds"])
        
        # Calculate percentage savings
        savings = orig_tokens - opt_tokens
        savings_percent = round((savings / orig_tokens) * 100, 1) if orig_tokens > 0 else 0.0
        
        return {
            "optimizedText": opt_text,
            "explanation": optimized_data["explanation"],
            "originalTokenCount": orig_tokens,
            "optimizedTokenCount": opt_tokens,
            "savingsPercent": max(0.0, savings_percent)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

