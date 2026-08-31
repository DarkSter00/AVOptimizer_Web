import platform
import os
import subprocess
import asyncio
import tkinter as tk
from tkinter import filedialog
from fastapi import APIRouter

from api.models import ScanRequest, TargetRequest, HashRequest, OpenFolderRequest
from core.globals import controller

api_router = APIRouter(prefix="/api")

@api_router.post("/open_folder")
async def open_system_folder(req: OpenFolderRequest):
    path = req.path
    try:
        if platform.system() == "Windows":
            os.startfile(path)
        elif platform.system() == "Darwin":
            subprocess.Popen(["open", path])
        else:
            subprocess.Popen(["xdg-open", path])
        return {"status": "ok"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@api_router.post("/exclude_target")
async def exclude_target(req: TargetRequest):
    controller.exclude_target(req.sub_name)
    return {"status": "ok"}

@api_router.post("/include_target")
async def include_target(req: TargetRequest):
    controller.include_target(req.sub_name)
    return {"status": "ok"}

@api_router.post("/scan")
async def start_scan(req: ScanRequest):
    controller.scan_and_queue(req.directory, force_rescan=req.force_rescan)
    return {"status": "ok"}

@api_router.post("/delete_core")
async def delete_core(req: ScanRequest):
    controller.delete_target(True, req.directory)
    return {"status": "ok"}

@api_router.post("/toggle_pause")
async def toggle_pause():
    if controller.is_processing_paused:
        controller.resume_all()
        return {"status": "resumed"}
    else:
        controller.pause_all()
        return {"status": "paused"}

@api_router.post("/stop")
async def stop_all():
    controller.reset_all()
    return {"status": "stopped"}

@api_router.get("/browse")
async def browse_folder():
    def get_path():
        root = tk.Tk()
        root.withdraw()
        root.attributes('-topmost', True)
        root.lift()
        folder = filedialog.askdirectory(title="Seleziona cartella da ottimizzare", parent=root)
        root.destroy()
        return folder

    current_loop = asyncio.get_running_loop()
    folder = await current_loop.run_in_executor(None, get_path)
    return {"folder": folder}

@api_router.get("/db/records")
async def get_db_records():
    return {"records": controller.db.get_all_records()}

@api_router.post("/db/delete")
async def delete_db_record(req: HashRequest):
    controller.db.delete_record(req.pseudo_hash)
    controller.db.load_cache()
    return {"status": "ok"}

@api_router.post("/db/clear_all")
async def clear_all_db_records():
    controller.db.clear_all()
    controller.db.load_cache()
    return {"status": "ok"}

@api_router.post("/retry_errors")
async def retry_errors():
    controller.retry_errors()
    return {"status": "ok"}