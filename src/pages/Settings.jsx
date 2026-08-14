import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayers, getTournaments, getTournamentRegistrations } from '../utils/firebaseStorage';
import { exportDatabase, downloadBackup, validateBackup, getBackupStats, importDatabase } from '../utils/firebaseBackup';
import Navigation from '../components/Navigation';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dbStats, setDbStats] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [backupPreview, setBackupPreview] = useState(null);
  const [uploadedBackup, setUploadedBackup] = useState(null);
  const { modalState, hideModal, showSuccess, showError, showConfirm } = useModal();

  useEffect(() => {
    loadDatabaseStats();
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

  const handleExportDatabase = async () => {
    try {
      setExporting(true);
      const backup = await exportDatabase();
      downloadBackup(backup);
      
      // Store backup info in localStorage
      const backupHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
      backupHistory.unshift({
        timestamp: backup.timestamp,
        exported_at: backup.exported_at,
        stats: backup.metadata
      });
      // Keep only last 10 backups in history
      localStorage.setItem('backupHistory', JSON.stringify(backupHistory.slice(0, 10)));

      showSuccess('Database Exported Successfully!', `Backup downloaded with ${backup.metadata.totalPlayers} players, ${backup.metadata.totalTournaments} tournaments, and ${backup.metadata.totalRegistrations} registrations.`);
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
      downloadBackup(currentBackup, `auto_backup_before_restore_${new Date().toISOString().slice(0, 10)}.json`);

      // Perform restore
      const result = await importDatabase(uploadedBackup, { mode: 'merge' });

      showSuccess('Database Restored Successfully!', `Imported ${result.imported.players} players, ${result.imported.tournaments} tournaments, and ${result.imported.registrations} registrations in ${result.duration}.`);

      // Reload stats
      loadDatabaseStats();
      setUploadedBackup(null);
      setBackupPreview(null);
    } catch (error) {
      console.error('Restore error:', error);
      showError('Restore Failed', error.message);
    } finally {
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        message="Loading Settings"
        subMessage="Please wait while we load database statistics..."
      />
    );
  }

  return (
    <div className="page-container">
      <Navigation />
      
      <div className="content-wrapper">
        <div className="page-header">
          <h1>⚙️ Settings</h1>
          <p className="page-subtitle">Manage database backups and system settings</p>
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

        {/* Warning Notice */}
        <div className="settings-section">
          <div className="warning-notice">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h3>Important Notes</h3>
              <ul>
                <li>Always create a backup before making major changes to your database</li>
                <li>Backup files contain all your data including photos (as URLs)</li>
                <li>An automatic backup is created before every restore operation</li>
                <li>Store your backup files in a safe location</li>
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
