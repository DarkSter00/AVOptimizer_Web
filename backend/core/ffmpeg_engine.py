import subprocess
import psutil
import time
import re


class FFmpegEngine:
    def __init__(self):
        self._process = None
        self._ps_process = None
        self.is_paused = False
        self.is_aborted = False

    def run_conversion(self, cmd, duration):
        """
        Avvia FFmpeg in un sottoprocesso e restituisce (tramite yield)
        la percentuale di completamento in tempo reale.
        """
        self.is_aborted = False
        self.is_paused = False

        try:
            # Avvio del processo con intercettazione dell'output
            self._process = subprocess.Popen(
                cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, text=True, bufsize=1
            )
            # Creazione dell'oggetto psutil per il controllo a basso livello
            self._ps_process = psutil.Process(self._process.pid)
        except Exception:
            yield -1.0  # Errore critico all'avvio
            return

        regex_tempo = re.compile(r"out_time_us=(\d+)")

        # Lettura asincrona dell'output di FFmpeg
        for line in self._process.stdout:
            if self.is_aborted:
                self._process.terminate()
                break

            # Se la pausa è attiva, il loop Python attende e non consuma risorse
            while self.is_paused and not self.is_aborted:
                time.sleep(0.5)

            match = regex_tempo.search(line)
            if match and duration > 0:
                try:
                    tempo_corrente = int(match.group(1)) / 1_000_000.0
                    progress = min(100.0, max(0.0, (tempo_corrente / duration) * 100))
                    yield progress  # Cede il valore al controller per aggiornare l'UI
                except ValueError:
                    pass

        self._process.wait()

        # Restituisce l'esito finale
        if self.is_aborted:
            yield -1.0
        else:
            yield 100.0 if self._process.returncode == 0 else -1.0

    def pause(self):
        """Sospende l'esecuzione del processo (Zero consumo CPU)."""
        if self._ps_process and self._ps_process.is_running():
            try:
                self._ps_process.suspend()
                self.is_paused = True
            except psutil.Error:
                pass

    def resume(self):
        """Ripristina l'esecuzione del processo."""
        if self._ps_process and self._ps_process.is_running():
            try:
                self._ps_process.resume()
                self.is_paused = False
            except psutil.Error:
                pass

    def abort(self):
        """Interrompe forzatamente l'operazione in corso."""
        self.is_aborted = True
        if self._ps_process and self._ps_process.is_running():
            try:
                # Se un processo è sospeso dal SO, deve essere "svegliato" prima di poter essere terminato
                if self.is_paused:
                    self._ps_process.resume()
                self._process.terminate()
            except psutil.Error:
                pass