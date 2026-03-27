"""
FitMon CV Module — Socket Client
Connects to the Node.js backend via Socket.IO.
"""

import socketio
import time

sio = socketio.Client(
    reconnection=True,
    reconnection_attempts=10,
    reconnection_delay=1,
    logger=False,
    engineio_logger=False,
)

_session_id = None
_connected = False


@sio.event
def connect():
    global _connected
    _connected = True
    print("[Socket] ✅ Connected to backend")


@sio.event
def disconnect():
    global _connected, _session_id
    _connected = False
    _session_id = None
    print("[Socket] ❌ Disconnected from backend")


@sio.on("session_started")
def on_session_started(data):
    global _session_id
    _session_id = data.get("sessionId")
    print(f"[Socket] 🏋️  Session started: {_session_id}")


@sio.on("feedback")
def on_feedback(data):
    """Receive and display real-time feedback from backend."""
    if data.get("type") == "update":
        rep_count = data.get("repCount", 0)
        angle = data.get("angle", 0)
        posture = data.get("postureScore", 0)
        rep_completed = data.get("repCompleted", False)
        rep_correct = data.get("repCorrect", False)

        if rep_completed:
            status = "✅ Good rep!" if rep_correct else "⚠️  Fix form"
            print(f"[Rep {rep_count}] {status} | Angle: {angle}° | Posture: {posture}")

    elif data.get("type") == "warning":
        print(f"[Warning] ⚠️  {data.get('message', '')}")


@sio.on("session_summary")
def on_session_summary(data):
    """Receive end-of-session report."""
    print("\n" + "=" * 50)
    print("📊 SESSION REPORT")
    print("=" * 50)
    print(f"  Total Reps:    {data.get('totalReps', 0)}")
    print(f"  Correct:       {data.get('correctReps', 0)}")
    print(f"  Incorrect:     {data.get('incorrectReps', 0)}")
    print(f"  Accuracy:      {data.get('accuracy', 0)}%")
    print(f"  Posture Score: {data.get('avgPostureScore', 0)}/100")
    print(f"  Injury Risk:   {data.get('injuryRiskScore', 0)}%")
    print("=" * 50 + "\n")


def connect_to_server(url: str = "http://localhost:3001"):
    try:
        print(f"[Socket] Connecting to {url}...")
        sio.connect(url, transports=["websocket"])
        return True
    except Exception as e:
        print(f"[Socket] Connection failed: {e}")
        return False


def start_session():
    if not _connected: return False
    sio.emit("start_session", {})
    time.sleep(0.5)
    return _session_id is not None


def send_cv_results(results: dict):
    """Send processed CV results to backend."""
    if not _connected or not _session_id:
        return
    # Use 'cv_results' event to distinguish from raw 'frame'
    sio.emit("cv_results", results)


def end_session():
    if not _connected: return
    print("[Socket] Ending session...")
    sio.emit("end_session", {})
    time.sleep(2)


def disconnect_from_server():
    if _connected: sio.disconnect()


def is_connected(): return _connected
def get_session_id(): return _session_id
