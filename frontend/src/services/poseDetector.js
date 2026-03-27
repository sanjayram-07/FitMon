import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

let poseLandmarker = null;
let isInitializing = false;

/**
 * Initialize the MediaPipe Pose Landmarker.
 */
export async function initializePoseDetector(onReady) {
  if (poseLandmarker || isInitializing) return poseLandmarker;
  isInitializing = true;

  try {
    console.log('[Pose] Initializing MediaPipe Pose Landmarker...');

    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );

    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    console.log('[Pose] MediaPipe initialized successfully');
    isInitializing = false;
    if (onReady) onReady();
    return poseLandmarker;
  } catch (error) {
    console.error('[Pose] Failed to initialize:', error);
    isInitializing = false;
    return null;
  }
}

/**
 * Detect pose in a video frame.
 * Returns landmarks array or null.
 */
export function detectPose(videoElement, timestamp) {
  if (!poseLandmarker || !videoElement) return null;

  try {
    const result = poseLandmarker.detectForVideo(videoElement, timestamp);

    if (result.landmarks && result.landmarks.length > 0) {
      return result.landmarks[0]; // First person
    }
    return null;
  } catch (error) {
    // Silently handle frame processing errors
    return null;
  }
}

/**
 * Draw landmarks on a canvas overlay.
 */
export function drawLandmarks(canvasCtx, landmarks, canvasWidth, canvasHeight) {
  if (!landmarks || !canvasCtx) return;

  canvasCtx.clearRect(0, 0, canvasWidth, canvasHeight);

  const drawingUtils = new DrawingUtils(canvasCtx);

  // Draw connections
  drawingUtils.drawConnectors(landmarks, PoseLandmarker.POSE_CONNECTIONS, {
    color: '#6c5ce780',
    lineWidth: 2,
  });

  // Draw landmarks
  drawingUtils.drawLandmarks(landmarks, {
    color: '#a29bfe',
    lineWidth: 1,
    radius: 3,
  });

  // Highlight arm joints (shoulder, elbow, wrist)
  const armIndices = [11, 13, 15, 12, 14, 16];
  armIndices.forEach((idx) => {
    const lm = landmarks[idx];
    if (lm && lm.visibility > 0.5) {
      canvasCtx.beginPath();
      canvasCtx.arc(lm.x * canvasWidth, lm.y * canvasHeight, 6, 0, 2 * Math.PI);
      canvasCtx.fillStyle = '#6c5ce7';
      canvasCtx.fill();
      canvasCtx.strokeStyle = '#ffffff40';
      canvasCtx.lineWidth = 2;
      canvasCtx.stroke();
    }
  });
}

/**
 * Cleanup pose landmarker.
 */
export function closePoseDetector() {
  if (poseLandmarker) {
    poseLandmarker.close();
    poseLandmarker = null;
  }
}
