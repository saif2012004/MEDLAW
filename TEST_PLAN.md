# Smoke Test Plan

## Frontend
- npm run dev
- Open /home ? search ? /assistant ? classification routing ? templates/alerts
- Upload doc modal: ensure stub response message
- Onboarding: submit form, redirected to dashboard

## Backend
- npm run dev (backend)
- curl http://localhost:3001/health
- curl -X POST http://localhost:3001/api/llm/generate -d '{"prompt":"test"}' -H "Content-Type: application/json"
- curl -X POST http://localhost:3001/api/rag/analyze -d '{"query":"GMP"}' -H "Content-Type: application/json"

## Pipeline
- python pipeline/embed-and-vec-search/vector_search_api.py
- curl http://localhost:5001/health

## End-to-End
1) Home ? query ? assistant
2) Assistant template query routes to /dashboard/templates with search prefilled
3) Assistant alerts query routes to /dashboard/alerts with filters applied
4) Onboarding submit ? dashboard shows data
