import io
import config
from api import app


def setup_module(_module):
    config.MOCK_MODE = True


def test_health():
    client = app.test_client()
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json()["status"] == "healthy"


def test_rag_query_returns_result():
    client = app.test_client()
    res = client.post("/rag/query", json={"query": "How to comply?", "doc_ids": ["doc1"]})
    assert res.status_code == 200
    data = res.get_json()
    assert "narrative" in data
    assert "checklist" in data


def test_rag_upload_requires_file():
    client = app.test_client()
    res = client.post("/rag/upload")
    assert res.status_code == 400


def test_rag_full_requires_inputs():
    client = app.test_client()
    res = client.post("/rag/full")
    assert res.status_code == 400


def test_rag_full_with_query_only():
    client = app.test_client()
    res = client.post("/rag/full", data={"query": "hello"})
    assert res.status_code == 200
    data = res.get_json()
    assert "result" in data

