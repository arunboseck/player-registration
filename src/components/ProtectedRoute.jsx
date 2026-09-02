import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Pass allowedRoles={['super_admin']} to restrict a route to specific roles.
// Omit allowedRoles to just require any authenticated user.
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🚫</h1>
        <h2>Access Denied</h2>
        <p style={{ color: '#6b7280' }}>You don't have permission to view this page.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
