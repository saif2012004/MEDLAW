import pytest
from vector_search_api import app
import vector_search_api as api


class DummyIndexer:
    def __init__(self):
        self.index = type("Index", (), {"ntotal": 1})()
        self._chunks = [{"chunk_id": "doc1_chunk_0", "text": "hello", "score": 0.9, "doc_id": "doc1"}]

    def load_chunks(self, *_args, **_kwargs):
        return self._chunks

    def embed_chunks(self, chunks):
        return [[0.1] * 384 for _ in chunks]

    def build_index(self, *_args, **_kwargs):
        return

    def save_index(self):
        return

    def load_index(self):
        return True

    def search(self, query, k=5, filters=None):
        return self._chunks[:k]


@pytest.fixture(autouse=True)
def override_indexer():
    api.indexer = DummyIndexer()
    yield
    api.indexer = DummyIndexer()


def test_health_endpoint():
    client = app.test_client()
    res = client.get("/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"


def test_vector_search_requires_query():
    client = app.test_client()
    res = client.post("/vector/search", json={})
    assert res.status_code == 400


def test_vector_search_returns_results():
    client = app.test_client()
    res = client.post("/vector/search", json={"query": "hello", "k": 1})
    assert res.status_code == 200
    data = res.get_json()
    assert data["count"] == 1

