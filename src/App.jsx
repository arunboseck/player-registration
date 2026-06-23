import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RegisterPlayer from './pages/RegisterPlayer';
import EditPlayer from './pages/EditPlayer';
import Players from './pages/Players';
import PublicRegister from './pages/PublicRegister';
import AddTournament from './pages/AddTournament';
import EditTournament from './pages/EditTournament';
import Tournaments from './pages/Tournaments';
import TournamentRegister from './pages/TournamentRegister';
import TournamentRegistrations from './pages/TournamentRegistrations';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<PublicRegister />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-player"
            element={
              <ProtectedRoute>
                <RegisterPlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/players"
            element={
              <ProtectedRoute>
                <Players />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-player/:id"
            element={
              <ProtectedRoute>
                <EditPlayer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tournaments"
            element={
              <ProtectedRoute>
                <Tournaments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-tournament"
            element={
              <ProtectedRoute>
                <AddTournament />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit-tournament/:id"
            element={
              <ProtectedRoute>
                <EditTournament />
              </ProtectedRoute>
            }
          />
          <Route path="/tournament-register/:id" element={<TournamentRegister />} />
          <Route
            path="/tournament-registrations/:id"
            element={
              <ProtectedRoute>
                <TournamentRegistrations />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
