"""
Utility helpers for ingestion pipeline.
"""

from __future__ import annotations

import json
import os
import uuid
from pathlib import Path
from typing import Any


# Base storage directory (relative to pipeline root)
PIPELINE_ROOT = Path(__file__).parent.parent
STORAGE_DIR = PIPELINE_ROOT / "storage"


def generate_doc_id() -> str:
    """Generate a unique hex document identifier."""
    return uuid.uuid4().hex


def ensure_folder(path: str | Path) -> None:
    """Create folder path if it does not exist."""
    Path(path).mkdir(parents=True, exist_ok=True)


def get_chunks_dir() -> Path:
    """Get the chunks storage directory."""
    chunks_dir = STORAGE_DIR / "chunks"
    ensure_folder(chunks_dir)
    return chunks_dir


def get_uploads_dir() -> Path:
    """Get the uploads storage directory."""
    uploads_dir = STORAGE_DIR / "uploads"
    ensure_folder(uploads_dir)
    return uploads_dir


def save_chunk(doc_id: str, chunk_index: int, chunk_data: Any, base_dir: Path | None = None) -> Path:
    """
    Save chunk data to storage/chunks/<doc_id>/chunk_<index>.json.
    Returns the path to the saved file.
    
    Args:
        doc_id: Document identifier
        chunk_index: Index of the chunk
        chunk_data: Chunk data to save
        base_dir: Optional base directory override
    """
    if base_dir is None:
        base_dir = get_chunks_dir() / doc_id
    else:
        base_dir = Path(base_dir) / doc_id
    
    ensure_folder(base_dir)

    file_path = base_dir / f"chunk_{chunk_index}.json"
    with file_path.open("w", encoding="utf-8") as f:
        json.dump(chunk_data, f, ensure_ascii=False, indent=2)

    return file_path
