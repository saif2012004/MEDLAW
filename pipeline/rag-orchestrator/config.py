"""
Configuration module for RAG Orchestrator.
Contains all settings, API endpoints, and environment variables.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# ========================================
# RETRIEVAL SERVICE CONFIGURATION
# ========================================
VECTOR_SEARCH_URL = os.getenv(
    "VECTOR_SEARCH_URL", 
    "http://localhost:5001/vector/search"
)
RETRIEVAL_TIMEOUT = int(os.getenv("RETRIEVAL_TIMEOUT", "30"))  # seconds

# ========================================
# GROQ API CONFIGURATION (groq.com)
# ========================================
GROQ_API_URL = os.getenv("GROQ_API_URL", "https://api.groq.com/openai/v1/chat/completions")
GROQ_API_KEY = os.getenv("GROK_API_KEY", "")  # Using GROK_API_KEY from .env for compatibility
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
GROQ_TIMEOUT = int(os.getenv("GROQ_TIMEOUT", "60"))  # seconds
GROQ_MAX_TOKENS = int(os.getenv("GROQ_MAX_TOKENS", "2048"))
GROQ_TEMPERATURE = float(os.getenv("GROQ_TEMPERATURE", "0.1"))

# ========================================
# ANTHROPIC API CONFIGURATION
# ========================================
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
ANTHROPIC_TIMEOUT = int(os.getenv("ANTHROPIC_TIMEOUT", "60"))  # seconds
ANTHROPIC_MAX_TOKENS = int(os.getenv("ANTHROPIC_MAX_TOKENS", "2048"))
ANTHROPIC_TEMPERATURE = float(os.getenv("ANTHROPIC_TEMPERATURE", "0.1"))

# ========================================
# MOCK MODE CONFIGURATION
# ========================================
# When True, uses mock data instead of real API calls
MOCK_MODE = os.getenv("MOCK_MODE", "False").lower() == "true"

# ========================================
# PROMPT TEMPLATES CONFIGURATION
# ========================================
PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "prompts")
QA_TEMPLATE = "qa_prompt.jinja"
GAP_TEMPLATE = "gap_prompt.jinja"
CHECKLIST_TEMPLATE = "checklist_prompt.jinja"

# ========================================
# OUTPUT PARSING CONFIGURATION
# ========================================
# Maximum attempts to parse LLM output
MAX_PARSE_ATTEMPTS = 3
# Fallback message when parsing fails
PARSE_FAILURE_MESSAGE = "needs human review"

# ========================================
# INGESTION CONFIGURATION
# ========================================
INGESTION_DIR = os.getenv(
    "INGESTION_DIR",
    os.path.join(os.path.dirname(__file__), "..", "ingestion")
)
STORAGE_DIR = os.getenv(
    "STORAGE_DIR",
    os.path.join(os.path.dirname(__file__), "..", "storage")
)
CHUNKS_DIR = os.path.join(STORAGE_DIR, "chunks")
UPLOADS_DIR = os.path.join(STORAGE_DIR, "uploads")

# ========================================
# VECTOR INDEX CONFIGURATION
# ========================================
VECTOR_INDEX_DIR = os.getenv(
    "VECTOR_INDEX_DIR",
    os.path.join(os.path.dirname(__file__), "..", "embed-and-vec-search", "vector_index")
)

# ========================================
# LOGGING CONFIGURATION
# ========================================
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"

# ========================================
# API SERVER CONFIGURATION
# ========================================
API_HOST = os.getenv("RAG_API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("RAG_API_PORT", "8000"))
