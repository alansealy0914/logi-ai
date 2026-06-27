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

More useful docker commands; When new development needs to be passed to docker:
docker-compose down -v docker-compose up --build -d
or... 
docker compose down && docker compose up -d

When need to re-seed:
docker-compose down -v docker-compose up
or... 
npm run seed --workspace=backend
then: docker-compose down -v docker-compose up --build -d
 
Rebuild-backend: 
docker compose up -d --build backend

Restart the backend: 
docker compose restart backend

A clean re-build so the container picks up new changes: 
docker compose down && docker compose up -d –build

Can't push refs to remote. Try running "Pull" first to integrate your changes.
cd /Users/alansealy/Desktop/asealy0914-Repository/0914-repo/logi-ai git pull --rebase origin main
then: push from terminal: 
git push origin main

if all else fails... 
force push: git push origin main --force-with-lease

When we need to rerun migrations: 
npm run db:migrate --workspace=backend

Next step: open the frontend at http://localhost:4009 or tell me if you want me to run integration tests or open the PR for review.
