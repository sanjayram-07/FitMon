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
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_0.9fr] gap-8 items-stretch">
        <section className="glass-card p-10 lg:p-12">
          <div className="hero-pill mb-6">
            <Activity className="h-4 w-4 text-accent-primary" />
            <span>Secure OAuth access</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight">
            Sign in to launch your
            <span className="text-accent-primary"> AI workout monitor</span>
          </h1>
          <p className="text-dark-200 mt-5 max-w-xl">
            FitMon uses Firebase Authentication with Google Sign-In and verifies the ID token on the backend before any
            protected route or real-time socket session opens.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mt-8">
            <ValueCard label="Auth" value="Firebase OAuth" />
            <ValueCard label="Realtime" value="Token-gated Socket.IO" />
            <ValueCard label="Storage" value="Firestore users + sessions" />
          </div>
        </section>

        <section className="glass-card p-8 lg:p-10 flex flex-col justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-dark-300">Welcome Back</p>
            <h2 className="text-2xl font-bold text-white mt-3">Continue with Google</h2>
            <p className="text-dark-200 text-sm mt-3">
              New accounts are provisioned automatically in Firestore with the default role of trainee.
            </p>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="btn-primary w-full inline-flex items-center justify-center gap-3 disabled:opacity-60"
            >
              <span>{isSubmitting ? 'Opening Google...' : 'Sign in with Google'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            {(localError || storeError) ? (
              <div className="camera-error relative top-auto left-auto right-auto mt-4">
                <AlertTriangle className="h-5 w-5" />
                <div>
                  <strong>Authentication issue</strong>
                  <p>{localError || storeError}</p>
                </div>
              </div>
            ) : null}

            <p className="text-xs text-dark-300 mt-5">
              Trainees are redirected to `/dashboard`; mentors are redirected to `/mentor`.
            </p>
          </div>

          <Link to="/" className="text-sm text-dark-200 hover:text-white no-underline mt-8 inline-flex items-center gap-2">
            Back to landing
          </Link>
        </section>
      </div>
    </div>
  );
}

function ValueCard({ label, value }) {
  return (
    <div className="rounded-3xl border border-dark-600 bg-dark-800/60 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-dark-300">{label}</p>
      <p className="text-white font-semibold mt-2">{value}</p>
    </div>
  );
}
