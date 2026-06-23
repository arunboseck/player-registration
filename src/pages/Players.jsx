import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, deletePlayer } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
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

  const handleEdit = (id) => {
    navigate(`/edit-player/${id}`);
  };

  const handleDownloadExcel = () => {
    if (filteredPlayers.length === 0) {
      alert('No players to download');
      return;
    }

    // Prepare data for Excel
    const excelData = filteredPlayers.map((player, index) => ({
      'S.No': index + 1,
      'Name': player.name,
      'Mobile': player.mobile,
      'Date of Birth': new Date(player.dateOfBirth).toLocaleDateString(),
      'Blood Group': player.bloodGroup,
      'Place': player.place,
      'Position': player.position,
      'Registered On': player.createdAt ? new Date(player.createdAt).toLocaleDateString() : 'N/A',
    }));

    // Create workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Players');

    // Set column widths
    const columnWidths = [
      { wch: 6 },  // S.No
      { wch: 25 }, // Name
      { wch: 15 }, // Mobile
      { wch: 15 }, // DOB
      { wch: 12 }, // Blood Group
      { wch: 20 }, // Place
      { wch: 35 }, // Position
      { wch: 15 }, // Registered On
    ];
    worksheet['!cols'] = columnWidths;

    // Generate filename with current date
    const filename = `Cricket_Players_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, filename);
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
          <div className="header-actions">
            <button onClick={handleDownloadExcel} className="btn-download">
              📥 Download Excel
            </button>
            <button onClick={() => navigate('/register-player')} className="btn-add">
              + Add New Player
            </button>
          </div>
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
                    <p><strong>Mobile:</strong> {player.mobile}</p>
                    <p><strong>DOB:</strong> {new Date(player.dateOfBirth).toLocaleDateString()}</p>
                    <p><strong>Blood Group:</strong> {player.bloodGroup}</p>
                    <p><strong>Place:</strong> {player.place}</p>
                  </div>
                </div>
                <div className="player-actions">
                  <button onClick={() => handleEdit(player.id)} className="btn-edit">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(player.id)} className="btn-delete">
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
