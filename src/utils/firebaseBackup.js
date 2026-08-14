import { ref as dbRef, get, set } from 'firebase/database';
import { database } from '../firebase/config';
import { getPlayers, getTournaments, getTournamentRegistrations } from './firebaseStorage';

/**
 * Export entire Firebase database to JSON
 * @returns {Promise<Object>} Complete database backup
 */
export const exportDatabase = async () => {
  try {
    console.log('🔄 Starting database export...');
    const startTime = Date.now();

    // Fetch all main collections
    const players = await getPlayers();
    const tournaments = await getTournaments();

    // Fetch all tournament registrations
    const registrationsMap = {};
    for (const tournament of tournaments) {
      const regs = await getTournamentRegistrations(tournament.id);
      if (regs.length > 0) {
        registrationsMap[tournament.id] = regs;
      }
    }

    // Fetch unique registration keys
    const uniqueKeysRef = dbRef(database, 'tournament_registrations_unique');
    const uniqueSnapshot = await get(uniqueKeysRef);
    const uniqueKeys = uniqueSnapshot.exists() ? uniqueSnapshot.val() : {};

    // Calculate total registrations
    const totalRegistrations = Object.values(registrationsMap).reduce(
      (sum, regs) => sum + regs.length,
      0
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    // Create backup object
    const backup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      exported_at: new Date().toLocaleString(),
      collections: {
        players: players,
        tournaments: tournaments,
        tournament_registrations: registrationsMap,
        tournament_registrations_unique: uniqueKeys
      },
      metadata: {
        totalPlayers: players.length,
        totalTournaments: tournaments.length,
        totalRegistrations: totalRegistrations,
        exportDuration: `${duration}s`,
        databaseSize: JSON.stringify({
          players,
          tournaments,
          tournament_registrations: registrationsMap,
          tournament_registrations_unique: uniqueKeys
        }).length
      }
    };

    console.log('✅ Database export completed:', {
      players: players.length,
      tournaments: tournaments.length,
      registrations: totalRegistrations,
      duration: `${duration}s`
    });

    return backup;
  } catch (error) {
    console.error('❌ Error exporting database:', error);
    throw error;
  }
};

/**
 * Download backup as JSON file
 * @param {Object} backup - Backup data object
 * @param {string} filename - Optional custom filename
 */
export const downloadBackup = (backup, filename = null) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const defaultFilename = `cricket_db_backup_${timestamp}.json`;
  const finalFilename = filename || defaultFilename;

  const dataStr = JSON.stringify(backup, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = finalFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  console.log('📥 Backup downloaded:', finalFilename);
};

/**
 * Validate backup file structure
 * @param {Object} backup - Backup data to validate
 * @returns {Object} Validation result
 */
export const validateBackup = (backup) => {
  const errors = [];
  const warnings = [];

  // Check version
  if (!backup.version) {
    errors.push('Missing version field');
  }

  // Check timestamp
  if (!backup.timestamp) {
    errors.push('Missing timestamp field');
  }

  // Check collections
  if (!backup.collections) {
    errors.push('Missing collections object');
    return { valid: false, errors, warnings };
  }

  const { collections } = backup;

  // Validate players
  if (!Array.isArray(collections.players)) {
    errors.push('Players collection must be an array');
  }

  // Validate tournaments
  if (!Array.isArray(collections.tournaments)) {
    errors.push('Tournaments collection must be an array');
  }

  // Validate registrations
  if (!collections.tournament_registrations || typeof collections.tournament_registrations !== 'object') {
    warnings.push('Tournament registrations may be missing or invalid');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get backup file statistics
 * @param {Object} backup - Backup data
 * @returns {Object} Statistics
 */
export const getBackupStats = (backup) => {
  if (!backup.metadata) {
    return null;
  }

  return {
    players: backup.metadata.totalPlayers || 0,
    tournaments: backup.metadata.totalTournaments || 0,
    registrations: backup.metadata.totalRegistrations || 0,
    timestamp: backup.timestamp,
    exported_at: backup.exported_at,
    size: formatBytes(backup.metadata.databaseSize || 0)
  };
};

/**
 * Format bytes to human readable format
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Import database from backup file
 * @param {Object} backup - Backup data to import
 * @param {Object} options - Import options
 * @returns {Promise<Object>} Import result
 */
export const importDatabase = async (backup, options = { mode: 'merge' }) => {
  try {
    console.log('🔄 Starting database import...');
    const startTime = Date.now();

    // Validate backup first
    const validation = validateBackup(backup);
    if (!validation.valid) {
      throw new Error(`Invalid backup file: ${validation.errors.join(', ')}`);
    }

    const { collections } = backup;
    const { mode } = options; // 'merge' or 'replace'

    let imported = {
      players: 0,
      tournaments: 0,
      registrations: 0
    };

    // Import players
    if (collections.players && Array.isArray(collections.players)) {
      for (const player of collections.players) {
        const playerRef = dbRef(database, `players/${player.id}`);
        await set(playerRef, player);
        imported.players++;
      }
    }

    // Import tournaments
    if (collections.tournaments && Array.isArray(collections.tournaments)) {
      for (const tournament of collections.tournaments) {
        const tournamentRef = dbRef(database, `tournaments/${tournament.id}`);
        await set(tournamentRef, tournament);
        imported.tournaments++;
      }
    }

    // Import tournament registrations
    if (collections.tournament_registrations) {
      for (const [tournamentId, registrations] of Object.entries(collections.tournament_registrations)) {
        for (const registration of registrations) {
          const regRef = dbRef(database, `tournament_registrations/${tournamentId}/${registration.id}`);
          await set(regRef, registration);
          imported.registrations++;
        }
      }
    }

    // Import unique keys
    if (collections.tournament_registrations_unique) {
      const uniqueRef = dbRef(database, 'tournament_registrations_unique');
      await set(uniqueRef, collections.tournament_registrations_unique);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('✅ Database import completed:', {
      players: imported.players,
      tournaments: imported.tournaments,
      registrations: imported.registrations,
      duration: `${duration}s`
    });

    return {
      success: true,
      imported,
      duration: `${duration}s`
    };
  } catch (error) {
    console.error('❌ Error importing database:', error);
    throw error;
  }
};
