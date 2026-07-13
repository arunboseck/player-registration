import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPlayers, getTournaments } from '../utils/storage';
import Navigation from '../components/Navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [playerCount, setPlayerCount] = useState(0);
  const [tournamentCount, setTournamentCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    // Simulate slight delay to ensure smooth loading animation
    setTimeout(async () => {
      const players = await getPlayers();
      const tournaments = await getTournaments();
      setPlayerCount(players.length);
      setTournamentCount(tournaments.length);
      setLoading(false);
    }, 500);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      <Navigation />
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Cricket Player Management</h1>
        </div>
        <div className="navbar-actions">
          <span className="welcome-text">Welcome, {user?.username || 'admin@techcorp.com'}</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <h2 className="dashboard-title">Dashboard</h2>

        {loading ? (
          <LoadingSpinner
            message="Loading Dashboard"
            subMessage="Please wait while we fetch your statistics..."
          />
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <div className="stat-label">Total Players</div>
                  <div className="stat-value">{playerCount}</div>
                </div>
              </div>

          <div className="stat-card clickable" onClick={() => navigate('/players')}>
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <div className="stat-label">View All Players</div>
              <div className="stat-subtitle">Click to view player list</div>
            </div>
          </div>

          <div className="stat-card clickable" onClick={() => navigate('/register-player')}>
            <div className="stat-icon">➕</div>
            <div className="stat-info">
              <div className="stat-label">Register New Player</div>
              <div className="stat-subtitle">Click to add a player</div>
            </div>
          </div>
        </div>

            <div className="stats-grid" style={{marginTop: '2rem'}}>
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-info">
                  <div className="stat-label">Total Tournaments</div>
                  <div className="stat-value">{tournamentCount}</div>
                </div>
              </div>

          <div className="stat-card clickable" onClick={() => navigate('/tournaments')}>
            <div className="stat-icon">📊</div>
            <div className="stat-info">
              <div className="stat-label">View All Tournaments</div>
              <div className="stat-subtitle">Click to view tournament list</div>
            </div>
          </div>

              <div className="stat-card clickable" onClick={() => navigate('/add-tournament')}>
                <div className="stat-icon">🎯</div>
                <div className="stat-info">
                  <div className="stat-label">Create New Tournament</div>
                  <div className="stat-subtitle">Click to add a tournament</div>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <h3>Quick Actions</h3>
              <div className="action-buttons">
                <button onClick={() => navigate('/register-player')} className="action-btn primary">
                  Register Player
                </button>
                <button onClick={() => navigate('/players')} className="action-btn secondary">
                  View Players
                </button>
                <button onClick={() => navigate('/add-tournament')} className="action-btn success">
                  Create Tournament
                </button>
                <button onClick={() => navigate('/tournaments')} className="action-btn info">
                  View Tournaments
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
