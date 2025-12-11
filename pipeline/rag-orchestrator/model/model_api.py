"""
Model API Module (Module 5)
Wrapper around the Groq API for LLM inference.
"""

import json
import logging
from typing import Optional
import requests
import config

logger = logging.getLogger(__name__)


class ModelAPIError(Exception):
    """Custom exception for model API errors."""
    pass


def infer(prompt: str, max_tokens: Optional[int] = None, temperature: Optional[float] = None) -> str:
    """
    Call the Groq API to generate a response.
    
    This is the main interface for Module 5 (Model Caller).
    Uses the Groq chat/completions endpoint (OpenAI-compatible).
    
    Args:
        prompt: The input prompt for the model
        max_tokens: Maximum tokens to generate (defaults to config.GROQ_MAX_TOKENS)
        temperature: Sampling temperature (defaults to config.GROQ_TEMPERATURE)
        
    Returns:
        Raw model output as a string
        
    Raises:
        ModelAPIError: If the API call fails
    """
    if config.MOCK_MODE:
        logger.info("MOCK MODE: Using mock model inference")
        return _mock_infer(prompt)
    
    try:
        logger.info("Calling Groq API")
        
        if not config.GROQ_API_KEY:
            raise ModelAPIError(
                "GROQ_API_KEY not set. Please configure GROK_API_KEY in your .env file."
            )

        payload = {
            "model": config.GROQ_MODEL,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": max_tokens or config.GROQ_MAX_TOKENS,
            "temperature": temperature if temperature is not None else config.GROQ_TEMPERATURE
        }

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {config.GROQ_API_KEY}"
        }

        response = requests.post(
            config.GROQ_API_URL,
            json=payload,
            headers=headers,
            timeout=config.GROQ_TIMEOUT
        )
        response.raise_for_status()
        data = response.json()

        if "choices" not in data or len(data["choices"]) == 0:
            raise ModelAPIError(f"Invalid response format from Groq API: {data}")

        output = data["choices"][0]["message"]["content"]

        logger.info(f"Groq API call successful (output length: {len(output)} chars)")
        return output

    except requests.exceptions.Timeout:
        logger.error(f"Groq API timeout after {config.GROQ_TIMEOUT}s")
        raise ModelAPIError(f"Groq API timeout after {config.GROQ_TIMEOUT}s")
    except requests.exceptions.HTTPError as e:
        logger.error(f"Groq API HTTP error: {e.response.status_code} - {e.response.text}")
        raise ModelAPIError(f"Groq API HTTP error {e.response.status_code}: {e.response.text}")
    except requests.exceptions.RequestException as e:
        logger.error(f"Groq API request failed: {str(e)}")
        raise ModelAPIError(f"Failed to call Groq API: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error calling Groq API: {str(e)}")
        raise ModelAPIError(f"Unexpected error: {str(e)}")


def _mock_infer(prompt: str) -> str:
    """
    Mock inference function for testing without the actual Groq API.
    
    Args:
        prompt: The input prompt
        
    Returns:
        Mock JSON response
    """
    mock_response = {
        "narrative": "This is a mock response generated for testing purposes. "
                    "In production, this would be replaced by actual Groq API output. "
                    "The prompt was processed successfully and this narrative provides "
                    "a comprehensive answer based on the retrieved document chunks.",
        "checklist": [
            "First action item from the analysis",
            "Second recommended step",
            "Third verification task",
            "Final review and validation"
        ],
        "citations": {
            "doc1_chunk1": "Relevant excerpt from first chunk",
            "doc1_chunk2": "Important information from second chunk",
            "doc2_chunk1": "Supporting evidence from third chunk"
        }
    }
    
    return json.dumps(mock_response, indent=2)
