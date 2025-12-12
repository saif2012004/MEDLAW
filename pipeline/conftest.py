import json
import os
from pathlib import Path
import pytest


@pytest.fixture
def tmp_storage(tmp_path: Path):
    storage = tmp_path / "storage"
    storage.mkdir()
    return storage


@pytest.fixture
def sample_txt_file(tmp_path: Path) -> Path:
    file_path = tmp_path / "sample.txt"
    file_path.write_text("Hello world\nThis is a test document.", encoding="utf-8")
    return file_path


@pytest.fixture
def sample_chunks_dir(tmp_storage: Path) -> Path:
    chunks_dir = tmp_storage / "chunks" / "doc1"
    chunks_dir.mkdir(parents=True)
    sample_chunk = {
        "doc_id": "doc1",
        "chunk_index": 0,
        "text": "Sample chunk text",
        "source": "sample.txt",
    }
    (chunks_dir / "chunk_0.json").write_text(json.dumps(sample_chunk), encoding="utf-8")
    return tmp_storage / "chunks"

