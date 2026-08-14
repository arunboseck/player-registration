# 🚀 Backup System Quick Start Guide

Get your backup server running in 5 minutes!

---

## 📦 Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

This will install:
- Express (web server)
- CORS (cross-origin support)
- Multer (file uploads)

---

## ▶️ Step 2: Start the Backend Server

```bash
npm start
```

You should see:
```
🚀 Backup server running on port 3001
📁 Backups directory: /path/to/backend/backups
✅ Server ready to handle backup operations
```

**Keep this terminal running!**

---

## 🌐 Step 3: Start the Frontend (New Terminal)

```bash
# Go back to project root
cd ..

# Start the React frontend
npm run dev
```

Frontend will run on `http://localhost:5173`

---

## ✅ Step 4: Test the Backup System

1. **Open your browser**: `http://localhost:5173`

2. **Login to the app**

3. **Go to Settings**: Click hamburger menu → "⚙️ Settings"

4. **Export a backup**:
   - Click "📥 Export Database" button
   - Backup will be:
     - ✅ Saved to `backend/backups/` folder
     - ✅ Downloaded to your device
     - ✅ Listed in "Backup History" section

5. **View your backups**:
   - Scroll down to "📋 Backup History"
   - You'll see all backups stored on the server
   - Each shows: players, tournaments, registrations, file size

6. **Test backup operations**:
   - **📥 Download** - Download backup to device
   - **♻️ Restore** - Restore database from backup
   - **🗑️ Delete** - Remove backup from server

---

## 📁 Where Are Backups Stored?

```
backend/
  └── backups/
      ├── cricket_db_backup_2026-08-14T10-19-27.json
      ├── cricket_db_backup_2026-08-14T09-15-32.json
      └── cricket_db_backup_2026-08-13T16-45-18.json
```

These files persist on your local machine or server!

---

## 🛠️ Development Setup

### Terminal 1 (Backend):
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Terminal 2 (Frontend):
```bash
npm run dev
```

---

## 🌐 Production Deployment

See `BACKUP_SERVER_DEPLOYMENT.md` for:
- Railway deployment (free hosting)
- Vercel environment variable setup
- Production configuration

---

## 🐛 Troubleshooting

### "Server offline" warning in Settings:
- Make sure backend server is running
- Check `http://localhost:3001/health`
- Should return: `{"status":"ok"}`

### Backups not appearing:
- Check `backend/backups/` folder exists
- Verify backend terminal shows no errors
- Check browser console for API errors

### CORS errors:
- Backend already has CORS enabled
- Make sure frontend is on `localhost:5173`
- Check backend is on `localhost:3001`

---

## 📝 API Endpoints

Test these in your browser or Postman:

```bash
# Health check
http://localhost:3001/health

# List all backups
http://localhost:3001/api/backups

# Download a backup
http://localhost:3001/api/backups/cricket_db_backup_2026-08-14T10-19-27.json
```

---

## 🎉 You're All Set!

Your backup system is now running with:
- ✅ Backups stored in `backend/backups/` folder
- ✅ Full management UI in Settings page
- ✅ Local server handling all operations
- ✅ Complete backup history

**Next Steps:**
- Deploy to Railway for production use
- Set up automatic backup schedules (optional)
- Configure backup retention policies (optional)

Happy backing up! 🚀
