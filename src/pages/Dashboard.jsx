import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPlayers, getTournaments, getTournamentRegistrations } from '../utils/firebaseStorage';
import { ROLES } from '../utils/userManagement';
import LoadingSpinner from '../components/LoadingSpinner';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isOrganizer = user?.role === ROLES.TOURNAMENT_ORGANIZER;
  const [playerCount, setPlayerCount] = useState(0);
  const [tournamentCount, setTournamentCount] = useState(0);
  const [assignedTournaments, setAssignedTournaments] = useState([]);
  const [registrationCounts, setRegistrationCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);

    if (isOrganizer) {
      // Tournament Organizer: only load details for their assigned tournaments
      const allTournaments = await getTournaments();
      const assignedIds = user?.assignedTournaments || [];
      const myTournaments = allTournaments.filter((t) => assignedIds.includes(t.id));

      const counts = {};
      await Promise.all(
        myTournaments.map(async (t) => {
          const regs = await getTournamentRegistrations(t.id);
          counts[t.id] = regs.length;
        })
      );

      setAssignedTournaments(myTournaments);
      setRegistrationCounts(counts);
      setLoading(false);
      return;
    }

    // Super Admin: full stats
    const players = await getPlayers();
    const tournaments = await getTournaments();
    setPlayerCount(players.length);
    setTournamentCount(tournaments.length);
    setLoading(false);
  };

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
        <div className="navbar-actions">
          <span className="welcome-text">Welcome, {user?.email || user?.name || 'Admin'}</span>
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
        ) : isOrganizer ? (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">🏆</div>
                <div className="stat-info">
                  <div className="stat-label">Your Assigned Tournaments</div>
                  <div className="stat-value">{assignedTournaments.length}</div>
                </div>
              </div>
            </div>

            <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>My Tournaments</h3>
            {assignedTournaments.length === 0 ? (
              <div className="no-data">
                <p>No tournaments have been assigned to you yet.</p>
              </div>
            ) : (
              <div className="stats-grid">
                {assignedTournaments.map((t) => (
                  <div
                    key={t.id}
                    className="stat-card clickable"
                    onClick={() => navigate(`/tournament-registrations/${t.id}`)}
                  >
                    <div className="stat-icon">📊</div>
                    <div className="stat-info">
                      <div className="stat-label">{t.name}</div>
                      <div className="stat-subtitle">
                        {t.location} • {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}
                      </div>
                      <div className="stat-subtitle">
                        Status: {t.status || 'Upcoming'} • Registrations: {registrationCounts[t.id] || 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
