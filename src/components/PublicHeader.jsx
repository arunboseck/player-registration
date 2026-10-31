import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Shared header + mobile sidebar used across the public pages (Home, About Us, Calendar).
const PublicHeader = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <header className="home-header">
        <button
          type="button"
          className="home-hamburger"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <Link to="/" className="home-header-brand">
          <span className="home-header-icon">🏏</span>
          <span className="home-header-title">Player Management System</span>
        </Link>

        <nav className="home-header-nav">
          <Link to="/" className={`home-nav-link ${isActive('/') ? 'home-nav-link-active' : ''}`}>Home</Link>
          <Link to="/about" className={`home-nav-link ${isActive('/about') ? 'home-nav-link-active' : ''}`}>About Us</Link>
          <Link to="/calendar" className={`home-nav-link ${isActive('/calendar') ? 'home-nav-link-active' : ''}`}>Calendar</Link>
        </nav>

        <Link to="/admin-login" className="home-header-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Admin Login</span>
        </Link>
      </header>

      <div className={`home-sidebar-overlay ${menuOpen ? 'home-sidebar-overlay-open' : ''}`} onClick={() => setMenuOpen(false)}></div>
      <aside className={`home-sidebar ${menuOpen ? 'home-sidebar-open' : ''}`}>
        <div className="home-sidebar-header">
          <span className="home-header-icon">🏏</span>
          <span className="home-header-title">Menu</span>
          <button type="button" className="home-sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">×</button>
        </div>
        <div className="home-sidebar-links">
          <Link to="/" className={`home-sidebar-link ${isActive('/') ? 'home-sidebar-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
            <span>🏠</span> Home
          </Link>
          <Link to="/about" className={`home-sidebar-link ${isActive('/about') ? 'home-sidebar-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
            <span>ℹ️</span> About Us
          </Link>
          <Link to="/calendar" className={`home-sidebar-link ${isActive('/calendar') ? 'home-sidebar-link-active' : ''}`} onClick={() => setMenuOpen(false)}>
            <span>📅</span> Calendar
          </Link>
          <Link to="/admin-login" className="home-sidebar-link" onClick={() => setMenuOpen(false)}>
            <span>🔐</span> Admin Login
          </Link>
        </div>
      </aside>
    </>
  );
};

export default PublicHeader;
