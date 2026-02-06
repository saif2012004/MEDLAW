# MedLaw Regulatory Copilot

**An enterprise-grade AI-powered regulatory compliance assistant for medical device and pharmaceutical companies.**

MedLaw helps organizations navigate complex regulatory frameworks (FDA, ISO 13485, EU MDR) through intelligent document analysis, real-time compliance monitoring, and AI-driven recommendations.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Python](https://img.shields.io/badge/Python-3.10+-blue)

## 🎯 Key Features

### 🤖 AI-Powered Analysis
- **Natural Language Queries**: Ask questions in plain English about regulatory requirements
- **RAG (Retrieval-Augmented Generation)**: Accurate answers grounded in your regulatory documents
- **Smart Document Processing**: Multi-format support (PDF, DOCX, TXT) with OCR capabilities
- **Intelligent Chunking**: Optimized text segmentation with context preservation

### 📊 Compliance Dashboard
- **Real-time Compliance Scoring**: Track your organization's regulatory adherence
- **Alert Monitoring**: Stay updated on FDA recalls, safety alerts, and regulatory changes
- **Product Management**: Centralized tracking of medical devices and compliance status
- **AI-Generated Checklists**: Tailored compliance checklists based on your queries

### 🔍 Advanced Search
- **Vector Similarity Search**: FAISS-powered semantic search across documents
- **Citation Tracking**: Every AI response includes source document citations
- **Multi-Document Analysis**: Query across multiple regulatory documents simultaneously
- **Entity Extraction**: Automatically identifies regulations, dates, and device types

### 🔐 Enterprise Security
- **Firebase Authentication**: Secure user management and session handling
- **Role-Based Access Control**: Organization-level permissions
- **Rate Limiting**: API protection against abuse
- **Input Validation**: Comprehensive request sanitization

## 🏗️ Architecture

### Microservices Design
```
┌─────────────────┐
│   Frontend      │  Next.js 16 (React 19)
│   Port: 3000    │  TypeScript, Tailwind CSS
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Backend API   │  Node.js/Express
│   Port: 3001    │  MongoDB, Firebase Auth
└────────┬────────┘
         │
    ┌────┴─────┐
    ▼          ▼
┌───────┐  ┌──────────────┐
│Vector │  │RAG           │  Python/Flask
│Search │  │Orchestrator  │  LangChain, Groq API
│5001   │  │Port: 8000    │
└───────┘  └──────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- Docker and Docker Compose (recommended)
- MongoDB Atlas account
- Firebase project
- LLM API key (Groq/OpenAI/Anthropic)

### Option 1: Docker Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/saif2012004/MedLaw-Regulatory-Copilot.git
cd MedLaw-Regulatory-Copilot

# Set up environment variables
cp backend/env.example.txt backend/.env
cp frontend/.env.local.example frontend/.env.local
cp pipeline/.env.example pipeline/.env

# Edit the .env files with your credentials

# Start all services with Docker
docker-compose up --build
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **RAG Orchestrator**: http://localhost:8000
- **Vector Search API**: http://localhost:5001

### Option 2: Manual Setup

#### 1. Backend Setup
```bash
cd backend
npm install
cp env.example.txt .env
# Edit .env with your credentials
npm run dev
```

#### 2. Frontend Setup
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your Firebase config
npm run dev
```

#### 3. Pipeline Setup
```bash
cd pipeline
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start Vector Search API
python embed-and-vec-search/vector_search_api.py &

# Start RAG Orchestrator
cd rag-orchestrator
python api.py
```

## 📦 Technology Stack

### Frontend
- **Framework**: Next.js 16 with React 19 (Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Authentication**: Firebase Auth SDK
- **State Management**: React Context API

### Backend
- **Runtime**: Node.js 18+ with Express
- **Database**: MongoDB Atlas
- **Authentication**: Firebase Admin SDK
- **LLM Integration**: OpenAI/Anthropic/Groq APIs
- **File Processing**: Multer for uploads
- **Testing**: Jest, Supertest

### AI/ML Pipeline (Python)
- **Framework**: Flask for REST APIs
- **Vector Database**: FAISS (Facebook AI Similarity Search)
- **Embeddings**: sentence-transformers (all-MiniLM-L6-v2, 384 dimensions)
- **Document Processing**: pdfplumber, python-docx, pytesseract (OCR)
- **LLM Orchestration**: Groq API (llama-3.3-70b-versatile)
- **Prompt Engineering**: Jinja2 templates
- **Testing**: pytest, pytest-mock

### DevOps
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions (planned)
- **Code Quality**: ESLint, Prettier, Black
- **Testing**: Jest, pytest with coverage

## 🏛️ Project Structure

```
MedLaw/
├── frontend/                       # Next.js web application
│   ├── src/
│   │   ├── app/                   # App router pages
│   │   ├── components/            # React components
│   │   ├── context/               # Context providers
│   │   └── lib/                   # Utilities
│   └── public/                    # Static assets
│
├── backend/                        # Node.js API server
│   ├── src/
│   │   ├── middleware/            # Auth, validation
│   │   ├── models/                # MongoDB schemas
│   │   ├── routes/                # API endpoints
│   │   └── services/              # Business logic
│   └── uploads/                   # File uploads
│
└── pipeline/                       # Python RAG system
    ├── ingestion/                 # Document processing
    ├── embed-and-vec-search/      # Vector search service
    ├── rag-orchestrator/          # RAG pipeline
    └── storage/                   # File storage
```

## 📚 Documentation

- **[API Documentation](api-documentation.md)** - Complete API reference with all endpoints
- **[Engineering Report](engineering-report.md)** - Technical architecture and implementation details
- **[Frontend README](frontend/README.md)** - Frontend development guide
- **[Backend README](backend/README.md)** - Backend development guide
- **[Pipeline README](pipeline/README.md)** - AI pipeline overview

## 🧪 Testing

### Run All Tests
```bash
# Frontend tests
cd frontend && npm test

# Backend tests
cd backend && npm test

# Python pipeline tests
cd pipeline && pytest -v --cov
```

### Test Coverage
- **Frontend**: Component tests, integration tests
- **Backend**: API endpoint tests, middleware tests, service tests
- **Pipeline**: Unit tests for ingestion, embeddings, RAG orchestration

### Linting
```bash
# Frontend & Backend
npm run lint

# Python
cd pipeline && black . && flake8
```

## 🚀 Deployment

### Production Deployment Options

**Frontend (Vercel)**
```bash
# Deploy to Vercel
vercel --prod

# Environment Variables Required:
# - NEXT_PUBLIC_API_URL
# - NEXT_PUBLIC_FIREBASE_* (all Firebase config)
```

**Backend (Render/Railway)**
```bash
# Service Configuration:
# - Service Type: Web Service (Node 18)
# - Build Command: npm install && npm run build
# - Start Command: npm start
# - Port: 3001

# Environment Variables Required:
# PORT, CORS_ORIGIN, MONGODB_URI, FIREBASE_PROJECT_ID,
# FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, LLM_PROVIDER,
# GROQ_API_KEY/OPENAI_API_KEY, PYTHON_RAG_URL,
# RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS
```

**Pipeline (Render/AWS EC2)**
```bash
# Build Command: pip install -r pipeline/requirements.txt
# Start Command: python pipeline/embed-and-vec-search/vector_search_api.py
# Persistent Volume: Mount for vector_index directory
# CORS: Configure for cross-origin requests from backend

# Environment Variables:
# LLM_PROVIDER, GROQ_API_KEY, LLM_MODEL, VECTOR_SEARCH_URL
```

**DNS/HTTPS**
- Vercel provides managed HTTPS for frontend
- Render/Railway provides managed HTTPS for backend services
- Configure CORS_ORIGIN to match your production frontend URL

## 📊 Usage Examples

### Query Compliance Requirements
```bash
curl -X POST http://localhost:3001/api/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What are the design control requirements for Class II medical devices?",
    "template_type": "qa"
  }'
```

### Upload Regulatory Documents
```bash
curl -X POST http://localhost:3001/api/rag/upload \
  -F "files=@FDA_21CFR820.pdf" \
  -F "files=@ISO13485.pdf"
```

### Get Compliance Dashboard
```bash
curl -X GET http://localhost:3001/api/dashboard/overview \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

## 🎓 Learning Resources

- **[FDA Regulations](https://www.fda.gov/medical-devices)** - U.S. regulatory guidelines
- **[ISO 13485](https://www.iso.org/standard/59752.html)** - Quality management systems
- **[EU MDR](https://www.medical-device-regulation.eu/)** - European regulations
- **[FAISS Documentation](https://faiss.ai/)** - Vector similarity search
- **[Next.js Docs](https://nextjs.org/docs)** - Frontend framework

## 👥 Contributors

This project was developed as a collaborative team effort:

- **Muhammad Ahmad Tariq** - Architecture, Frontend, Auth, Integration, Dockerization
- **Zarnab Ali** - Frontend Development
- **Saif ur Rehman** - Document Ingestion Pipeline
- **Ghulam Husnain** - Embeddings and Vector Search
- **Afnan Rafaqat** - RAG Orchestrator
- **Muhammad Ali** - LLM Integration

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Contact & Support

For questions, feedback, or collaboration opportunities:

- **GitHub**: [@saif2012004](https://github.com/saif2012004)
- **Repository**: [github.com/saif2012004/MedLaw-Regulatory-Copilot](https://github.com/saif2012004/MedLaw-Regulatory-Copilot)
- **Email**: saifurrehman2012004@gmail.com

## 🔮 Future Roadmap

- [ ] Multi-language support (Spanish, German, Japanese)
- [ ] Real-time collaborative document annotation
- [ ] Automated compliance report generation (PDF/DOCX)
- [ ] Integration with FDA MAUDE database API
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard with compliance trends
- [ ] Custom LLM fine-tuning on proprietary regulatory data
- [ ] GraphQL API support
- [ ] Real-time notifications via WebSockets
- [ ] Advanced role-based permissions system

---

**Last Updated**: February 2026  
**Repository**: https://github.com/saif2012004/MedLaw-Regulatory-Copilot

