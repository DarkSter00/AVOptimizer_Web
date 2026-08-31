import os
import time
import json
import subprocess
import threading
import concurrent.futures
from pathlib import Path


class Scanner:
    def __init__(self, controller):
        self.controller = controller

    def _build_meta_dict(self, file_path, info):
        if not info: return None
        v_codec = "N/A"
        a_codec = "N/A"
        for s in info.get('streams', []):
            if s.get('codec_type') == 'video' and v_codec == "N/A":
                v_codec = s.get('codec_name', 'N/A').lower()
            if s.get('codec_type') == 'audio':
                a_codec = s.get('codec_name', 'N/A').lower()
        dur = float(info.get('format', {}).get('duration', 0.0))
        lufs = info.get('measured_lufs')
        target_lufs = float(self.controller.settings.get('target_lufs'))

        v_opt = v_codec in ['hevc', 'h265']
        pref_a = self.controller.settings.get(
            "audio_codec_mkv") if file_path.suffix.lower() == ".mkv" else self.controller.settings.get(
            "audio_codec_mp4")
        a_opt = (a_codec == pref_a) or pref_a == 'copy'
        lufs_opt = False
        if lufs is not None and abs(lufs - target_lufs) <= 1.0:
            lufs_opt = True

        return {
            "v_codec": v_codec, "v_opt": v_opt,
            "a_codec": a_codec, "a_opt": a_opt,
            "lufs": lufs, "lufs_opt": lufs_opt,
            "dur": dur
        }

    def _extract_metadata(self, file_path):
        while self.controller.is_scanning_paused and not self.controller.is_scanning_aborted: time.sleep(0.5)
        if self.controller.is_scanning_aborted: return (file_path, None)
        cmd = ['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_type,codec_name,channels:format=duration',
               '-of', 'json', str(file_path)]
        try:
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
            if result.returncode != 0: return (file_path, None)
            return (file_path, json.loads(result.stdout))
        except:
            return (file_path, None)

    def scan_and_queue(self, directory_path, force_rescan=False, delay_seconds=0):
        self.controller.is_scanning_aborted = False
        target_dir = Path(directory_path)
        valid_extensions = set(self.controller.settings.get("extension_priority"))
        core_name = str(target_dir.resolve())
        if core_name not in self.controller.metrics["cores"]: self.controller.metrics["cores"][core_name] = {}

        def scan_thread():
            self.controller.metrics["global"]["is_scanning"] = True
            self.controller.metrics["global"]["scan_step"] = 1
            self.controller.metrics["global"]["scan_status"] = "Mappatura cartelle in corso..."
            self.controller._trigger_metrics()

            tutti_i_file = []
            ultimo_aggiornamento = time.time()
            dirs_to_scan = [target_dir]

            while dirs_to_scan:
                current_dir = dirs_to_scan.pop()
                if self.controller.is_scanning_aborted: return
                while self.controller.is_scanning_paused and not self.controller.is_scanning_aborted: time.sleep(0.5)
                try:
                    for entry in os.scandir(current_dir):
                        if entry.is_dir(follow_symlinks=False):
                            dirs_to_scan.append(Path(entry.path))
                        elif entry.is_file(follow_symlinks=False):
                            percorso = Path(entry.path)
                            if percorso.suffix.lower() in valid_extensions:
                                tutti_i_file.append(percorso)
                                if time.time() - ultimo_aggiornamento > 0.05:
                                    self.controller.metrics["global"][
                                        "scan_file"] = f"{len(tutti_i_file)} file trovati..."
                                    self.controller._trigger_metrics()
                                    ultimo_aggiornamento = time.time()
                except (PermissionError, FileNotFoundError):
                    pass

            def get_size(p):
                try:
                    return p.stat().st_size
                except:
                    return 0

            tutti_i_file.sort(key=lambda f: (get_size(f), f.name))

            self.controller.metrics["global"]["scan_step"] = 2
            self.controller.metrics["global"]["scan_status"] = "Interrogazione Database RAM..."
            self.controller._trigger_metrics()
            self.controller.db.load_cache()

            for file_path in tutti_i_file:
                try:
                    rel = file_path.relative_to(target_dir)
                    sub_folder_path = target_dir / rel.parts[0] if len(rel.parts) > 1 else target_dir
                except ValueError:
                    sub_folder_path = target_dir
                sub_name = str(sub_folder_path.resolve())

                if sub_name not in self.controller.metrics["cores"][core_name]:
                    self.controller.metrics["cores"][core_name][sub_name] = {
                        "total_files": 0, "completed": 0, "skipped": 0, "errors": 0,
                        "total_duration": 0.0, "audio_processed_duration": 0.0, "video_processed_duration": 0.0,
                        "status": "In Attesa", "files": {}, "folder_size": 0
                    }

                if file_path.name not in self.controller.metrics["cores"][core_name][sub_name]["files"]:
                    self.controller.metrics["cores"][core_name][sub_name]["files"][file_path.name] = {
                        "status": "init", "progress": 0.0, "size": get_size(file_path)
                    }
                    self.controller.metrics["cores"][core_name][sub_name]["total_files"] += 1

            self.controller.metrics["global"]["scan_step"] = 3
            self.controller.metrics["global"]["scan_status"] = "Lettura Cache DB Metadati..."
            self.controller._trigger_metrics()

            file_da_analizzare = []
            L_tot = len(tutti_i_file)

            for idx, file_path in enumerate(tutti_i_file):
                if self.controller.is_scanning_aborted: return
                while self.controller.is_scanning_paused and not self.controller.is_scanning_aborted: time.sleep(0.5)

                try:
                    rel = file_path.relative_to(target_dir)
                    sub_folder_path = target_dir / rel.parts[0] if len(rel.parts) > 1 else target_dir
                except ValueError:
                    sub_folder_path = target_dir
                sub_name = str(sub_folder_path.resolve())
                size = get_size(file_path)

                is_processed_db = self.controller.db.is_file_processed_fast(file_path)
                cached_meta = None if force_rescan else self.controller.db.get_cached_metadata(file_path)

                if is_processed_db:
                    meta_dict = self._build_meta_dict(file_path, cached_meta) if cached_meta else None
                    self.controller.metrics["cores"][core_name][sub_name]["files"][file_path.name] = {
                        "status": "skipped", "progress": 100.0, "size": size, "meta": meta_dict}
                elif cached_meta:
                    meta_dict = self._build_meta_dict(file_path, cached_meta)
                    status = self.controller._route_task(core_name, sub_name, file_path, cached_meta, delay_seconds)

                    self.controller.metrics["cores"][core_name][sub_name]["files"][file_path.name] = {
                        "status": status, "progress": 0.0, "size": size, "meta": meta_dict}

                    try:
                        duration = float(cached_meta.get('format', {}).get('duration', 0.0))
                        self.controller.metrics["cores"][core_name][sub_name]["total_duration"] += duration
                    except:
                        pass
                    self.controller._trigger_metrics()
                else:
                    self.controller.metrics["cores"][core_name][sub_name]["files"][file_path.name] = {
                        "status": "pending", "progress": 0.0, "size": size}
                    file_da_analizzare.append(file_path)

                if time.time() - ultimo_aggiornamento > 0.05:
                    self.controller.metrics["global"]["scan_progress"] = ((idx + 1) / L_tot) * 100
                    self.controller.metrics["global"]["scan_file"] = f"{idx + 1}/{L_tot} | {file_path.name}"
                    self.controller._trigger_metrics()
                    ultimo_aggiornamento = time.time()

            tot_da_analizzare = len(file_da_analizzare)
            if tot_da_analizzare > 0:
                self.controller.metrics["global"]["scan_step"] = 4
                self.controller.metrics["global"][
                    "scan_status"] = f"Estrazione Metadati (ffprobe) ({tot_da_analizzare} nuovi)..."
                self.controller.metrics["global"]["scan_progress"] = 0.0
                self.controller._trigger_metrics()
                completati = 0

                def extract_worker(f_path):
                    if self.controller.is_scanning_aborted: return (f_path, None)
                    res = self._extract_metadata(f_path)
                    if res and res[1]:
                        self.controller.db.save_cached_metadata(f_path, res[1])
                    return res

                with concurrent.futures.ThreadPoolExecutor(max_workers=min(6, os.cpu_count() or 1)) as executor:
                    futures = [executor.submit(extract_worker, f) for f in file_da_analizzare]
                    for future in concurrent.futures.as_completed(futures):
                        if self.controller.is_scanning_aborted: return
                        file_path, metadata = future.result()

                        try:
                            rel = file_path.relative_to(target_dir)
                            sub_name = str((target_dir / rel.parts[0] if len(rel.parts) > 1 else target_dir).resolve())
                        except ValueError:
                            sub_name = core_name

                        if not metadata:
                            self.controller.metrics["cores"][core_name][sub_name]["errors"] += 1
                            self.controller.metrics["cores"][core_name][sub_name]["files"][file_path.name][
                                "status"] = "error"
                        else:
                            meta_dict = self._build_meta_dict(file_path, metadata)
                            status = self.controller._route_task(core_name, sub_name, file_path, metadata,
                                                                 delay_seconds)

                            if file_path.name in self.controller.metrics["cores"][core_name][sub_name]["files"]:
                                self.controller.metrics["cores"][core_name][sub_name]["files"][file_path.name].update(
                                    {"status": status, "meta": meta_dict})

                            try:
                                duration = float(metadata.get('format', {}).get('duration', 0.0))
                                self.controller.metrics["cores"][core_name][sub_name]["total_duration"] += duration
                            except:
                                pass

                        completati += 1
                        if time.time() - ultimo_aggiornamento > 0.05:
                            self.controller.metrics["global"]["scan_progress"] = (completati / tot_da_analizzare) * 100
                            self.controller.metrics["global"][
                                "scan_file"] = f"{completati}/{tot_da_analizzare} | {file_path.name}"
                            self.controller._trigger_metrics()
                            ultimo_aggiornamento = time.time()

            self.controller.metrics["global"]["is_scanning"] = False
            self.controller.metrics["global"]["scan_step"] = 0
            self.controller._trigger_metrics()

        threading.Thread(target=scan_thread, daemon=True).start()