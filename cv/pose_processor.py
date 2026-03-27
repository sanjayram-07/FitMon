"""
FitMon CV Module — Pose Processor
Handles MediaPipe Pose detection, landmark extraction, and rep counting logic.
"""

import mediapipe as mp
import numpy as np
import time

mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles


class PoseProcessor:
    """Wraps MediaPipe Pose for real-time landmark detection and rep counting."""

    # Landmark indices for arms
    LANDMARKS = {
        "LEFT_SHOULDER": 11,
        "LEFT_ELBOW": 13,
        "LEFT_WRIST": 15,
        "RIGHT_SHOULDER": 12,
        "RIGHT_ELBOW": 14,
        "RIGHT_WRIST": 16,
    }

    # Rep thresholds
    CURL_UP_THRESHOLD = 70    # Degrees
    CURL_DOWN_THRESHOLD = 140 # Degrees

    def __init__(
        self,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5,
        model_complexity: int = 1,
    ):
        self.pose = mp_pose.Pose(
            static_image_mode=False,
            model_complexity=model_complexity,
            smooth_landmarks=True,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
        )
        
        # Session state
        self.reset_session()

    def reset_session(self):
        """Reset all session counters and state machines."""
        self.total_reps = 0
        self.correct_reps = 0
        self.rep_state = "IDLE"  # IDLE, CURLING, PEAK, EXTENDING
        self.prev_angle = None
        self.prev_timestamp = None
        self.velocity_history = []
        self.current_rep_min_angle = 180
        self.current_rep_max_angle = 0
        self.current_rep_start_time = None

    def process_frame(self, frame, timestamp_ms=None):
        """
        Process a BGR frame and return complete analysis results.
        """
        rgb = frame # assumed to be converted if needed, but MP needs RGB
        results = self.pose.process(rgb)

        annotated = frame.copy()
        
        if not results.pose_landmarks:
            return {
                "valid": False,
                "message": "No pose detected",
                "annotated": annotated
            }

        # Draw skeleton on frame
        mp_drawing.draw_landmarks(
            annotated,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing_styles.get_default_pose_landmarks_style(),
        )

        landmarks = self._landmarks_to_list(results.pose_landmarks)
        joints = self.get_active_arm(landmarks)
        
        if joints["visibility"] < 0.5:
            return {
                "valid": False,
                "message": "Arm not clearly visible",
                "annotated": annotated
            }

        # Calculate angle
        angle = self.calculate_angle(joints["shoulder"], joints["elbow"], joints["wrist"])
        
        # Angular velocity
        now = timestamp_ms or int(time.time() * 1000)
        angular_velocity = 0
        if self.prev_angle is not None and self.prev_timestamp is not None:
            dt = (now - self.prev_timestamp) / 1000.0
            if dt > 0:
                angular_velocity = abs(angle - self.prev_angle) / dt
                self.velocity_history.append(angular_velocity)
                if len(self.velocity_history) > 30:
                    self.velocity_history.pop(0)

        # Biomechanical checks
        elbow_stability = self.check_elbow_stability(joints["shoulder"], joints["elbow"])
        is_jerky = self.detect_jerk()
        smoothness = self.calculate_smoothness()
        speed_ok = angular_velocity < 400

        # Update rep tracking
        self.current_rep_min_angle = min(self.current_rep_min_angle, angle)
        self.current_rep_max_angle = max(self.current_rep_max_angle, angle)

        rep_completed = False
        rep_correct = False
        feedback = []

        # State machine
        if self.rep_state == "IDLE":
            if angle < self.CURL_DOWN_THRESHOLD:
                self.rep_state = "CURLING"
                self.current_rep_start_time = now
        elif self.rep_state == "CURLING":
            if angle <= self.CURL_UP_THRESHOLD:
                self.rep_state = "PEAK"
            if angle > self.CURL_DOWN_THRESHOLD:
                self.rep_state = "IDLE"
                feedback.append("Complete full range")
        elif self.rep_state == "PEAK":
            if angle > self.CURL_UP_THRESHOLD + 20:
                self.rep_state = "EXTENDING"
        elif self.rep_state == "EXTENDING":
            if angle >= self.CURL_DOWN_THRESHOLD:
                rep_completed = True
                self.rep_state = "IDLE"
                
                # Evaluate quality
                rom_score = self.check_rom()
                form_score = int((elbow_stability * 0.3 + rom_score * 0.3 + (smoothness / 100.0) * 0.2 + (0.2 if speed_ok else 0)) * 100)
                rep_correct = form_score >= 60
                
                self.total_reps += 1
                if rep_correct:
                    self.correct_reps += 1
                
                # Reset rep markers
                self.current_rep_min_angle = 180
                self.current_rep_max_angle = 0

        # Generate warnings
        if elbow_stability < 0.6:
            feedback.append("Keep elbow stable")
        if is_jerky:
            feedback.append("Controlled motion please")
        if not speed_ok:
            feedback.append("Slow down")

        # Posture score for this frame
        posture_score = int((elbow_stability * 40) + (smoothness * 0.3) + (30 if speed_ok else 0))

        # Update persistent state
        self.prev_angle = angle
        self.prev_timestamp = now

        return {
            "valid": True,
            "angle": int(angle),
            "repState": self.rep_state,
            "repCompleted": rep_completed,
            "repCorrect": rep_correct,
            "repCount": self.total_reps,
            "postureScore": posture_score,
            "elbowStability": int(elbow_stability * 100),
            "smoothness": int(smoothness),
            "feedback": feedback,
            "landmarks": landmarks,
            "annotated": annotated
        }

    def _landmarks_to_list(self, pose_landmarks):
        return [{"x": lm.x, "y": lm.y, "z": lm.z, "visibility": lm.visibility} for lm in pose_landmarks.landmark]

    @staticmethod
    def calculate_angle(a, b, c):
        ba = np.array([a["x"] - b["x"], a["y"] - b["y"], (a["z"] - b["z"]) if "z" in a else 0])
        bc = np.array([c["x"] - b["x"], c["y"] - b["y"], (c["z"] - b["z"]) if "z" in c else 0])
        cos_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc) + 1e-8)
        return np.degrees(np.arccos(np.clip(cos_angle, -1.0, 1.0)))

    def get_active_arm(self, lms):
        def vis(idx): return lms[idx]["visibility"]
        l_vis = (vis(11) + vis(13) + vis(15)) / 3.0
        r_vis = (vis(12) + vis(14) + vis(16)) / 3.0
        if l_vis > r_vis:
            return {"shoulder": lms[11], "elbow": lms[13], "wrist": lms[15], "side": "left", "visibility": l_vis}
        return {"shoulder": lms[12], "elbow": lms[14], "wrist": lms[16], "side": "right", "visibility": r_vis}

    def check_elbow_stability(self, s, e, threshold=0.08):
        drift = abs(e["x"] - s["x"])
        if drift < threshold: return 1.0
        return max(0, 1.0 - (drift - threshold) * 5)

    def detect_jerk(self, threshold=500):
        if len(self.velocity_history) < 2: return False
        return abs(self.velocity_history[-1] - self.velocity_history[-2]) > threshold

    def calculate_smoothness(self):
        if len(self.velocity_history) < 3: return 100
        recent = self.velocity_history[-10:]
        std = np.std(recent)
        return max(0, min(100, 100 - std * 0.5))

    def check_rom(self):
        rom = self.current_rep_max_angle - self.current_rep_min_angle
        if rom >= 120 * 0.8: return 1.0
        if rom >= 120 * 0.5: return 0.7
        return 0.4

    def close(self):
        self.pose.close()
