# 🚀 Vercel Environment Variables Setup

## Add These Variables to Vercel:

Go to: https://vercel.com/dashboard
→ Click your `player-registration` project
→ Settings → Environment Variables

---

## Copy-Paste These (One by One):

### Variable 1:
**Name:** `VITE_FIREBASE_API_KEY`
**Value:** `AIzaSyDjS1gfnv8DHocsCKNr_HD3F7w89mgKUqs`

### Variable 2:
**Name:** `VITE_FIREBASE_AUTH_DOMAIN`
**Value:** `cricket-player-app.firebaseapp.com`

### Variable 3:
**Name:** `VITE_FIREBASE_DATABASE_URL`
**Value:** `https://cricket-player-app-default-rtdb.asia-southeast1.firebasedatabase.app`

### Variable 4:
**Name:** `VITE_FIREBASE_PROJECT_ID`
**Value:** `cricket-player-app`

### Variable 5:
**Name:** `VITE_FIREBASE_STORAGE_BUCKET`
**Value:** `cricket-player-app.firebasestorage.app`

### Variable 6:
**Name:** `VITE_FIREBASE_MESSAGING_SENDER_ID`
**Value:** `165596828178`

### Variable 7:
**Name:** `VITE_FIREBASE_APP_ID`
**Value:** `1:165596828178:web:325b21413621a5fc13fecb`

---

## After Adding All Variables:

1. Go to **Deployments** tab
2. Click **⋯** (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes for deployment

---

## ✅ Test on Vercel:

1. Visit: `https://player-registration.vercel.app/`
2. Login (admin/admin123)
3. Create a tournament
4. Get registration link
5. Share with players - they can register from ANY device! 🎉

---

## 🔒 IMPORTANT: Secure Your Database

After testing, update Firebase Database Rules:

1. Firebase Console → Realtime Database → Rules
2. Replace with:

```json
{
  "rules": {
    "tournaments": {
      ".read": true,
      ".write": false
    },
    "tournament_registrations": {
      "$tournamentId": {
        ".read": false,
        ".write": true
      }
    },
    "players": {
      ".read": false,
      ".write": false
    }
  }
}
```

3. Click "Publish"

This ensures:
- ✅ Anyone can READ tournaments (public)
- ✅ Anyone can REGISTER for tournaments (public)
- 🔒 Only admins can create/edit tournaments
- 🔒 Player data is protected
