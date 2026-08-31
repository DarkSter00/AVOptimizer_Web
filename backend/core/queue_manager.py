import queue
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path


@dataclass(order=True)
class ConversionTask:
    # Tuple di ordinamento multicriterio.
    # Es: (priorità_disco, dimensione_cartella, priorità_estensione, dimensione_file, nome_file)
    sort_key: tuple

    scheduled_time: float

    # Campi ignorati dall'ordinatore
    file_path: str = field(compare=False)
    file_info: dict = field(compare=False)


class QueueManager:
    def __init__(self):
        self.task_queue = queue.PriorityQueue()
        self.lock = threading.Lock()

    def add_task(self, sort_key, file_path, file_info, delay_seconds=0):
        scheduled_time = time.time() + delay_seconds
        task = ConversionTask(
            sort_key=sort_key,
            scheduled_time=scheduled_time,
            file_path=str(file_path),
            file_info=file_info
        )
        self.task_queue.put(task)

    def get_next_task(self, paused_targets=None, deleted_targets=None):
        if paused_targets is None: paused_targets = set()
        if deleted_targets is None: deleted_targets = set()

        temp_queue = []
        target_task = None

        with self.lock:
            while not self.task_queue.empty():
                task = self.task_queue.get()
                fpath = Path(task.file_path)

                # Verifica se il file si trova in un Core o in una Subcartella eliminati
                is_deleted = any(Path(p) in fpath.parents or Path(p) == fpath for p in deleted_targets)
                if is_deleted:
                    continue  # Lo scarta per sempre

                # Verifica se il file si trova in un bersaglio in pausa
                is_paused = any(Path(p) in fpath.parents or Path(p) == fpath for p in paused_targets)

                if not is_paused and time.time() >= task.scheduled_time:
                    target_task = task
                    break
                else:
                    temp_queue.append(task)

            for t in temp_queue:
                self.task_queue.put(t)

        return target_task