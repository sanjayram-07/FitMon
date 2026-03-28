import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

export default function ProtectedRoute({ roles }) {
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const isLoading = useAuthStore((state) => state.isLoading);
  const initialized = useAuthStore((state) => state.initialized);

  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="glass-card p-8 text-center max-w-md w-full">
          <p className="text-white text-lg font-semibold">Preparing your FitMon workspace...</p>
          <p className="text-dark-300 text-sm mt-2">Authenticating with Firebase and loading your role.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles?.length && !roles.includes(user.role)) {
    return <Navigate to={user.role === 'mentor' ? '/mentor' : '/dashboard'} replace />;
  }

  return <Outlet />;
}
