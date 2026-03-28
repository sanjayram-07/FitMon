import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Camera, CircleAlert } from 'lucide-react';
import Webcam from 'react-webcam';
import {
  closePoseDetector,
  detectPose,
  drawLandmarks,
  initializePoseDetector,
} from '../services/poseDetector';
import socketService from '../services/socketService';
import useSessionStore from '../stores/useSessionStore';
import { BicepCurlEngine } from '../utils/cvLogic';

const FRAME_INTERVAL = 100;
const curlEngine = new BicepCurlEngine();

export default function WebcamFeed() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastFrameTime = useRef(0);
  const [cameraError, setCameraError] = useState('');

  const sessionActive = useSessionStore((s) => s.sessionActive);
  const setPoseReady = useSessionStore((s) => s.setPoseReady);
  const updateFeedback = useSessionStore((s) => s.updateFeedback);
  const resetLiveFeedback = useSessionStore((s) => s.resetLiveFeedback);
  const angle = useSessionStore((s) => s.angle);
  const repCount = useSessionStore((s) => s.repCount);
  const repState = useSessionStore((s) => s.repState);
  const postureScore = useSessionStore((s) => s.postureScore);

  useEffect(() => {
    curlEngine.reset();
    if (!sessionActive) {
      resetLiveFeedback();
    }
  }, [resetLiveFeedback, sessionActive]);

  useEffect(() => {
    initializePoseDetector(() => {
      setPoseReady(true);
    });

    return () => {
      closePoseDetector();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [setPoseReady]);

  const handleUserMedia = useCallback(() => {
    setCameraError('');
  }, []);

  const handleUserMediaError = useCallback((error) => {
    const message = error?.name === 'NotReadableError'
      ? 'Camera is busy. Close the separate Python/OpenCV window and refresh this page.'
      : 'Camera access failed. Allow browser camera permission and try again.';

    setPoseReady(false);
    setCameraError(message);
  }, [setPoseReady]);

  useEffect(() => {
    function processFrame() {
      const now = performance.now();
      if (now - lastFrameTime.current < FRAME_INTERVAL) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastFrameTime.current = now;

      const video = webcamRef.current?.video;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        animationRef.current = requestAnimationFrame(processFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      const landmarks = detectPose(video, now);

      if (landmarks) {
        drawLandmarks(ctx, landmarks, canvas.width, canvas.height);
        if (sessionActive) {
          const results = curlEngine.processFrame(landmarks, Date.now());
          updateFeedback(results);

          if (results.valid) {
            socketService.sendCVResults({
              ...results,
              landmarks,
            });
          }
        }
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      animationRef.current = requestAnimationFrame(processFrame);
    }

    animationRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [sessionActive, updateFeedback]);

  return (
    <div className="camera-shell">
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored
        className="absolute inset-0 h-full w-full object-cover"
        onUserMedia={handleUserMedia}
        onUserMediaError={handleUserMediaError}
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: 'user',
          frameRate: { ideal: 15, max: 30 },
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      <div className="camera-gradient" />

      {cameraError ? (
        <div className="camera-error">
          <CircleAlert className="h-5 w-5" />
          <div>
            <strong>Camera unavailable</strong>
            <p>{cameraError}</p>
          </div>
        </div>
      ) : null}

      <div className="camera-hud">
        <div className="camera-chip">
          <Camera className="h-4 w-4" />
          <span>Browser CV Feed</span>
        </div>

        {sessionActive && (
          <div className="camera-chip camera-chip--live">
            <span className="camera-dot" />
            <span>Session Live</span>
          </div>
        )}
      </div>

      <div className="camera-tip">
        {cameraError ? (
          <>
            <CircleAlert className="h-4 w-4" />
            <span>Web mode uses only the browser camera. Do not run `cv/main.py` at the same time.</span>
          </>
        ) : sessionActive ? (
          <>
            <Activity className="h-4 w-4" />
            <span>Raise and lower the same arm fully to count reps in the page.</span>
          </>
        ) : (
          <>
            <CircleAlert className="h-4 w-4" />
            <span>Allow camera access, then press Start Session to begin tracking.</span>
          </>
        )}
      </div>

      <div className="camera-stats">
        <div className="camera-stat">
          <span className="camera-label">Reps</span>
          <strong>{repCount}</strong>
        </div>
        <div className="camera-stat">
          <span className="camera-label">Angle</span>
          <strong>{angle}&deg;</strong>
        </div>
        <div className="camera-stat">
          <span className="camera-label">Stage</span>
          <strong>{repState}</strong>
        </div>
        <div className="camera-stat">
          <span className="camera-label">Form</span>
          <strong>{postureScore}</strong>
        </div>
      </div>
    </div>
  );
}
