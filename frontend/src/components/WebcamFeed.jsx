import { BicepCurlEngine } from '../utils/cvLogic';

const FRAME_INTERVAL = 100; // ~10 FPS
const curlEngine = new BicepCurlEngine();

export default function WebcamFeed() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const lastFrameTime = useRef(0);
  const sessionActive = useSessionStore((s) => s.sessionActive);
  const setPoseReady = useSessionStore((s) => s.setPoseReady);

  // Reset engine when session starts/ends
  useEffect(() => {
    if (!sessionActive) {
      curlEngine.reset();
    }
  }, [sessionActive]);

  // Initialize MediaPipe
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

  // Process frame loop
  const processFrame = useCallback(() => {
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

    // Resize canvas to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');

    // Detect pose
    const landmarks = detectPose(video, now);

    if (landmarks) {
      // Draw skeleton overlay
      drawLandmarks(ctx, landmarks, canvas.width, canvas.height);

      // ─── LOCAL CV PROCESSING ───
      const results = curlEngine.processFrame(landmarks, Date.now());

      // Send results to server (if session active)
      if (sessionActive && results.valid) {
        socketService.sendCVResults({
          ...results,
          landmarks, // Keep landmarks for drawing or additional backend logs
        });
      }
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    animationRef.current = requestAnimationFrame(processFrame);
  }, [sessionActive]);

  // Start/stop frame loop
  useEffect(() => {
    animationRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [processFrame]);

  return (
    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-dark-800 border border-dark-600">
      <Webcam
        ref={webcamRef}
        audio={false}
        mirrored={true}
        className="absolute inset-0 w-full h-full object-cover"
        videoConstraints={{
          width: 640,
          height: 480,
          facingMode: 'user',
          frameRate: { ideal: 15, max: 30 },
        }}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Status overlay */}
      {sessionActive && (
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-2 bg-dark-900/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
            <span className="text-xs font-semibold text-white">LIVE</span>
          </div>
        </div>
      )}
    </div>
  );
}
