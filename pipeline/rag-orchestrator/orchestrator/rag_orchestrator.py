"""
RAG Orchestrator Module
Main orchestration logic for the RAG pipeline.
"""

import logging
from typing import Dict, List, Any
from .retrieval_service import retrieve, RetrievalError
from .prompt_builder import PromptBuilder, PromptBuilderError
from .output_parser import parse_output, OutputParserError
from model.model_api import infer, ModelAPIError
import config

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT
)
logger = logging.getLogger(__name__)


class RAGOrchestratorError(Exception):
    """Custom exception for RAG orchestrator errors."""
    pass


def run(
    query: str,
    doc_ids: List[str],
    template_type: str = "qa"
) -> Dict[str, Any]:
    """
    Main RAG orchestrator function.
    
    This function orchestrates the entire RAG pipeline:
    1. Retrieve relevant chunks from vector search
    2. Compose a prompt using templates
    3. Call the LLM (Grok API)
    4. Parse the output into structured JSON
    
    Args:
        query: The user's query string
        doc_ids: List of document IDs to search within
        template_type: Type of template to use ('qa', 'gap', or 'checklist')
        
    Returns:
        Dictionary containing:
            - narrative: Text narrative response
            - checklist: List of checklist items
            - citations: Dictionary of citations {doc#chunk: text}
            
    Raises:
        RAGOrchestratorError: If any step in the pipeline fails critically
    """
    logger.info("=" * 60)
    logger.info(f"Starting RAG orchestration for query: '{query}'")
    logger.info(f"Document IDs: {doc_ids}")
    logger.info(f"Template type: {template_type}")
    logger.info("=" * 60)
    
    try:
        # ========================================
        # STEP 1: RETRIEVE CHUNKS
        # ========================================
        logger.info("STEP 1: Retrieving chunks from vector search")
        chunks = retrieve(query, doc_ids)
        logger.info(f"Retrieved {len(chunks)} chunks")
        
        if not chunks:
            logger.warning("No chunks retrieved, returning empty response")
            return _create_empty_response(
                "No relevant information found in the specified documents."
            )
        
        # ========================================
        # STEP 2: COMPOSE PROMPT
        # ========================================
        logger.info("STEP 2: Composing prompt from template")
        prompt_builder = PromptBuilder()
        
        # Select the appropriate template method
        template_methods = {
            "qa": prompt_builder.compose_qa_prompt,
            "gap": prompt_builder.compose_gap_prompt,
            "checklist": prompt_builder.compose_checklist_prompt
        }
        
        if template_type not in template_methods:
            logger.warning(f"Unknown template type '{template_type}', defaulting to 'qa'")
            template_type = "qa"
        
        prompt = template_methods[template_type](query, chunks)
        logger.info(f"Prompt composed (length: {len(prompt)} chars)")
        
        # ========================================
        # STEP 3: CALL LLM
        # ========================================
        logger.info("STEP 3: Calling LLM (Grok API)")
        llm_output = infer(prompt)
        logger.info(f"LLM response received (length: {len(llm_output)} chars)")
        
        # ========================================
        # STEP 4: PARSE OUTPUT
        # ========================================
        logger.info("STEP 4: Parsing LLM output")
        result = parse_output(llm_output)
        
        # Add metadata
        result["_metadata"] = {
            "query": query,
            "doc_ids": doc_ids,
            "template_type": template_type,
            "num_chunks_retrieved": len(chunks),
            "chunks_used": [chunk.get("chunk_id", "unknown") for chunk in chunks]
        }
        
        logger.info("RAG orchestration completed successfully")
        logger.info("=" * 60)
        
        return result
        
    except RetrievalError as e:
        logger.error(f"Retrieval failed: {str(e)}")
        raise RAGOrchestratorError(f"Retrieval step failed: {str(e)}")
        
    except PromptBuilderError as e:
        logger.error(f"Prompt building failed: {str(e)}")
        raise RAGOrchestratorError(f"Prompt building step failed: {str(e)}")
        
    except ModelAPIError as e:
        logger.error(f"Model API call failed: {str(e)}")
        raise RAGOrchestratorError(f"LLM inference step failed: {str(e)}")
        
    except Exception as e:
        logger.error(f"Unexpected error in RAG orchestration: {str(e)}")
        raise RAGOrchestratorError(f"Unexpected error: {str(e)}")


def _create_empty_response(message: str) -> Dict[str, Any]:
    """
    Create an empty response with a message.
    
    Args:
        message: Message to include in the narrative
        
    Returns:
        Empty response dictionary
    """
    return {
        "narrative": message,
        "checklist": [],
        "citations": {}
    }
