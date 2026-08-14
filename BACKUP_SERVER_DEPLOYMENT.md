# 🚀 Backup Server Deployment Guide

This guide will help you deploy the Node.js backup server to Railway (free hosting).

## 📋 Prerequisites

- GitHub account
- Railway account (sign up at https://railway.app)

---

## 🎯 Step 1: Install Backend Dependencies Locally

```bash
cd backend
npm install
```

---

## 🧪 Step 2: Test Locally (Optional)

### Start the backend server:
```bash
cd backend
npm start
```

Server will run on `http://localhost:3001`

### Start the frontend (in another terminal):
```bash
cd ..
npm run dev
```

Visit `http://localhost:5173/settings` and test the backup functionality.

---

## 🌐 Step 3: Deploy to Railway

### Option A: Deploy via Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway:**
   ```bash
   railway login
   ```

3. **Initialize project:**
   ```bash
   cd backend
   railway init
   ```
   - Select "Create new project"
   - Name it "cricket-backup-server"

4. **Deploy:**
   ```bash
   railway up
   ```

5. **Add domain:**
   ```bash
   railway domain
   ```
   - This will give you a URL like: `cricket-backup-server.railway.app`

### Option B: Deploy via Railway Web Dashboard

1. Go to https://railway.app/dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your GitHub account
5. Select your repository
6. Click "Add variables" (none needed for basic setup)
7. Railway will auto-detect the backend folder
8. Click "Deploy"
9. Once deployed, click "Settings" → "Generate Domain"

---

## 🔧 Step 4: Configure Frontend

1. **Update your `.env` file:**
   ```bash
   # Replace with your Railway domain
   VITE_BACKUP_API_URL=https://your-project.railway.app
   ```

2. **For Vercel deployment, add environment variable:**
   - Go to Vercel dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add: `VITE_BACKUP_API_URL` = `https://your-project.railway.app`

---

## ✅ Step 5: Verify Deployment

1. Visit your Railway deployment URL:
   ```
   https://your-project.railway.app/health
   ```

2. You should see:
   ```json
   {
     "status": "ok",
     "message": "Backup server is running"
   }
   ```

3. Test the Settings page:
   - Export a backup
   - Check if it appears in the backup list
   - Download/restore/delete operations

---

## 📁 Backup Storage

Backups are stored in the `/backend/backups/` folder on Railway's persistent storage.

**Note:** Railway provides persistent volumes. Your backups will persist across deployments.

---

## 🆓 Free Tier Limits

Railway Free Tier includes:
- ✅ 500 hours/month (enough for 24/7 uptime)
- ✅ Persistent storage
- ✅ Custom domains
- ✅ Automatic HTTPS

---

## 🔄 Update Deployment

When you push changes to GitHub:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Railway will automatically redeploy! 🎉

---

## 🐛 Troubleshooting

### Backend server not responding:
1. Check Railway logs: `railway logs`
2. Verify the domain is correct
3. Ensure CORS is enabled (already configured)

### Backups not saving:
1. Check Railway storage limits
2. Verify API URL in frontend .env
3. Check browser console for errors

### Connection errors:
1. Ensure backend is deployed and running
2. Check if HTTPS is used (Railway auto-provides)
3. Verify no firewall/CORS blocks

---

## 📞 Support

If you encounter issues:
1. Check Railway documentation: https://docs.railway.app
2. Check backend logs: `railway logs`
3. Verify environment variables

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Backups stored on Railway server
- ✅ Persistent storage across deployments
- ✅ Free hosting with custom domain
- ✅ Automatic HTTPS
- ✅ Full backup management (list, download, restore, delete)
