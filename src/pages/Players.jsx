import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, getPlayersPaginated, getPlayersCount, deletePlayer } from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import LoadingSpinner from '../components/LoadingSpinner';
import './Players.css';

const Players = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [players, setPlayers] = useState([]);
  const [allPlayers, setAllPlayers] = useState([]); // Keep all loaded players
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // 20 players per page
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [lastKey, setLastKey] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadInitialPlayers();
  }, []);

  const loadInitialPlayers = async () => {
    console.log('📊 Loading initial page of players...');
    setLoading(true);

    // Get total count first
    const count = await getPlayersCount();
    setTotalPlayers(count);
    console.log(`📊 Total players in database: ${count}`);

    // Load first page using server-side pagination
    const result = await getPlayersPaginated(itemsPerPage, null);
    console.log('📊 Setting players state with', result.players.length, 'players');
    setPlayers(result.players);
    setAllPlayers(result.players);
    setLastKey(result.lastKey);
    setHasMore(result.hasMore);
    setCurrentPage(1);
    setLoading(false);
    console.log('📊 Loading complete. Initial page loaded.');
  };

  const loadNextPage = async () => {
    if (!hasMore || loading) return;

    console.log('📊 Loading next page...');
    setLoading(true);
    const result = await getPlayersPaginated(itemsPerPage, lastKey);

    // Append new players
    const updatedPlayers = [...allPlayers, ...result.players];
    setAllPlayers(updatedPlayers);
    setPlayers(result.players);
    setLastKey(result.lastKey);
    setHasMore(result.hasMore);
    setCurrentPage(prev => prev + 1);
    setLoading(false);
    console.log(`📊 Page ${currentPage + 1} loaded. Total loaded: ${updatedPlayers.length}`);
  };

  const loadPreviousPage = async () => {
    if (currentPage === 1) return;

    // For previous pages, we use the already loaded data
    const startIdx = (currentPage - 2) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const previousPagePlayers = allPlayers.slice(startIdx, endIdx);

    setPlayers(previousPagePlayers);
    setCurrentPage(prev => prev - 1);
    console.log(`📊 Showing page ${currentPage - 1}`);
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

  const handleDownloadExcel = async () => {
    if (totalPlayers === 0) {
      alert('No players to download');
      return;
    }

    // Fetch all players for Excel download (without pagination)
    console.log('📥 Downloading all players for Excel...');
    const allPlayersForExcel = await getPlayers();

    // Prepare data for Excel
    const excelData = allPlayersForExcel.map((player, index) => ({
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

  // Filter players based on search and position (client-side filter on current page only)
  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
      player.mobile.includes(searchTerm);

    const matchesPosition = filterPosition ? player.position === filterPosition : true;

    return matchesSearch && matchesPosition;
  });

  // Pagination calculations - now based on total players, not filtered
  const totalPages = Math.ceil(totalPlayers / itemsPerPage);
  const currentPlayers = filteredPlayers; // Show filtered players from current page

  // Get unique positions for filter (from all loaded players)
  const uniquePositions = [...new Set(allPlayers.map((p) => p.position))];

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
              <p>Showing page {currentPage} of {totalPages} (Total: {totalPlayers} players, Loaded: {allPlayers.length})</p>
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
                  onClick={loadPreviousPage}
                  disabled={currentPage === 1 || loading}
                  className="btn-pagination"
                >
                  ← Previous
                </button>
                <div className="pagination-info-compact">
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  onClick={loadNextPage}
                  disabled={!hasMore || loading}
                  className="btn-pagination"
                >
                  {loading ? 'Loading...' : 'Next →'}
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
