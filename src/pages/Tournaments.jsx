import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTournaments, deleteTournament } from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import Navigation from '../components/Navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import './Players.css';

const Tournaments = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { modalState, hideModal, showConfirm, showSuccess } = useModal();

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    const allTournaments = await getTournaments();
    setTournaments(allTournaments);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirm(
      'Are you sure you want to delete this tournament? This action cannot be undone.',
      '🗑️ Delete Tournament'
    );

    if (confirmed) {
      await deleteTournament(id);
      loadTournaments();
      await showSuccess('Tournament has been deleted successfully!');
    }
  };

  const handleGetLink = async (id) => {
    const link = `${window.location.origin}/tournament-register/${id}`;
    navigator.clipboard.writeText(link);
    await showSuccess(
      `Registration link copied to clipboard!\n\n${link}`,
      '📋 Link Copied'
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getStatusClass = (status) => {
    const statusMap = {
      'Upcoming': 'status-upcoming',
      'Ongoing': 'status-ongoing',
      'Completed': 'status-completed',
      'Cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-upcoming';
  };

  return (
    <div className="players-container">
      <Navigation />
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Cricket Player Management</h1>
        </div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-nav">Dashboard</button>
          <button onClick={() => navigate('/players')} className="btn-nav">Players</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="players-content">
        <div className="players-header">
          <h2>Tournaments</h2>
          <div className="header-actions">
            <button onClick={() => navigate('/add-tournament')} className="btn-primary">
              + Add New Tournament
            </button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner
            message="Loading Tournaments"
            subMessage="Please wait while we fetch the tournament data..."
          />
        ) : tournaments.length === 0 ? (
          <div className="no-data">
            <p>No tournaments found. Create your first tournament!</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>S.No</th>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((tournament, index) => (
                  <tr key={tournament.id}>
                    <td>{index + 1}</td>
                    <td><strong>{tournament.name}</strong></td>
                    <td>{tournament.location}</td>
                    <td>{new Date(tournament.startDate).toLocaleDateString()}</td>
                    <td>{new Date(tournament.endDate).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(tournament.status)}`}>
                        {tournament.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => navigate(`/tournament-registrations/${tournament.id}`)}
                          className="btn-icon-action btn-registrations"
                          title="View Registrations"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleGetLink(tournament.id)}
                          className="btn-icon-action btn-get-link"
                          title="Get Registration Link"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => navigate(`/edit-tournament/${tournament.id}`)}
                          className="btn-icon-action btn-edit"
                          title="Edit Tournament"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(tournament.id)}
                          className="btn-icon-action btn-delete-tournament"
                          title="Delete Tournament"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        show={modalState.show}
        onClose={hideModal}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        icon={modalState.icon}
      />
    </div>
  );
};

export default Tournaments;
