# MedLaw Regulatory Copilot - API Documentation

## Overview

This document provides comprehensive API documentation for the MedLaw Regulatory Copilot system, covering all REST endpoints across three services:

- **Backend API** (Node.js/Express, port 3001)
- **RAG Orchestrator API** (Python/Flask, port 8000)
- **Vector Search API** (Python/Flask, port 5001)

## API Endpoints

| Name | Brief Description | Access Point | Type | Input Format | Output Format | Sample Input | Sample Output | Implementation Files | Authentication Required | Rate Limiting | Notes |
|------|------------------|--------------|------|--------------|---------------|--------------|---------------|---------------------|-----------------------|---------------|-------|
| Health Check | Basic service health check | /health | GET | None | JSON status | N/A | `{"status": "ok", "service": "MedLaw Backend", "timestamp": "2025-12-12T..."}` | `backend/src/app.ts` | No | Yes | Used for monitoring |
| LLM Generate | Generate text using LLM | /api/llm/generate | POST | JSON: prompt, temperature, max_tokens | JSON: text | `{"prompt": "What are FDA 21 CFR 820 requirements?", "temperature": 0.1, "max_tokens": 500}` | `{"text": "FDA 21 CFR 820 outlines requirements for medical device quality systems..."}` | `backend/src/routes/llm.ts`, `backend/src/services/llm.service.ts` | No | Yes | Supports OpenAI/Anthropic |
| LLM Classify | Classify query intent and extract entities | /api/llm/classify | POST | JSON: query | JSON: flow, intendedPage, entities, confidence | `{"query": "Show me DHF templates"}` | `{"flow": "C", "intendedPage": "templates", "entities": {"templateType": "DHF"}, "confidence": 0.95}` | `backend/src/routes/llm.ts`, `backend/src/services/llm.service.ts` | No | Yes | Used for smart routing |
| LLM Extract Entities | Extract regulatory entities from query | /api/llm/extract-entities | POST | JSON: query | JSON: entities | `{"query": "alerts for ventilators from June 2024"}` | `{"entities": {"device": "ventilator", "date": "June 2024"}}` | `backend/src/routes/llm.ts`, `backend/src/services/llm.service.ts` | No | Yes | Entity extraction for filtering |
| User Login | Authenticate user | /api/auth/login | POST | JSON: email, password | JSON: message, uid, token | `{"email": "user@example.com", "password": "secure123"}` | `{"message": "Login successful", "uid": "user123", "token": "jwt_token_here"}` | `backend/src/routes/auth.ts` | No | Yes | Returns mock data currently |
| User Signup | Register new user | /api/auth/signup | POST | JSON: email, password | JSON: message, uid, token | `{"email": "user@example.com", "password": "secure123"}` | `{"message": "Signup successful", "uid": "user123", "token": "jwt_token_here"}` | `backend/src/routes/auth.ts` | No | Yes | Returns mock data currently |
| User Logout | End user session | /api/auth/logout | POST | None | JSON: message | N/A | `{"message": "Logout successful"}` | `backend/src/routes/auth.ts` | No | Yes | Simple session cleanup |
| Get User Profile | Retrieve user profile information | /api/user/profile | GET | None | JSON: uid, email, organizationId | N/A | `{"uid": "user123", "email": "user@example.com", "organizationId": "org_123"}` | `backend/src/routes/user.ts` | Yes | Yes | Requires Bearer token |
| Submit Organization Form | Save organization details | /api/user/orgForm | POST | JSON: name, size, deviceCategories, regulations | JSON: organizationId, status | `{"name": "BioMed Inc", "size": "50-200", "deviceCategories": ["Class II", "Class III"], "regulations": ["FDA 21 CFR 820", "ISO 13485"]}` | `{"organizationId": "org_12345", "status": "saved"}` | `backend/src/routes/user.ts` | Yes | Yes | Stores org data in memory |
| Get Dashboard Overview | Retrieve dashboard statistics | /api/dashboard/overview | GET | None | JSON: complianceScore, urgentIssues, documents, recentQueries, products | N/A | `{"complianceScore": 85, "urgentIssues": 2, "documents": [], "recentQueries": [], "products": []}` | `backend/src/routes/dashboard.ts` | Yes | Yes | Returns mock dashboard data |
| Get Monitoring Preferences | Retrieve user's monitoring settings | /api/monitoring/preferences | GET | None | JSON: preferences object | N/A | `{"productIds": ["prod1", "prod2"], "frequency": "weekly", "email": "user@example.com"}` | `backend/src/routes/monitoring.ts` | Yes | Yes | User-specific preferences |
| Set Monitoring Preferences | Save user's monitoring settings | /api/monitoring/preferences | POST | JSON: productIds, frequency, email | JSON: status | `{"productIds": ["prod1", "prod2"], "frequency": "weekly", "email": "user@example.com"}` | `{"status": "saved"}` | `backend/src/routes/monitoring.ts` | Yes | Yes | Stores preferences in memory |
| Main Query Processing | Process user queries with classification and RAG | /api/query | POST | JSON: query, template_type + multipart files | JSON: classification, result, uploaded_files | `{"query": "What are GMP requirements?", "template_type": "qa"}` | `{"classification": {"flow": "A", "intendedPage": "chat"}, "result": {"narrative": "...", "checklist": ["..."], "citations": {...}}}` | `backend/src/routes/query.ts` | No | Yes | Main entry point for queries |
| Classify Query Only | Classify query without RAG processing | /api/query/classify | POST | JSON: query | JSON: flow, intendedPage, entities, confidence | `{"query": "Show me alert templates"}` | `{"flow": "C", "intendedPage": "templates", "entities": {"templateType": "alert"}, "confidence": 0.92}` | `backend/src/routes/query.ts` | No | Yes | For routing decisions |
| Upload Files for RAG | Upload documents for processing | /api/rag/upload | POST | Multipart form data: files | JSON: files array, reindexed count | Form data with PDF/DOCX files | `{"files": [{"doc_id": "doc123", "filename": "regulatory.pdf", "chunks": 25}], "reindexed": 25}` | `backend/src/routes/bridge.ts` | No | Yes | Forwards to RAG orchestrator |
| Run RAG Query | Execute RAG query against indexed documents | /api/rag/query | POST | JSON: query, doc_ids, template_type | JSON: narrative, checklist, citations, _metadata | `{"query": "What are ISO 13485 requirements?", "doc_ids": ["doc1"], "template_type": "qa"}` | `{"narrative": "ISO 13485 requires...", "checklist": ["Implement QMS", "..."], "citations": {"chunk123": "text..."}}` | `backend/src/routes/bridge.ts` | No | Yes | Forwards to RAG orchestrator |
| Full RAG Pipeline | Upload files and run query in one request | /api/rag/full | POST | Multipart form data: query, template_type, files | JSON: uploaded_files, result | Form data with query + files | `{"uploaded_files": [{"doc_id": "doc123", "filename": "guide.pdf"}], "result": {"narrative": "...", "checklist": [...]}}` | `backend/src/routes/bridge.ts` | No | Yes | Combined upload + query |
| Legacy Analyze | Vector search (legacy endpoint) | /api/rag/analyze | POST | JSON: query, docIds, k | JSON: query, results, count | `{"query": "compliance requirements", "docIds": ["doc1"], "k": 5}` | `{"query": "compliance requirements", "results": [...], "count": 3}` | `backend/src/routes/bridge.ts` | No | Yes | Forwards to vector search API |
| Check RAG Health | Health status of RAG services | /api/rag/health | GET | None | JSON: rag_api, vector_api status | N/A | `{"rag_api": {"status": "healthy"}, "vector_api": {"status": "healthy", "index_size": 1500}}` | `backend/src/routes/bridge.ts` | No | Yes | Health check proxy |
| RAG Health Check | RAG orchestrator health status | /health | GET | None | JSON: status, service, mock_mode | N/A | `{"status": "healthy", "service": "RAG Orchestrator API", "mock_mode": false}` | `pipeline/rag-orchestrator/api.py` | No | No | Service health indicator |
| RAG API Documentation | List available RAG endpoints | / | GET | None | JSON: service, endpoints | N/A | `{"service": "RAG Orchestrator API", "endpoints": {"GET /health": "Health check", "POST /rag/query": "Run RAG query"}}` | `pipeline/rag-orchestrator/api.py` | No | No | Endpoint documentation |
| RAG Query Execution | Run RAG query against documents | /rag/query | POST | JSON: query, doc_ids, template_type | JSON: narrative, checklist, citations, _metadata | `{"query": "What are FDA requirements?", "doc_ids": ["doc1", "doc2"], "template_type": "qa"}` | `{"narrative": "FDA requires comprehensive documentation...", "checklist": ["Maintain design controls", "..."], "citations": {"chunk_123": "text..."}}` | `pipeline/rag-orchestrator/api.py` | No | No | Core RAG functionality |
| RAG File Upload | Upload and process documents | /rag/upload | POST | Multipart form data: files | JSON: files array, reindexed count | Form data with PDF/DOCX files | `{"files": [{"doc_id": "abc123", "filename": "fda_guide.pdf", "chunks": 45, "characters": 25000}], "reindexed": 45}` | `pipeline/rag-orchestrator/api.py` | No | No | Document ingestion pipeline |
| RAG Full Pipeline | Upload files and run query | /rag/full | POST | Multipart form data: query, template_type, files | JSON: uploaded_files, result | Form data with query + files | `{"uploaded_files": [{"doc_id": "xyz789", "filename": "iso_standard.pdf"}], "result": {"narrative": "ISO 13485 specifies...", "checklist": [...]}}` | `pipeline/rag-orchestrator/api.py` | No | No | Combined ingestion + query |
| Vector Search Health | Vector search service health | /health | GET | None | JSON: status, index_size, index_loaded | N/A | `{"status": "healthy", "index_size": 1200, "index_loaded": true}` | `pipeline/embed-and-vec-search/vector_search_api.py` | No | No | Index status monitoring |
| Vector Search API Docs | List vector search endpoints | / | GET | None | JSON: service, endpoints, index_status | N/A | `{"service": "Vector Search API", "endpoints": {"POST /vector/index": "Re-index chunks"}, "index_status": {"loaded": true, "size": 1200}}` | `pipeline/embed-and-vec-search/vector_search_api.py` | No | No | API documentation |
| Re-index Vectors | Rebuild vector index from chunks | /vector/index | POST | None | JSON: status, num_chunks, index_size | N/A | `{"status": "success", "num_chunks": 1200, "index_size": 1200}` | `pipeline/embed-and-vec-search/vector_search_api.py` | No | No | Rebuilds FAISS index |
| Vector Similarity Search | Search for similar document chunks | /vector/search | POST | JSON: query, k, filters | JSON: query, results, count | `{"query": "quality management system", "k": 5, "filters": {"doc_id": "doc123"}}` | `{"query": "quality management system", "results": [{"chunk_id": "chunk_456", "score": 0.85, "text": "QMS requires...", "doc_id": "doc123"}], "count": 3}` | `pipeline/embed-and-vec-search/vector_search_api.py` | No | No | Core vector search functionality |

## Authentication Notes

- All `/api/user/*`, `/api/dashboard/*`, `/api/monitoring/*` endpoints require authentication via Bearer token
- Authentication is handled by middleware that verifies Firebase JWT tokens
- Unauthenticated requests to protected endpoints return 401 Unauthorized

## Rate Limiting

- All backend endpoints are rate-limited to 100 requests per 15 minutes per IP
- Rate limiting is implemented using express-rate-limit middleware
- Exceeding limits returns 429 Too Many Requests

## Error Handling

- All endpoints return appropriate HTTP status codes (400 for bad requests, 401 for auth, 500 for server errors)
- Error responses include descriptive error messages in JSON format
- File upload endpoints validate file types and sizes, returning 400 for invalid files

## File Upload Specifications

- Supported formats: PDF, DOCX, TXT, PNG, JPG, JPEG
- Maximum file size: 50MB per file
- Multiple files allowed in single upload
- Files are temporarily stored and cleaned up after processing

## Service Dependencies

- Backend API depends on RAG Orchestrator (port 8000) and Vector Search API (port 5001)
- RAG Orchestrator depends on Vector Search API for retrieval
- All services communicate via HTTP REST APIs
