import { Link, useLocation } from 'react-router-dom';
import { Activity, Wifi, WifiOff } from 'lucide-react';
import useSessionStore from '../stores/useSessionStore';

export default function Navbar() {
  const location = useLocation();
  const isConnected = useSessionStore((s) => s.isConnected);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-dark-600 bg-dark-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-primary to-purple-500 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            Fit<span className="text-accent-primary">Mon</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className={`text-sm font-medium no-underline transition-colors ${
              location.pathname === '/' ? 'text-white' : 'text-dark-200 hover:text-white'
            }`}
          >
            Home
          </Link>
          <Link
            to="/session"
            className={`text-sm font-medium no-underline transition-colors ${
              location.pathname === '/session' ? 'text-white' : 'text-dark-200 hover:text-white'
            }`}
          >
            Session
          </Link>

          {/* Connection Status */}
          <div className={`status-badge ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Live</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
