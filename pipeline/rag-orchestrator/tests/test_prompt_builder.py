"""
Unit tests for Prompt Builder
"""

import pytest
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from orchestrator.prompt_builder import PromptBuilder, PromptBuilderError


@pytest.fixture
def sample_chunks():
    """Sample chunks for testing."""
    return [
        {
            "chunk_id": "doc1_chunk1",
            "text": "Sample text content",
            "score": 0.95,
            "metadata": {"doc_id": "doc1", "page": 1}
        },
        {
            "chunk_id": "doc1_chunk2",
            "text": "More sample content",
            "score": 0.87,
            "metadata": {"doc_id": "doc1", "page": 2}
        }
    ]


def test_prompt_builder_initialization():
    """Test PromptBuilder initialization."""
    builder = PromptBuilder()
    assert builder is not None
    assert builder.env is not None


def test_compose_qa_prompt(sample_chunks):
    """Test composing Q&A prompt."""
    builder = PromptBuilder()
    query = "What is the authentication process?"
    
    prompt = builder.compose_qa_prompt(query, sample_chunks)
    
    assert query in prompt
    assert "doc1_chunk1" in prompt
    assert "Sample text content" in prompt


def test_compose_gap_prompt(sample_chunks):
    """Test composing gap analysis prompt."""
    builder = PromptBuilder()
    query = "Identify documentation gaps"
    
    prompt = builder.compose_gap_prompt(query, sample_chunks)
    
    assert query in prompt
    assert len(prompt) > 0


def test_compose_checklist_prompt(sample_chunks):
    """Test composing checklist prompt."""
    builder = PromptBuilder()
    query = "Create deployment checklist"
    
    prompt = builder.compose_checklist_prompt(query, sample_chunks)
    
    assert query in prompt
    assert len(prompt) > 0


def test_compose_with_empty_chunks():
    """Test composing prompt with empty chunks list."""
    builder = PromptBuilder()
    query = "Test query"
    
    prompt = builder.compose_qa_prompt(query, [])
    
    assert query in prompt
    assert "0 total" in prompt or "0" in prompt


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
