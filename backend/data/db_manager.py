import sqlite3
import hashlib
import json
from pathlib import Path
from datetime import datetime


class DBManager:
    def __init__(self):
        self.docs_dir = Path.home() / "Documents"
        if not self.docs_dir.exists():
            docs_it = Path.home() / "Documenti"
            if docs_it.exists():
                self.docs_dir = docs_it
            else:
                self.docs_dir = Path.home()
        self.db_path = self.docs_dir / "av_optimizer_global.db"
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS processed_files (
                    pseudo_hash TEXT PRIMARY KEY,
                    file_path TEXT NOT NULL,
                    original_size INTEGER,
                    processed_date TEXT,
                    audio_lufs REAL,
                    video_codec TEXT
                )
            ''')
            # Migrazione silente per aggiungere la colonna final_size ai DB esistenti
            try:
                cursor.execute("ALTER TABLE processed_files ADD COLUMN final_size INTEGER")
            except sqlite3.OperationalError:
                pass

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS metadata_cache (
                    pseudo_hash TEXT PRIMARY KEY,
                    file_path TEXT NOT NULL,
                    metadata_json TEXT
                )
            ''')
            conn.commit()

    def _generate_pseudo_hash(self, file_path: Path) -> str:
        stat = file_path.stat()
        unique_string = f"{file_path.resolve()}_{stat.st_size}_{stat.st_mtime}"
        return hashlib.md5(unique_string.encode('utf-8')).hexdigest()

    def is_file_processed(self, file_path: str) -> bool:
        path_obj = Path(file_path)
        if not path_obj.exists(): return False
        file_hash = self._generate_pseudo_hash(path_obj)
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT 1 FROM processed_files WHERE pseudo_hash = ?", (file_hash,))
            return cursor.fetchone() is not None

    def mark_as_processed(self, file_path: str, original_size: int, final_size: int = None, audio_lufs: float = None,
                          video_codec: str = None):
        path_obj = Path(file_path)
        if not path_obj.exists(): return
        file_hash = self._generate_pseudo_hash(path_obj)
        timestamp = datetime.now().isoformat()
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO processed_files 
                (pseudo_hash, file_path, original_size, final_size, processed_date, audio_lufs, video_codec)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (file_hash, str(path_obj.resolve()), original_size, final_size, timestamp, audio_lufs, video_codec))
            conn.commit()

    def load_cache(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT pseudo_hash FROM processed_files")
            self.ram_cache = {row[0] for row in cursor.fetchall()}

    def is_file_processed_fast(self, file_path: Path) -> bool:
        if not hasattr(self, 'ram_cache'): self.load_cache()
        file_hash = self._generate_pseudo_hash(file_path)
        return file_hash in self.ram_cache

    def get_cached_metadata(self, file_path: Path):
        file_hash = self._generate_pseudo_hash(file_path)
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT metadata_json FROM metadata_cache WHERE pseudo_hash = ?", (file_hash,))
            row = cursor.fetchone()
            if row:
                try:
                    return json.loads(row[0])
                except:
                    return None
        return None

    def save_cached_metadata(self, file_path: Path, metadata: dict):
        file_hash = self._generate_pseudo_hash(file_path)
        metadata_str = json.dumps(metadata)
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT OR REPLACE INTO metadata_cache (pseudo_hash, file_path, metadata_json)
                VALUES (?, ?, ?)
            ''', (file_hash, str(file_path.resolve()), metadata_str))
            conn.commit()

    def get_total_saved_space(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            # FIX: La query ora accetta qualsiasi bilancio, anche fortemente negativo.
            cursor.execute("SELECT SUM(original_size - final_size) FROM processed_files WHERE final_size IS NOT NULL")
            res = cursor.fetchone()
            return res[0] if res and res[0] else 0

    def get_all_records(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT pseudo_hash, file_path, processed_date, audio_lufs, video_codec FROM processed_files ORDER BY processed_date DESC")
            records = []
            for row in cursor.fetchall():
                records.append({
                    "pseudo_hash": row[0], "file_path": row[1], "date": row[2],
                    "audio": row[3], "video": row[4]
                })
            return records

    def delete_record(self, pseudo_hash: str):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM processed_files WHERE pseudo_hash = ?", (pseudo_hash,))
            conn.commit()

    def clear_all(self):
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM processed_files")
            cursor.execute("DELETE FROM metadata_cache")
            conn.commit()