import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthBootstrap from './hooks/useAuthBootstrap';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Mentor from './pages/Mentor';
import Profile from './pages/Profile';
import Report from './pages/Report';
import Session from './pages/Session';
import Workout from './pages/Workout';

function AppShell() {
  return (
    <div className="app-shell app-shell--light">
      <div className="app-shell__noise" />
      <div className="app-shell__aurora app-shell__aurora--one" />
      <div className="app-shell__aurora app-shell__aurora--two" />
      <Navbar />

      <main className="app-main">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute roles={['trainee']} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/session" element={<Session />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<History />} />
            <Route path="/workout" element={<Workout />} />
          </Route>

          <Route element={<ProtectedRoute roles={['mentor']} />}>
            <Route path="/mentor" element={<Mentor />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  useAuthBootstrap();

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}
