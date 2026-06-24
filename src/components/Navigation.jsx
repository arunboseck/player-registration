import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleNavigation = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    logout();
    setSidebarOpen(false);
    navigate('/');
  };

  return (
    <>
      <button className="hamburger-menu-btn" onClick={() => setSidebarOpen(true)}>
        <div className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <div className={'sidebar-menu' + (sidebarOpen ? ' sidebar-open' : '')}>
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2>🏏 Cricket App</h2>
            <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>
          <div className="sidebar-body">
            {user ? (
              <>
                <h3 className="sidebar-section-title">Quick Actions</h3>
                <button className="sidebar-menu-item sidebar-menu-item-purple" onClick={() => handleNavigation('/register-player')}>
                  <span>Register Player</span>
                </button>
                <button className="sidebar-menu-item sidebar-menu-item-indigo" onClick={() => handleNavigation('/players')}>
                  <span>View Players</span>
                </button>
                <button className="sidebar-menu-item sidebar-menu-item-green" onClick={() => handleNavigation('/add-tournament')}>
                  <span>Create Tournament</span>
                </button>
                <button className="sidebar-menu-item sidebar-menu-item-blue" onClick={() => handleNavigation('/tournaments')}>
                  <span>View Tournaments</span>
                </button>
                <h3 className="sidebar-section-title">Management</h3>
                <button className="sidebar-menu-item sidebar-menu-item-indigo" onClick={() => handleNavigation('/dashboard')}>
                  <span>Dashboard</span>
                </button>
                <div className="sidebar-divider"></div>
                <button className="sidebar-menu-item sidebar-menu-item-logout" onClick={handleLogout}>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <h3 className="sidebar-section-title">Welcome</h3>
                <p className="sidebar-info-text">Register for the tournament or login as admin.</p>
                <button className="sidebar-menu-item sidebar-menu-item-blue" onClick={() => handleNavigation('/')}>
                  <span>Admin Login</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Navigation;