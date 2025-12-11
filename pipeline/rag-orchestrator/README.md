# RAG Orchestrator - Module 4 & 5

A complete, modular RAG (Retrieval-Augmented Generation) orchestrator with Grok API integration.

## 📁 Project Structure

```
project/
├── main.py                          # Main demo runner
├── config.py                        # Configuration and settings
├── requirements.txt                 # Python dependencies
├── .env.example                     # Environment variables template
│
├── orchestrator/                    # Module 4: RAG Orchestrator
│   ├── __init__.py
│   ├── rag_orchestrator.py         # Main orchestration logic
│   ├── retrieval_service.py        # Vector search API client
│   ├── prompt_builder.py           # Jinja2 template renderer
│   └── output_parser.py            # LLM output parser
│
├── prompts/                         # Jinja2 templates
│   ├── qa_prompt.jinja             # Q&A template
│   ├── gap_prompt.jinja            # Gap analysis template
│   └── checklist_prompt.jinja      # Checklist generation template
│
├── model/                           # Module 5: Model API Wrapper
│   ├── __init__.py
│   └── model_api.py                # Grok API wrapper
│
└── tests/                           # Unit tests
    ├── test_rag_orchestrator.py
    ├── test_output_parser.py
    └── test_prompt_builder.py
```

## 🚀 Installation

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` and add your Grok API key:

```bash
cp .env.example .env
```

Edit `.env`:
```
GROK_API_KEY=your_actual_grok_api_key_here
MOCK_MODE=False
```

**For testing without API keys**, set `MOCK_MODE=True`

## 🎯 Usage

### Quick Start (Demo Mode)

Run the demo with mock data (no API keys required):

```bash
python main.py
```

Select from the menu:
- **1**: Question Answering demo
- **2**: Gap Analysis demo
- **3**: Checklist Generation demo
- **4**: Interactive mode
- **5**: Run all demos

### Programmatic Usage

```python
from orchestrator import run

# Basic Q&A
result = run(
    query="What are the key features?",
    doc_ids=["doc1", "doc2"],
    template_type="qa"
)

print(result["narrative"])
print(result["checklist"])
print(result["citations"])
```

### Template Types

- **`qa`**: Question answering
- **`gap`**: Gap analysis
- **`checklist`**: Checklist generation

## 🧪 Running Tests

Run all tests:

```bash
pytest tests/ -v
```

Run specific test file:

```bash
pytest tests/test_rag_orchestrator.py -v
```

Run with coverage:

```bash
pytest tests/ --cov=orchestrator --cov=model -v
```

## 🔧 Configuration

All configuration is in `config.py`. Key settings:

| Variable | Description | Default |
|----------|-------------|---------|
| `GROK_API_KEY` | Your Grok API key | (required) |
| `GROK_MODEL` | Model to use | `grok-beta` |
| `VECTOR_SEARCH_URL` | Vector search endpoint | `http://localhost:8001/vector/search` |
| `MOCK_MODE` | Use mock data | `False` |
| `GROK_TIMEOUT` | API timeout (seconds) | `60` |
| `GROK_MAX_TOKENS` | Max tokens to generate | `2048` |

## 📚 Module Details

### Module 4: RAG Orchestrator

**Main Function**: `orchestrator.run(query, doc_ids, template_type)`

**Pipeline**:
1. **Retrieve**: Calls vector search API to get relevant chunks
2. **Compose**: Builds prompt using Jinja2 templates
3. **Infer**: Calls Grok API for generation
4. **Parse**: Extracts structured JSON from output

**Output Format**:
```json
{
  "narrative": "Comprehensive answer...",
  "checklist": ["item 1", "item 2"],
  "citations": {
    "doc1_chunk1": "citation text"
  }
}
```

### Module 5: Model API Wrapper

**Main Function**: `model.model_api.infer(prompt)`

Simple wrapper around Grok API that:
- Handles authentication
- Manages timeouts
- Provides error handling
- Supports mock mode for testing

## 🔌 Integration with Other Modules

### Person 3's Vector Search API

Expected endpoint: `POST http://localhost:8001/vector/search`

Request:
```json
{
  "query": "search query",
  "doc_ids": ["doc1", "doc2"]
}
```

Response:
```json
{
  "chunks": [
    {
      "chunk_id": "doc1_chunk1",
      "text": "chunk content",
      "score": 0.95,
      "metadata": {"doc_id": "doc1", "page": 1}
    }
  ]
}
```

## 🛡️ Error Handling

The system includes comprehensive error handling:

- **RetrievalError**: Vector search API failures
- **PromptBuilderError**: Template rendering issues
- **ModelAPIError**: Grok API failures
- **OutputParserError**: Parsing failures

All errors are logged and propagated with context.

## 🧩 Mock Mode

For development/testing without external dependencies:

1. Set `MOCK_MODE=True` in `.env`
2. Run normally - mock data will be used

Mock mode provides:
- Simulated vector search results
- Simulated LLM responses
- Consistent test data

## 📝 License

MIT License - Free to use and modify

## 👥 Team Integration

- **Person 3**: Provides vector search API
- **Person 4** (You): RAG orchestrator
- **Person 5** (You): Model API wrapper

---

**Questions?** Check the code comments or run `python main.py` for interactive demos!
