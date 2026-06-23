import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, deletePlayer } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import './Players.css';

const Players = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = () => {
    const allPlayers = getPlayers();
    setPlayers(allPlayers);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      deletePlayer(id);
      loadPlayers();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Filter players based on search and position
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.mobile.includes(searchTerm);

    const matchesPosition = filterPosition ? player.position === filterPosition : true;

    return matchesSearch && matchesPosition;
  });

  // Get unique positions for filter
  const uniquePositions = [...new Set(players.map((p) => p.position))];

  return (
    <div className="players-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Cricket Player Management</h1>
        </div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-nav">
            Dashboard
          </button>
          <button onClick={() => navigate('/register-player')} className="btn-nav">
            Register Player
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="players-content">
        <div className="players-header">
          <h2>All Players ({filteredPlayers.length})</h2>
          <button onClick={() => navigate('/register-player')} className="btn-add">
            + Add New Player
          </button>
        </div>

        <div className="filters">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, place, or mobile..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-box">
            <select
              value={filterPosition}
              onChange={(e) => setFilterPosition(e.target.value)}
            >
              <option value="">All Positions</option>
              {uniquePositions.map((pos) => (
                <option key={pos} value={pos}>
                  {pos}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredPlayers.length === 0 ? (
          <div className="no-players">
            <p>No players found. {searchTerm || filterPosition ? 'Try adjusting your filters.' : 'Register your first player!'}</p>
          </div>
        ) : (
          <div className="players-grid">
            {filteredPlayers.map((player) => (
              <div key={player.id} className="player-card">
                <div className="player-photo">
                  {player.photo ? (
                    <img src={player.photo} alt={player.name} />
                  ) : (
                    <div className="photo-placeholder">📷</div>
                  )}
                </div>
                <div className="player-info">
                  <h3>{player.name}</h3>
                  <p className="player-position">{player.position}</p>
                  <div className="player-details">
                    <p>
                      <strong>Mobile:</strong> {player.mobile}
                    </p>
                    <p>
                      <strong>DOB:</strong> {new Date(player.dateOfBirth).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Blood Group:</strong> {player.bloodGroup}
                    </p>
                    <p>
                      <strong>Place:</strong> {player.place}
                    </p>
                  </div>
                </div>
                <div className="player-actions">
                  <button
                    onClick={() => handleDelete(player.id)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Players;
