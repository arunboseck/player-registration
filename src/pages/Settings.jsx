import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getPlayers, getTournaments, getTournamentRegistrations } from '../utils/firebaseStorage';
import {
  exportDatabase,
  downloadBackup,
  validateBackup,
  getBackupStats,
  importDatabase,
  saveBackupToStorage,
  listBackupsFromStorage,
  deleteBackupFromStorage,
  downloadBackupFromStorage,
  loadBackupFromStorage
} from '../utils/firebaseBackup';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import './Settings.css';
import './Players.css';

const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backupPreview, setBackupPreview] = useState(null);
  const [uploadedBackup, setUploadedBackup] = useState(null);
  const [backupList, setBackupList] = useState([]);
  const [loadingBackups, setLoadingBackups] = useState(false);
  const [deletingBackup, setDeletingBackup] = useState(null);
  const { modalState, hideModal, showSuccess, showError, showConfirm } = useModal();

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await logout();
      navigate('/');
    }
  };

  useEffect(() => {
    loadDatabaseStats();
    loadBackupList();
  }, []);

  const loadDatabaseStats = async () => {
    try {
      setLoading(true);
      const players = await getPlayers();
      const tournaments = await getTournaments();

      let totalRegistrations = 0;
      for (const tournament of tournaments) {
        const regs = await getTournamentRegistrations(tournament.id);
        totalRegistrations += regs.length;
      }

      setDbStats({
        totalPlayers: players.length,
        totalTournaments: tournaments.length,
        totalRegistrations: totalRegistrations
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBackupList = async () => {
    try {
      setLoadingBackups(true);
      const backups = await listBackupsFromStorage();
      setBackupList(backups);
    } catch (error) {
      console.error('Error loading backup list:', error);
      // Don't show error modal, just log it
    } finally {
      setLoadingBackups(false);
    }
  };

  const handleExportDatabase = async () => {
    try {
      setExporting(true);
      const backup = await exportDatabase();

      // Save to Firebase Storage
      await saveBackupToStorage(backup);

      // Also download to user's device
      downloadBackup(backup);

      // Refresh backup list
      await loadBackupList();

      showSuccess('Database Exported Successfully!', `Backup saved to Firebase Storage and downloaded. ${backup.metadata.totalPlayers} players, ${backup.metadata.totalTournaments} tournaments, ${backup.metadata.totalRegistrations} registrations.`);
    } catch (error) {
      console.error('Export error:', error);
      showError('Export Failed', error.message);
    } finally {
      setExporting(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        const validation = validateBackup(backup);

        if (!validation.valid) {
          showError('Invalid Backup File', validation.errors.join('\n'));
          return;
        }

        setUploadedBackup(backup);
        const stats = getBackupStats(backup);
        setBackupPreview(stats);

        showSuccess('Backup File Loaded', `Valid backup file from ${stats.exported_at}`);
      } catch (error) {
        showError('Invalid File', 'Could not parse JSON file. Please upload a valid backup file.');
      }
    };
    reader.readAsText(file);
  };

  const handleRestoreDatabase = () => {
    if (!uploadedBackup) {
      showError('No Backup Selected', 'Please upload a backup file first.');
      return;
    }

    showConfirm(
      'Restore Database?',
      `This will restore the database from backup (${backupPreview.players} players, ${backupPreview.tournaments} tournaments, ${backupPreview.registrations} registrations). Current data will be merged with the backup. Continue?`,
      () => performRestore()
    );
  };

  const performRestore = async () => {
    try {
      setImporting(true);
      hideModal();

      // Create auto-backup before restore
      const currentBackup = await exportDatabase();
      await saveBackupToStorage(currentBackup);
      downloadBackup(currentBackup, `auto_backup_before_restore_${new Date().toISOString().slice(0, 10)}.json`);

      // Perform restore
      const result = await importDatabase(uploadedBackup, { mode: 'merge' });

      showSuccess('Database Restored Successfully!', `Imported ${result.imported.players} players, ${result.imported.tournaments} tournaments, and ${result.imported.registrations} registrations in ${result.duration}.`);

      // Reload stats and backup list
      loadDatabaseStats();
      loadBackupList();
      setUploadedBackup(null);
      setBackupPreview(null);
    } catch (error) {
      console.error('Restore error:', error);
      showError('Restore Failed', error.message);
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadFromStorage = async (backup) => {
    try {
      await downloadBackupFromStorage(backup.downloadUrl, backup.name);
      showSuccess('Backup Downloaded', `Downloaded ${backup.name} to your device.`);
    } catch (error) {
      console.error('Download error:', error);
      showError('Download Failed', error.message);
    }
  };

  const handleDeleteBackup = async (backup) => {
    const confirmed = await showConfirm(
      'Delete Backup?',
      `Are you sure you want to delete "${backup.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        setDeletingBackup(backup.name);
        await deleteBackupFromStorage(backup.name);
        await loadBackupList();
        showSuccess('Backup Deleted', `Successfully deleted ${backup.name}`);
      } catch (error) {
        console.error('Delete error:', error);
        showError('Delete Failed', error.message);
      } finally {
        setDeletingBackup(null);
      }
    }
  };

  const handleRestoreFromStorage = async (backup) => {
    const confirmed = await showConfirm(
      'Restore from Backup?',
      `This will restore the database from "${backup.name}" (${backup.totalPlayers} players, ${backup.totalTournaments} tournaments, ${backup.totalRegistrations} registrations). An auto-backup will be created first. Continue?`
    );

    if (confirmed) {
      try {
        setImporting(true);
        hideModal();

        // Load backup from storage
        const backupData = await loadBackupFromStorage(backup.downloadUrl);

        // Create auto-backup before restore
        const currentBackup = await exportDatabase();
        await saveBackupToStorage(currentBackup);
        downloadBackup(currentBackup, `auto_backup_before_restore_${new Date().toISOString().slice(0, 10)}.json`);

        // Perform restore
        const result = await importDatabase(backupData, { mode: 'merge' });

        showSuccess('Database Restored Successfully!', `Imported ${result.imported.players} players, ${result.imported.tournaments} tournaments, and ${result.imported.registrations} registrations in ${result.duration}.`);

        // Reload stats and backup list
        loadDatabaseStats();
        loadBackupList();
      } catch (error) {
        console.error('Restore error:', error);
        showError('Restore Failed', error.message);
      } finally {
        setImporting(false);
      }
    }
  };

  if (loading) {
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
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </nav>
        <div className="players-content">
          <LoadingSpinner />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

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
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="players-content">
        <div className="players-header">
          <h2>⚙️ Settings</h2>
          <p className="header-subtitle">Manage database backups and system settings</p>
        </div>

        {/* Database Statistics */}
        <div className="settings-section">
          <h2 className="section-title">📊 Database Statistics</h2>
          <div className="stats-grid">
            <div className="stat-card stat-card-purple">
              <div className="stat-icon">👥</div>
              <div className="stat-value">{dbStats?.totalPlayers || 0}</div>
              <div className="stat-label">Total Players</div>
            </div>
            <div className="stat-card stat-card-blue">
              <div className="stat-icon">🏆</div>
              <div className="stat-value">{dbStats?.totalTournaments || 0}</div>
              <div className="stat-label">Total Tournaments</div>
            </div>
            <div className="stat-card stat-card-green">
              <div className="stat-icon">📝</div>
              <div className="stat-value">{dbStats?.totalRegistrations || 0}</div>
              <div className="stat-label">Total Registrations</div>
            </div>
          </div>
        </div>

        {/* Database Backup Section */}
        <div className="settings-section">
          <h2 className="section-title">💾 Database Backup</h2>
          <div className="backup-card">
            <div className="backup-info">
              <p className="backup-description">
                Export the entire database to a JSON file. This creates a complete backup of all players, tournaments, and registrations.
              </p>
            </div>
            <button
              className="btn-export"
              onClick={handleExportDatabase}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <span className="spinner"></span>
                  Exporting...
                </>
              ) : (
                <>
                  <span className="btn-icon">📥</span>
                  Export Database
                </>
              )}
            </button>
          </div>
        </div>

        {/* Database Restore Section */}
        <div className="settings-section">
          <h2 className="section-title">📤 Database Restore</h2>
          <div className="restore-card">
            <div className="restore-info">
              <p className="restore-description">
                Upload a previously exported backup file to restore your database. An automatic backup will be created before restoring.
              </p>
            </div>

            <div className="file-upload-section">
              <label className="file-upload-label">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="file-input"
                  disabled={importing}
                />
                <span className="file-upload-btn">
                  📁 Choose Backup File
                </span>
              </label>

              {backupPreview && (
                <div className="backup-preview">
                  <h3>Backup Preview</h3>
                  <div className="preview-stats">
                    <div className="preview-item">
                      <span className="preview-label">Exported:</span>
                      <span className="preview-value">{backupPreview.exported_at}</span>
                    </div>
                    <div className="preview-item">
                      <span className="preview-label">Players:</span>
                      <span className="preview-value">{backupPreview.players}</span>
                    </div>
                    <div className="preview-item">
                      <span className="preview-label">Tournaments:</span>
                      <span className="preview-value">{backupPreview.tournaments}</span>
                    </div>
                    <div className="preview-item">
                      <span className="preview-label">Registrations:</span>
                      <span className="preview-value">{backupPreview.registrations}</span>
                    </div>
                  </div>

                  <button
                    className="btn-restore"
                    onClick={handleRestoreDatabase}
                    disabled={importing}
                  >
                    {importing ? (
                      <>
                        <span className="spinner"></span>
                        Restoring...
                      </>
                    ) : (
                      <>
                        <span className="btn-icon">♻️</span>
                        Restore Database
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Backup History Section */}
        <div className="settings-section">
          <h2 className="section-title">📋 Backup History</h2>
          {loadingBackups ? (
            <div className="backup-list-loading">
              <LoadingSpinner />
              <p>Loading backups...</p>
            </div>
          ) : backupList.length === 0 ? (
            <div className="no-backups">
              <p>📦 No backups found in Firebase Storage</p>
              <p className="no-backups-hint">Create your first backup using the "Export Database" button above</p>
            </div>
          ) : (
            <div className="backup-list">
              {backupList.map((backup) => (
                <div key={backup.name} className="backup-item">
                  <div className="backup-item-header">
                    <div className="backup-item-icon">💾</div>
                    <div className="backup-item-info">
                      <h3 className="backup-item-name">{backup.name}</h3>
                      <p className="backup-item-date">
                        Created: {new Date(backup.created).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="backup-item-stats">
                    <div className="backup-stat">
                      <span className="backup-stat-icon">👥</span>
                      <span className="backup-stat-value">{backup.totalPlayers}</span>
                      <span className="backup-stat-label">Players</span>
                    </div>
                    <div className="backup-stat">
                      <span className="backup-stat-icon">🏆</span>
                      <span className="backup-stat-value">{backup.totalTournaments}</span>
                      <span className="backup-stat-label">Tournaments</span>
                    </div>
                    <div className="backup-stat">
                      <span className="backup-stat-icon">📝</span>
                      <span className="backup-stat-value">{backup.totalRegistrations}</span>
                      <span className="backup-stat-label">Registrations</span>
                    </div>
                    <div className="backup-stat">
                      <span className="backup-stat-icon">💿</span>
                      <span className="backup-stat-value">{(backup.size / 1024).toFixed(1)}</span>
                      <span className="backup-stat-label">KB</span>
                    </div>
                  </div>
                  <div className="backup-item-actions">
                    <button
                      className="btn-backup-action btn-download-backup"
                      onClick={() => handleDownloadFromStorage(backup)}
                      title="Download to your device"
                    >
                      📥 Download
                    </button>
                    <button
                      className="btn-backup-action btn-restore-backup"
                      onClick={() => handleRestoreFromStorage(backup)}
                      disabled={importing}
                      title="Restore this backup"
                    >
                      {importing ? '⏳ Restoring...' : '♻️ Restore'}
                    </button>
                    <button
                      className="btn-backup-action btn-delete-backup"
                      onClick={() => handleDeleteBackup(backup)}
                      disabled={deletingBackup === backup.name}
                      title="Delete this backup"
                    >
                      {deletingBackup === backup.name ? '⏳ Deleting...' : '🗑️ Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Warning Notice */}
        <div className="settings-section">
          <div className="warning-notice">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h3>Important Notes</h3>
              <ul>
                <li>Backups are automatically saved to Firebase Storage when you export</li>
                <li>All backups are stored in your Firebase project and persist across sessions</li>
                <li>An automatic backup is created before every restore operation</li>
                <li>You can download any backup from the list to your device</li>
                <li>Deleted backups cannot be recovered - use with caution</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        onConfirm={modalState.onConfirm}
      />
    </div>
  );
};

export default Settings;
