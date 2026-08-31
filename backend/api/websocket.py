import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from core.globals import controller

ws_router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

def setup_ws_callbacks(loop):
    def on_metrics(metrics):
        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({"type": "metrics", "data": metrics}),
                loop
            )

    def on_progress(worker_id, filename, op_type, file_prog, sub_prog, global_prog):
        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({
                    "type": "progress",
                    "data": {
                        "worker_id": worker_id, "filename": filename, "op_type": op_type,
                        "file_prog": file_prog, "sub_prog": sub_prog, "global_prog": global_prog
                    }
                }),
                loop
            )

    def on_log(msg):
        if loop and loop.is_running():
            asyncio.run_coroutine_threadsafe(
                manager.broadcast({"type": "log", "data": msg}),
                loop
            )

    controller.on_metrics_update = on_metrics
    controller.on_progress_update = on_progress
    controller.on_log_event = on_log

@ws_router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    await websocket.send_json({"type": "metrics", "data": controller.metrics})
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)