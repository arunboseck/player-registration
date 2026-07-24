import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournamentById, getTournamentRegistrations, deleteRegistration, updateRegistration, syncTournamentPhotosWithPlayers } from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import LoadingSpinner from '../components/LoadingSpinner';
import './Players.css';
import './TournamentRegistrations.css';

const POSITIONS = [
  'ALL ROUNDER', 'LEFT ARM MEDIUM (BOWLING)', 'LEFT ARM FAST MEDIUM (BOWLING)',
  'LEFT ARM FAST (BOWLING)', 'LEFT HAND BATTING (BATTER)', 'RIGHT ARM MEDIUM (BOWLING)',
  'RIGHT ARM FAST MEDIUM (BOWLING)', 'RIGHT ARM FAST (BOWLING)', 'RIGHT HAND BATTING (BATTER)',
  'WICKET KEEPER BATTER'
];

const TournamentRegistrations = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, registration: null });
  const [editModal, setEditModal] = useState({ show: false, registration: null });
  const [editFormData, setEditFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const tournamentData = await getTournamentById(id);
      if (!tournamentData) {
        alert('Tournament not found!');
        navigate('/tournaments');
        return;
      }
      setTournament(tournamentData);

      const regs = await getTournamentRegistrations(id);
      setRegistrations(regs);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Error loading tournament data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (registration) => {
    setDeleteModal({ show: true, registration });
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.registration) {
      try {
        await deleteRegistration(id, deleteModal.registration.id);
        await loadData();
        setDeleteModal({ show: false, registration: null });
      } catch (error) {
        console.error('Error deleting registration:', error);
        alert('Error deleting registration');
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ show: false, registration: null });
  };

  const handleEditClick = (registration) => {
    setEditFormData({
      name: registration.name,
      mobile: registration.mobile,
      place: registration.place,
      dateOfBirth: registration.dateOfBirth,
      bloodGroup: registration.bloodGroup || '',
      position: registration.position,
    });
    setEditModal({ show: true, registration });
  };

  const handleCancelEdit = () => {
    setEditModal({ show: false, registration: null });
    setEditFormData({});
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEdit = async () => {
    if (!editModal.registration) return;

    // Validation
    if (!editFormData.name?.trim()) {
      alert('Name is required');
      return;
    }
    if (!editFormData.mobile?.trim()) {
      alert('Mobile number is required');
      return;
    }
    if (!editFormData.place?.trim()) {
      alert('Place is required');
      return;
    }
    if (!editFormData.position?.trim()) {
      alert('Position is required');
      return;
    }

    setSaving(true);
    try {
      const result = await updateRegistration(id, editModal.registration.id, editFormData);

      if (result.success) {
        alert('Registration updated successfully!');
        await loadData(); // Reload data
        handleCancelEdit();
      } else {
        alert(result.message || 'Failed to update registration');
      }
    } catch (error) {
      console.error('Error updating registration:', error);
      alert('Error updating registration');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncPhotos = async () => {
    if (!window.confirm('This will replace base64 photos with Cloudinary URLs from the Players collection (matched by mobile number). Continue?')) {
      return;
    }

    setSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncTournamentPhotosWithPlayers(id);
      setSyncResult(result);

      if (result.success && result.synced > 0) {
        // Reload data to show updated photos
        await loadData();
      }
    } catch (error) {
      console.error('Error syncing photos:', error);
      setSyncResult({
        success: false,
        error: error.message
      });
    } finally {
      setSyncing(false);
    }
  };

  const handleDownloadExcel = () => {
    if (filteredRegistrations.length === 0) {
      alert('No registrations to download');
      return;
    }

    // Prepare CSV data
    const headers = ['S.No', 'Name', 'Mobile', 'Date of Birth', 'Blood Group', 'Place', 'Position', 'Registered On'];

    const rows = filteredRegistrations.map((reg, index) => [
      index + 1,
      reg.name,
      reg.mobile,
      reg.dateOfBirth ? new Date(reg.dateOfBirth).toLocaleDateString() : 'N/A',
      reg.bloodGroup || 'N/A',
      reg.place,
      reg.position,
      reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : 'N/A',
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape commas and quotes in cell values
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${tournament.name}_Registrations_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const makeCircularImage = (imageDataUrl) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 100;
        canvas.height = 100;

        // White background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 100, 100);

        // Clip to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(50, 50, 45, 0, Math.PI * 2);
        ctx.clip();

        // Draw cropped image (center square)
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 5, 5, 90, 90);
        ctx.restore();

        // Blue border
        ctx.strokeStyle = '#667EEA';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(50, 50, 47, 0, Math.PI * 2);
        ctx.stroke();

        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageDataUrl;
    });
  };

  const handleDownloadPDF = async () => {
    if (filteredRegistrations.length === 0) {
      alert('No registrations to download');
      return;
    }

    try {
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

      // Process all photos to circular bordered images
      const circularPhotos = await Promise.all(
        filteredRegistrations.map(async (reg) => {
          if (reg.photo && reg.photo.trim()) {
            try {
              return await makeCircularImage(reg.photo);
            } catch (e) {
              return null;
            }
          }
          return null;
        })
      );

      const tableData = filteredRegistrations.map((reg, index) => [
        index + 1,
        '', // Photo column
        reg.name,
        reg.mobile,
        reg.bloodGroup || 'N/A',
        reg.place,
        reg.position,
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['S.No', 'Photo', 'Name', 'Mobile', 'Blood Group', 'Place', 'Position']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 2,
          minCellHeight: 16,
          valign: 'middle',
          halign: 'center',
        },
        headStyles: {
          fillColor: [102, 126, 234],
          halign: 'center',
          valign: 'middle',
          fontSize: 7,
        },
        columnStyles: {
          0: { cellWidth: 12, halign: 'center' },  // S.No - reduced
          1: { cellWidth: 16, halign: 'center' },  // Photo - reduced
          2: { cellWidth: 35, halign: 'center' },  // Name - increased
          3: { cellWidth: 28, halign: 'center' },  // Mobile - increased
          4: { cellWidth: 28, halign: 'center' },  // Blood Group - increased
          5: { cellWidth: 30, halign: 'center' },  // Place - increased
          6: { cellWidth: 40, halign: 'center' },  // Position - increased
        },
        didDrawCell: (data) => {
          if (data.column.index === 1 && data.cell.section === 'body') {
            const photo = circularPhotos[data.row.index];
            if (photo) {
              try {
                const size = 12;
                const x = data.cell.x + (data.cell.width - size) / 2;
                const y = data.cell.y + (data.cell.height - size) / 2;
                doc.addImage(photo, 'JPEG', x, y, size, size);
              } catch (e) {
                console.error('Photo error:', e);
              }
            }
          }
        },
      });

      const filename = `${tournament.name}_Registrations_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('PDF error:', error);
      alert('Error generating PDF');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredRegistrations = registrations.filter((reg) =>
    reg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
    reg.mobile.includes(searchTerm)
  );

  if (loading) return <LoadingSpinner />;
  if (!tournament) return <div>Loading...</div>;

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
            <button
              onClick={handleSyncPhotos}
              className="btn-download btn-sync"
              disabled={syncing}
              title="Replace base64 photos with Cloudinary URLs from Players collection"
            >
              {syncing ? '⏳ Syncing...' : '🔄 Sync Photos'}
            </button>
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

        {/* Sync Result Display */}
        {syncResult && (
          <div className={`sync-result ${syncResult.success ? 'sync-success' : 'sync-error'}`}>
            <div className="sync-result-header">
              <h4>{syncResult.success ? '✅ Photo Sync Complete!' : '❌ Sync Failed'}</h4>
              <button onClick={() => setSyncResult(null)} className="btn-close-sync">×</button>
            </div>
            {syncResult.success ? (
              <div className="sync-result-body">
                <p><strong>Total registrations:</strong> {syncResult.total}</p>
                <p><strong>Photos synced:</strong> {syncResult.synced}</p>
                <p><strong>Skipped:</strong> {syncResult.skipped} (already using Cloudinary or no match)</p>
                {syncResult.failed > 0 && <p><strong>Failed:</strong> {syncResult.failed}</p>}
                <p><strong>Duration:</strong> {syncResult.duration}</p>
              </div>
            ) : (
              <div className="sync-result-body">
                <p>Error: {syncResult.error}</p>
              </div>
            )}
          </div>
        )}

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
                    <img
                      src={reg.photo}
                      alt={reg.name}
                      onError={(e) => {
                        // If image fails to load, show placeholder
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<div class="avatar-placeholder">${reg.name.charAt(0).toUpperCase()}</div>`;
                      }}
                    />
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
                    className="btn-icon btn-edit"
                    title="Edit Registration"
                    onClick={() => handleEditClick(reg)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
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

      {/* Edit Registration Modal */}
      {editModal.show && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Registration</h3>
            </div>
            <div className="modal-body">
              <form className="edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-name">Name *</label>
                    <input
                      type="text"
                      id="edit-name"
                      name="name"
                      value={editFormData.name || ''}
                      onChange={handleEditFormChange}
                      placeholder="Enter player name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-mobile">Mobile *</label>
                    <input
                      type="tel"
                      id="edit-mobile"
                      name="mobile"
                      value={editFormData.mobile || ''}
                      onChange={handleEditFormChange}
                      placeholder="Enter mobile number"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-place">Place *</label>
                    <input
                      type="text"
                      id="edit-place"
                      name="place"
                      value={editFormData.place || ''}
                      onChange={handleEditFormChange}
                      placeholder="Enter place"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-dateOfBirth">Date of Birth</label>
                    <input
                      type="date"
                      id="edit-dateOfBirth"
                      name="dateOfBirth"
                      value={editFormData.dateOfBirth || ''}
                      onChange={handleEditFormChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="edit-bloodGroup">Blood Group</label>
                    <select
                      id="edit-bloodGroup"
                      name="bloodGroup"
                      value={editFormData.bloodGroup || ''}
                      onChange={handleEditFormChange}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="edit-position">Position *</label>
                    <select
                      id="edit-position"
                      name="position"
                      value={editFormData.position || ''}
                      onChange={handleEditFormChange}
                      required
                    >
                      <option value="">Select Position</option>
                      {POSITIONS.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancelEdit} disabled={saving}>
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveEdit} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TournamentRegistrations;
