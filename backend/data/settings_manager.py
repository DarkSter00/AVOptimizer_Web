import json
from pathlib import Path


class SettingsManager:
    def __init__(self):
        docs_dir = Path.home() / "Documents"
        if not docs_dir.exists():
            docs_dir = Path.home() / "Documenti" if (Path.home() / "Documenti").exists() else Path.home()

        self.config_path = docs_dir / "av_optimizer_settings.json"

        self.default_settings = {
            "smart_mode_disabled": False,  # False = Smart Attiva (impostazioni bloccate)
            "max_workers": 1,
            "sorting_method": "smart",
            "video_codec_mp4": "hevc_nvenc",
            "video_codec_mkv": "hevc_nvenc",
            "audio_codec_mp4": "aac",
            "audio_codec_mkv": "libopus",
            "target_lufs": -16.0,
            "preset": "slow",
            "disk_priority": ["D:", "C:", "/mnt/data"],
            "extension_priority": [".mp4", ".mkv", ".avi", ".mov"]
        }
        self.settings = self.default_settings.copy()
        self.settings = self._load_settings()

    def _load_settings(self):
        if not self.config_path.exists():
            self.save_settings(self.default_settings)
            return self.default_settings
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                loaded = json.load(f)
                return {**self.default_settings, **loaded}
        except Exception:
            return self.default_settings

    def save_settings(self, new_settings):
        self.settings.update(new_settings)
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.settings, f, indent=4)
        except Exception:
            pass

    def get(self, key):
        return self.settings.get(key, self.default_settings.get(key))