"""
FitMon CV Module — Main Entry Point

Captures webcam feed, processes with MediaPipe Pose, and sends
processed results (angles, reps, posture) to the Node.js backend.

Usage:
    python main.py [--camera 0] [--server http://localhost:3001] [--fps 10]
"""

import cv2
import time
import argparse
import sys

from pose_processor import PoseProcessor
import socket_client


def parse_args():
    parser = argparse.ArgumentParser(description="FitMon CV Module")
    parser.add_argument("--camera", type=int, default=0, help="Camera index")
    parser.add_argument("--server", type=str, default="http://localhost:3001", help="Backend URL")
    parser.add_argument("--fps", type=int, default=10, help="Processing FPS")
    parser.add_argument("--show", action="store_true", default=True, help="Show preview window")
    return parser.parse_args()


def draw_hud(frame, res, connected, fps_actual):
    h, w = frame.shape[:2]
    cv2.rectangle(frame, (0, 0), (w, 40), (10, 10, 15), -1)
    
    # Connection
    color = (0, 214, 143) if connected else (71, 87, 255)
    cv2.circle(frame, (w - 20, 20), 6, color, -1)
    
    # Reps & State
    if res.get("valid"):
        cv2.putText(frame, f"REPS: {res['repCount']}", (10, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, res["repState"], (150, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (108, 92, 231), 2)
        cv2.putText(frame, f"Angle: {res['angle']}°", (w - 150, 28), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)


def main():
    args = parse_args()
    processor = PoseProcessor()
    
    if not socket_client.connect_to_server(args.server):
        print("[CV] ⚠️  Backend not reachable. Running standalone.")

    cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        print("[CV] ❌ Camera failed")
        return

    print("\n[Controls] S=Start, E=End, Q=Quit\n")
    
    frame_interval = 1.0 / args.fps
    last_frame_time = 0
    session_active = False

    try:
        while True:
            ret, frame = cap.read()
            if not ret: break

            now = time.time()
            if now - last_frame_time >= frame_interval:
                last_frame_time = now
                
                # RGB for MediaPipe
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                res = processor.process_frame(rgb, int(now * 1000))
                
                # Annotated back to BGR for CV2
                annotated = cv2.cvtColor(res["annotated"], cv2.COLOR_RGB2BGR)

                if session_active and res["valid"]:
                    # Send results to backend
                    socket_client.send_cv_results(res)

                draw_hud(annotated, res, socket_client.is_connected(), 0)
                
                if args.show:
                    cv2.imshow("FitMon CV", annotated)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"): break
            elif key == ord("s"):
                if socket_client.start_session():
                    session_active = True
                    print("[CV] 🏋️  Session started")
            elif key == ord("e"):
                socket_client.end_session()
                session_active = False
                processor.reset_session()

    finally:
        cap.release()
        cv2.destroyAllWindows()
        processor.close()
        socket_client.disconnect_from_server()


if __name__ == "__main__":
    main()
