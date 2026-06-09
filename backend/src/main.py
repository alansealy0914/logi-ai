from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import shipments, ai, tracking, optimization, auth, drivers, trucks
from .models import fleet  # ensure fleet tables are registered  # noqa

app = FastAPI(title="LogiAI", version="1.1.0")

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