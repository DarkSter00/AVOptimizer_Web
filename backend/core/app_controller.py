import threading
import time
from pathlib import Path
import json
import subprocess
import os
import re
import shutil

from core.ffmpeg_engine import FFmpegEngine
from core.queue_manager import QueueManager
from core.scanner import Scanner
from data.db_manager import DBManager
from data.settings_manager import SettingsManager


class AppController:
    def __init__(self, max_workers=None):
        self.settings = SettingsManager()
        self.db = DBManager()
        self.scanner = Scanner(self)

        self.audio_queue = QueueManager()
        self.video_queue = QueueManager()
        self.norm_queue = QueueManager()

        self.excluded_targets = set()
        self.deleted_targets = set()

        self.folder_active_timers = {}
        self.retrigger_timer = None
        self.retrigger_lock = threading.Lock()

        if max_workers is not None and max_workers != 1:
            self.max_workers = max_workers
        else:
            self.max_workers = int(self.settings.get("max_workers"))

        self.is_running = False
        self.is_processing_paused = True
        self.is_scanning_paused = False
        self.is_scanning_aborted = False
        self.workers = []
        self.engines = {}
        self.current_tasks = {}

        try:
            initial_saved = self.db.get_total_saved_space()
        except:
            initial_saved = 0

        self.metrics = {
            "global": {
                "total_files": 0, "completed": 0, "skipped": 0, "errors": 0, "saved_space": initial_saved,
                "total_duration": 0.0, "audio_processed_duration": 0.0, "video_processed_duration": 0.0,
                "is_scanning": False, "scan_progress": 0.0, "scan_step": 0, "scan_status": "", "scan_file": "",
                "is_paused": True
            },
            "cores": {},
            "ui_order": {}
        }

        self.on_metrics_update = None
        self.on_progress_update = None
        self.on_log_event = None

    def _log(self, message):
        if self.on_log_event: self.on_log_event(message)

    def _get_target_context(self, file_path):
        core_name = next((c for c in list(self.metrics["cores"].keys()) if str(file_path).startswith(c)), None)
        sub_name = None
        if core_name:
            target_dir = Path(core_name)
            try:
                rel = file_path.relative_to(target_dir)
                sub_folder_path = target_dir / rel.parts[0] if len(rel.parts) > 1 else target_dir
                sub_name = str(sub_folder_path.resolve())
            except ValueError:
                sub_name = core_name
        sub_data = self.metrics["cores"].get(core_name, {}).get(sub_name)
        return core_name, sub_name, sub_data

    def _route_task(self, core_name, sub_name, file_path, metadata, delay_seconds=0):
        sub_data = self.metrics["cores"].get(core_name, {}).get(sub_name)
        size = file_path.stat().st_size if file_path.exists() else 0
        ha_audio = False
        canali_audio = 2
        codec_v = "sconosciuto"

        if metadata:
            for s in metadata.get('streams', []):
                if s.get('codec_type') == 'video' and codec_v == "sconosciuto":
                    codec_v = s.get('codec_name', 'sconosciuto').lower()
                if s.get('codec_type') == 'audio':
                    ha_audio, canali_audio = True, s.get('channels', 2)

        estensione_output = ".mkv" if file_path.suffix.lower() == ".mkv" else ".mp4"
        if estensione_output == ".mkv":
            pref_video_codec = self.settings.get("video_codec_mkv")
            pref_audio_codec = self.settings.get("audio_codec_mkv")
        else:
            pref_video_codec = self.settings.get("video_codec_mp4")
            pref_audio_codec = self.settings.get("audio_codec_mp4")

        target_lufs = float(self.settings.get("target_lufs"))
        needs_video = codec_v not in ['hevc', 'h265']
        if pref_video_codec == "copy": needs_video = False
        needs_audio = ha_audio and pref_audio_codec != "copy"
        lufs_measured = metadata.get("measured_lufs") if metadata else None
        needs_audio_analysis = needs_audio and lufs_measured is None

        if needs_audio and lufs_measured is not None:
            if abs(lufs_measured - target_lufs) <= 1.0:
                needs_audio = False

        folder_size = sub_data.get("folder_size", 0) if sub_data else 0
        sort_key = (folder_size, sub_name, size)

        if needs_audio_analysis:
            status = "pending"
            self.audio_queue.add_task(sort_key=sort_key, file_path=file_path, file_info=metadata,
                                      delay_seconds=delay_seconds)
        elif needs_video:
            status = "pending"
            if metadata and metadata.get("measured_lufs") is None: metadata["measured_lufs"] = -24.0
            self.video_queue.add_task(sort_key=sort_key, file_path=file_path, file_info=metadata,
                                      delay_seconds=delay_seconds)
        elif needs_audio:
            status = "analyzed_waiting"
            self.norm_queue.add_task(sort_key=sort_key, file_path=file_path, file_info=metadata,
                                     delay_seconds=delay_seconds)
        else:
            status = "skipped"
            self.db.mark_as_processed(str(file_path), size, size, video_codec=codec_v)
            if sub_data:
                dur = float(metadata.get('format', {}).get('duration', 0.0)) if metadata else 0.0
                sub_data["video_processed_duration"] += dur

        return status

    def exclude_target(self, target_path):
        self.excluded_targets.add(target_path)
        for wid, task_file in self.current_tasks.items():
            if task_file:
                tf = Path(task_file)
                if Path(target_path) in tf.parents or Path(target_path) == tf:
                    if wid in self.engines: self.engines[wid].abort()
        self._trigger_metrics()

    def include_target(self, target_path):
        self.excluded_targets.discard(target_path)
        self._trigger_metrics()

    def delete_target(self, is_core, core_name, sub_name=None):
        target_path = core_name if is_core else sub_name
        self.deleted_targets.add(target_path)
        if is_core and core_name in self.metrics["cores"]:
            del self.metrics["cores"][core_name]
        elif not is_core and core_name in self.metrics["cores"] and sub_name in self.metrics["cores"][core_name]:
            del self.metrics["cores"][core_name][sub_name]
        for wid, task_file in self.current_tasks.items():
            if task_file:
                tf = Path(task_file)
                if Path(target_path) in tf.parents or Path(target_path) == tf:
                    if wid in self.engines: self.engines[wid].abort()
        self._trigger_metrics()

    def scan_and_queue(self, directory_path, force_rescan=False, delay_seconds=0):
        self.scanner.scan_and_queue(directory_path, force_rescan, delay_seconds)

    def _trigger_metrics(self):
        tot_files = 0
        tot_completed = 0
        tot_skipped = 0
        tot_errors = 0
        tot_dur = 0.0
        tot_aud_dur = 0.0
        tot_vid_dur = 0.0
        ui_order = {}
        now = time.time()
        need_delayed_retrigger = False

        if not hasattr(self, 'folder_global_states'):
            self.folder_global_states = {}

        for core_name, subfolders in self.metrics["cores"].items():
            for sub_name, data in subfolders.items():
                c_active = 0
                c_in_queue = 0
                c_done = 0
                c_skip = 0
                c_err = 0
                c_aud = 0
                f_size_total = 0
                valid_size = 0
                count_meta = 0
                count_v_codec = 0
                count_a_codec = 0
                count_vol = 0

                for f_name, f_data in data.get("files", {}).items():
                    f_size = f_data.get("size", 0)
                    f_size_total += f_size
                    st = f_data.get("status", "")
                    if st != "error":
                        valid_size += f_size
                    if st in ("analyzing", "converting", "normalizing"):
                        c_active += 1
                    elif st in ("init", "pending", "analyzed_waiting"):
                        c_in_queue += 1
                    elif st.startswith("completed"):
                        c_done += 1
                    elif st == "skipped":
                        c_skip += 1
                    elif st == "error":
                        c_err += 1
                    if st == "analyzed_waiting":
                        c_aud += 1

                    # Calcolo Metriche Specifiche
                    if st.startswith("completed") or st == "skipped":
                        count_meta += 1
                        count_v_codec += 1
                        count_a_codec += 1
                        count_vol += 1
                    elif "meta" in f_data and f_data["meta"]:
                        meta = f_data["meta"]
                        count_meta += 1
                        if meta.get("v_opt"): count_v_codec += 1
                        if meta.get("a_opt"): count_a_codec += 1
                        if meta.get("lufs_opt"): count_vol += 1

                data["folder_size"] = f_size_total
                tot_files += data.get("total_files", 0)
                tot_completed += c_done
                tot_skipped += c_skip
                tot_errors += c_err
                tot_dur += data.get("total_duration", 0.0)
                tot_aud_dur += data.get("audio_processed_duration", 0.0)
                tot_vid_dur += data.get("video_processed_duration", 0.0)

                data["completed"] = c_done
                data["skipped"] = c_skip
                data["errors"] = c_err
                data["c_aud"] = c_aud
                data["valid_size"] = valid_size
                data["is_processing"] = c_active > 0

                total_items = data.get("total_files", 0)
                data["count_meta"] = count_meta
                data["count_v_codec"] = count_v_codec
                data["count_a_codec"] = count_a_codec
                data["count_vol"] = count_vol

                p_meta = (count_meta / total_items * 100) if total_items > 0 else 0
                p_v_codec = (count_v_codec / total_items * 100) if total_items > 0 else 0
                p_a_codec = (count_a_codec / total_items * 100) if total_items > 0 else 0
                p_vol = (count_vol / total_items * 100) if total_items > 0 else 0

                data["p_meta"] = p_meta
                data["p_v_codec"] = p_v_codec
                data["p_a_codec"] = p_a_codec
                data["p_vol"] = p_vol
                data["p_global"] = (p_meta + p_v_codec + p_a_codec + p_vol) / 4

                is_all_finished = (total_items > 0 and (c_done + c_skip + c_err) == total_items)

                # STATO IBRIDO: CODE + TIMER
                prev_state = self.folder_global_states.get(sub_name, "In Attesa")
                if c_active > 0:
                    self.folder_active_timers[sub_name] = now

                last_active = self.folder_active_timers.get(sub_name, 0)
                time_since_active = now - last_active
                is_within_grace_period = (time_since_active < 3.0)

                new_state = prev_state

                if total_items > 0 and str(sub_name) in self.excluded_targets:
                    new_state = "Esclusa"
                elif is_all_finished:
                    if prev_state not in ("Completato", "Completando..."):
                        # Avvia l'animazione di completamento tenendola in alto per 2 secondi
                        new_state = "Completando..."
                        self.folder_active_timers[sub_name] = now
                        need_delayed_retrigger = True
                    elif prev_state == "Completando...":
                        if time_since_active < 2.0:
                            new_state = "Completando..."
                            need_delayed_retrigger = True
                        else:
                            new_state = "Completato"
                    else:
                        new_state = "Completato"
                elif c_active > 0:
                    new_state = "In Esecuzione"
                elif c_in_queue > 0:
                    if prev_state == "In Esecuzione" and is_within_grace_period:
                        new_state = "In Esecuzione"
                        need_delayed_retrigger = True
                    else:
                        new_state = "In Attesa"
                else:
                    new_state = "In Attesa"

                self.folder_global_states[sub_name] = new_state
                data["status"] = new_state

            def sort_func(item):
                sub_n, d = item
                st = d["status"]
                if st == "Esclusa":
                    p = 3
                elif st == "Completato":
                    p = 2
                elif st in ("In Esecuzione", "Completando..."):
                    p = 0
                else:
                    p = 1
                return (p, d.get("folder_size", 0), sub_n)

            ui_order[core_name] = [k for k, v in sorted(subfolders.items(), key=sort_func)]

        if need_delayed_retrigger:
            with self.retrigger_lock:
                if self.retrigger_timer:
                    self.retrigger_timer.cancel()
                self.retrigger_timer = threading.Timer(0.5, self._trigger_metrics)
                self.retrigger_timer.daemon = True
                self.retrigger_timer.start()

        self.metrics["global"]["total_files"] = tot_files
        self.metrics["global"]["completed"] = tot_completed
        self.metrics["global"]["skipped"] = tot_skipped
        self.metrics["global"]["errors"] = tot_errors
        self.metrics["global"]["total_duration"] = tot_dur
        self.metrics["global"]["audio_processed_duration"] = tot_aud_dur
        self.metrics["global"]["video_processed_duration"] = tot_vid_dur

        try:
            self.metrics["global"]["saved_space"] = self.db.get_total_saved_space()
        except:
            self.metrics["global"]["saved_space"] = 0

        self.metrics["ui_order"] = ui_order
        if self.on_metrics_update:
            self.on_metrics_update(self.metrics)

    def _measure_lufs(self, file_path: Path, duration: float, engine: FFmpegEngine):
        engine.is_aborted = False
        engine.is_paused = False
        engine.last_lufs_result = None
        cmd = ['ffmpeg', '-y', '-i', str(file_path), '-vn', '-sn', '-af', 'loudnorm=print_format=json', '-f', 'null',
               '-']
        engine._process = subprocess.Popen(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE, text=True, bufsize=1,
                                           encoding='utf-8', errors='replace')
        try:
            engine._ps_process = __import__('psutil').Process(engine._process.pid)
        except Exception:
            pass
        ultime_righe = []
        regex_tempo = re.compile(r"time=(\d+):(\d+):(\d+.\d+)")
        for line in engine._process.stderr:
            if engine.is_aborted:
                engine._process.terminate()
                return
            while engine.is_paused and not engine.is_aborted: time.sleep(0.5)
            ultime_righe.append(line)
            if len(ultime_righe) > 50: ultime_righe.pop(0)
            match = regex_tempo.search(line)
            if match and duration > 0:
                h, m, s = float(match.group(1)), float(match.group(2)), float(match.group(3))
                tempo_corrente = h * 3600 + m * 60 + s
                progress = min(100.0, max(0.0, (tempo_corrente / duration) * 100))
                yield progress
        engine._process.wait()
        yield 100.0
        json_str = "".join(ultime_righe)
        start_idx, end_idx = json_str.find('{'), json_str.rfind('}')
        if start_idx != -1 and end_idx != -1:
            try:
                engine.last_lufs_result = float(json.loads(json_str[start_idx:end_idx + 1]).get('input_i', 0.0))
            except:
                pass

    def _audio_worker_loop(self, worker_id):
        engine = FFmpegEngine()
        self.engines[worker_id] = engine
        while self.is_running:
            while self.is_processing_paused and self.is_running: time.sleep(0.5)
            if not self.is_running: break
            task = self.audio_queue.get_next_task(paused_targets=self.excluded_targets,
                                                  deleted_targets=self.deleted_targets)
            if not task:
                time.sleep(0.5)
                continue
            file_path = Path(task.file_path)
            self.current_tasks[worker_id] = str(file_path)
            core_name, sub_name, sub_data = self._get_target_context(file_path)

            operazione_completata = False

            try:
                if sub_data and file_path.name in sub_data.get("files", {}):
                    sub_data["files"][file_path.name]["status"] = "analyzing"
                    self._trigger_metrics()
                info = task.file_info
                duration = float(info.get('format', {}).get('duration', 0.0)) if info else 0.0
                for audio_prog in self._measure_lufs(file_path, duration, engine):
                    if sub_data and file_path.name in sub_data["files"]:
                        sub_data["files"][file_path.name]["progress"] = audio_prog
                    if self.on_progress_update:
                        self.on_progress_update(worker_id, file_path.name, "audio", audio_prog, 0.0, 0.0)
                task.file_info["measured_lufs"] = getattr(engine, 'last_lufs_result', None)
                if task.file_info["measured_lufs"] is not None:
                    self.db.save_cached_metadata(file_path, task.file_info)
                    if sub_data and file_path.name in sub_data["files"]:
                        sub_data["files"][file_path.name]["meta"] = self.scanner._build_meta_dict(file_path,
                                                                                                  task.file_info)
            except Exception as e:
                pass

            if engine.is_aborted:
                if core_name in self.metrics["cores"] and sub_name in self.metrics["cores"][core_name]:
                    if sub_data and file_path.name in sub_data["files"]:
                        sub_data["files"][file_path.name]["status"] = "pending"
                        sub_data["files"][file_path.name]["progress"] = 0.0
                    self.audio_queue.add_task(task.sort_key, task.file_path, task.file_info)
            else:
                operazione_completata = True

            self._trigger_metrics()

            # Pausa visiva 2s per completamento animazione 100%
            for _ in range(4):
                if not self.is_running or self.is_scanning_aborted: break
                time.sleep(0.5)

            if operazione_completata:
                if sub_data: sub_data["audio_processed_duration"] += duration
                status = self._route_task(core_name, sub_name, file_path, task.file_info, delay_seconds=0)
                if sub_data and file_path.name in sub_data["files"]:
                    sub_data["files"][file_path.name]["status"] = status
                    sub_data["files"][file_path.name]["progress"] = 0.0
                self._trigger_metrics()

            self.current_tasks[worker_id] = None

    def _video_worker_loop(self, worker_id):
        engine = FFmpegEngine()
        self.engines[worker_id] = engine
        while self.is_running:
            while self.is_processing_paused and self.is_running: time.sleep(0.5)
            if not self.is_running: break
            task = self.video_queue.get_next_task(paused_targets=self.excluded_targets,
                                                  deleted_targets=self.deleted_targets)
            if not task:
                time.sleep(0.5)
                continue
            file_path = Path(task.file_path)
            self.current_tasks[worker_id] = str(file_path)
            core_name, sub_name, sub_data = self._get_target_context(file_path)
            out_file = None
            operazione_completata = False

            try:
                info = task.file_info
                target_lufs = float(self.settings.get("target_lufs"))
                pref_preset = self.settings.get("preset")
                estensione_output = ".mkv" if file_path.suffix.lower() == ".mkv" else ".mp4"
                if estensione_output == ".mkv":
                    pref_video_codec = self.settings.get("video_codec_mkv")
                    pref_audio_codec = self.settings.get("audio_codec_mkv")
                else:
                    pref_video_codec = self.settings.get("video_codec_mp4")
                    pref_audio_codec = self.settings.get("audio_codec_mp4")
                ha_audio, canali_audio = False, 2
                codec_v = "sconosciuto"
                for s in info.get('streams', []):
                    if s.get('codec_type') == 'video' and codec_v == "sconosciuto":
                        codec_v = s.get('codec_name', 'sconosciuto').lower()
                    if s.get('codec_type') == 'audio':
                        ha_audio, canali_audio = True, s.get('channels', 2)
                duration = float(info.get('format', {}).get('duration', 0.0)) if info else 0.0
                if sub_data and file_path.name in sub_data.get("files", {}):
                    sub_data["files"][file_path.name]["status"] = "converting"
                    sub_data["files"][file_path.name]["progress"] = 0.0
                    self._trigger_metrics()
                out_file = file_path.with_name(f"{file_path.stem}_converted{estensione_output}")
                cmd = ['ffmpeg', '-y', '-i', str(file_path), '-map', '0']
                cmd.extend(['-c:v', pref_video_codec, '-preset', pref_preset, '-cq', '25'])
                needs_audio = ha_audio and pref_audio_codec != "copy"
                if needs_audio:
                    lufs_measured = task.file_info.get("measured_lufs")
                    if lufs_measured is not None and abs(lufs_measured - target_lufs) <= 1.0:
                        needs_audio = False
                if needs_audio:
                    lufs_measured = task.file_info.get("measured_lufs", -24.0)
                    bitrate_a = "256k" if canali_audio > 2 else "128k" if "opus" in pref_audio_codec else "384k" if canali_audio > 2 else "160k"
                    cmd.extend(['-af', f'loudnorm=I={target_lufs}:TP=-1.5:LRA=11:measured_I={lufs_measured}', '-c:a',
                                pref_audio_codec, '-b:a', bitrate_a])
                else:
                    cmd.extend(['-c:a', 'copy'])
                cmd.extend(['-c:s', 'copy', '-progress', '-', '-nostats', str(out_file)])
                op_label = "video_audio" if needs_audio else "video"
                for progress in engine.run_conversion(cmd, duration):
                    if sub_data and file_path.name in sub_data["files"]:
                        sub_data["files"][file_path.name]["progress"] = progress
                    if self.on_progress_update:
                        self.on_progress_update(worker_id, file_path.name, op_label, progress, 0.0, 0.0)
            except Exception as e:
                pass

            if engine.is_aborted:
                if core_name in self.metrics["cores"] and sub_name in self.metrics["cores"][core_name]:
                    if sub_data and file_path.name in sub_data["files"]:
                        sub_data["files"][file_path.name]["status"] = "analyzed_waiting"
                        sub_data["files"][file_path.name]["progress"] = 0.0
                    self.video_queue.add_task(task.sort_key, task.file_path, task.file_info)
            elif engine._process and engine._process.returncode == 0 and out_file and out_file.exists():
                dim_originale = file_path.stat().st_size
                dim_finale = out_file.stat().st_size
                try:
                    os.remove(file_path)
                    shutil.move(str(out_file), str(file_path.with_suffix(estensione_output)))
                    self.db.mark_as_processed(str(file_path.with_suffix(estensione_output)), dim_originale, dim_finale,
                                              video_codec=pref_video_codec)
                    if dim_finale < dim_originale:
                        self.metrics["global"]["saved_space"] += (dim_originale - dim_finale)
                    operazione_completata = True
                except Exception:
                    if sub_data:
                        sub_data["video_processed_duration"] += duration
                        if file_path.name in sub_data["files"]:
                            sub_data["files"][file_path.name]["status"] = "error"
            else:
                if sub_data:
                    sub_data["video_processed_duration"] += duration
                    if file_path.name in sub_data["files"]: sub_data["files"][file_path.name]["status"] = "error"

            self._trigger_metrics()

            for _ in range(4):
                if not self.is_running or self.is_scanning_aborted: break
                time.sleep(0.5)

            if operazione_completata and sub_data:
                sub_data["video_processed_duration"] += duration
                if file_path.name in sub_data["files"]:
                    sub_data["files"][file_path.name]["status"] = "completed_video"
                self._trigger_metrics()

            self.current_tasks[worker_id] = None

    def _norm_worker_loop(self, worker_id):
        engine = FFmpegEngine()
        self.engines[worker_id] = engine
        while self.is_running:
            while self.is_processing_paused and self.is_running: time.sleep(0.5)
            if not self.is_running: break
            task = self.norm_queue.get_next_task(paused_targets=self.excluded_targets,
                                                 deleted_targets=self.deleted_targets)
            if not task:
                time.sleep(0.5)
                continue

            file_path = Path(task.file_path)
            self.current_tasks[worker_id] = str(file_path)
            core_name, sub_name, sub_data = self._get_target_context(file_path)
            out_file = None
            operazione_completata = False

            try:
                info = task.file_info
                target_lufs = float(self.settings.get("target_lufs"))
                estensione_output = ".mkv" if file_path.suffix.lower() == ".mkv" else ".mp4"

                if estensione_output == ".mkv":
                    pref_audio_codec = self.settings.get("audio_codec_mkv")
                else:
                    pref_audio_codec = self.settings.get("audio_codec_mp4")
                canali_audio = 2
                for s in info.get('streams', []):
                    if s.get('codec_type') == 'audio': canali_audio = s.get('channels', 2)
                duration = float(info.get('format', {}).get('duration', 0.0)) if info else 0.0

                if sub_data and file_path.name in sub_data.get("files", {}):
                    sub_data["files"][file_path.name]["status"] = "normalizing"
                    sub_data["files"][file_path.name]["progress"] = 0.0
                    self._trigger_metrics()

                out_file = file_path.with_name(f"{file_path.stem}_normalized{estensione_output}")
                cmd = ['ffmpeg', '-y', '-i', str(file_path), '-map', '0']
                cmd.extend(['-c:v', 'copy'])
                lufs_measured = task.file_info.get("measured_lufs", -24.0)
                bitrate_a = "256k" if canali_audio > 2 else "128k" if "opus" in pref_audio_codec else "384k" if canali_audio > 2 else "160k"
                cmd.extend(['-af', f'loudnorm=I={target_lufs}:TP=-1.5:LRA=11:measured_I={lufs_measured}', '-c:a',
                            pref_audio_codec, '-b:a', bitrate_a])
                cmd.extend(['-c:s', 'copy', '-progress', '-', '-nostats', str(out_file)])

                for progress in engine.run_conversion(cmd, duration):
                    if sub_data and file_path.name in sub_data["files"]:
                        sub_data["files"][file_path.name]["progress"] = progress
                    if self.on_progress_update:
                        self.on_progress_update(worker_id, file_path.name, "audio_norm", progress, 0.0, 0.0)
            except Exception as e:
                pass

            if engine.is_aborted:
                if core_name in self.metrics["cores"] and sub_name in self.metrics["cores"][core_name]:
                    if sub_data and file_path.name in sub_data["files"]:
                        sub_data["files"][file_path.name]["status"] = "analyzed_waiting"
                        sub_data["files"][file_path.name]["progress"] = 0.0
                    self.norm_queue.add_task(task.sort_key, task.file_path, task.file_info)
            elif engine._process and engine._process.returncode == 0 and out_file and out_file.exists():
                dim_originale = file_path.stat().st_size
                dim_finale = out_file.stat().st_size
                try:
                    os.remove(file_path)
                    final_path = file_path.with_suffix(estensione_output)
                    shutil.move(str(out_file), str(final_path))

                    if dim_finale < dim_originale:
                        self.metrics["global"]["saved_space"] += (dim_originale - dim_finale)

                    # Azzeriamo il volume calcolato per forzare il ricontrollo
                    task.file_info["measured_lufs"] = None
                    self.db.save_cached_metadata(final_path, task.file_info)

                    operazione_completata = True
                except Exception:
                    if sub_data:
                        sub_data["video_processed_duration"] += duration
                        if file_path.name in sub_data["files"]:
                            sub_data["files"][file_path.name]["status"] = "error"
            else:
                if sub_data:
                    sub_data["video_processed_duration"] += duration
                    if file_path.name in sub_data["files"]: sub_data["files"][file_path.name]["status"] = "error"

            self._trigger_metrics()

            # Pausa visiva per far ammirare l'animazione al 100% (Normalizzazione)
            for _ in range(4):
                if not self.is_running or self.is_scanning_aborted: break
                time.sleep(0.5)

            if operazione_completata and sub_data:
                sub_data["video_processed_duration"] += duration

                # Se l'estensione è cambiata, rimuoviamo il vecchio nome dalla RAM
                if file_path.name != final_path.name and file_path.name in sub_data["files"]:
                    del sub_data["files"][file_path.name]

                # Re-inseriamo il file in RAM come "IN ATTESA" con volume N/A
                sub_data["files"][final_path.name] = {
                    "status": "pending",
                    "progress": 0.0,
                    "size": final_path.stat().st_size,
                    "meta": self.scanner._build_meta_dict(final_path, task.file_info)
                }

                # Riassegniamo alla Coda Audio per innescare "L'Analisi di Verifica"
                sort_key = (sub_data.get("folder_size", 0), sub_name, final_path.stat().st_size)
                self.audio_queue.add_task(sort_key=sort_key, file_path=final_path, file_info=task.file_info,
                                          delay_seconds=0)

                self._trigger_metrics()

            self.current_tasks[worker_id] = None

    def start(self):
        if self.is_running: return
        self.is_running = True
        t_audio = threading.Thread(target=self._audio_worker_loop, args=("audio_0",), daemon=True)
        self.workers.append(t_audio)
        t_audio.start()
        t_norm = threading.Thread(target=self._norm_worker_loop, args=("norm_0",), daemon=True)
        self.workers.append(t_norm)
        t_norm.start()
        for i in range(self.max_workers):
            t_video = threading.Thread(target=self._video_worker_loop, args=(f"video_{i + 1}",), daemon=True)
            self.workers.append(t_video)
            t_video.start()

    def pause_all(self):
        self.is_processing_paused = True
        self.is_scanning_paused = True
        self.metrics["global"]["is_paused"] = True
        for engine in self.engines.values(): engine.pause()
        self._trigger_metrics()

    def resume_all(self):
        self.is_processing_paused = False
        self.is_scanning_paused = False
        self.metrics["global"]["is_paused"] = False
        for engine in self.engines.values(): engine.resume()
        self._trigger_metrics()

    def reset_all(self):
        self.is_scanning_aborted = True
        self.is_processing_paused = True
        self.is_scanning_paused = False
        self.metrics["cores"] = {}
        self.metrics["ui_order"] = {}
        for engine in self.engines.values(): engine.abort()
        with self.audio_queue.lock:
            while not self.audio_queue.task_queue.empty():
                try:
                    self.audio_queue.task_queue.get_nowait()
                except:
                    pass
        with self.video_queue.lock:
            while not self.video_queue.task_queue.empty():
                try:
                    self.video_queue.task_queue.get_nowait()
                except:
                    pass
        with self.norm_queue.lock:
            while not self.norm_queue.task_queue.empty():
                try:
                    self.norm_queue.task_queue.get_nowait()
                except:
                    pass
        try:
            saved = self.db.get_total_saved_space()
        except:
            saved = 0

        self.metrics["global"] = {
            "total_files": 0, "completed": 0, "skipped": 0, "errors": 0, "saved_space": saved,
            "total_duration": 0.0, "audio_processed_duration": 0.0, "video_processed_duration": 0.0,
            "is_scanning": False, "scan_progress": 0.0, "scan_step": 0, "scan_status": "", "scan_file": "",
            "is_paused": True
        }
        self.current_tasks = {}
        self.excluded_targets.clear()
        self.deleted_targets.clear()
        self.folder_active_timers.clear()
        self._trigger_metrics()

    def stop_all(self):
        self.is_running = False
        for engine in self.engines.values(): engine.abort()

    def retry_errors(self):
        cores_to_rescan = set()
        for core_name, subs in self.metrics["cores"].items():
            for sub_name, data in subs.items():
                err_count = 0
                for f, s in data["files"].items():
                    if s["status"] == "error": err_count += 1
                if err_count > 0:
                    cores_to_rescan.add(core_name)
                    files_to_delete = [f for f, s in data["files"].items() if s["status"] == "error"]
                    for f in files_to_delete: del data["files"][f]
        self._trigger_metrics()
        for core in cores_to_rescan:
            self.scan_and_queue(core)