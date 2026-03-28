import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Play, Square } from 'lucide-react';
import BlurText from '../components/BlurText';
import FeedbackPanel from '../components/FeedbackPanel';
import ScrollFloat from '../components/ScrollFloat';
import WebcamFeed from '../components/WebcamFeed';
import socketService from '../services/socketService';
import useAuthStore from '../store/useAuthStore';
import useSessionStore from '../stores/useSessionStore';

export default function SessionPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const isConnected = useSessionStore((state) => state.isConnected);
  const sessionActive = useSessionStore((state) => state.sessionActive);
  const poseReady = useSessionStore((state) => state.poseReady);
  const report = useSessionStore((state) => state.report);
  const isGeneratingReport = useSessionStore((state) => state.isGeneratingReport);
  const socketError = useSessionStore((state) => state.socketError);
  const resetSession = useSessionStore((state) => state.resetSession);

  useEffect(() => {
    if (!token) {
      return undefined;
    }

    socketService.connect(token);

    return () => {
      socketService.disconnect();
      resetSession();
    };
  }, [resetSession, token]);

  useEffect(() => {
    if (report) {
      navigate('/report/latest', { state: { report } });
    }
  }, [navigate, report]);

  const handleStart = useCallback(() => {
    if (!isConnected && token) {
      socketService.connect(token);
    }

    socketService.startSession();
  }, [isConnected, token]);

  const handleEnd = useCallback(() => {
    socketService.endSession();
  }, []);

  return (
    <div className="page session-page">
      <div className="container">
        <div className="session-header fade-up">
          <ScrollFloat containerClassName="session-title-wrap" textClassName="session-title">
            LIVE SESSION
          </ScrollFloat>
          <BlurText
            text={
              !sessionActive
                ? 'Authenticated browser CV is ready. Position yourself in frame and start the curl session.'
                : 'Session active. FitMon is streaming pose and sensor data through the protected socket.'
            }
            delay={80}
            animateBy="words"
            direction="top"
            className="session-subtitle"
          />
        </div>

        <div className="session-grid">
          <div className="session-stack">
            <div className="card session-feed-card">
              <WebcamFeed />
            </div>

            {socketError ? (
              <div className="camera-error camera-error-inline">
                <div>
                  <strong>Socket connection problem</strong>
                  <p>{socketError}</p>
                </div>
              </div>
            ) : null}

            <div className="card session-control-dock">
              <div className="session-control-copy">
                <div className={`status-badge ${poseReady && isConnected ? 'connected' : 'disconnected'}`}>
                  {poseReady && isConnected ? 'Pose + Socket Ready' : 'Preparing Session'}
                </div>
                <p className="session-control-note">
                  Live inference stays in the browser for latency, while the backend orchestrates secure session state and report generation.
                </p>
              </div>

              <div className="session-control-actions">
                {!sessionActive ? (
                  <button
                    onClick={handleStart}
                    disabled={!poseReady || !token}
                    className="btn-primary session-control-button button-inline"
                  >
                    <Play className="icon-sm" />
                    Start Session
                  </button>
                ) : (
                  <button
                    onClick={handleEnd}
                    disabled={isGeneratingReport}
                    className="btn-danger session-control-button button-inline"
                  >
                    {isGeneratingReport ? (
                      <>
                        <Loader2 className="icon-sm spin" />
                        Generating Report...
                      </>
                    ) : (
                      <>
                        <Square className="icon-sm" />
                        End Session
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          <aside className="fade-up fade-up-2" style={{ animationDelay: '0.2s' }}>
            <FeedbackPanel />
          </aside>
        </div>
      </div>
    </div>
  );
}
