from fastapi import APIRouter, WebSocket
import asyncio
import json
import random
from datetime import datetime, timezone
from sqlalchemy import text
from ..core.database import AsyncSessionLocal

router = APIRouter(prefix="/tracking", tags=["Real-time Tracking"])

async def _get_shipment_coords(tracking_number: str):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT metadata, status FROM shipments WHERE tracking_number = :tn"),
            {"tn": tracking_number}
        )
        row = result.fetchone()
        if not row or not row.metadata:
            return None
        m = row.metadata
        if not all(k in m for k in ("origin_lat", "origin_lng", "dest_lat", "dest_lng")):
            return None
        return {
            "origin_lat": float(m["origin_lat"]),
            "origin_lng": float(m["origin_lng"]),
            "dest_lat":   float(m["dest_lat"]),
            "dest_lng":   float(m["dest_lng"]),
            "status":     row.status,
        }

@router.websocket("/ws/{tracking_number}")
async def websocket_endpoint(websocket: WebSocket, tracking_number: str):
    await websocket.accept()

    coords = await _get_shipment_coords(tracking_number)

    # Fallback to hardcoded NYC if no DB coords found
    if coords is None:
        coords = {"origin_lat": 40.7128, "origin_lng": -74.0060,
                  "dest_lat": 34.0522, "dest_lng": -118.2437, "status": "IN_TRANSIT"}

    o_lat, o_lng = coords["origin_lat"], coords["origin_lng"]
    d_lat, d_lng = coords["dest_lat"],   coords["dest_lng"]

    # Simulate a 60-step journey (2s interval = ~2 min total sim)
    total_steps = 60
    step = 0

    try:
        while True:
            progress = min(step / total_steps, 1.0)
            lat = o_lat + (d_lat - o_lat) * progress + random.uniform(-0.005, 0.005)
            lng = o_lng + (d_lng - o_lng) * progress + random.uniform(-0.005, 0.005)
            status = "DELIVERED" if progress >= 1.0 else coords["status"]

            await websocket.send_text(json.dumps({
                "tracking_number": tracking_number,
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "speed": random.randint(55, 75) if status == "IN_TRANSIT" else 0,
                "status": status,
                "progress": round(progress * 100, 1),
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }))

            step += 1
            await asyncio.sleep(2)
    except:
        pass