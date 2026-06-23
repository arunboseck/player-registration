import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournamentById, getTournamentRegistrations, deleteRegistration, updateRegistration } from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import './Players.css';
import './TournamentRegistrations.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const POSITIONS = ['BATSMAN', 'BOWLER', 'ALL ROUNDER', 'WICKET KEEPER'];

const TournamentRegistrations = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModal, setDeleteModal] = useState({ show: false, registration: null });
  const [bulkDeleteModal, setBulkDeleteModal] = useState({ show: false, count: 0 });
  const [editModal, setEditModal] = useState({ show: false, registration: null });
  const [loading, setLoading] = useState(true);
  const [selectedRegistrations, setSelectedRegistrations] = useState([]);
  const [saving, setSaving] = useState(false);
  const { modalState, hideModal, showSuccess, showError } = useModal();
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);
  const [imageModal, setImageModal] = useState({ show: false, image: null, name: '' });

  useEffect(() => {
    loadData();
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
      alert('Error loading tournament data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageClick = (photo, name) => {
    setImageModal({ show: true, image: photo, name });
  };

  const handleCloseImageModal = () => {
    setImageModal({ show: false, image: null, name: '' });
  };

  const handleDeleteClick = (registration) => {
    setDeleteModal({ show: true, registration });
  };

  const handleConfirmDelete = async () => {
    if (deleteModal.registration) {
      try {
        // Delete from Firebase
        await deleteRegistration(id, deleteModal.registration.id);
        // Reload data
        await loadData();
        // Close modal
        setDeleteModal({ show: false, registration: null });
      } catch (error) {
        console.error('Error deleting registration:', error);
        alert('Failed to delete registration. Please try again.');
      }
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ show: false, registration: null });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRegistrations(filteredRegistrations.map(reg => reg.id));
    } else {
      setSelectedRegistrations([]);
    }
  };

  const handleSelectOne = (registrationId) => {
    setSelectedRegistrations(prev => {
      if (prev.includes(registrationId)) {
        return prev.filter(id => id !== registrationId);
      } else {
        return [...prev, registrationId];
      }
    });
  };

  const handleBulkDeleteClick = () => {
    if (selectedRegistrations.length === 0) {
      alert('Please select at least one registration to delete');
      return;
    }
    setBulkDeleteModal({ show: true, count: selectedRegistrations.length });
  };

  const handleConfirmBulkDelete = async () => {
    try {
      // Delete all selected registrations
      for (const registrationId of selectedRegistrations) {
        await deleteRegistration(id, registrationId);
      }

      // Reload data
      await loadData();

      // Clear selection
      setSelectedRegistrations([]);

      // Close modal
      setBulkDeleteModal({ show: false, count: 0 });

      alert(`Successfully deleted ${selectedRegistrations.length} registration(s)`);
    } catch (error) {
      console.error('Error deleting registrations:', error);
      alert('Failed to delete some registrations. Please try again.');
    }
  };

  const handleCancelBulkDelete = () => {
    setBulkDeleteModal({ show: false, count: 0 });
  };

  const handleEditClick = (registration) => {
    // Parse DOB
    let dobParts = { day: '', month: '', year: '' };
    if (registration.dateOfBirth) {
      const date = new Date(registration.dateOfBirth);
      dobParts = {
        day: String(date.getDate()).padStart(2, '0'),
        month: String(date.getMonth() + 1).padStart(2, '0'),
        year: String(date.getFullYear())
      };
    }

    setEditModal({
      show: true,
      registration: {
        ...registration,
        dob: dobParts
      }
    });
  };

  const handleEditChange = (field, value) => {
    setEditModal(prev => ({
      ...prev,
      registration: {
        ...prev.registration,
        [field]: value
      }
    }));
  };

  const handleDobChange = (field, value) => {
    // Only allow numbers
    if (value && !/^\d*$/.test(value)) return;

    let newValue = value;
    let maxLength = 2;
    let maxValue = 31;

    if (field === 'day') {
      maxLength = 2;
      maxValue = 31;
      if (value.length === 2 && parseInt(value) > maxValue) {
        newValue = String(maxValue);
      }
    } else if (field === 'month') {
      maxLength = 2;
      maxValue = 12;
      if (value.length === 2 && parseInt(value) > maxValue) {
        newValue = String(maxValue);
      }
    } else if (field === 'year') {
      maxLength = 4;
    }

    if (newValue.length > maxLength) return;

    setEditModal(prev => ({
      ...prev,
      registration: {
        ...prev.registration,
        dob: {
          ...prev.registration.dob,
          [field]: newValue
        }
      }
    }));

    // Auto-focus next field
    if (field === 'day' && newValue.length === 2) {
      monthRef.current?.focus();
    } else if (field === 'month' && newValue.length === 2) {
      yearRef.current?.focus();
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditModal(prev => ({
          ...prev,
          registration: {
            ...prev.registration,
            photo: reader.result
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEdit = async () => {
    const reg = editModal.registration;

    // Validate required fields
    if (!reg.name || !reg.mobile || !reg.place || !reg.position) {
      await showError('Please fill in all required fields');
      return;
    }

    // Validate DOB
    if (!reg.dob.day || !reg.dob.month || !reg.dob.year) {
      await showError('Please enter a valid date of birth');
      return;
    }

    // Validate photo
    if (!reg.photo) {
      await showError('Player photo is required');
      return;
    }

    setSaving(true);

    try {
      // Format DOB
      const dateOfBirth = `${reg.dob.year}-${reg.dob.month.padStart(2, '0')}-${reg.dob.day.padStart(2, '0')}`;

      const updatedData = {
        name: reg.name,
        mobile: reg.mobile,
        dateOfBirth,
        bloodGroup: reg.bloodGroup,
        place: reg.place,
        position: reg.position,
        photo: reg.photo
      };

      const result = await updateRegistration(id, reg.id, updatedData);

      if (result.success) {
        await loadData();
        setEditModal({ show: false, registration: null });
        await showSuccess(result.message);
      } else {
        await showError(result.message);
      }
    } catch (error) {
      console.error('Error saving registration:', error);
      await showError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditModal({ show: false, registration: null });
  };

  const handleDownloadCSV = () => {
    if (filteredRegistrations.length === 0) {
      alert('No registrations to download');
      return;
    }

    // Prepare CSV data
    const csvData = filteredRegistrations.map((reg, index) => ({
      'S.No': index + 1,
      'Name': reg.name,
      'Mobile': reg.mobile,
      'Date of Birth': reg.dateOfBirth ? new Date(reg.dateOfBirth).toLocaleDateString() : 'N/A',
      'Blood Group': reg.bloodGroup || 'N/A',
      'Place': reg.place,
      'Position': reg.position,
      'Registered On': reg.registeredAt ? new Date(reg.registeredAt).toLocaleString() : 'N/A',
    }));

    // Convert to CSV format
    const headers = Object.keys(csvData[0]);
    const csvRows = [];

    // Add headers
    csvRows.push(headers.join(','));

    // Add data rows
    csvData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvRows.push(values.join(','));
    });

    // Create CSV content
    const csvContent = csvRows.join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const filename = `${tournament.name}_Registrations_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to resize and crop image to circular 80x80px (maintains aspect ratio)
  const resizeImage = (base64Str, size = 80) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // Calculate dimensions to crop to square (center crop)
        const imgAspect = img.width / img.height;
        let sx, sy, sWidth, sHeight;

        if (imgAspect > 1) {
          // Landscape: crop width
          sHeight = img.height;
          sWidth = img.height; // Make it square
          sx = (img.width - sWidth) / 2; // Center horizontally
          sy = 0;
        } else {
          // Portrait or square: crop height
          sWidth = img.width;
          sHeight = img.width; // Make it square
          sx = 0;
          sy = (img.height - sHeight) / 2; // Center vertically
        }

        // Fill with white background first
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);

        // Create circular clipping path
        ctx.save();
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        // Draw cropped and resized image (will be clipped to circle)
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, size, size);

        ctx.restore();

        // Optional: Add circular border
        ctx.strokeStyle = '#667eea'; // Purple border matching theme
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
        ctx.stroke();

        // Use 92% quality for better clarity
        resolve(canvas.toDataURL('image/jpeg', 0.92));
      };
      img.onerror = () => resolve(null);
      img.src = base64Str;
    });
  };

  const handleDownloadPDF = async () => {
    if (filteredRegistrations.length === 0) {
      alert('No registrations to download');
      return;
    }

    try {
      // Show loading indicator
      const originalButton = document.querySelector('.btn-pdf');
      if (originalButton) {
        originalButton.disabled = true;
        originalButton.textContent = '⏳ Generating PDF...';
      }

      // Resize all images first
      const resizedRegistrations = await Promise.all(
        filteredRegistrations.map(async (reg) => {
          if (reg.photo) {
            const resizedPhoto = await resizeImage(reg.photo);
            return { ...reg, resizedPhoto };
          }
          return reg;
        })
      );

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

      // Prepare table data
      const tableData = resizedRegistrations.map((reg, index) => [
        index + 1,
        '', // Photo will be added in didDrawCell
        reg.name,
        reg.mobile,
        reg.dateOfBirth ? new Date(reg.dateOfBirth).toLocaleDateString() : 'N/A',
        reg.bloodGroup || 'N/A',
        reg.place,
        reg.position,
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['S.No', 'Photo', 'Name', 'Mobile', 'DOB', 'Blood Group', 'Place', 'Position']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
          minCellHeight: 18, // Increased for better photo display
        },
        headStyles: {
          fillColor: [102, 126, 234],
          fontSize: 9,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' }, // S.No
          1: { cellWidth: 18, halign: 'center', valign: 'middle' }, // Photo (increased width)
          2: { cellWidth: 30 }, // Name
          3: { cellWidth: 25 }, // Mobile
          4: { cellWidth: 22 }, // DOB
          5: { cellWidth: 18, halign: 'center' }, // Blood Group
          6: { cellWidth: 25 }, // Place
          7: { cellWidth: 28 }, // Position
        },
        didDrawCell: (data) => {
          // Add photos to the Photo column (column index 1)
          if (data.column.index === 1 && data.cell.section === 'body') {
            const reg = resizedRegistrations[data.row.index];
            if (reg.resizedPhoto) {
              try {
                const cellX = data.cell.x + 2.5;
                const cellY = data.cell.y + 2;
                const imgSize = 13; // 13mm for better visibility

                doc.addImage(reg.resizedPhoto, 'JPEG', cellX, cellY, imgSize, imgSize);
              } catch (error) {
                console.error('Error adding image to PDF:', error);
              }
            }
          }
        },
        margin: { top: 45 },
      });

      const filename = `${tournament.name}_Registrations_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);

      // Reset button
      if (originalButton) {
        originalButton.disabled = false;
        originalButton.textContent = '📄 Download PDF';
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');

      // Reset button on error
      const originalButton = document.querySelector('.btn-pdf');
      if (originalButton) {
        originalButton.disabled = false;
        originalButton.textContent = '📄 Download PDF';
      }
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

  if (loading || !tournament) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="cricket-ball-loader">
            <div className="ball">
              <div className="seam"></div>
              <div className="seam seam-2"></div>
            </div>
          </div>
          <h2 className="loading-text">Loading Tournament Registrations</h2>
          <p className="loading-subtext">Please wait while we fetch the player data...</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

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
            <button onClick={handleDownloadCSV} className="btn-download btn-csv">
              📊 Download CSV
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
            {selectedRegistrations.length > 0 && (
              <button
                onClick={handleBulkDeleteClick}
                className="btn-bulk-delete"
                title={`Delete ${selectedRegistrations.length} selected registration(s)`}
              >
                🗑️ Delete Selected ({selectedRegistrations.length})
              </button>
            )}
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
            <div className="select-all-bar">
              <label>
                <input
                  type="checkbox"
                  checked={selectedRegistrations.length === filteredRegistrations.length && filteredRegistrations.length > 0}
                  onChange={handleSelectAll}
                />
                <span>Select All ({filteredRegistrations.length})</span>
              </label>
            </div>
            {filteredRegistrations.map((reg, index) => (
              <div key={reg.id} className="registration-card">
                <div className="registration-checkbox">
                  <input
                    type="checkbox"
                    id={`player-${reg.id}`}
                    checked={selectedRegistrations.includes(reg.id)}
                    onChange={() => handleSelectOne(reg.id)}
                  />
                </div>

                <div className="registration-avatar">
                  {reg.photo ? (
                    <img src={reg.photo} alt={reg.name} onClick={() => handleImageClick(reg.photo, reg.name)} style={{ cursor: 'pointer' }} title="Click to view full image" />
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
                </div>

                <div className="registration-actions">
                  <button
                    className="btn-icon btn-view"
                    title="View/Edit Details"
                    onClick={() => handleEditClick(reg)}
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

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteModal.show && (
        <div className="modal-overlay" onClick={handleCancelBulkDelete}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🗑️ Bulk Delete Registrations</h3>
            </div>
            <div className="modal-body">
              <p>Are you sure you want to delete <strong>{bulkDeleteModal.count}</strong> selected registration(s)?</p>
              <div className="warning-box">
                <p className="warning-text">⚠️ This action cannot be undone!</p>
                <p className="warning-subtext">All selected registrations will be permanently deleted.</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancelBulkDelete}>
                Cancel
              </button>
              <button className="btn-confirm-delete" onClick={handleConfirmBulkDelete}>
                Delete {bulkDeleteModal.count} Registration(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.show && editModal.registration && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal-content edit-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✏️ Edit Registration</h3>
            </div>
            <div className="modal-body">
              <div className="edit-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={editModal.registration.name}
                      onChange={(e) => handleEditChange('name', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Mobile *</label>
                    <input
                      type="tel"
                      value={editModal.registration.mobile}
                      onChange={(e) => handleEditChange('mobile', e.target.value)}
                      maxLength="10"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Place *</label>
                    <input
                      type="text"
                      value={editModal.registration.place}
                      onChange={(e) => handleEditChange('place', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth (DD/MM/YYYY) *</label>
                    <div className="date-input-group">
                      <input
                        ref={dayRef}
                        type="text"
                        placeholder="DD"
                        value={editModal.registration.dob.day}
                        onChange={(e) => handleDobChange('day', e.target.value)}
                        maxLength="2"
                        required
                      />
                      <span>/</span>
                      <input
                        ref={monthRef}
                        type="text"
                        placeholder="MM"
                        value={editModal.registration.dob.month}
                        onChange={(e) => handleDobChange('month', e.target.value)}
                        maxLength="2"
                        required
                      />
                      <span>/</span>
                      <input
                        ref={yearRef}
                        type="text"
                        placeholder="YYYY"
                        value={editModal.registration.dob.year}
                        onChange={(e) => handleDobChange('year', e.target.value)}
                        maxLength="4"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Blood Group *</label>
                    <select
                      value={editModal.registration.bloodGroup}
                      onChange={(e) => handleEditChange('bloodGroup', e.target.value)}
                      required
                    >
                      <option value="">Select Blood Group</option>
                      {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Position *</label>
                    <select
                      value={editModal.registration.position}
                      onChange={(e) => handleEditChange('position', e.target.value)}
                      required
                    >
                      <option value="">Select Position</option>
                      {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Player Photo *</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} />
                  {editModal.registration.photo && (
                    <div className="photo-preview">
                      <img src={editModal.registration.photo} alt="Preview" />
                      <span className="photo-uploaded">✓ Photo uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={handleCancelEdit} disabled={saving}>
                Cancel
              </button>
              <button className="btn-confirm-save" onClick={handleSaveEdit} disabled={saving}>
                {saving ? '⏳ Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

            {/* Image Modal */}
      {imageModal.show && (
        <div className="modal-overlay" onClick={handleCloseImageModal}>
          <div className="modal-content image-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal-topright" onClick={handleCloseImageModal}>
              ✕
            </button>
            <div className="modal-header">
              <h3>📷 {imageModal.name}</h3>
            </div>
            <div className="modal-body image-modal-body">
              <img src={imageModal.image} alt={imageModal.name} className="full-size-image" />
            </div>
          </div>
        </div>
      )}

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

export default TournamentRegistrations;
