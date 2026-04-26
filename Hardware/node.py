"""
Sentinel Node - laptop edge node (NODE-001 / NODE-002 / ...).

Hardware-agnostic Python script. Two threads:
  * Vision: capture frame, base64 encode, POST /api/node/frame.
  * Audio:  poll /api/events/sync, play any pending mp3 dispatch.

USAGE
    pip install -r requirements.txt
    set NODE_ID=NODE-001                            (Windows)
    export NODE_ID=NODE-001                          (macOS / Linux)
    set SENTINEL_SERVER_URL=https://sentinal-node-production.up.railway.app
    python node.py
"""
from __future__ import annotations

import base64
import os
import signal
import sys
import tempfile
import threading
import time
from dataclasses import dataclass

import cv2
import requests

try:
    import pygame
except ImportError:
    pygame = None  # type: ignore[assignment]


@dataclass
class NodeConfig:
    node_id: str
    server_url: str
    vision_interval_s: float
    audio_poll_interval_s: float
    camera_index: int
    skip_analysis: bool
    include_source: bool
    disable_vision: bool
    disable_audio: bool

    @classmethod
    def from_env(cls) -> "NodeConfig":
        return cls(
            node_id=os.environ.get("NODE_ID", "NODE-001").strip() or "NODE-001",
            server_url=os.environ.get("SENTINEL_SERVER_URL", "http://localhost:3000").rstrip("/"),
            vision_interval_s=float(os.environ.get("VISION_INTERVAL_S", "3.0")),
            audio_poll_interval_s=float(os.environ.get("AUDIO_POLL_INTERVAL_S", "2.0")),
            camera_index=int(os.environ.get("CAMERA_INDEX", "0")),
            skip_analysis=os.environ.get("SKIP_ANALYSIS", "").strip() == "1",
            include_source=os.environ.get("INCLUDE_SOURCE", "").strip() == "1",
            disable_vision=os.environ.get("DISABLE_VISION", "").strip() == "1",
            disable_audio=os.environ.get("DISABLE_AUDIO", "").strip() == "1",
        )


CONFIG = NodeConfig.from_env()
STOP_EVENT = threading.Event()


def log(msg: str) -> None:
    print("[" + CONFIG.node_id + "] " + msg, flush=True)


def vision_loop() -> None:
    if os.name == "nt":
        cap = cv2.VideoCapture(CONFIG.camera_index, cv2.CAP_DSHOW)
    else:
        cap = cv2.VideoCapture(CONFIG.camera_index)
    if not cap.isOpened():
        log("ERROR: Could not open camera index " + str(CONFIG.camera_index))
        return

    log("Vision thread online (interval=" + str(CONFIG.vision_interval_s) + "s)")
    endpoint = CONFIG.server_url + "/api/node/frame"

    try:
        while not STOP_EVENT.is_set():
            tick_start = time.monotonic()
            ok, frame = cap.read()
            if not ok or frame is None:
                log("Camera read failed, retrying...")
                _sleep_with_stop(1.0)
                continue

            ok_enc, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
            if not ok_enc:
                log("JPEG encode failed, skipping frame")
                _sleep_with_stop(1.0)
                continue

            image_b64 = base64.b64encode(buf.tobytes()).decode("ascii")

            payload = {
                "node_id": CONFIG.node_id,
                "image_base64": image_b64,
            }
            if CONFIG.skip_analysis:
                payload["skip_analysis"] = True

            try:
                resp = requests.post(endpoint, json=payload, timeout=20)
                if resp.ok:
                    data = resp.json()
                    if data.get("threat_detected"):
                        if data.get("dispatched"):
                            log(
                                "THREAT DISPATCHED -> " + str(data.get("threat_type"))
                                + " (" + format(data.get("confidence", 0), ".2f") + ") "
                                + "event_id=" + str(data.get("event_id"))
                            )
                        else:
                            log("Threat seen (" + str(data.get("threat_type")) + "), crisis already locked - no re-dispatch.")
                else:
                    log("Frame POST " + str(resp.status_code) + ": " + resp.text[:160])
            except requests.RequestException as exc:
                log("Frame POST failed: " + str(exc))

            elapsed = time.monotonic() - tick_start
            wait = max(0.0, CONFIG.vision_interval_s - elapsed)
            _sleep_with_stop(wait)
    finally:
        cap.release()
        log("Vision thread stopped")


def audio_loop() -> None:
    if pygame is None:
        log("ERROR: pygame not installed - audio thread cannot start")
        log("   fix: `pip install pygame` inside this venv")
        log("        (on Python 3.13+ try `pip install pygame --pre`)")
        return

    try:
        pygame.mixer.init()
    except Exception as exc:
        log("ERROR: pygame.mixer.init failed: " + str(exc))
        return

    if not CONFIG.include_source:
        log("INFO: Source-node alarm suppression is ON - this node will NOT play its own dispatch. Set INCLUDE_SOURCE=1 to override.")
    log("Audio thread online (poll=" + str(CONFIG.audio_poll_interval_s) + "s)")
    endpoint = CONFIG.server_url + "/api/events/sync"
    ack_endpoint = endpoint

    last_played: str | None = None

    try:
        while not STOP_EVENT.is_set():
            params = {"node_id": CONFIG.node_id}
            if CONFIG.include_source:
                params["include_source"] = "1"

            try:
                resp = requests.get(endpoint, params=params, timeout=15)
            except requests.RequestException as exc:
                log("Sync GET failed: " + str(exc))
                _sleep_with_stop(CONFIG.audio_poll_interval_s)
                continue

            if not resp.ok:
                log("Sync GET " + str(resp.status_code) + ": " + resp.text[:120])
                _sleep_with_stop(CONFIG.audio_poll_interval_s)
                continue

            data = resp.json()
            dispatch = data.get("dispatch")
            if not dispatch:
                _sleep_with_stop(CONFIG.audio_poll_interval_s)
                continue

            event_id = dispatch.get("event_id")
            audio_b64 = dispatch.get("audio_base64") or ""

            if not event_id or event_id == last_played or not audio_b64:
                _sleep_with_stop(CONFIG.audio_poll_interval_s)
                continue

            log("EMERGENCY INSTRUCTION RECEIVED - " + str(dispatch.get("threat_type")) + " from " + str(dispatch.get("source_node_id")))
            log("   message: \"" + str(dispatch.get("evacuation_message")) + "\"")

            try:
                _play_mp3_bytes(base64.b64decode(audio_b64))
                last_played = event_id
                log("Played event_id=" + str(event_id))
            except Exception as exc:
                log("Audio playback failed: " + str(exc))
                _sleep_with_stop(CONFIG.audio_poll_interval_s)
                continue

            try:
                ack = requests.post(
                    ack_endpoint,
                    json={
                        "node_id": CONFIG.node_id,
                        "event_id": event_id,
                        "action": "ack",
                    },
                    timeout=10,
                )
                if not ack.ok:
                    log("Ack " + str(ack.status_code) + ": " + ack.text[:120])
            except requests.RequestException as exc:
                log("Ack POST failed: " + str(exc))

            _sleep_with_stop(CONFIG.audio_poll_interval_s)
    finally:
        try:
            pygame.mixer.quit()
        except Exception:
            pass
        log("Audio thread stopped")


def _play_mp3_bytes(data: bytes) -> None:
    assert pygame is not None
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as fp:
        fp.write(data)
        path = fp.name
    try:
        pygame.mixer.music.load(path)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy() and not STOP_EVENT.is_set():
            pygame.time.Clock().tick(20)
    finally:
        try:
            os.unlink(path)
        except OSError:
            pass


def _sleep_with_stop(seconds: float) -> None:
    end = time.monotonic() + seconds
    while not STOP_EVENT.is_set():
        remaining = end - time.monotonic()
        if remaining <= 0:
            return
        time.sleep(min(remaining, 0.2))


def _install_signal_handlers() -> None:
    def handle(_signum, _frame):
        log("Stop signal received")
        STOP_EVENT.set()

    signal.signal(signal.SIGINT, handle)
    if hasattr(signal, "SIGTERM"):
        signal.signal(signal.SIGTERM, handle)


def main() -> int:
    log("-" * 60)
    log("Sentinel Node booting up")
    log("  NODE_ID            = " + CONFIG.node_id)
    log("  SENTINEL_SERVER_URL= " + CONFIG.server_url)
    log("  vision interval    = " + str(CONFIG.vision_interval_s) + "s")
    log("  audio poll         = " + str(CONFIG.audio_poll_interval_s) + "s")
    log("  camera index       = " + str(CONFIG.camera_index))
    log("  skip_analysis      = " + str(CONFIG.skip_analysis))
    log("  include_source     = " + str(CONFIG.include_source))
    log("-" * 60)

    _install_signal_handlers()

    threads: list[threading.Thread] = []
    if not CONFIG.disable_vision:
        t = threading.Thread(target=vision_loop, name="vision", daemon=True)
        t.start()
        threads.append(t)
    else:
        log("Vision thread DISABLED via env")

    if not CONFIG.disable_audio:
        t = threading.Thread(target=audio_loop, name="audio", daemon=True)
        t.start()
        threads.append(t)
    else:
        log("Audio thread DISABLED via env")

    if not threads:
        log("Nothing to do (both threads disabled). Exiting.")
        return 0

    try:
        while not STOP_EVENT.is_set():
            time.sleep(0.5)
    except KeyboardInterrupt:
        STOP_EVENT.set()

    for t in threads:
        t.join(timeout=5.0)

    log("Sentinel Node shutdown complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
