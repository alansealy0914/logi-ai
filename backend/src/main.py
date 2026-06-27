from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import shipments, ai, tracking, optimization, auth, drivers, trucks
clearfrom .models import fleet, shipment, user  # noqa - register all models
from sqlalchemy import text
from .core.database import engine, Base

app = FastAPI(title="LogiAI", version="1.1.0")

@app.on_event("startup")
async def create_tables():
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(shipments.router)
app.include_router(drivers.router)
app.include_router(trucks.router)
app.include_router(ai.router)
app.include_router(tracking.router)
app.include_router(optimization.router)

@app.get("/")
async def root():
    return {"message": "LogiAI v1.1 Running - JWT Protected"}