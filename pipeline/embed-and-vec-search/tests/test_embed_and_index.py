import numpy as np
import pytest
from pathlib import Path
from embed_and_index import EmbeddingIndexer
import embed_and_index as module


class DummyModel:
    def encode(self, texts, **kwargs):
        # return unique vectors per text
        return np.array([[float(i)] * 384 for i in range(len(texts))])


@pytest.fixture(autouse=True)
def mock_model(monkeypatch):
    monkeypatch.setattr(module, "SentenceTransformer", lambda *args, **kwargs: DummyModel())


def test_load_chunks(sample_chunks_dir: Path):
    indexer = EmbeddingIndexer(index_path=str(sample_chunks_dir / "index"))
    chunks = indexer.load_chunks(str(sample_chunks_dir))
    assert len(chunks) == 1
    assert chunks[0]["chunk_id"].startswith("doc1")


def test_build_and_search(sample_chunks_dir: Path, tmp_path: Path):
    indexer = EmbeddingIndexer(index_path=str(tmp_path / "index"))
    chunks = indexer.load_chunks(str(sample_chunks_dir))
    embeddings = indexer.embed_chunks(chunks)
    indexer.build_index(embeddings, chunks)
    indexer.save_index()

    assert indexer.index is not None
    assert indexer.index.ntotal == len(chunks)

    loaded = EmbeddingIndexer(index_path=str(tmp_path / "index"))
    loaded.model = DummyModel()
    assert loaded.load_index()
    results = loaded.search("query", k=1)
    assert len(results) == 1

