import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navigation from './components/Navigation';
// Public pages load eagerly — they must stay small and fast on mobile.
import Home from './pages/Home';
import AboutUs from './pages/AboutUs';
import CalendarPage from './pages/CalendarPage';
// Everything else (admin/auth-gated pages, the camera-heavy tournament register
// flow) is code-split so visiting "/" never has to parse/compile/execute their
// JS — that main-thread work was the cause of scroll stutter on mobile.
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const RegisterPlayer = lazy(() => import('./pages/RegisterPlayer'));
const EditPlayer = lazy(() => import('./pages/EditPlayer'));
const Players = lazy(() => import('./pages/Players'));
const PublicRegister = lazy(() => import('./pages/PublicRegister'));
const AddTournament = lazy(() => import('./pages/AddTournament'));
const EditTournament = lazy(() => import('./pages/EditTournament'));
const Tournaments = lazy(() => import('./pages/Tournaments'));
const TournamentRegister = lazy(() => import('./pages/TournamentRegister'));
const TournamentRegistrations = lazy(() => import('./pages/TournamentRegistrations'));
const CleanupDuplicates = lazy(() => import('./pages/CleanupDuplicates'));
const MigratePhotos = lazy(() => import('./pages/MigratePhotos'));
const Settings = lazy(() => import('./pages/Settings'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
import { ROLES } from './utils/userManagement';
import './App.css';

// Layout component that conditionally shows navigation
function Layout({ children }) {
  const location = useLocation();

  // Don't show navigation on the public home page, login page, and tournament registration page
  const isHomePage = location.pathname === '/';
  const isAboutPage = location.pathname === '/about';
  const isCalendarPage = location.pathname === '/calendar';
  const isLoginPage = location.pathname === '/admin-login';
  const isTournamentRegisterPage = location.pathname.startsWith('/tournament-register/');
  const showNavigation =
    !isHomePage && !isAboutPage && !isCalendarPage && !isLoginPage && !isTournamentRegisterPage;

  return (
    <>
      {showNavigation && <Navigation />}
      {children}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout>
          <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/admin-login" element={<Login />} />
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
            <Route
              path="/cleanup-duplicates"
              element={
                <ProtectedRoute>
                  <CleanupDuplicates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/migrate-photos"
              element={
                <ProtectedRoute>
                  <MigratePhotos />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          </Suspense>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
