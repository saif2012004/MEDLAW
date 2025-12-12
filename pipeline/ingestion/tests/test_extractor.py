import pytest
from pathlib import Path
from ingestion import extractor


def test_detect_file_type_supported():
  assert extractor.detect_file_type("file.pdf") == "pdf"
  assert extractor.detect_file_type("file.docx") == "docx"
  assert extractor.detect_file_type("file.txt") == "txt"


def test_detect_file_type_unsupported():
  with pytest.raises(ValueError):
    extractor.detect_file_type("file.xyz")


def test_clean_text():
  assert extractor.clean_text("  hello   world  ") == "hello world"
  assert extractor.clean_text("") == ""


def test_extract_text_txt(sample_txt_file: Path):
  full_text, pages = extractor.extract_text(sample_txt_file)
  assert "Hello world" in full_text
  assert pages[0]["page"] == 1


def test_extract_text_invalid(tmp_path: Path):
  bad_file = tmp_path / "bad.bin"
  bad_file.write_bytes(b"\x00\x01")
  with pytest.raises(ValueError):
    extractor.extract_text(bad_file)

