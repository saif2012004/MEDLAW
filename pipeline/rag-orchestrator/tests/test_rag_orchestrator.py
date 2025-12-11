"""
Unit tests for RAG Orchestrator
"""

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from orchestrator import run
from orchestrator.rag_orchestrator import RAGOrchestratorError
import config


@pytest.fixture(autouse=True)
def enable_mock_mode():
    """Enable mock mode for all tests."""
    original_mock_mode = config.MOCK_MODE
    config.MOCK_MODE = True
    yield
    config.MOCK_MODE = original_mock_mode


def test_run_basic():
    """Test basic RAG orchestrator execution."""
    result = run(
        query="What is the authentication process?",
        doc_ids=["doc1", "doc2"]
    )
    
    assert isinstance(result, dict)
    assert "narrative" in result
    assert "checklist" in result
    assert "citations" in result
    assert isinstance(result["narrative"], str)
    assert isinstance(result["checklist"], list)
    assert isinstance(result["citations"], dict)


def test_run_with_qa_template():
    """Test RAG orchestrator with Q&A template."""
    result = run(
        query="How does the system work?",
        doc_ids=["doc1"],
        template_type="qa"
    )
    
    assert result["narrative"] != ""
    assert len(result["checklist"]) > 0


def test_run_with_gap_template():
    """Test RAG orchestrator with gap analysis template."""
    result = run(
        query="Identify gaps in documentation",
        doc_ids=["doc1", "doc2"],
        template_type="gap"
    )
    
    assert result["narrative"] != ""
    assert isinstance(result["checklist"], list)


def test_run_with_checklist_template():
    """Test RAG orchestrator with checklist template."""
    result = run(
        query="Create deployment checklist",
        doc_ids=["doc1"],
        template_type="checklist"
    )
    
    assert result["narrative"] != ""
    assert len(result["checklist"]) > 0


def test_run_with_empty_doc_ids():
    """Test RAG orchestrator with empty document IDs."""
    result = run(
        query="Test query",
        doc_ids=[]
    )
    
    # Should still work with mock mode
    assert isinstance(result, dict)
    assert "narrative" in result


def test_run_metadata():
    """Test that metadata is included in the result."""
    query = "Test query"
    doc_ids = ["doc1", "doc2"]
    template_type = "qa"
    
    result = run(
        query=query,
        doc_ids=doc_ids,
        template_type=template_type
    )
    
    assert "_metadata" in result
    metadata = result["_metadata"]
    assert metadata["query"] == query
    assert metadata["doc_ids"] == doc_ids
    assert metadata["template_type"] == template_type
    assert "num_chunks_retrieved" in metadata


def test_run_invalid_template_type():
    """Test RAG orchestrator with invalid template type (should default to qa)."""
    result = run(
        query="Test query",
        doc_ids=["doc1"],
        template_type="invalid_template"
    )
    
    # Should still work, defaulting to 'qa'
    assert isinstance(result, dict)
    assert result["_metadata"]["template_type"] == "qa"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
