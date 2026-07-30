import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, getPlayersPaginated, getPlayersCount, deletePlayer, getTournaments, addTournamentRegistration, searchPlayers } from '../utils/firebaseStorage';
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
  const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    loadAllPlayers();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.card-menu')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openDropdownId]);

  const loadAllPlayers = async () => {
    console.log('📊 Loading all players...');
    setLoading(true);

    try {
      // Load ALL players at once (fast with Cloudinary photos)
      const allPlayersData = await getPlayers();
      console.log('📊 Loaded', allPlayersData.length, 'players');
      setPlayers(allPlayersData);
      setAllPlayers(allPlayersData);
      setTotalPlayers(allPlayersData.length);
      setLoading(false);
    } catch (error) {
      console.error('Error loading players:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      await deletePlayer(id);
      loadAllPlayers(); // Reload all players after delete
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

  const toggleDropdown = (playerId) => {
    setOpenDropdownId(openDropdownId === playerId ? null : playerId);
  };

  const handleSearch = (term) => {
    // Update search term immediately (no lag in input field)
    setSearchTerm(term);

    // Clear existing debounce timer
    if (searchDebounceTimer) {
      clearTimeout(searchDebounceTimer);
    }

    // Clear search results if search is empty
    if (!term.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    // Only show searching indicator after user has stopped typing for a moment
    // This prevents the "loading" flash on every keystroke

    // Debounce search - wait 500ms after user stops typing
    const timer = setTimeout(async () => {
      setSearching(true); // Show loading only when actually searching

      try {
        // ✅ OPTIMIZED: Use indexed Firebase query instead of downloading all players
        console.log(`🔍 Optimized search for: "${term}"`);
        const results = await searchPlayers(term);

        // Apply position filter if set
        const filteredResults = filterPosition
          ? results.filter(player => player.position === filterPosition)
          : results;

        setSearchResults(filteredResults);
        console.log(`✅ Search complete: ${filteredResults.length} results`);
      } catch (error) {
        console.error('Error searching players:', error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500); // Increased to 500ms for better UX (waits for user to finish typing)

    setSearchDebounceTimer(timer);
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
          <h2>All Players ({allPlayers.length})</h2>
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
              placeholder="Type to search by name or mobile number..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
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


        {loading ? (
          <div className="no-players">
            <LoadingSpinner />
            <p>Loading players...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="no-players">
            <p>No players found. {searchTerm || filterPosition ? 'Try adjusting your filters.' : 'Register your first player!'}</p>
          </div>
        ) : (
          <div className="players-grid">
            {currentPlayers.map((player) => (
              <div key={player.id} className="player-card">
                {/* 3-Dot Menu */}
                <div className="card-menu">
                  <button
                    className="btn-card-menu"
                    onClick={() => toggleDropdown(player.id)}
                    title="More options"
                  >
                    ⋮
                  </button>
                  {openDropdownId === player.id && (
                    <div className="card-dropdown">
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          handleEdit(player.id);
                          setOpenDropdownId(null);
                        }}
                      >
                        <span className="dropdown-icon">✏️</span>
                        Edit Player
                      </button>
                      <button
                        className="dropdown-item"
                        onClick={() => {
                          handleAssignToTournament(player);
                          setOpenDropdownId(null);
                        }}
                      >
                        <span className="dropdown-icon">🏆</span>
                        Assign to Tournament
                      </button>
                      <button
                        className="dropdown-item dropdown-item-danger"
                        onClick={() => {
                          handleDelete(player.id);
                          setOpenDropdownId(null);
                        }}
                      >
                        <span className="dropdown-icon">🗑️</span>
                        Delete Player
                      </button>
                    </div>
                  )}
                </div>

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
              </div>
            ))}
          </div>
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
