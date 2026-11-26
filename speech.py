"""Free Windows text-to-speech through built-in System.Speech (no voice API)."""
import os
import subprocess
import threading

_SCRIPT = (
    "Add-Type -AssemblyName System.Speech; "
    "[Console]::InputEncoding = New-Object System.Text.UTF8Encoding($false); "
    "$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer; "
    "$speaker.Rate = -1; "
    "$text = [Console]::In.ReadToEnd(); "
    "try { $speaker.Speak($text) } finally { $speaker.Dispose() }"
)


class WindowsSpeech:
    """Voice output is optional; content is never saved by this class."""

    def __init__(self):
        self.enabled = True
        self.last_text = ""
        self._process = None
        self._lock = threading.Lock()

    def stop(self):
        with self._lock:
            process = self._process
            self._process = None
        if process is not None and process.poll() is None:
            try:
                process.kill()
            except OSError:
                pass

    def speak(self, text):
        self.last_text = str(text or "")[:6000]
        self.stop()
        if not self.enabled or not self.last_text or os.name != "nt":
            return
        try:
            process = subprocess.Popen(
                ["powershell.exe", "-NoProfile", "-NonInteractive", "-Command", _SCRIPT],
                stdin=subprocess.PIPE,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        except OSError:
            return
        with self._lock:
            self._process = process

        def feed():
            try:
                process.communicate(input=self.last_text.encode("utf-8"), timeout=120)
            except (OSError, subprocess.TimeoutExpired):
                try:
                    process.kill()
                except OSError:
                    pass
            finally:
                with self._lock:
                    if self._process is process:
                        self._process = None

        threading.Thread(target=feed, daemon=True).start()

    def replay(self):
        if self.last_text:
            self.speak(self.last_text)
