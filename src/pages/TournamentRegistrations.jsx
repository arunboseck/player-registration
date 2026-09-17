import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournamentById, getTournamentRegistrations, deleteRegistration, updateRegistration, syncTournamentPhotosWithPlayers, syncTournamentPlayersToMainModule, uploadPhotoToStorage, getPlayerByMobile, updatePlayer } from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../utils/userManagement';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { removeBackground } from '@imgly/background-removal';
import LoadingSpinner from '../components/LoadingSpinner';

// Small inline brand-colored icons for the header action buttons (avoids
// pulling in an icon library just for six fixed glyphs). Self-colored so
// they read on their own with no button background behind them.
const PdfIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#fef2f2" stroke="#ef4444" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M14 2v6h6" stroke="#ef4444" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
    <text x="12" y="18" textAnchor="middle" fontSize="7" fontWeight="700" fill="#ef4444">PDF</text>
  </svg>
);

const ExcelIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#f0fdf4" stroke="#10b981" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M14 2v6h6" stroke="#10b981" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
    <text x="12" y="18" textAnchor="middle" fontSize="6" fontWeight="700" fill="#10b981">XLS</text>
  </svg>
);

const ZipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2h9l5 5v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#fffbeb" stroke="#f59e0b" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M15 2v5h5" stroke="#f59e0b" strokeWidth="1.4" strokeLinejoin="round" fill="none" />
    <rect x="10" y="6" width="3" height="2" fill="#f59e0b" />
    <rect x="10" y="10" width="3" height="2" fill="#f59e0b" />
    <rect x="10" y="14" width="3" height="2" fill="#f59e0b" />
  </svg>
);

const SyncPlayersIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="9" cy="8" r="3" fill="#7c3aed" />
    <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" fill="#7c3aed" />
    <circle cx="17" cy="9" r="2.5" fill="#c4b5fd" />
    <path d="M14 20c0-2.5 1.8-4.5 4-4.8" fill="#c4b5fd" />
  </svg>
);

const RawPhotosIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="14" rx="2" fill="#eff6ff" stroke="#3b82f6" strokeWidth="1.4" />
    <circle cx="8" cy="9.5" r="1.7" fill="#3b82f6" />
    <path d="M4 16l5-4 3 2.5 4-3.5 4 4" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

const SyncPhotosIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M4 12a8 8 0 0 1 13.7-5.7L20 8M20 12a8 8 0 0 1-13.7 5.7L4 16"
      stroke="#7c3aed"
      strokeWidth="2"
      strokeLinecap="round"
      fill="none"
    />
    <path d="M20 4v4h-4M4 20v-4h4" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);
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
  const { logout, user } = useAuth();
  const isOrganizer = user?.role === ROLES.TOURNAMENT_ORGANIZER;
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
  const [syncingPlayers, setSyncingPlayers] = useState(false);
  const [playerSyncResult, setPlayerSyncResult] = useState(null);
  const [photoModal, setPhotoModal] = useState({ show: false, photo: null, name: '' });
  const [downloadingPhotos, setDownloadingPhotos] = useState(false);
  const [photoZipProgress, setPhotoZipProgress] = useState({ current: 0, total: 0 });
  const [downloadingRawPhotos, setDownloadingRawPhotos] = useState(false);
  const [rawPhotoZipProgress, setRawPhotoZipProgress] = useState({ current: 0, total: 0 });

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
      photo: registration.photo || null,
      newPhoto: null, // For new uploaded photo
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

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({
          ...prev,
          newPhoto: reader.result // base64
        }));
      };
      reader.readAsDataURL(file);
    }
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
      let photoURL = editFormData.photo; // Keep existing photo by default

      // If new photo uploaded, upload to Cloudinary
      if (editFormData.newPhoto) {
        console.log('📤 Uploading new photo to Cloudinary...');
        const tempId = `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        photoURL = await uploadPhotoToStorage(editFormData.newPhoto, tempId);
        console.log('✅ Photo uploaded to Cloudinary:', photoURL);
      }

      // Prepare updated data
      const updatedData = {
        name: editFormData.name,
        mobile: editFormData.mobile,
        place: editFormData.place,
        dateOfBirth: editFormData.dateOfBirth,
        bloodGroup: editFormData.bloodGroup,
        position: editFormData.position,
        photo: photoURL
      };

      // Update tournament registration
      const result = await updateRegistration(id, editModal.registration.id, updatedData);

      if (result.success) {
        // Also update player in global players list (by mobile number)
        console.log('🔄 Updating player in global list...');
        try {
          const player = await getPlayerByMobile(editFormData.mobile.trim());
          if (player && player.id) {
            await updatePlayer(player.id, updatedData);
            console.log('✅ Player updated in global list');
          } else {
            console.log('⚠️ Player not found in global list, skipping update');
          }
        } catch (playerError) {
          console.error('Error updating player:', playerError);
          // Don't fail the whole operation if player update fails
        }

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

  const handleSyncPlayersToModule = async () => {
    setSyncingPlayers(true);
    setPlayerSyncResult(null);

    try {
      const result = await syncTournamentPlayersToMainModule(id);
      setPlayerSyncResult(result);

      // Auto-hide success message after 5 seconds
      if (result.success && result.added === 0) {
        setTimeout(() => {
          setPlayerSyncResult(null);
        }, 5000);
      }
    } catch (error) {
      console.error('Error syncing players:', error);
      setPlayerSyncResult({
        success: false,
        error: error.message,
        added: 0,
        skipped: 0,
        failed: 0
      });
    } finally {
      setSyncingPlayers(false);
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

  const handlePhotoClick = (photo, name) => {
    if (photo) {
      setPhotoModal({ show: true, photo, name });
    }
  };

  const handleClosePhotoModal = () => {
    setPhotoModal({ show: false, photo: null, name: '' });
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
      // Add crossOrigin attribute to allow canvas export with external images (Cloudinary)
      img.crossOrigin = 'anonymous';

      // Set timeout to prevent hanging on slow/broken images
      const timeout = setTimeout(() => {
        reject(new Error('Image load timeout'));
      }, 10000); // 10 second timeout

      img.onload = () => {
        clearTimeout(timeout);
        try {
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
        } catch (error) {
          console.error('Canvas error:', error);
          reject(error);
        }
      };

      img.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load image'));
      };

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

  // Standard passport/ID-photo proportions (35mm x 45mm => ~0.778 width/height).
  const PASSPORT_ASPECT = 35 / 45;
  const PASSPORT_OUTPUT_WIDTH = 413; // ~35mm at ~300dpi
  const PASSPORT_OUTPUT_HEIGHT = 531; // ~45mm at ~300dpi

  // Crops a photo down to a passport-style head-and-shoulders portrait
  // (35:45 aspect ratio, not a plain square).
  // Close-up portraits are center-cropped to that aspect (biased slightly
  // upward, since a face usually sits above the vertical center of a
  // headshot-style photo). Long / full-body shots take just the top portion
  // of the frame instead, since the head is almost always up there.
  const cropToHeadshot = async (imageUrl, outputWidth = PASSPORT_OUTPUT_WIDTH, outputHeight = PASSPORT_OUTPUT_HEIGHT) => {
    // Load the photo as a same-origin blob URL first. Drawing directly from
    // a remote URL (even with crossOrigin="anonymous") taints the canvas if
    // the response is missing the right CORS headers, which makes
    // canvas.toBlob() fail silently and drops the player from the ZIP.
    // A blob: URL is always same-origin for canvas purposes once fetched.
    let objectUrl;
    if (imageUrl.startsWith('data:')) {
      objectUrl = imageUrl;
    } else {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error(`Failed to fetch photo (${res.status})`);
      const blob = await res.blob();
      objectUrl = URL.createObjectURL(blob);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();

      const cleanup = () => {
        clearTimeout(timeout);
        if (objectUrl !== imageUrl) URL.revokeObjectURL(objectUrl);
      };

      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Image load timeout'));
      }, 15000);

      img.onload = () => {
        cleanup();
        try {
          const { width, height } = img;
          const aspect = outputWidth / outputHeight;
          const isLongShot = height > width * 1.3;

          let cropW;
          let cropH;
          let cropX;
          let cropY;

          if (isLongShot) {
            // Full-body / long shot: take just the head & shoulders from the
            // top of the frame, sized to the passport aspect ratio.
            cropH = height * 0.45;
            cropW = cropH * aspect;
            if (cropW > width) {
              cropW = width;
              cropH = cropW / aspect;
            }
            cropX = (width - cropW) / 2;
            cropY = height * 0.02; // small margin so the very top edge isn't clipped
          } else {
            // Close-up / headshot-style photo: crop the largest region that
            // matches the passport aspect ratio, biased toward the top where
            // the face typically is.
            if (width / height > aspect) {
              cropH = height;
              cropW = height * aspect;
            } else {
              cropW = width;
              cropH = width / aspect;
            }
            cropX = (width - cropW) / 2;
            cropY = Math.max(0, (height - cropH) * 0.15);
          }

          const canvas = document.createElement('canvas');
          canvas.width = outputWidth;
          canvas.height = outputHeight;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, outputWidth, outputHeight);
          ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, outputWidth, outputHeight);

          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create cropped image'));
            },
            'image/jpeg',
            0.92
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        cleanup();
        reject(new Error('Failed to load image'));
      };

      img.src = objectUrl;
    });
  };

  const handleDownloadPhotosZip = async () => {
    const withPhotos = filteredRegistrations.filter((reg) => reg.photo && reg.photo.trim());

    if (withPhotos.length === 0) {
      alert('No player photos available to download');
      return;
    }

    setDownloadingPhotos(true);
    setPhotoZipProgress({ current: 0, total: withPhotos.length });
    try {
      const zip = new JSZip();
      const usedNames = new Map();
      let failedCount = 0;

      for (let i = 0; i < withPhotos.length; i++) {
        const reg = withPhotos[i];
        try {
          const croppedBlob = await cropToHeadshot(reg.photo);

          // Background removal runs an ML model in the browser and can fail
          // (model fetch blocked, CORS, out of memory, etc). Don't let that
          // drop the player from the ZIP entirely — fall back to the cropped
          // (background intact) photo so every player still gets a file.
          let finalBlob = croppedBlob;
          let extension = 'jpg';
          try {
            finalBlob = await removeBackground(croppedBlob);
            extension = 'png';
          } catch (bgError) {
            console.error(`Background removal failed for ${reg.name}, using cropped photo instead:`, bgError);
          }

          // Sanitize name for use as a filename
          const baseName = (reg.name || 'player').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_') || 'player';

          // Avoid overwriting files with duplicate player names
          const count = usedNames.get(baseName) || 0;
          usedNames.set(baseName, count + 1);
          const filename = count === 0 ? `${baseName}.${extension}` : `${baseName}_${count + 1}.${extension}`;

          zip.file(filename, finalBlob);
        } catch (photoError) {
          console.error(`Error processing photo for ${reg.name}:`, photoError);
          failedCount += 1;
        } finally {
          setPhotoZipProgress({ current: i + 1, total: withPhotos.length });
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(zipBlob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${tournament.name}_Player_Photos_${new Date().toISOString().split('T')[0]}.zip`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (failedCount > 0) {
        alert(`Downloaded photos ZIP, but ${failedCount} photo(s) could not be processed and were skipped.`);
      }
    } catch (error) {
      console.error('Error creating photos ZIP:', error);
      alert('Error downloading player photos');
    } finally {
      setDownloadingPhotos(false);
      setPhotoZipProgress({ current: 0, total: 0 });
    }
  };

  const getExtensionFromMime = (mimeType) => {
    if (!mimeType) return 'jpg';
    if (mimeType.includes('png')) return 'png';
    if (mimeType.includes('webp')) return 'webp';
    if (mimeType.includes('gif')) return 'gif';
    return 'jpg';
  };

  const fetchPhotoBlob = async (photo) => {
    const res = await fetch(photo);
    if (!res.ok) throw new Error(`Failed to fetch photo (${res.status})`);
    return res.blob();
  };

  // Downloads every player's original photo as-is (no crop, no background
  // removal) into a single ZIP, named after each player.
  const handleDownloadRawPhotosZip = async () => {
    const withPhotos = filteredRegistrations.filter((reg) => reg.photo && reg.photo.trim());

    if (withPhotos.length === 0) {
      alert('No player photos available to download');
      return;
    }

    setDownloadingRawPhotos(true);
    setRawPhotoZipProgress({ current: 0, total: withPhotos.length });
    try {
      const zip = new JSZip();
      const usedNames = new Map();
      let failedCount = 0;

      for (let i = 0; i < withPhotos.length; i++) {
        const reg = withPhotos[i];
        try {
          const blob = await fetchPhotoBlob(reg.photo);
          const extension = getExtensionFromMime(blob.type);

          // Sanitize name for use as a filename
          const baseName = (reg.name || 'player').trim().replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, '_') || 'player';

          // Avoid overwriting files with duplicate player names
          const count = usedNames.get(baseName) || 0;
          usedNames.set(baseName, count + 1);
          const filename = count === 0 ? `${baseName}.${extension}` : `${baseName}_${count + 1}.${extension}`;

          zip.file(filename, blob);
        } catch (photoError) {
          console.error(`Error fetching photo for ${reg.name}:`, photoError);
          failedCount += 1;
        } finally {
          setRawPhotoZipProgress({ current: i + 1, total: withPhotos.length });
        }
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(zipBlob);

      link.setAttribute('href', url);
      link.setAttribute('download', `${tournament.name}_Player_Photos_Original_${new Date().toISOString().split('T')[0]}.zip`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      if (failedCount > 0) {
        alert(`Downloaded photos ZIP, but ${failedCount} photo(s) could not be fetched and were skipped.`);
      }
    } catch (error) {
      console.error('Error creating photos ZIP:', error);
      alert('Error downloading player photos');
    } finally {
      setDownloadingRawPhotos(false);
      setRawPhotoZipProgress({ current: 0, total: 0 });
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
            {!isOrganizer && (
              <>
                <button
                  onClick={handleSyncPlayersToModule}
                  className="btn-download btn-sync-players btn-icon-only"
                  disabled={syncingPlayers}
                  title={syncingPlayers ? 'Syncing players…' : 'Sync to Player Module — add missing players to main player module'}
                >
                  {syncingPlayers ? <span className="btn-spinner"></span> : <SyncPlayersIcon />}
                </button>
                <button
                  onClick={handleSyncPhotos}
                  className="btn-download btn-sync btn-icon-only"
                  disabled={syncing}
                  title={syncing ? 'Syncing photos…' : 'Sync Photos — replace base64 photos with Cloudinary URLs from Players collection'}
                >
                  {syncing ? <span className="btn-spinner"></span> : <SyncPhotosIcon />}
                </button>
              </>
            )}
            <button onClick={handleDownloadPDF} className="btn-download btn-pdf btn-icon-only" title="Download PDF">
              <PdfIcon />
            </button>
            <button onClick={handleDownloadExcel} className="btn-download btn-excel btn-icon-only" title="Download Excel">
              <ExcelIcon />
            </button>
            <button
              onClick={handleDownloadRawPhotosZip}
              className="btn-download btn-photos-raw-zip btn-icon-only"
              disabled={downloadingRawPhotos}
              title={
                downloadingRawPhotos
                  ? `Downloading ${rawPhotoZipProgress.current}/${rawPhotoZipProgress.total}...`
                  : 'Download all original player photos as a ZIP file'
              }
            >
              {downloadingRawPhotos ? <span className="btn-spinner"></span> : <RawPhotosIcon />}
            </button>
            <button
              onClick={handleDownloadPhotosZip}
              className="btn-download btn-photos-zip btn-icon-only"
              disabled={downloadingPhotos}
              title={
                downloadingPhotos
                  ? `Processing ${photoZipProgress.current}/${photoZipProgress.total}...`
                  : 'Download all player photos, cropped to headshots with background removed, as a ZIP file'
              }
            >
              {downloadingPhotos ? <span className="btn-spinner"></span> : <ZipIcon />}
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

        {/* Player Sync Result Display */}
        {playerSyncResult && (
          <div className={`sync-result player-sync-result ${playerSyncResult.success ? 'sync-success' : 'sync-error'}`}>
            <div className="sync-result-header">
              <h4>
                {playerSyncResult.success ?
                  (playerSyncResult.added > 0 ? '✅ Player Sync Complete!' : 'ℹ️ All Players Already Exist')
                  : '❌ Sync Failed'}
              </h4>
              <button onClick={() => setPlayerSyncResult(null)} className="btn-close-sync">×</button>
            </div>
            {playerSyncResult.success ? (
              <div className="sync-result-body">
                <div className="sync-stats">
                  <div className="stat-item stat-success">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                      <div className="stat-number">{playerSyncResult.added}</div>
                      <div className="stat-label">New Players Added</div>
                    </div>
                  </div>
                  <div className="stat-item stat-info">
                    <div className="stat-icon">ℹ️</div>
                    <div className="stat-content">
                      <div className="stat-number">{playerSyncResult.skipped}</div>
                      <div className="stat-label">Already Exist</div>
                    </div>
                  </div>
                  {playerSyncResult.failed > 0 && (
                    <div className="stat-item stat-error">
                      <div className="stat-icon">❌</div>
                      <div className="stat-content">
                        <div className="stat-number">{playerSyncResult.failed}</div>
                        <div className="stat-label">Failed</div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="sync-summary">
                  <p><strong>Total Processed:</strong> {playerSyncResult.total} players</p>
                  <p><strong>Duration:</strong> {playerSyncResult.duration}</p>
                </div>
                {playerSyncResult.added > 0 && (
                  <div className="sync-success-message">
                    <span className="success-icon">🎉</span>
                    <span>Successfully added {playerSyncResult.added} new player{playerSyncResult.added > 1 ? 's' : ''} to the main player module!</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="sync-result-body sync-error-body">
                <div className="error-icon">⚠️</div>
                <p className="error-message">{playerSyncResult.error}</p>
              </div>
            )}
          </div>
        )}

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
                <div className="registration-serial">
                  <span className="serial-number">{index + 1}</span>
                </div>

                <div
                  className="registration-avatar"
                  onClick={() => handlePhotoClick(reg.photo, reg.name)}
                  style={{ cursor: reg.photo ? 'pointer' : 'default' }}
                  title={reg.photo ? 'Click to view full size' : ''}
                >
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

      {/* Photo Fullscreen Modal */}
      {photoModal.show && (
        <div className="modal-overlay" onClick={handleClosePhotoModal}>
          <div className="modal-content modal-photo-fullscreen" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-photo-modal" onClick={handleClosePhotoModal}>×</button>
            <div className="photo-modal-header">
              <h3>{photoModal.name}</h3>
            </div>
            <div className="photo-modal-body">
              <img src={photoModal.photo} alt={photoModal.name} className="fullscreen-photo" />
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

                {/* Player Photo */}
                <div className="form-group">
                  <label htmlFor="edit-photo">Player Photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                    {/* Current Photo Preview */}
                    {(editFormData.newPhoto || editFormData.photo) && (
                      <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '3px solid #667eea',
                        flexShrink: 0
                      }}>
                        <img
                          src={editFormData.newPhoto || editFormData.photo}
                          alt="Player"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}

                    {/* Upload Button */}
                    <div style={{ flex: 1 }}>
                      <input
                        type="file"
                        id="edit-photo"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        style={{ display: 'none' }}
                      />
                      <label
                        htmlFor="edit-photo"
                        style={{
                          display: 'inline-block',
                          padding: '0.75rem 1.5rem',
                          backgroundColor: '#667eea',
                          color: 'white',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#5568d3'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#667eea'}
                      >
                        📷 {editFormData.newPhoto ? 'Change Photo' : (editFormData.photo ? 'Update Photo' : 'Upload Photo')}
                      </label>
                      {editFormData.newPhoto && (
                        <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#22c55e' }}>
                          ✅ New photo selected
                        </p>
                      )}
                    </div>
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
