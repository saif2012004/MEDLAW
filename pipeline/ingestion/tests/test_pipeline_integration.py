from ingestion.ingest import main as ingest_main
from ingestion import extractor, chunker, utils
from pathlib import Path
import sys
import pytest


def test_pipeline_functions(sample_txt_file: Path, tmp_storage: Path, monkeypatch):
    # Wire storage dir to temp
    monkeypatch.setattr(utils, "STORAGE_DIR", tmp_storage)

    full_text, pages = extractor.extract_text(sample_txt_file)
    ranges = chunker.build_page_ranges(pages)
    chunks = chunker.chunk_text(full_text, "docX", page_ranges=ranges, source=sample_txt_file.name, chunk_size=5, overlap=1)
    assert chunks
    saved_path = utils.save_chunk("docX", 0, chunks[0], base_dir=tmp_storage / "chunks")
    assert saved_path.exists()


def test_ingest_cli_invalid_path(monkeypatch, capsys):
    monkeypatch.setattr(sys, "argv", ["ingest.py", "missing.txt"])
    with pytest.raises(SystemExit):
        ingest_main()
    captured = capsys.readouterr()
    assert "File not found" in captured.out

