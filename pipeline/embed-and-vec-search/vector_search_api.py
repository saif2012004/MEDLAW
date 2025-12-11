from flask import Flask, request, jsonify
import logging

from embed_and_index import EmbeddingIndexer


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Initialize indexer (load existing index if present)
indexer = EmbeddingIndexer()
if indexer.load_index():
    logger.info("[OK] Loaded existing index with %d vectors", indexer.index.ntotal)
else:
    logger.warning("[WARN] No index loaded. Run embed_and_index.py or POST /vector/index.")


@app.route("/vector/index", methods=["POST"])
def index_documents():
    """Trigger re-indexing of all chunks from storage/chunks/."""
    try:
        logger.info("Starting indexing job...")

        chunks = indexer.load_chunks("../storage/chunks")
        if not chunks:
            return (
                jsonify(
                    {
                        "error": "No chunks found in storage/chunks/",
                        "message": "Make sure Person 2 has run ingestion first",
                    }
                ),
                404,
            )

        embeddings = indexer.embed_chunks(chunks)
        indexer.build_index(embeddings, chunks)
        indexer.save_index()

        logger.info("[OK] Indexing complete: %d chunks", len(chunks))

        return jsonify({"status": "success", "num_chunks": len(chunks), "index_size": indexer.index.ntotal})

    except Exception as e:  # pragma: no cover - defensive
        logger.error("Indexing error: %s", e, exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/vector/search", methods=["POST"])
def search():
    """Search for similar chunks."""
    try:
        data = request.json

        if not data:
            return jsonify({"error": "Request body is required"}), 400

        query = data.get("query")
        k = data.get("k", 5)
        filters = data.get("filters")

        if not query:
            return jsonify({"error": "query field is required"}), 400

        if indexer.index is None or indexer.index.ntotal == 0:
            return (
                jsonify({"error": "Index not loaded or empty", "message": "Run POST /vector/index first to build the index"}),
                503,
            )

        results = indexer.search(query, k=k, filters=filters)
        logger.info("Search query='%s...' returned %d results", query[:50], len(results))

        return jsonify({"query": query, "results": results, "count": len(results)})

    except Exception as e:  # pragma: no cover - defensive
        logger.error("Search error: %s", e, exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    index_size = indexer.index.ntotal if indexer.index else 0

    return jsonify({"status": "healthy", "index_size": index_size, "index_loaded": indexer.index is not None})


@app.route("/", methods=["GET"])
def root():
    """API documentation root."""
    return jsonify(
        {
            "service": "Vector Search API (Person 3)",
            "endpoints": {
                "POST /vector/index": "Re-index all chunks from storage/chunks/",
                "POST /vector/search": "Search for similar chunks (body: {query, k?, filters?})",
                "GET /health": "Health check",
            },
            "index_status": {"loaded": indexer.index is not None, "size": indexer.index.ntotal if indexer.index else 0},
        }
    )


if __name__ == "__main__":
    print("=" * 60)
    print("Vector Search API (Person 3)")
    print("=" * 60)
    print("Starting server on http://localhost:5001")
    print("\nEndpoints:")
    print("  POST /vector/index  - Build/rebuild index")
    print("  POST /vector/search - Search for chunks")
    print("  GET  /health        - Health check")
    print("=" * 60)

    app.run(host="0.0.0.0", port=5001, debug=True)

