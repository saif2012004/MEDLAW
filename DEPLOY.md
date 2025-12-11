# Deploy Guide

## Frontend (Vercel)
- Set env vars from frontend/.env.local
- vercel --prod

## Backend (Render)
- Service type: Web Service (Node 18)
- Build: npm install && npm run build
- Start: npm start
- Env vars: PORT, CORS_ORIGIN, MONGODB_URI, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, LLM_PROVIDER, OPENAI_API_KEY/ANTHROPIC_API_KEY, PYTHON_RAG_URL, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS

## Pipeline (Render or local)
- Build: pip install -r pipeline/requirements.txt
- Start: python pipeline/embed-and-vec-search/vector_search_api.py
- Persistent volume for vector_index

## DNS/HTTPS
- Use Vercel-managed HTTPS for frontend
- Use Render-managed HTTPS for backend and pipeline
