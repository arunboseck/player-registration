#!/bin/bash
cat > src/components/Navigation.jsx << 'NAVCODE'
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
      <button 
        className="hamburger-menu-btn" 
        onClick={() => setSidebarOpen(true)} 
      >
        <div className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>

      <div className={'sidebar-menu' + (sidebarOpen ? ' sidebar-open' : '')}>
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
        <div className="sidebar-        <div className="sidebar-        <div clder">
            <h2>Cricket App</h2>
            <button className="sidebar-close-            <button className="sidebar-close-             X
            </butto            </butto                    </butto            </butto                   {user ? (
              <>
                <h3 className="sidebar-section                <h3 className="sideba      <button 
                                ebar-menu-item sidebar-menu-item-purple"
                                     le                 st   player')}
                >
                  <span>Register Player</span>
                                             tton 
                                           te                      di                      onClick={() => handleNavig             rs')}
                >
                  <span>View Players</span>
                </button>
                <button 
                  className="sidebar-menu-item sidebar-menu-item-green"
                  onClick={() => handleNavigation('/add-tournament')}
                >
                  <span>Create Tournament</span>
                </button>
                <button 
                  className="sidebar-menu-item sidebar-menu-item-blue"
                  onClick={() => handleNavigation('/tournaments')}
                 
                                                                                                 ss                                                                                        className="sidebar-menu-item sidebar-menu-item-indigo"
                  onClick={() => handleNavigation('/dashboard')}
                >
                  <span>Dashboard</span>
                </button>
                <div className="sidebar-divider"></div>
                <button 
                  clas                en                  clas                en           onClick={handleLogout}
                >
                  <span>Logout</span>
                </button>
                                                                               ame="sidebar-section-title">Welcome</h3>
                <p className="sidebar-info-text">
                  Register fo                  Register fo                  Register fo               <button 
                  className="sidebar-menu-item sidebar-menu-item-blue"
                  onClick={() => handleNavigation('/')}
                >
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
NAVCODE
echo "Created Navigation.jsx"
