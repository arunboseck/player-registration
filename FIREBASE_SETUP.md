# Firebase Setup Guide

This app now uses **Firebase Realtime Database** instead of localStorage to allow multiple users to access shared data from different devices and browsers.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `cricket-player-app` (or any name you prefer)
4. Disable Google Analytics (optional, you can enable it if needed)
5. Click "Create project"

### Step 2: Create Realtime Database

1. In your Firebase project, click "Realtime Database" in the left sidebar
2. Click "Create Database"
3. Choose a location (select the closest to your users)
4. Start in **Test Mode** for now (we'll secure it later)
5. Click "Enable"

### Step 3: Get Firebase Configuration

1. Click the ⚙️ (Settings) icon in the left sidebar
2. Click "Project settings"
3. Scroll down to "Your apps" section
4. Click the Web icon `</>`
5. Register your app with a nickname (e.g., "Cricket Player App")
6. Copy the `firebaseConfig` object

### Step 4: Configure Your App

1. In your project folder, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and paste your Firebase credentials:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=cricket-player-app.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://cricket-player-app-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=cricket-player-app
   VITE_FIREBASE_STORAGE_BUCKET=cricket-player-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abc...
   ```

3. Save the file

### Step 5: Deploy to Vercel with Firebase

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add each environment variable from your `.env` file:
   - Name: `VITE_FIREBASE_API_KEY`, Value: (your API key)
   - Name: `VITE_FIREBASE_AUTH_DOMAIN`, Value: (your auth domain)
   - etc...

4. Redeploy your app

## ✅ Test It!

1. **Local**: Run `npm run dev` and test creating tournaments
2. **Vercel**: Visit your deployed app and test the same
3. **Different Devices**: Open the tournament registration link on your phone - it should work! 🎉

## 🔒 Security Rules (Important!)

After testing, update your Firebase Realtime Database rules:

1. Go to Firebase Console → Realtime Database → Rules
2. Replace with these rules:

```json
{
  "rules": {
    "players": {
      ".read": "auth != null",
      ".write": "auth != null"
    },
    "tournaments": {
      ".read": true,
      ".write": "auth != null"
    },
    "tournament_registrations": {
      ".read": "auth != null",
      ".write": true
    }
  }
}
```

This allows:
- ✅ Anyone can view tournaments (public)
- ✅ Anyone can register for tournaments (public)
- ✅ Only admins can create/edit/delete tournaments
- ✅ Only admins can view player data

## 📊 Data Structure

Your Firebase database will have this structure:

```
cricket-player-app/
├── players/
│   ├── player_id_1/
│   │   ├── name: "John Doe"
│   │   ├── mobile: "1234567890"
│   │   └── ...
│   └── player_id_2/
├── tournaments/
│   ├── tournament_id_1/
│   │   ├── name: "Summer Cup 2024"
│   │   ├── location: "Mumbai"
│   │   └── ...
└── tournament_registrations/
    ├── tournament_id_1/
    │   ├── registration_id_1/
    │   │   ├── name: "Player Name"
    │   │   ├── mobile: "9876543210"
    │   │   └── ...
```

## 🎉 Benefits

✅ **Multi-device access**: All users see the same data  
✅ **Real-time updates**: Changes sync instantly  
✅ **Public registration**: Players can register without login  
✅ **No backend needed**: Firebase handles everything  
✅ **Free tier**: 1GB storage, 10GB/month bandwidth

## ❓ Troubleshooting

**Error: "Firebase app not initialized"**
- Make sure your `.env` file exists and has all variables
- Restart your dev server after creating `.env`

**Data not showing up**
- Check Firebase Console → Realtime Database to verify data
- Check browser console for errors
- Verify your database rules allow read/write access

**Vercel deployment not working**
- Make sure you added all environment variables in Vercel settings
- Redeploy after adding environment variables

---

Need help? Check the Firebase documentation: https://firebase.google.com/docs/database
