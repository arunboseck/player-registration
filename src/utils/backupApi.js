/**
 * Backup API - Handles communication with the Node.js backend server
 */

// Backend API URL - will be set via environment variable
const API_URL = import.meta.env.VITE_BACKUP_API_URL || 'http://localhost:3001';

/**
 * Save backup to backend server
 */
export const saveBackupToServer = async (backup) => {
  try {
    console.log('💾 Saving backup to server...');
    
    const response = await fetch(`${API_URL}/api/backups`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ backup })
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to save backup');
    }
    
    console.log('✅ Backup saved to server:', data.filename);
    return data;
  } catch (error) {
    console.error('❌ Error saving backup to server:', error);
    throw new Error('Failed to save backup to server: ' + error.message);
  }
};

/**
 * List all backups from server
 */
export const listBackupsFromServer = async () => {
  try {
    console.log('📋 Fetching backup list from server...');
    
    const response = await fetch(`${API_URL}/api/backups`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to list backups');
    }
    
    console.log(`✅ Found ${data.backups.length} backups on server`);
    return data.backups;
  } catch (error) {
    console.error('❌ Error listing backups:', error);
    throw new Error('Failed to list backups from server: ' + error.message);
  }
};

/**
 * Download backup file from server to user's device
 */
export const downloadBackupFromServer = async (filename) => {
  try {
    console.log('📥 Downloading backup from server:', filename);
    
    const response = await fetch(`${API_URL}/api/backups/${filename}`);
    
    if (!response.ok) {
      throw new Error('Backup not found');
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ Backup downloaded:', filename);
    return { success: true };
  } catch (error) {
    console.error('❌ Error downloading backup:', error);
    throw new Error('Failed to download backup: ' + error.message);
  }
};

/**
 * Load backup content from server (for restore)
 */
export const loadBackupFromServer = async (filename) => {
  try {
    console.log('📤 Loading backup content from server:', filename);
    
    const response = await fetch(`${API_URL}/api/backups/${filename}/content`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to load backup');
    }
    
    console.log('✅ Backup content loaded successfully');
    return data.backup;
  } catch (error) {
    console.error('❌ Error loading backup:', error);
    throw new Error('Failed to load backup from server: ' + error.message);
  }
};

/**
 * Delete backup from server
 */
export const deleteBackupFromServer = async (filename) => {
  try {
    console.log('🗑️ Deleting backup from server:', filename);
    
    const response = await fetch(`${API_URL}/api/backups/${filename}`, {
      method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete backup');
    }
    
    console.log('✅ Backup deleted:', filename);
    return { success: true };
  } catch (error) {
    console.error('❌ Error deleting backup:', error);
    throw new Error('Failed to delete backup: ' + error.message);
  }
};

/**
 * Check if backend server is available
 */
export const checkServerHealth = async () => {
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Backend server not available:', error);
    return false;
  }
};
