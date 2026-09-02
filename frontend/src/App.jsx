import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import useAuthBootstrap from './hooks/useAuthBootstrap';
import Activity from './pages/Activity';
import Dashboard from './pages/Dashboard';
import Diet from './pages/Diet';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Mentor from './pages/Mentor';
import Onboarding from './pages/Onboarding';
import People from './pages/People';
import Profile from './pages/Profile';
import PublicProfile from './pages/PublicProfile';
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
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/session" element={<Session />} />
            <Route path="/report/:id" element={<Report />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/u/:uid" element={<PublicProfile />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/history" element={<Activity />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/diet" element={<Diet />} />
            <Route path="/people" element={<People />} />
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
