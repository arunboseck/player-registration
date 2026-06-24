import { useState } from 'react';
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

      <div className={"sidebar-menu " + (sidebarOpen ? 'sidebar-open' : '')}>
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
        <div className=        <div className=        <div className=        <div de        <div className=        <div className=         <button className="side        <div className=  () => setSidebarOpen(false)}>
              ✕
            </button>
          </div>
          
          <div className="sidebar-body">
            {user ? (
                                        ss       sidebar-secti                         /h3>
                                             ass                         sidebar-menu-item-pur   "
                  onClick={() =>                   onClick={() =>                      >
                  <span className="sidebar-menu-icon">👤</span>
                  <span>Register Player</span>
                </button>
                <button 
                  clas            bar-menu-item sidebar-menu-item-indigo"
                  onClick={() => handleNavigation('/players')}
                >
                  <span className="sidebar-menu-icon">👥</span>
                  <span>View Players</span>
                </button>
                <button 
                  className="sidebar-menu-item sidebar-menu-item-green"
                  onClick={() => handleNavigation('                )}
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

                <h3 cla                <h3 cla -t                <h3 cla                <button 
                  className="sidebar-menu-item sidebar-menu-item-indigo"
                  onClick={() => handleN                board')}
                >
                  <span className="sidebar-menu-icon">📊</span>
                  <             d</span>
                                           <div className="sidebar-divider"></div>
                
                <button 
                  className="sidebar-menu-ite                tem-logout"
                  onClick={handleLogout}
                >
                  <span className="sidebar-men                  <span                     <spanut</span>
                </button>
              </>
            ) : (
              <>
                <h3 className="sidebar-section-title                                  <h3 className="sidebar-section-title               Register for the tournament or login as admin to                <h3 clasnam                <h3 className="sidebar-section-title                                  <h3 clasit                <h3 className="sidebar-section-title                    ti                <h3 className="sidebar-section-title          sidebar-menu-icon">🔑</span>
                  <span>Admin Login</span>
                </button>
              </>
                                                                                             avigation;
