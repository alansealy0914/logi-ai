# logi-ai
# LogiAI - Intelligent Transportation Logistics Platform

Production-ready monolithic app with:
- PostgreSQL + pgvector semantic search
- AI Assistant (RAG + Groq Llama3)
- Real-time GPS simulation via WebSockets
- Route optimization with OR-Tools
- React Frontend + Leaflet maps
- Docker + Kubernetes + Terraform (AWS)

## Quick Start
```bash
docker compose up --build
# Backend: http://localhost:8000
# Frontend: http://localhost:3000


logiai/
├── backend/
│   ├── src/
│   │   ├── main.py
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── rag/
│   │   └── utils/
│   ├── alembic.ini
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml
├── k8s/
├── terraform/
├── .env.example
├── README.md
└── .gitignore


Useful commands if you want to re-run or inspect:
- Start both (rebuild): 
```bash
cd /Users/alansealy/Desktop/logi-ai
docker compose up -d --build
```
- Show status and recent logs:
```bash
docker compose ps
docker compose logs backend --tail=50
docker compose logs frontend --tail=50
```

Next step: open the frontend at http://localhost:4000 or tell me if you want me to run integration tests or open the PR for review.
