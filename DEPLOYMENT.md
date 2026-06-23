# Cricket Player Management System - Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
- Node.js installed on your machine
- A Vercel account (free tier available at https://vercel.com)
- Git installed

### Step 1: Install Vercel CLI (Optional)
```bash
npm install -g vercel
```

### Step 2: Deploy Using Vercel Dashboard

1. **Push your code to GitHub** (if not already done):
   ```bash
   cd cricket-player-app
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPO_URL
   git push -u origin main
   ```

2. **Go to Vercel Dashboard**:
   - Visit https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect it's a Vite project
   - Click "Deploy"

### Step 3: Deploy Using Vercel CLI

Alternatively, deploy directly from your terminal:

```bash
cd cricket-player-app
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **cricket-player-app** (or your preferred name)
- In which directory is your code located? **./**
- Override settings? **N**

Your app will be deployed and you'll get a URL!

### Production Deployment

For production deployment:

```bash
vercel --prod
```

## 📱 Features

- **Login Page**: Simple authentication system
- **Dashboard**: Overview with player statistics
- **Player Registration**: Form with all required fields
  - Name
  - Mobile Number (10 digits)
  - Date of Birth
  - Blood Group (dropdown)
  - Place
  - Position of Play (dropdown with cricket positions)
  - Player Photo Upload
- **Players List**: View all registered players with search and filter

## 🔑 Login Credentials

The app uses simple client-side authentication. You can login with any username and password.

## 💾 Data Storage

Player data is stored in browser's localStorage. This means:
- Data persists across page refreshes
- Data is specific to each browser/device
- Clearing browser data will remove all players

## 🛠️ Local Development

```bash
cd cricket-player-app
npm install
npm run dev
```

Visit http://localhost:5173

## 📦 Build for Production

```bash
npm run build
```

This creates optimized files in the `dist` folder.

## 🔧 Environment Variables

No environment variables are required for this application.

## 📝 Notes

- The application is fully responsive and works on mobile devices
- Photo uploads are converted to base64 and stored in localStorage
- Maximum photo size is 5MB
- Supported image formats: JPG, PNG, GIF, WEBP

## 🌐 Custom Domain

To add a custom domain in Vercel:
1. Go to your project dashboard
2. Click "Settings" → "Domains"
3. Add your domain and follow DNS configuration steps
