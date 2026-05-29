import os
from typing import Dict, Any
from openai import OpenAI

class OpenAIService:
    """
    Service layer interacting with OpenAI API.
    Handles prompt diagnostics and token footprint optimization.
    """
    
    @staticmethod
    def get_client(api_key: str = None) -> OpenAI:
        """
        Initializes an OpenAI client. Uses the supplied key from the frontend
        if available, otherwise falls back to the server environment variable.
        """
        key = api_key or os.environ.get("OPENAI_API_KEY")
        if not key:
            raise ValueError("OpenAI API Key not configured. Please provide a key in settings.")
        return OpenAI(api_key=key)

    @classmethod
    def explain_token_inflation(cls, text: str, api_key: str = None) -> str:
        """
        Uses gpt-4o-mini to diagnose why the input text has a high token footprint.
        Highlights multi-byte character scaling, spacing issues, and Morpheme splitting.
        """
        try:
            client = cls.get_client(api_key)
            system_prompt = (
                "You are an expert AI prompt engineer and tokenomics profiler. "
                "Analyze the user's input text and explain clearly why it has a specific token count. "
                "Identify any of the following factors if they apply:\n"
                "- Unicode/Multi-byte expansion (non-English scripts like Bengali, Hindi, Cyrillic, or Emojis taking up 3-4x more tokens than English).\n"
                "- Whitespace overhead (excessive spaces, tab character indentations, carriage returns).\n"
                "- Subword segmentation limits (highly technical terms, acronyms, or rare words being sliced into small chips).\n"
                "Provide your response in beautifully formatted markdown with clear bullet points, brief sections, and a helpful, senior developer tone."
            )
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Please profile this text:\n\n{text}"}
                ],
                temperature=0.3,
                max_tokens=600
            )
            return response.choices[0].message.content
        except Exception as e:
            raise RuntimeError(f"OpenAI service error: {str(e)}")

    @classmethod
    def optimize_prompt(cls, text: str, api_key: str = None) -> Dict[str, Any]:
        """
        Uses gpt-4o-mini to rewrite the prompt to reduce its token footprint
        without losing any original semantic meaning, context, or instructions.
        """
        try:
            client = cls.get_client(api_key)
            system_prompt = (
                "You are an elite prompt compression engine. Your task is to optimize the user's input prompt "
                "to minimize its token count (aim for 20% to 50% savings) while keeping 100% of the "
                "original instructions, variables, constraints, and semantics.\n\n"
                "Apply strategies like:\n"
                "- Removing redundant conversational filler ('please do this', 'in order to').\n"
                "- Compacting layout spaces/newlines without breaking formatting rules.\n"
                "- Swapping verbose phrasing for concise, highly informative terms.\n\n"
                "You MUST return your response as a valid JSON object containing exactly two keys:\n"
                "1. 'optimized_text': The rewritten, token-efficient prompt string.\n"
                "2. 'explanation': A very brief bulleted list (max 3 points) explaining what optimizations you performed."
            )
            
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": text}
                ],
                response_format={"type": "json_object"},
                temperature=0.2,
                max_tokens=600
            )
            
            import json
            result = json.loads(response.choices[0].message.content)
            return {
                "optimizedText": result.get("optimized_text", text),
                "explanation": result.get("explanation", ["Compacted redundant wording", "Removed conversational filler"])
            }
        except Exception as e:
            raise RuntimeError(f"OpenAI service error: {str(e)}")
