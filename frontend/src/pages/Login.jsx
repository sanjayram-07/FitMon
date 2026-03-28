import { useEffect, useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { AlertTriangle, ArrowRight } from 'lucide-react';
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
    if (!user) return;
    navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
  }, [location.state, navigate, user]);

  async function handleGoogleSignIn() {
    if (!hasFirebaseConfig || !auth || !googleProvider) {
      setLocalError('Sign-in is not available right now. Please try again later.');
      return;
    }
    try {
      setLocalError('');
      setIsSubmitting(true);
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      setLocalError('Sign-in failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page" style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* centered card only — no split layout */}
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <div className="card auth-card">

          {/* Logo */}
          <div className="auth-logo">
            Fit<span className="navbar-dot">·</span>Mon
          </div>

          {/* Heading */}
          <div style={{ textAlign: 'center' }}>
            <h2 className="section-title" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
              Welcome back, Trainee
            </h2>
            <p className="text-secondary" style={{ fontSize: '0.9rem' }}>
              Sign in to continue your training journey.
            </p>
          </div>

          {/* Google Sign In */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="btn-primary button-inline button-block"
              style={{ padding: '14px 28px', fontSize: '0.95rem' }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.96l3.007 2.332C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <span>{isSubmitting ? 'Signing in...' : 'Continue with Google'}</span>
              {!isSubmitting && <ArrowRight className="icon-sm" />}
            </button>

            {(localError || storeError) && (
              <div className="camera-error camera-error-inline" style={{ marginTop: '4px' }}>
                <AlertTriangle className="icon-md" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: '0.85rem' }}>{localError || storeError}</p>
              </div>
            )}
          </div>

          {/* Back link */}
          <div style={{ textAlign: 'center' }}>
            <Link to="/" style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}