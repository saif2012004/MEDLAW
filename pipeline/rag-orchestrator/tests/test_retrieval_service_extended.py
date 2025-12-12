import config
from orchestrator import retrieval_service


def test_mock_retrieve_returns_chunks():
    config.MOCK_MODE = True
    chunks = retrieval_service.retrieve("quality system", ["doc1", "doc2"])
    assert len(chunks) >= 1
    assert "chunk_id" in chunks[0]

