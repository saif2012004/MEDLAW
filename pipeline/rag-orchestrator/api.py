"""
Flask API Wrapper for RAG Orchestrator.
Provides HTTP endpoints for the RAG pipeline.
"""

import os
import sys
import json
import uuid
import logging
import tempfile
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import config
from orchestrator import run
from orchestrator.rag_orchestrator import RAGOrchestratorError

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format=config.LOG_FORMAT
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'}


def allowed_file(filename: str) -> bool:
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def process_uploaded_file(file) -> dict:
    """
    Process an uploaded file through the ingestion pipeline.
    
    Args:
        file: Flask file object
        
    Returns:
        Dictionary with doc_id and processing info
    """
    from ingestion.extractor import extract_text
    from ingestion.chunker import chunk_text, build_page_ranges
    from ingestion.utils import generate_doc_id, save_chunk
    
    # Save file temporarily
    filename = secure_filename(file.filename)
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, filename)
    
    logger.info(f"Processing uploaded file: {filename}")
    logger.info(f"Temp path: {temp_path}")
    
    file.save(temp_path)
    
    try:
        # Extract text
        doc_id = generate_doc_id()
        logger.info(f"Extracting text from {filename}...")
        full_text, page_texts = extract_text(temp_path)
        logger.info(f"Extracted {len(full_text)} characters")
        
        page_ranges = build_page_ranges(page_texts)
        
        # Chunk text
        logger.info(f"Chunking text...")
        chunks = chunk_text(
            full_text, 
            doc_id, 
            source=filename, 
            page_ranges=page_ranges
        )
        logger.info(f"Created {len(chunks)} chunks")
        
        # Save chunks
        for idx, chunk in enumerate(chunks):
            save_chunk(doc_id, idx, chunk)
        
        logger.info(f"Processed file {filename}: doc_id={doc_id}, chunks={len(chunks)}")
        
        return {
            "doc_id": doc_id,
            "filename": filename,
            "chunks": len(chunks),
            "characters": len(full_text)
        }
        
    except Exception as e:
        logger.error(f"Error processing file {filename}: {e}", exc_info=True)
        raise
        
    finally:
        # Cleanup temp file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        if os.path.exists(temp_dir):
            try:
                os.rmdir(temp_dir)
            except OSError:
                pass  # Directory not empty or already removed


def reindex_vectors():
    """Trigger re-indexing of all chunks."""
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'embed-and-vec-search'))
        from embed_and_index import EmbeddingIndexer
        
        chunks_dir = config.CHUNKS_DIR
        logger.info(f"Re-indexing from chunks_dir: {chunks_dir}")
        logger.info(f"Index path: {config.VECTOR_INDEX_DIR}")
        
        indexer = EmbeddingIndexer(index_path=config.VECTOR_INDEX_DIR)
        
        chunks = indexer.load_chunks(chunks_dir)
        if chunks:
            embeddings = indexer.embed_chunks(chunks)
            indexer.build_index(embeddings, chunks)
            indexer.save_index()
            logger.info(f"Re-indexed {len(chunks)} chunks")
            return len(chunks)
        logger.warning("No chunks found to re-index")
        return 0
        
    except Exception as e:
        logger.error(f"Re-indexing failed: {e}", exc_info=True)
        # Don't re-raise - allow the request to continue even if re-indexing fails
        return 0


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "RAG Orchestrator API",
        "mock_mode": config.MOCK_MODE
    })


@app.route('/', methods=['GET'])
def root():
    """API documentation root."""
    return jsonify({
        "service": "RAG Orchestrator API",
        "version": "1.0.0",
        "endpoints": {
            "GET /health": "Health check",
            "POST /rag/query": "Run RAG query (body: {query, doc_ids?, template_type?})",
            "POST /rag/upload": "Upload and process files",
            "POST /rag/full": "Full pipeline: upload files + run query"
        }
    })


@app.route('/rag/query', methods=['POST'])
def rag_query():
    """
    Run a RAG query against existing documents.
    
    Request body:
    {
        "query": "string",
        "doc_ids": ["string"],  // optional, defaults to all docs
        "template_type": "qa" | "gap" | "checklist"  // optional, defaults to "qa"
    }
    
    Returns:
    {
        "narrative": "string",
        "checklist": ["string"],
        "citations": {"chunk_id": "text"},
        "_metadata": {...}
    }
    """
    try:
        data = request.json or {}
        
        query = data.get('query')
        if not query:
            return jsonify({"error": "query is required"}), 400
        
        doc_ids = data.get('doc_ids', [])
        template_type = data.get('template_type', 'qa')
        
        logger.info(f"RAG query: '{query[:50]}...' template={template_type}")
        
        result = run(
            query=query,
            doc_ids=doc_ids if doc_ids else ["default"],
            template_type=template_type
        )
        
        return jsonify(result)
        
    except RAGOrchestratorError as e:
        logger.error(f"RAG orchestration error: {e}")
        return jsonify({"error": str(e)}), 500
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/rag/upload', methods=['POST'])
def upload_files():
    """
    Upload and process files for RAG.
    
    Multipart form data with files.
    
    Returns:
    {
        "files": [
            {"doc_id": "string", "filename": "string", "chunks": int}
        ],
        "reindexed": int
    }
    """
    try:
        if 'files' not in request.files and 'file' not in request.files:
            return jsonify({"error": "No files provided"}), 400
        
        # Handle both single file and multiple files
        files = request.files.getlist('files') or [request.files.get('file')]
        files = [f for f in files if f and f.filename]
        
        if not files:
            return jsonify({"error": "No valid files provided"}), 400
        
        processed = []
        for file in files:
            if not allowed_file(file.filename):
                logger.warning(f"Skipping file with disallowed extension: {file.filename}")
                continue
            
            result = process_uploaded_file(file)
            processed.append(result)
        
        if not processed:
            return jsonify({"error": "No valid files to process"}), 400
        
        # Re-index vectors
        reindexed = reindex_vectors()
        
        return jsonify({
            "files": processed,
            "reindexed": reindexed
        })
        
    except Exception as e:
        logger.error(f"Upload error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route('/rag/full', methods=['POST'])
def full_pipeline():
    """
    Full RAG pipeline: upload files (if any), then run query (if provided).
    
    Accepts multipart form data with:
    - files (optional): Files to upload
    - query (optional): The query string - if not provided, only processes files
    - template_type (optional): qa, gap, or checklist
    
    Returns combined upload + query result.
    """
    try:
        # Get query from form or JSON
        query = request.form.get('query') or (request.json or {}).get('query')
        template_type = request.form.get('template_type', 'qa')
        
        # Process any uploaded files
        doc_ids = []
        uploaded_files = []
        
        files = request.files.getlist('files') or []
        # Also check for single 'file' field
        single_file = request.files.get('file')
        if single_file and single_file.filename:
            files = [single_file] + list(files)
        
        if files and files[0].filename:
            for file in files:
                if allowed_file(file.filename):
                    result = process_uploaded_file(file)
                    uploaded_files.append(result)
                    doc_ids.append(result['doc_id'])
            
            # Re-index if we uploaded files
            if uploaded_files:
                reindex_vectors()
        
        # If no query provided, just return upload results (like /rag/upload)
        if not query:
            if not uploaded_files:
                return jsonify({"error": "Either query or files must be provided"}), 400
            
            logger.info(f"File upload only: {len(uploaded_files)} files processed")
            return jsonify({
                "uploaded_files": uploaded_files,
                "reindexed": len(doc_ids),
                "message": "Files processed successfully. Send a query to analyze them."
            })
        
        # Run RAG query
        logger.info(f"Full pipeline query: '{query[:50]}...' with {len(doc_ids)} new docs")
        
        rag_result = run(
            query=query,
            doc_ids=doc_ids if doc_ids else ["default"],
            template_type=template_type
        )
        
        return jsonify({
            "uploaded_files": uploaded_files,
            "result": rag_result
        })
        
    except RAGOrchestratorError as e:
        logger.error(f"RAG orchestration error: {e}")
        return jsonify({"error": str(e)}), 500
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    print("=" * 60)
    print("RAG Orchestrator API")
    print("=" * 60)
    print(f"Starting server on http://{config.API_HOST}:{config.API_PORT}")
    print(f"Mock mode: {config.MOCK_MODE}")
    print("\nEndpoints:")
    print("  GET  /health     - Health check")
    print("  POST /rag/query  - Run RAG query")
    print("  POST /rag/upload - Upload and process files")
    print("  POST /rag/full   - Full pipeline (upload + query)")
    print("=" * 60)
    
    app.run(
        host=config.API_HOST,
        port=config.API_PORT,
        debug=True
    )



