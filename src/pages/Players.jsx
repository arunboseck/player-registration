import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, getPlayersPaginated, getPlayersCount, deletePlayer, getTournaments, addTournamentRegistration } from '../utils/firebaseStorage';
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
  const [showTournamentModal, setShowTournamentModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [tournamentSearch, setTournamentSearch] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    loadInitialPlayers();
  }, []);

  const loadInitialPlayers = async () => {
    console.log('📊 Loading initial page of players (NO FULL COUNT - FAST!)...');
    setLoading(true);

    // Skip total count to avoid downloading all players!
    // We'll estimate pages as we load
    setTotalPlayers(0); // Will update as we paginate

    // Load first page using server-side pagination
    const result = await getPlayersPaginated(itemsPerPage, null);
    console.log('📊 Setting players state with', result.players.length, 'players');
    setPlayers(result.players);
    setAllPlayers(result.players);
    setLastKey(result.lastKey);
    setHasMore(result.hasMore);
    setCurrentPage(1);
    setLoading(false);
    console.log('📊 Loading complete. Initial page loaded in <1 second!');
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
    if (allPlayers.length === 0) {
      alert('No players to download');
      return;
    }

    // For now, download only loaded players (fast!)
    // To download ALL players, uncomment the next 2 lines (but it will take 5 minutes)
    // console.log('📥 Downloading all players for Excel...');
    // const allPlayersForExcel = await getPlayers();

    // Use already loaded players (instant download!)
    const allPlayersForExcel = allPlayers;

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

  const handleAssignToTournament = async (player) => {
    setSelectedPlayer(player);
    setShowTournamentModal(true);
    setTournamentSearch('');

    // Load tournaments
    try {
      const tournamentsList = await getTournaments();
      setTournaments(tournamentsList);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      alert('Failed to load tournaments. Please try again.');
    }
  };

  const handleTournamentSelect = async (tournament) => {
    if (!selectedPlayer || !tournament) return;

    if (!window.confirm(`Assign ${selectedPlayer.name} to tournament "${tournament.name}"?`)) {
      return;
    }

    setAssigning(true);

    try {
      // Prepare player data for tournament registration
      const registrationData = {
        name: selectedPlayer.name,
        mobile: selectedPlayer.mobile,
        dateOfBirth: selectedPlayer.dateOfBirth,
        bloodGroup: selectedPlayer.bloodGroup,
        place: selectedPlayer.place,
        position: selectedPlayer.position,
        photo: selectedPlayer.photo || '',
        registeredAt: new Date().toISOString(),
      };

      await addTournamentRegistration(tournament.id, registrationData);

      alert(`✅ ${selectedPlayer.name} successfully assigned to "${tournament.name}"!`);
      setShowTournamentModal(false);
      setSelectedPlayer(null);
      setTournamentSearch('');
    } catch (error) {
      console.error('Error assigning player to tournament:', error);
      if (error.message.includes('already registered')) {
        alert(`⚠️ ${selectedPlayer.name} is already registered for this tournament.`);
      } else {
        alert('Failed to assign player to tournament. Please try again.');
      }
    } finally {
      setAssigning(false);
    }
  };

  const handleCloseTournamentModal = () => {
    setShowTournamentModal(false);
    setSelectedPlayer(null);
    setTournamentSearch('');
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);

    // Clear search results if search is empty
    if (!term.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);

    try {
      // Search across entire database
      const allPlayersData = await getPlayers();
      const results = allPlayersData.filter((player) => {
        const matchesSearch =
          player.name.toLowerCase().includes(term.toLowerCase()) ||
          player.mobile.includes(term);

        const matchesPosition = filterPosition ? player.position === filterPosition : true;

        return matchesSearch && matchesPosition;
      });

      setSearchResults(results);
    } catch (error) {
      console.error('Error searching players:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Use search results if searching, otherwise use current page players
  const displayPlayers = searchTerm.trim() ? searchResults : players;

  // Filter by position only (search already filters by name/mobile)
  const filteredPlayers = displayPlayers.filter((player) => {
    const matchesPosition = filterPosition ? player.position === filterPosition : true;
    return matchesPosition;
  });

  // Show filtered players
  const currentPlayers = filteredPlayers;

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
              placeholder="Search by name or mobile (searches all players)..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              disabled={searching}
            />
            {searching && <span className="search-loading">🔍 Searching...</span>}
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
              {searchTerm.trim() ? (
                <p>🔍 Found {currentPlayers.length} player{currentPlayers.length !== 1 ? 's' : ''} matching "{searchTerm}"</p>
              ) : (
                <p>Showing {currentPlayers.length} players (Page {currentPage}, Loaded: {allPlayers.length} total) {hasMore ? '• More available' : '• End'}</p>
              )}
            </div>
            <div className="players-grid">
              {currentPlayers.map((player) => (
                <div key={player.id} className="player-card">
                  <button
                    className="btn-assign-tournament"
                    onClick={() => handleAssignToTournament(player)}
                    title="Assign to Tournament"
                  >
                    ⋮
                  </button>
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
            {/* Hide pagination when searching - show all results */}
            {!searchTerm.trim() && (currentPage > 1 || hasMore) && (
              <div className="pagination-controls">
                <button
                  onClick={loadPreviousPage}
                  disabled={currentPage === 1 || loading}
                  className="btn-pagination"
                >
                  ← Previous
                </button>
                <div className="pagination-info-compact">
                  Page {currentPage}
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

      {/* Tournament Assignment Modal */}
      {showTournamentModal && (
        <div className="modal-overlay" onClick={handleCloseTournamentModal}>
          <div className="modal-content modal-tournament-assign" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Assign {selectedPlayer?.name} to Tournament</h3>
              <button className="btn-close-modal" onClick={handleCloseTournamentModal}>×</button>
            </div>

            <div className="modal-body">
              <div className="tournament-search">
                <input
                  type="text"
                  placeholder="Search tournaments..."
                  value={tournamentSearch}
                  onChange={(e) => setTournamentSearch(e.target.value)}
                  className="tournament-search-input"
                />
              </div>

              <div className="tournaments-list">
                {tournaments.length === 0 ? (
                  <div className="no-tournaments">
                    <p>No tournaments available. Create a tournament first.</p>
                  </div>
                ) : (
                  tournaments
                    .filter((tournament) =>
                      tournament.name.toLowerCase().includes(tournamentSearch.toLowerCase()) ||
                      tournament.location.toLowerCase().includes(tournamentSearch.toLowerCase())
                    )
                    .map((tournament) => (
                      <div
                        key={tournament.id}
                        className="tournament-item"
                        onClick={() => handleTournamentSelect(tournament)}
                      >
                        <div className="tournament-item-info">
                          <h4>{tournament.name}</h4>
                          <p className="tournament-location">📍 {tournament.location}</p>
                          <p className="tournament-dates">
                            📅 {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="tournament-item-arrow">→</div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {assigning && (
              <div className="modal-loading">
                <LoadingSpinner />
                <p>Assigning player to tournament...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Players;
