from fastapi import APIRouter, WebSocket
import asyncio
import json
import random

router = APIRouter(prefix="/tracking", tags=["Real-time Tracking"])

@router.websocket("/ws/{tracking_number}")
async def websocket_endpoint(websocket: WebSocket, tracking_number: str):
    await websocket.accept()
    lat = 40.7128
    lng = -74.0060
    try:
        while True:
            lat += random.uniform(-0.01, 0.01)
            lng += random.uniform(-0.01, 0.01)
            data = {
                "tracking_number": tracking_number,
                "lat": lat,
                "lng": lng,
                "speed": random.randint(55, 75),
                "status": "IN_TRANSIT",
                "timestamp": "now"
            }
            await websocket.send_text(json.dumps(data))
            await asyncio.sleep(2)
    except:
        pass