# Create Navigation component files

nav_jsx = """import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
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

  const isPublicPage = location.pathname.includes('/tournament-register/');

  return (
    <>
      <button 
        className="hamburger-menu-btn" 
        onClick={() => setSidebarOpen(true)} 
        aria-label="Open menu"
      >
        <div className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <div className={'sidebar-menu' + (      <div className={'sidebar-me')}>      <div className={'sidebar-menu' + (     lick={() => setSidebarOpen(false)}></div>
        <div className="sidebar-content">
          <div className="side          <div className=<h2>🏏 Cricket App</h2>
            <button className="sidebar-close-btn" onClick={()            <button className="s              <button className="s>
            <button className="sideb  <            <button className="sideb      {user && (
                                     cl                             e"            ns                         tt                      className="sidebar-menu-item sidebar-menu-item-purple"
                  onClick={() => han     vigation('/regist                  onClick={() => han             <span className="sidebar-menu-icon">👤</span>
                  <span>Register Player</span>
                </button>
                <but                <but   className="sidebar-menu-item sidebar-menu-item-indigo"
                  onClick={() => handleNavigation('/players')}
                >
                  <span className="sidebar-menu-icon">👥</span>
                  <                  <                  <   <                  <                  <                  <   <               item sidebar-menu-item-green"
                  onClick={() => handleNavigation('/add-tournament')}
                >
                  <span className="sidebar-menu-icon">🏆</span>
                  <span>Create Tournament</span>
                </button>
                <button 
                  className="sidebar-menu-item sidebar-menu-item-blue"
                  onClick={() => handleNavigation('/tournaments')}
                >
                  <span className="sidebar-menu-icon">📋</span>
                  <span>View Tournaments</span>
                </button>

                <h3 className="sidebar-section-title">Managem                <h3 className="sidebar-section-title">Managem                <h3 className="sideem-indigo"
                  onClick={() => handleNavigation('/da                           >
                  <span className="sidebar-menu-icon">📊</span>
                  <span>Dashboard</span>
                </button>

                <div className="sidebar-divider"></div>
                
                                                                                   u-item-logout"
                  onClick={handleLogout}
                >
                  <span className="sidebar-menu-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </>
            )}

            {!user && !isPublicPage && (
              <>
                <h3 className="sidebar-section-title">Account</h3>
                <button 
                  cl                  cl                  cl      lue"
                  onClick={() => handleNavigation('/')}
                >
                  <span className="sidebar-menu-icon">🔑</span>
                  <span>Admin Login</span>
                                                                                          
                                                                 h                                        w'                        jsx)

print('Created Navigation.jsx')
