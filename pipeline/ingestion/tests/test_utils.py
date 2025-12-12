from pathlib import Path
from ingestion import utils


def test_generate_doc_id_unique():
    id1 = utils.generate_doc_id()
    id2 = utils.generate_doc_id()
    assert id1 != id2
    assert len(id1) == 32


def test_save_chunk(tmp_path: Path):
    chunk = {"doc_id": "doc1", "chunk_index": 0, "text": "hello"}
    path = utils.save_chunk("doc1", 0, chunk, base_dir=tmp_path)
    assert path.exists()
    data = path.read_text()
    assert "hello" in data

