from ingestion import chunker


def test_split_words_handles_empty():
    assert chunker.split_words("") == []


def test_build_page_ranges():
    ranges = chunker.build_page_ranges([
        {"page": 1, "text": "one two"},
        {"page": 2, "text": "three"},
    ])
    assert ranges == [
        {"page": 1, "start_offset": 0, "end_offset": 2},
        {"page": 2, "start_offset": 2, "end_offset": 3},
    ]


def test_chunk_text_with_overlap():
    text = " ".join([f"word{i}" for i in range(12)])
    chunks = chunker.chunk_text(text, doc_id="doc1", chunk_size=5, overlap=2)
    assert len(chunks) == 3
    assert chunks[0]["start_offset"] == 0
    assert chunks[1]["start_offset"] == 3  # chunk_size - overlap
    assert chunks[0]["page"] is None

