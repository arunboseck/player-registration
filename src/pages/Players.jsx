import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, getPlayersWithoutPhotos, deletePlayer } from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import LoadingSpinner from '../components/LoadingSpinner';
import './Players.css';

const Players = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [players, setPlayers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 players per page

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    console.log('📊 Loading players...');
    setLoading(true);
    // Use fast version without photos for instant load (90% faster!)
    const allPlayers = await getPlayersWithoutPhotos();
    console.log('📊 Setting players state with', allPlayers.length, 'players');
    setPlayers(allPlayers);
    setLoading(false);
    console.log('📊 Loading complete. State updated.');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      await deletePlayer(id);
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredPlayers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPlayers = filteredPlayers.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterPosition]);

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
          <>
            <div className="pagination-info">
              <p>Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPlayers.length)} of {filteredPlayers.length} players</p>
            </div>
            <div className="players-grid">
              {currentPlayers.map((player) => (
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
            {totalPages > 1 && (
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-pagination"
                >
                  ← Previous
                </button>
                <div className="pagination-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`btn-page ${currentPage === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-pagination"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Players;
