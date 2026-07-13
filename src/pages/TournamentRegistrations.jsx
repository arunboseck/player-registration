import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournamentById, getTournamentRegistrations } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import './Players.css';
import './TournamentRegistrations.css';

const TournamentRegistrations = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, registration: null });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = () => {
    setLoading(true);
    setTimeout(() => {
      try {
        const tournamentData = getTournamentById(id);
        if (!tournamentData) {
          alert('Tournament not found!');
          navigate('/tournaments');
          setLoading(false);
          return;
        }
        setTournament(tournamentData);

        const regs = getTournamentRegistrations(id);
        // Ensure regs is always an array
        setRegistrations(Array.isArray(regs) ? regs : []);
      } catch (error) {
        console.error('Error loading tournament data:', error);
        setRegistrations([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleDeleteClick = (registration) => {
    setDeleteModal({ show: true, registration });
  };

  const handleConfirmDelete = () => {
    if (deleteModal.registration) {
      // Get all registrations
      const allRegistrations = JSON.parse(localStorage.getItem('tournamentRegistrations') || '[]');
      // Filter out the one to delete
      const updatedRegistrations = allRegistrations.filter(reg => reg.id !== deleteModal.registration.id);
      // Save back to localStorage
      localStorage.setItem('tournamentRegistrations', JSON.stringify(updatedRegistrations));
      // Reload data
      loadData();
      // Close modal
      setDeleteModal({ show: false, registration: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ show: false, registration: null });
  };

  const handleDownloadExcel = () => {
    if (filteredRegistrations.length === 0) {
      alert('No registrations to download');
      return;
    }

    const excelData = filteredRegistrations.map((reg, index) => ({
      'S.No': index + 1,
      'Name': reg.name,
      'Mobile': reg.mobile,
      'Date of Birth': reg.dateOfBirth ? new Date(reg.dateOfBirth).toLocaleDateString() : 'N/A',
      'Blood Group': reg.bloodGroup || 'N/A',
      'Place': reg.place,
      'Position': reg.position,
      'Registered On': reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Registrations');

    const columnWidths = [
      { wch: 6 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
      { wch: 12 }, { wch: 20 }, { wch: 35 }, { wch: 20 }
    ];
    worksheet['!cols'] = columnWidths;

    const filename = `${tournament.name}_Registrations_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const handleDownloadPDF = () => {
    if (filteredRegistrations.length === 0) {
      alert('No registrations to download');
      return;
    }

    const doc = new jsPDF();

    // Add title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`${tournament.name} - Registrations`, 14, 20);

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Location: ${tournament.location}`, 14, 28);
    doc.text(`Date: ${new Date(tournament.startDate).toLocaleDateString()} - ${new Date(tournament.endDate).toLocaleDateString()}`, 14, 34);
    doc.text(`Total Registrations: ${filteredRegistrations.length}`, 14, 40);

    const tableData = filteredRegistrations.map((reg, index) => [
      index + 1,
      reg.name,
      reg.mobile,
      reg.dateOfBirth ? new Date(reg.dateOfBirth).toLocaleDateString() : 'N/A',
      reg.bloodGroup || 'N/A',
      reg.place,
      reg.position,
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['S.No', 'Name', 'Mobile', 'DOB', 'Blood Group', 'Place', 'Position']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [102, 126, 234] },
    });

    const filename = `${tournament.name}_Registrations_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Safely filter registrations - ensure it's always an array
  const filteredRegistrations = Array.isArray(registrations)
    ? registrations.filter((reg) =>
        reg.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.place?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reg.mobile?.includes(searchTerm)
      )
    : [];

  if (!tournament && !loading) return <div>Loading...</div>;

  return (
    <div className="players-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>🏏 Cricket Player Management</h1>
        </div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-nav">Dashboard</button>
          <button onClick={() => navigate('/tournaments')} className="btn-nav">Tournaments</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="players-content">
        <div className="players-header">
          <div>
            <h2>{tournament.name} - Registrations</h2>
            <p className="tournament-subtitle">
              📍 {tournament.location} | 📅 {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="header-actions">
            <button onClick={handleDownloadPDF} className="btn-download btn-pdf">
              📄 Download PDF
            </button>
            <button onClick={handleDownloadExcel} className="btn-download btn-excel">
              📥 Download Excel
            </button>
          </div>
        </div>

        <div className="search-filter-bar">
          <input
            type="text"
            placeholder="🔍 Search by name, place, or mobile..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="filter-info">
            <span className="count-badge">
              {filteredRegistrations.length} {filteredRegistrations.length === 1 ? 'Registration' : 'Registrations'}
            </span>
          </div>
        </div>

        {filteredRegistrations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🏏</div>
            <h3>No Registrations Yet</h3>
            <p>No one has registered for this tournament yet.</p>
          </div>
        ) : (
          <div className="registrations-list">
            {filteredRegistrations.map((reg, index) => (
              <div key={reg.id} className="registration-card">
                <div className="registration-checkbox">
                  <input type="checkbox" id={`player-${reg.id}`} />
                </div>

                <div className="registration-avatar">
                  {reg.photo ? (
                    <img src={reg.photo} alt={reg.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {reg.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="registration-info">
                  <div className="info-column info-name">
                    <label>Name</label>
                    <strong>{reg.name}</strong>
                  </div>

                  <div className="info-column info-place">
                    <label>Place</label>
                    <span>{reg.place}</span>
                  </div>

                  <div className="info-column info-mobile">
                    <label>Mobile</label>
                    <span>{reg.mobile}</span>
                  </div>

                  <div className="info-column info-dob">
                    <label>Date of Birth</label>
                    <span>{reg.dateOfBirth ? new Date(reg.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
                  </div>

                  <div className="info-column info-blood">
                    <label>Blood Group</label>
                    <span className="badge-inline badge-blood">{reg.bloodGroup || 'N/A'}</span>
                  </div>

                  <div className="info-column info-position">
                    <label>Position</label>
                    <span className="badge-inline badge-position">{reg.position}</span>
                  </div>
                </div>

                <div className="registration-actions">
                  <button
                    className="btn-icon btn-view"
                    title="View Details"
                    onClick={() => alert(`Name: ${reg.name}\nMobile: ${reg.mobile}\nPlace: ${reg.place}\nPosition: ${reg.position}\nBlood Group: ${reg.bloodGroup}\nDOB: ${reg.dateOfBirth}`)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                  <button
                    className="btn-icon btn-delete"
                    title="Delete Registration"
                    onClick={() => handleDeleteClick(reg)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="modal-overlay" onClick={handleCancelDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Delete Registration</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete the registration for:</p>
              <div className="delete-player-info">
                <strong>{deleteModal.registration?.name}</strong>
                <span>{deleteModal.registration?.mobile}</span>
              </div>
              <p className="warning-text">This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancelDelete}>
                Cancel
              </button>
              <button className="btn-confirm-delete" onClick={handleConfirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentRegistrations;
