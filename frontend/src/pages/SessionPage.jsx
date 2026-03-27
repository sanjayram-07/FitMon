import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Loader2 } from 'lucide-react';
import WebcamFeed from '../components/WebcamFeed';
import FeedbackPanel from '../components/FeedbackPanel';
import socketService from '../services/socketService';
import useSessionStore from '../stores/useSessionStore';

export default function SessionPage() {
  const navigate = useNavigate();
  const isConnected = useSessionStore((s) => s.isConnected);
  const sessionActive = useSessionStore((s) => s.sessionActive);
  const poseReady = useSessionStore((s) => s.poseReady);
  const report = useSessionStore((s) => s.report);
  const isGeneratingReport = useSessionStore((s) => s.isGeneratingReport);

  // Connect socket on mount
  useEffect(() => {
    socketService.connect();

    return () => {
      // Don't disconnect on unmount — keep connection alive
    };
  }, []);

  // Navigate to report when ready
  useEffect(() => {
    if (report) {
      navigate('/report/latest', { state: { report } });
    }
  }, [report, navigate]);

  const handleStart = useCallback(() => {
    if (!isConnected) {
      socketService.connect();
      // Retry after brief delay
      setTimeout(() => {
        socketService.startSession();
      }, 500);
      return;
    }
    socketService.startSession();
  }, [isConnected]);

  const handleEnd = useCallback(() => {
    socketService.endSession();
  }, []);

  return (
    <div className="min-h-screen pt-20 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <h1 className="text-2xl font-bold text-white mb-1">Bicep Curl Session</h1>
          <p className="text-sm text-dark-300">
            {!sessionActive
              ? 'Position yourself in front of the camera and press Start'
              : 'Session active — perform your curls with proper form'}
          </p>
        </div>

        {/* Main Layout */}
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          {/* Left: Webcam */}
          <div className="flex flex-col gap-4">
            <WebcamFeed />

            {/* Controls */}
            <div className="flex items-center justify-between glass-card p-4">
              <div className="flex items-center gap-3">
                {/* Pose status */}
                <div className={`status-badge ${poseReady ? 'connected' : 'disconnected'}`}>
                  {poseReady ? 'Pose AI Ready' : 'Loading AI...'}
                </div>
              </div>

              <div className="flex items-center gap-3">
                {!sessionActive ? (
                  <button
                    onClick={handleStart}
                    disabled={!poseReady}
                    className="btn-primary inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Play className="w-4 h-4" />
                    Start Session
                  </button>
                ) : (
                  <button
                    onClick={handleEnd}
                    disabled={isGeneratingReport}
                    className="btn-danger inline-flex items-center gap-2 disabled:opacity-60"
                  >
                    {isGeneratingReport ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" />
                        End Session
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Feedback Panel */}
          <aside className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <FeedbackPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
