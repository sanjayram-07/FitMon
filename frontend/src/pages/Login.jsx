import { useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, googleProvider, hasFirebaseConfig } from '../firebase/config';
import useAuthStore from '../store/useAuthStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const storeError = useAuthStore((state) => state.error);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!user) {
      return;
    }

    navigate(location.state?.from?.pathname || (user.role === 'mentor' ? '/mentor' : '/dashboard'), {
      replace: true,
    });
  }, [location.state, navigate, user]);

  async function handleGoogleSignIn() {
    if (!hasFirebaseConfig || !auth || !googleProvider) {
      setLocalError('Firebase OAuth is not configured. Add the Vite Firebase environment variables first.');
      return;
    }

    try {
      setLocalError('');
      setIsSubmitting(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setLocalError(error.message || 'Google sign-in failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-grid">
        <section className="card auth-hero">
          <div className="hero-pill badge-success">
            <Activity className="icon-sm" />
            <span>Secure OAuth access</span>
          </div>
          <h1 className="page-title">
            Sign in to launch your
            <span className="text-accent"> AI workout monitor</span>
          </h1>
          <p className="auth-copy">
            FitMon uses Firebase Authentication with Google Sign-In and verifies the ID token on the backend before any
            protected route or real-time socket session opens.
          </p>

          <div className="auth-value-grid">
            <ValueCard label="Auth" value="Firebase OAuth" />
            <ValueCard label="Realtime" value="Token-gated Socket.IO" />
            <ValueCard label="Storage" value="Firestore users + sessions" />
          </div>
        </section>

        <section className="card auth-card">
          <div className="auth-logo">
            Fit<span className="navbar-dot">·</span>Mon
          </div>
          <div>
            <p className="section-label">Welcome Back</p>
            <h2 className="section-title">Continue with Google</h2>
            <p className="text-secondary">
              New accounts are provisioned automatically in Firestore with the default role of trainee.
            </p>
          </div>

          <div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="btn-primary button-inline button-block"
            >
              <span>{isSubmitting ? 'Opening Google...' : 'Sign in with Google'}</span>
              <ArrowRight className="icon-sm" />
            </button>

            {(localError || storeError) ? (
              <div className="camera-error camera-error-inline auth-error">
                <AlertTriangle className="icon-md" />
                <div>
                  <strong>Authentication issue</strong>
                  <p>{localError || storeError}</p>
                </div>
              </div>
            ) : null}

            <p className="text-muted">
              Trainees are redirected to `/dashboard`; mentors are redirected to `/mentor`.
            </p>
          </div>

          <Link to="/" className="auth-link button-inline">
            Back to landing
          </Link>
        </section>
      </div>
    </div>
  );
}

function ValueCard({ label, value }) {
  return (
    <div className="card value-card">
      <p className="metric-label">{label}</p>
      <p className="card-title">{value}</p>
    </div>
  );
}
