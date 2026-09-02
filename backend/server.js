const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin SDK (used for deleting Auth accounts on user removal)
let firebaseAdminReady = false;
try {
  let serviceAccount = null;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Preferred: full service account JSON in a single env var
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    // Alternative: individual fields (private key with escaped \n)
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    };
  }

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    firebaseAdminReady = true;
    console.log('✅ Firebase Admin SDK initialized');
  } else {
    console.warn('⚠️ Firebase Admin SDK not configured (missing FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY env vars). /api/users/:uid delete endpoint will be unavailable.');
  }
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
}

// Ensure backups directory exists
const BACKUPS_DIR = path.join(__dirname, 'backups');
if (!fsSync.existsSync(BACKUPS_DIR)) {
  fsSync.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, BACKUPS_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    cb(null, `cricket_db_backup_${timestamp}.json`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'));
    }
  }
});

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backup server is running' });
});

// List all backups
app.get('/api/backups', async (req, res) => {
  try {
    const files = await fs.readdir(BACKUPS_DIR);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const backups = await Promise.all(
      jsonFiles.map(async (filename) => {
        const filePath = path.join(BACKUPS_DIR, filename);
        const stats = await fs.stat(filePath);
        
        // Try to read metadata from file
        let metadata = {
          totalPlayers: 'N/A',
          totalTournaments: 'N/A',
          totalRegistrations: 'N/A'
        };
        
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const data = JSON.parse(content);
          if (data.metadata) {
            metadata = {
              totalPlayers: data.metadata.totalPlayers || 'N/A',
              totalTournaments: data.metadata.totalTournaments || 'N/A',
              totalRegistrations: data.metadata.totalRegistrations || 'N/A',
              exportedAt: data.exported_at || stats.mtime.toISOString()
            };
          }
        } catch (err) {
          console.error(`Error reading metadata from ${filename}:`, err.message);
        }
        
        return {
          name: filename,
          size: stats.size,
          created: stats.mtime.toISOString(),
          ...metadata
        };
      })
    );
    
    // Sort by created date (newest first)
    backups.sort((a, b) => new Date(b.created) - new Date(a.created));
    
    res.json({ success: true, backups });
  } catch (error) {
    console.error('Error listing backups:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Upload/Save a new backup
app.post('/api/backups', express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { backup } = req.body;
    
    if (!backup) {
      return res.status(400).json({ success: false, error: 'No backup data provided' });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `cricket_db_backup_${timestamp}.json`;
    const filePath = path.join(BACKUPS_DIR, filename);
    
    await fs.writeFile(filePath, JSON.stringify(backup, null, 2));
    
    res.json({ 
      success: true, 
      filename,
      message: 'Backup saved successfully'
    });
  } catch (error) {
    console.error('Error saving backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download a specific backup
app.get('/api/backups/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUPS_DIR, filename);
    
    // Check if file exists
    await fs.access(filePath);
    
    res.download(filePath, filename);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(404).json({ success: false, error: 'Backup not found' });
  }
});

// Get backup content (for restore)
app.get('/api/backups/:filename/content', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUPS_DIR, filename);

    const content = await fs.readFile(filePath, 'utf-8');
    const backup = JSON.parse(content);

    res.json({ success: true, backup });
  } catch (error) {
    console.error('Error reading backup:', error);
    res.status(404).json({ success: false, error: 'Backup not found' });
  }
});

// Delete a backup
app.delete('/api/backups/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUPS_DIR, filename);

    await fs.unlink(filePath);

    res.json({
      success: true,
      message: `Backup ${filename} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a user's Firebase Auth account AND Realtime DB profile (Admin SDK required)
app.delete('/api/users/:uid', async (req, res) => {
  if (!firebaseAdminReady) {
    return res.status(503).json({
      success: false,
      error: 'Firebase Admin SDK not configured on the server. Set FIREBASE_SERVICE_ACCOUNT (or FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY) and FIREBASE_DATABASE_URL env vars.'
    });
  }

  try {
    const { uid } = req.params;

    // Delete the Auth account first (ignore "user not found" so DB cleanup still happens)
    try {
      await admin.auth().deleteUser(uid);
    } catch (authError) {
      if (authError.code !== 'auth/user-not-found') {
        throw authError;
      }
    }

    // Remove the profile from Realtime Database
    await admin.database().ref(`users/${uid}`).remove();

    res.json({ success: true, message: `User ${uid} deleted successfully` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backup server running on port ${PORT}`);
  console.log(`📁 Backups directory: ${BACKUPS_DIR}`);
  console.log(`✅ Server ready to handle backup operations`);
});
