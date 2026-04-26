# Sentinel Node — Edge Node (Python)

Hardware-agnostic edge node script. Runs on any laptop with a webcam and
speakers. Two threads: vision (capture + upload) and audio (poll + play).

## Quick start

```bash
cd Hardware
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

### Run as Node 1 (detection laptop)

```bash
# Windows (cmd)
set NODE_ID=NODE-001
set SENTINEL_SERVER_URL=https://sentinal-node-production.up.railway.app
python node.py

# Windows (PowerShell)
$env:NODE_ID="NODE-001"
$env:SENTINEL_SERVER_URL="https://sentinal-node-production.up.railway.app"
python node.py

# macOS / Linux
NODE_ID=NODE-001 \
SENTINEL_SERVER_URL=https://sentinal-node-production.up.railway.app \
python node.py
```

### Run as Node 2 (action / alarm laptop)

Same as above, change `NODE_ID=NODE-002`. Both laptops run the **same script** —
each is a fully capable node (it captures + uploads frames AND polls for audio
to play).

## Environment variables

| Var                       | Default                  | Purpose                                         |
| ------------------------- | ------------------------ | ----------------------------------------------- |
| `NODE_ID`                 | `NODE-001`               | Logical node identifier.                        |
| `SENTINEL_SERVER_URL`     | `http://localhost:3000`  | Base URL of the Next.js Railway server.         |
| `VISION_INTERVAL_S`       | `3.0`                    | Seconds between frame uploads.                  |
| `AUDIO_POLL_INTERVAL_S`   | `2.0`                    | Seconds between dispatch polls.                 |
| `CAMERA_INDEX`            | `0`                      | OpenCV camera index. Use `1`+ if `0` is taken. |
| `SKIP_ANALYSIS`           | `0`                      | `1` → upload frames without running Vision.     |
| `INCLUDE_SOURCE`          | `0`                      | `1` → also play alarms on the detection node.   |
| `DISABLE_VISION`          | `0`                      | `1` → don't start the vision thread.            |
| `DISABLE_AUDIO`           | `0`                      | `1` → don't start the audio thread.             |

## Demo workflow (two laptops)

1. Start the Railway dashboard in a browser.
2. On Laptop 1 (detection): `NODE_ID=NODE-001 python node.py`.
3. On Laptop 2 (alarm):     `NODE_ID=NODE-002 python node.py`.
4. Hold a tactical-shooter image up to Laptop 1's webcam.
5. Vision flags it → Gemma drafts the evacuation → ElevenLabs renders mp3.
6. Laptop 2's audio thread polls, sees a fresh dispatch, plays the alarm.
7. Dashboard updates: Node 1 turns red, evac route lights up, audio plays.

## Resetting between demo runs

`DELETE https://<server>/api/node/frame` clears the dispatch + crisis lock so
the next detected threat triggers a fresh Gemma + ElevenLabs run. Frames stay.

```bash
curl -X DELETE https://sentinal-node-production.up.railway.app/api/node/frame
```

## Solo testing on one laptop

The detection node does NOT play its own evacuation alarm by default — only
sibling nodes do. This is correct in production (you don't blast civilians
inside the active threat zone with their own evac instructions) but means
you'll hear silence when running with one laptop.

To hear the alarm on the same laptop you're filming with:

```bash
set INCLUDE_SOURCE=1   (Windows)
$env:INCLUDE_SOURCE="1"  (PowerShell)
export INCLUDE_SOURCE=1   (macOS / Linux)
```

Audio fires for **every** detected threat type (Active Shooter, Fire,
Seismic, Civilian Casualty), not just civilian distress.

## Troubleshooting

* **`pygame not installed`** — install it inside this venv:
  `pip install pygame`. On Python 3.13+ you may need
  `pip install pygame --pre`. Verify with
  `python -c "import pygame; pygame.mixer.init(); print('ok')"`.
* **"Could not open camera"** — check `CAMERA_INDEX`. Try `0`, `1`, `2`.
* **Frame POSTs returning 500** — check the Railway server's env vars
  (`GCP_VISION_API_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`).
* **Detection node not playing alarm** — by design. Set `INCLUDE_SOURCE=1`
  for solo testing.
* **Ack flooding logs** — only happens once per dispatch; subsequent polls
  see `consumed_by` and short-circuit on the server.
* **Vision quota worry** — the server throttles per-node Vision calls to
  one every 6 seconds and stops calling Vision entirely during the 60-second
  crisis lock window. Frames keep flowing for the live feed.


You're green for the demo flow
To recap what's confirmed working:

Vision detects threat, Gemma drafts evacuation, ElevenLabs synthesizes audio
Server-side dispatch lands on the polling node, alarm plays
Dashboard animation pulses red and arrow draws to safe exit
Click-to-swap camera viewer
Manual Operator broadcasts (you tested EVACUATE and SHELTER, both played)
Reset Crisis Lock + 60s vision pause countdown
Throttle keeps Vision burn at one call per 6s per node, zero during crisis lock
Snowflake history (now with the UUID fix)

Push checklist
When you commit, make sure both Dashboard/ and Hardware/ folders are in. The Railway deploy already builds from the Dashboard subfolder per your existing Dockerfile, so just push to main and Railway will rebuild. The Hardware/ folder doesn't get deployed — the laptops pull node.py from git when you set them up.
Two-laptop deployed test
Once Railway picks up the new build:

Laptop 1 (detection): NODE_ID=NODE-001, SENTINEL_SERVER_URL=https://sentinal-node-production.up.railway.app, no INCLUDE_SOURCE. Run node.py.
Laptop 2 (action): NODE_ID=NODE-002, same server URL, no INCLUDE_SOURCE. Run node.py.
Open the deployed dashboard on either laptop or a third device.
Hold the threat image to Laptop 1. NODE-001 tile turns red on the dashboard, arrow draws, IncidentLog gets the entry, Snowflake history records it. Laptop 2's terminal logs the dispatch and plays the ElevenLabs alarm. Laptop 1 stays silent (correct — source-node suppression).
Click the NODE-002 tile in the dashboard → camera viewer swaps to Laptop 2's webcam.
Type a message in Responder Override and broadcast → both laptops play it (operator broadcasts have no source-node suppression).

If that all works, that's a complete end-to-end demo. We're then clear to start on Solana — adding the devnet hash logging on top of this same dispatch pipeline.