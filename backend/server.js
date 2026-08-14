const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backup server running on port ${PORT}`);
  console.log(`📁 Backups directory: ${BACKUPS_DIR}`);
  console.log(`✅ Server ready to handle backup operations`);
});
