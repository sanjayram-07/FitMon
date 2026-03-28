import { signOut } from 'firebase/auth';
import { Activity, LogOut, Shield, Wifi, WifiOff } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase/config';
import useAuthStore from '../store/useAuthStore';
import useSessionStore from '../stores/useSessionStore';

export default function Navbar() {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isConnected = useSessionStore((state) => state.isConnected);

  async function handleLogout() {
    if (auth) {
      await signOut(auth);
    }
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-dark-600 bg-dark-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <Link to={user ? (user.role === 'mentor' ? '/mentor' : '/dashboard') : '/'} className="flex items-center gap-2 no-underline">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-primary to-accent-secondary flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Fit<span className="text-accent-primary">Mon</span>
          </span>
        </Link>

        <div className="flex items-center gap-3 sm:gap-5">
          <Link
            to={user ? (user.role === 'mentor' ? '/mentor' : '/dashboard') : '/'}
            className={`text-sm font-medium no-underline transition-colors ${
              ['/dashboard', '/mentor', '/'].includes(location.pathname) ? 'text-white' : 'text-dark-200 hover:text-white'
            }`}
          >
            Home
          </Link>

          {user?.role === 'trainee' ? (
            <Link
              to="/session"
              className={`text-sm font-medium no-underline transition-colors ${
                location.pathname === '/session' ? 'text-white' : 'text-dark-200 hover:text-white'
              }`}
            >
              Session
            </Link>
          ) : null}

          {user ? (
            <div className="hidden md:flex items-center gap-2 text-sm text-dark-200">
              <Shield className="w-4 h-4 text-accent-primary" />
              <span>{user.role}</span>
            </div>
          ) : null}

          <div className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Socket Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            )}
          </div>

          {user ? (
            <button type="button" onClick={handleLogout} className="btn-secondary inline-flex items-center gap-2 text-sm py-2 px-4">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <Link to="/login" className="btn-primary inline-flex items-center gap-2 no-underline text-sm py-2 px-4">
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
