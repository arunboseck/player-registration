import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPlayers } from '../utils/storage';
import { useState, useEffect } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [playerCount, setPlayerCount] = useState(0);

  useEffect(() => {
    const players = getPlayers();
    setPlayerCount(players.length);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Cricket Player Management</h1>
        </div>
        <div className="navbar-user">
          <span>Welcome, {user?.username}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h2>Dashboard</h2>
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-icon">👥</div>
            <div className="card-content">
              <h3>Total Players</h3>
              <p className="card-value">{playerCount}</p>
            </div>
          </div>
          <div className="dashboard-card clickable" onClick={() => navigate('/players')}>
            <div className="card-icon">📋</div>
            <div className="card-content">
              <h3>View All Players</h3>
              <p className="card-subtitle">Click to view player list</p>
            </div>
          </div>
          <div className="dashboard-card clickable" onClick={() => navigate('/register-player')}>
            <div className="card-icon">➕</div>
            <div className="card-content">
              <h3>Register New Player</h3>
              <p className="card-subtitle">Click to add a player</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h3>Quick Actions</h3>
          <div className="action-buttons">
            <button className="btn-action" onClick={() => navigate('/register-player')}>
              Register Player
            </button>
            <button className="btn-action" onClick={() => navigate('/players')}>
              View Players
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
