# MedLaw Regulatory Copilot - Engineering Report

Team Members:
1. Muhammad Ahmad Tariq - 22i-1534
2. Afnan Rafaqat - 22i-2437
3. Muahmmad Ali - 22i-1516
4. Saif ur Rehman - 22i-8767
5. Zarnab Ali - 22i-2471
6. Ghulam Husnain - 22i-1537

## 1. REST API Architecture

The MedLaw Regulatory Copilot implements a microservices architecture with three distinct API services, each serving specific functional responsibilities.

### Service Architecture

**Backend API (Node.js/Express, Port 3001)**
- Primary API gateway handling client requests
- Authentication and user management via Firebase Admin SDK
- LLM integration with OpenAI/Anthropic APIs
- Query classification and smart routing logic
- Rate limiting and security middleware

**RAG Orchestrator API (Python/Flask, Port 8000)**
- Retrieval-Augmented Generation pipeline orchestration
- Document processing and ingestion coordination
- LLM prompt engineering and response parsing
- Integration with vector search and model APIs

**Vector Search API (Python/Flask, Port 5001)**
- FAISS-based vector similarity search
- Document embedding generation and indexing
- High-performance nearest neighbor search
- Index persistence and management

### API Design Patterns

The system employs several architectural patterns:

- **API Gateway Pattern**: Backend service routes requests to appropriate microservices
- **CQRS Pattern**: Query endpoints separate from command/document upload endpoints
- **Repository Pattern**: Data access abstracted through service layers
- **Middleware Pipeline**: Express middleware stack for cross-cutting concerns

### Authentication & Authorization

Authentication is implemented using Firebase JWT tokens with middleware verification:

```javascript
// Authentication middleware in backend/src/middleware/auth.ts
export default async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const decoded = await admin.auth().verifyIdToken(token);
  req.user = { uid: decoded.uid, email: decoded.email };
  next();
}
```

Protected routes include user profiles, organization forms, dashboard data, and monitoring preferences.

### Rate Limiting

Express-rate-limit middleware provides API protection:

```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
  standardHeaders: true
});
```

## 2. Dockerization

The system is fully containerized using Docker Compose for local development and deployment.

### Docker Compose Architecture

```yaml
services:
  vector-api:    # Port 5001 - Vector search service
  rag-api:       # Port 8000 - RAG orchestration
  backend:       # Port 3001 - Main API gateway
  frontend:      # Port 3000 - Next.js application
```

### Service Dependencies

Services start in dependency order:
- `vector-api` starts first (no dependencies)
- `rag-api` depends on `vector-api` for retrieval
- `backend` depends on both Python services
- `frontend` depends on `backend`

### Volume Management

Persistent data is managed through Docker volumes:

```yaml
volumes:
  - ./pipeline/storage:/app/pipeline/storage
  - ./pipeline/embed-and-vec-search/vector_index:/app/pipeline/embed-and-vec-search/vector_index
```

This ensures FAISS indexes and processed document chunks persist across container restarts.

### Environment Configuration

Environment variables are injected via docker-compose.yml:

```yaml
environment:
  - GROQ_API_KEY=${GROQ_API_KEY}
  - MOCK_MODE=${MOCK_MODE:-False}
  - PYTHON_RAG_URL=http://rag-api:8000
```

### Multi-stage Builds

Dockerfiles use multi-stage builds for optimization:

```dockerfile
# Backend Dockerfile example
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

## 3. Automated Testing

The system implements comprehensive automated testing across all components with unit and integration test coverage.

### Frontend Testing (Jest + React Testing Library)

**Test Coverage:**
- Component unit tests for UI primitives (Button, Input, Modal, Navbar, Sidebar)
- Animation and effect component testing
- Upload modal functionality testing
- Page-level integration tests (Home page routing)

**Test Configuration:**
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

**Example Test:**
```typescript
describe('Button', () => {
  it('renders with default variant and size', () => {
    render(<Button>Click me</Button>);
    const btn = screen.getByRole('button', { name: /click me/i });
    expect(btn).toBeInTheDocument();
  });
});
```

### Backend Testing (Jest + Supertest)

**Test Coverage:**
- Route integration tests with HTTP request mocking
- Service layer unit tests (LLM, Firebase, MongoDB)
- Authentication middleware testing
- Error handling and validation testing

**Example Integration Test:**
```typescript
describe('/api/query route', () => {
  it('returns 400 when query is missing', async () => {
    const res = await request(app).post('/api/query').send({});
    expect(res.status).toBe(400);
  });
});
```

### Ingestion Pipeline Testing (pytest)

**Test Coverage:**
- File type detection and validation
- Text extraction from multiple formats (PDF, DOCX, TXT)
- Document chunking with overlap handling
- Page range calculation and metadata management
- End-to-end pipeline integration testing

**Example Unit Test:**
```python
def test_chunk_text_with_overlap():
    text = " ".join([f"word{i}" for i in range(12)])
    chunks = chunker.chunk_text(text, doc_id="doc1", chunk_size=5, overlap=2)
    assert len(chunks) == 3
    assert chunks[1]["start_offset"] == 3  # chunk_size - overlap
```

### Embed-and-Vector-Search Testing (pytest)

**Test Coverage:**
- Embedding generation and dimensionality validation
- FAISS index building and persistence
- Vector similarity search with filtering
- Index loading and metadata management
- API endpoint integration testing

**Example Test:**
```python
def test_build_and_search():
    chunks = indexer.load_chunks(self.chunks_dir)
    embeddings = indexer.embed_chunks(chunks)
    indexer.build_index(embeddings, chunks)
    results = indexer.search("GMP compliance pharmaceutical", k=2)
    assert len(results) > 0
    assert results[0]["score"] > 0
```

### RAG Orchestrator Testing (pytest)

**Test Coverage:**
- Core RAG pipeline execution
- API endpoint testing (health, query, upload, full pipeline)
- Retrieval service integration
- Model API interaction (with mock mode support)
- Output parsing and formatting
- Prompt template validation

**Mock Mode Configuration:**
```python
@pytest.fixture(autouse=True)
def enable_mock_mode():
    config.MOCK_MODE = True
    yield
    config.MOCK_MODE = False
```

### Test Infrastructure

**Shared Test Configuration:**
- `pipeline/conftest.py` provides pytest fixtures for sample data
- Mock LLM responses for isolated testing
- Temporary directories for file upload testing
- Database mocking for integration tests

**Test Execution:**
```bash
# Frontend tests
npm run test

# Backend tests
npm run test

# Pipeline tests
pytest pipeline/ingestion/tests/
pytest pipeline/embed-and-vec-search/tests/
pytest pipeline/rag-orchestrator/tests/
```

## 4. Logging and Monitoring

The system implements structured logging and health monitoring across all services.

### Python Logging Configuration

Centralized logging configuration in `config.py`:

```python
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
```

Log levels are configurable via environment variables (INFO, DEBUG, WARNING, ERROR).

### Express Logging

Morgan HTTP request logger provides request tracking:

```javascript
app.use(morgan('dev')); // Outputs: GET /api/health 200 15ms
```

Combined with Winston for structured application logging.

### Health Check Endpoints

All services expose health endpoints for monitoring:

```javascript
// Backend health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MedLaw Backend',
    timestamp: new Date().toISOString()
  });
});
```

```python
# Python services health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "RAG Orchestrator API",
        "mock_mode": config.MOCK_MODE
    })
```

### Service Health Monitoring

Backend provides aggregated health status:

```javascript
const [ragHealth, vectorHealth] = await Promise.allSettled([
  axios.get(`${RAG_API_URL}/health`, { timeout: 5000 }),
  axios.get(`${VECTOR_API_URL}/health`, { timeout: 5000 })
]);

res.json({
  rag_api: ragHealth.status === 'fulfilled' ? ragHealth.value.data : { status: 'unavailable' },
  vector_api: vectorHealth.status === 'fulfilled' ? vectorHealth.value.data : { status: 'unavailable' }
});
```

## 5. Exception Handling and Recovery

The system implements comprehensive error handling with graceful degradation.

### Backend Error Handling

Express routes use try-catch blocks with structured error responses:

```javascript
router.post('/generate', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const text = await llmService.generate({ prompt });
    res.json({ text });
  } catch (err) {
    console.error('LLM generate error', err);
    res.status(500).json({ error: 'LLM generate failed' });
  }
});
```

### Python Error Handling

Flask routes implement exception handling with custom error classes:

```python
class RAGOrchestratorError(Exception):
    """Custom exception for RAG orchestrator errors."""
    pass

@app.route('/rag/query', methods=['POST'])
def rag_query():
    try:
        data = request.json or {}
        query = data.get('query')
        if not query:
            return jsonify({"error": "query is required"}), 400

        result = run(query=query, doc_ids=doc_ids, template_type=template_type)
        return jsonify(result)

    except RAGOrchestratorError as e:
        logger.error(f"RAG orchestration error: {e}")
        return jsonify({"error": str(e)}), 500
```

### Graceful Degradation

When RAG services are unavailable, the system provides fallback responses:

```javascript
} catch (ragError) {
  response.error = 'RAG service unavailable, providing basic response';
  response.result = {
    narrative: `I understand you're asking about: "${query}". However, the document analysis service is currently unavailable.`,
    checklist: ['Try again in a few minutes'],
    citations: {}
  };
}
```

### File Upload Error Handling

Upload endpoints validate files and clean up on errors:

```javascript
} catch (err) {
  // Clean up uploaded files on error
  for (const file of files) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
  }
  res.status(502).json({ error: 'Failed to process files' });
}
```

## 6. Configuration Management

The system uses environment-based configuration with validation and defaults.

### Environment Variables

**Backend Configuration (`env.example.txt`):**
```
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://...
FIREBASE_PROJECT_ID=medlaw-app
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
LLM_PROVIDER=anthropic
PYTHON_RAG_URL=http://localhost:8000
VECTOR_SEARCH_URL=http://localhost:5001
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Python Configuration (`config.py`):**
```python
# Environment-based configuration with defaults
VECTOR_SEARCH_URL = os.getenv("VECTOR_SEARCH_URL", "http://localhost:5001/vector/search")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
MOCK_MODE = os.getenv("MOCK_MODE", "False").lower() == "true"
```

### Docker Environment Injection

Docker Compose injects environment variables:

```yaml
environment:
  - PYTHON_RAG_URL=http://rag-api:8000
  - VECTOR_SEARCH_URL=http://vector-api:5001
  - GROQ_API_KEY=${GROQ_API_KEY:-}
  - MOCK_MODE=${MOCK_MODE:-False}
```

### Configuration Validation

Services validate required configuration on startup:

```python
if not GROQ_API_KEY and not MOCK_MODE:
    raise ValueError("GROQ_API_KEY required when not in mock mode")
```

## 7. Git Workflow

The project follows a modular development approach with team-based branching strategy.

### Team Structure

Development is organized by functional teams:

- **Muhammad Ahmad Tariq + Zarnab Ali (Frontend)**: Next.js UI and client-side logic
- **Saif ur Rehman (Ingestion)**: Document processing pipeline
- **Ghulam Husnain (Embeddings)**: Vector search and indexing
- **Afnan Rafaqat (RAG)**: Retrieval-augmented generation
- **Muhammad Ali (LLM)**: AI model integration
- **Muhammad Ahmad Tariq (Auth)**: Authentication, User Management, Modules Inegration, Dockerization, Architecture Setup

### Branching Strategy

**Feature Branches:**
```
main
├── feature/home-page
├── feature/pdf-extraction
├── feature/vector-search
├── feature/rag-pipeline
├── feature/llm-integration
└── feature/auth-system-and-integration
```

**Pull Request Workflow:**
1. Create feature branch from `main`
2. Implement changes in isolated branch
3. Submit pull request with detailed description
4. Code review by team members
5. Automated testing validation
6. Merge to `main` after approval

### Modular Development

Each team member works within their designated directory structure:

```
MedLaw/
├── frontend/           # Zarnab Ali + Muhammad Ahmad Tariq
├── backend/            # Muhammad Ahmad Tariq + Muhammad Ali
└── pipeline/           # Afnan Rafaqat, Saif ur Rehman, Ghulam Husnain 
    ├── ingestion/              # Saif ur Rehman
    ├── embed-and-vec-search/   # Ghulam Husnain
    └── rag-orchestrator/       # Afnan Rafaqat
```

### Code Review Process

**Review Checklist:**
- Unit tests pass for modified components
- Integration tests maintain compatibility
- API contracts remain stable
- Documentation updated for changes
- No breaking changes to shared interfaces

### Continuous Integration

GitHub Actions workflow for automated testing:

```yaml
- name: Run tests
  run: |
    cd frontend && npm test
    cd ../backend && npm test
    cd ../pipeline && python -m pytest
```

This ensures all components maintain compatibility through modular development cycles.
