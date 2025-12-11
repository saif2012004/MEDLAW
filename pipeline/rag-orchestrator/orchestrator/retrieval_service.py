"""
Retrieval Service Module
Handles communication with the external vector search API (Person 3's module).
"""

import requests
import logging
from typing import List, Dict, Any
import config

logger = logging.getLogger(__name__)


class RetrievalError(Exception):
    """Custom exception for retrieval-related errors."""
    pass


def retrieve(query: str, doc_ids: List[str], k: int = 5) -> List[Dict[str, Any]]:
    """
    Retrieve relevant document chunks from the vector search API.
    
    Args:
        query: The search query string
        doc_ids: List of document IDs to search within
        k: Number of top results to retrieve
        
    Returns:
        List of chunk dictionaries containing:
            - chunk_id: Unique identifier for the chunk
            - text: The actual text content
            - score: Relevance score
            - metadata: Additional metadata (doc_id, page, etc.)
            
    Raises:
        RetrievalError: If the API call fails or returns invalid data
    """
    if config.MOCK_MODE:
        logger.info("MOCK MODE: Using mock retrieval data")
        return _mock_retrieve(query, doc_ids)
    
    try:
        logger.info(f"Retrieving chunks for query: '{query}' from docs: {doc_ids}")
        
        # Build filters if doc_ids provided
        filters = None
        if doc_ids and doc_ids[0] != "default":
            filters = {"doc_id": doc_ids[0]}
        
        payload = {
            "query": query,
            "k": k,
            "filters": filters
        }
        
        response = requests.post(
            config.VECTOR_SEARCH_URL,
            json=payload,
            timeout=config.RETRIEVAL_TIMEOUT,
            headers={"Content-Type": "application/json"}
        )
        
        response.raise_for_status()
        data = response.json()
        
        # Handle both response formats from vector_search_api
        # Format 1: {"results": [...]}
        # Format 2: {"chunks": [...]}
        if isinstance(data, dict):
            if "results" in data:
                chunks = data["results"]
            elif "chunks" in data:
                chunks = data["chunks"]
            else:
                raise RetrievalError(
                    f"Invalid response format from vector search API: {data}"
                )
        else:
            raise RetrievalError(
                f"Invalid response type from vector search API: {type(data)}"
            )
        
        # Normalize chunk format
        normalized_chunks = []
        for chunk in chunks:
            normalized = {
                "chunk_id": chunk.get("chunk_id", chunk.get("id", "unknown")),
                "text": chunk.get("text", ""),
                "score": chunk.get("score", 0.0),
                "metadata": {
                    "doc_id": chunk.get("doc_id", chunk.get("metadata", {}).get("doc_id", "unknown")),
                    "page": chunk.get("page", chunk.get("metadata", {}).get("page")),
                    "source": chunk.get("source", chunk.get("metadata", {}).get("source"))
                }
            }
            normalized_chunks.append(normalized)
        
        logger.info(f"Successfully retrieved {len(normalized_chunks)} chunks")
        
        return normalized_chunks
        
    except requests.exceptions.Timeout:
        logger.error(f"Retrieval timeout after {config.RETRIEVAL_TIMEOUT}s")
        raise RetrievalError(
            f"Vector search API timeout after {config.RETRIEVAL_TIMEOUT}s"
        )
        
    except requests.exceptions.RequestException as e:
        logger.error(f"Retrieval request failed: {str(e)}")
        raise RetrievalError(f"Failed to retrieve chunks: {str(e)}")
        
    except Exception as e:
        logger.error(f"Unexpected error during retrieval: {str(e)}")
        raise RetrievalError(f"Unexpected retrieval error: {str(e)}")


def _mock_retrieve(query: str, doc_ids: List[str]) -> List[Dict[str, Any]]:
    """
    Mock retrieval function for testing without the actual vector search API.
    
    Args:
        query: The search query string
        doc_ids: List of document IDs to search within
        
    Returns:
        Mock list of chunks
    """
    mock_chunks = [
        {
            "chunk_id": "doc1_chunk1",
            "text": f"This is a mock chunk related to '{query}'. It contains relevant information about FDA 21 CFR 820 requirements for medical device quality systems, including design controls and documentation requirements.",
            "score": 0.95,
            "metadata": {
                "doc_id": doc_ids[0] if doc_ids else "doc1",
                "page": 1,
                "section": "Introduction"
            }
        },
        {
            "chunk_id": "doc1_chunk2",
            "text": f"Another mock chunk discussing {query} in more detail. ISO 13485 provides additional context for quality management systems in medical device manufacturing, complementing FDA requirements.",
            "score": 0.87,
            "metadata": {
                "doc_id": doc_ids[0] if doc_ids else "doc1",
                "page": 2,
                "section": "Main Content"
            }
        },
        {
            "chunk_id": "doc2_chunk1",
            "text": f"A third mock chunk from a different document about {query}. EU MDR offers a different perspective on medical device regulation, with emphasis on clinical evaluation and post-market surveillance.",
            "score": 0.82,
            "metadata": {
                "doc_id": doc_ids[1] if len(doc_ids) > 1 else "doc2",
                "page": 5,
                "section": "Analysis"
            }
        }
    ]
    
    return mock_chunks
