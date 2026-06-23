# 🏏 Cricket Player Management System

A modern, responsive web application for managing cricket player registrations built with React and Vite.

## ✨ Features

- **🔐 User Authentication**: Simple login system with protected routes
- **📊 Dashboard**: Overview of player statistics and quick actions
- **➕ Player Registration**: Comprehensive form with validation
  - Player Name
  - Mobile Number (10-digit validation)
  - Date of Birth (date picker)
  - Blood Group (dropdown selection)
  - Place/Location
  - Position of Play (cricket-specific positions)
  - Photo Upload (with preview and validation)
- **👥 Players List**: View all registered players
  - Search functionality (by name, place, or mobile)
  - Filter by position
  - Responsive card layout with player details
  - Delete players
- **💾 Local Storage**: Data persistence using browser localStorage
- **📱 Responsive Design**: Works seamlessly on desktop and mobile devices

## 🎮 Cricket Positions Available

- ALL ROUNDER
- LEFT ARM MEDIUM (BOWLING)
- LEFT ARM FAST MEDIUM (BOWLING)
- LEFT ARM FAST (BOWLING)
- LEFT HAND BATTING (BATTER)
- RIGHT ARM MEDIUM (BOWLING)
- RIGHT ARM FAST MEDIUM (BOWLING)
- RIGHT ARM FAST (BOWLING)
- RIGHT HAND BATTING (BATTER)
- WICKET KEEPER BATTER

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository or navigate to the project folder:
   ```bash
   cd cricket-player-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and visit:
   ```
   http://localhost:5173
   ```

## 🔑 Login

The application uses simple client-side authentication. You can log in with any username and password combination.

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint

## 📦 Project Structure

```
cricket-player-app/
├── src/
│   ├── components/
│   │   └── ProtectedRoute.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Login.css
│   │   ├── Dashboard.jsx
│   │   ├── Dashboard.css
│   │   ├── RegisterPlayer.jsx
│   │   ├── RegisterPlayer.css
│   │   ├── Players.jsx
│   │   └── Players.css
│   ├── utils/
│   │   └── storage.js
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── vercel.json
├── DEPLOYMENT.md
└── package.json
```

## 🌐 Deployment

### Deploy to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

Quick deployment:

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. For production:
   ```bash
   vercel --prod
   ```

## 💡 Usage Guide

1. **Login**: Enter any username and password to access the system
2. **Dashboard**: View overview and navigate to different sections
3. **Register Player**: Click "Register Player" and fill out the form
   - All fields are required
   - Mobile number must be 10 digits
   - Photo size limit: 5MB
4. **View Players**: Browse all registered players
   - Use search to find specific players
   - Filter by position
   - Click delete to remove players

## 🔒 Data Storage

- All player data is stored in browser's localStorage
- Data persists across page refreshes
- Data is device/browser specific
- Clearing browser data will remove all stored information

## 🎨 Technologies Used

- **React 18** - UI library
- **Vite** - Build tool
- **React Router DOM** - Routing
- **CSS3** - Styling
- **LocalStorage API** - Data persistence

## 📝 Form Validation

- Name: Required field
- Mobile: Required, must be exactly 10 digits
- Date of Birth: Required, date picker
- Blood Group: Required, dropdown selection
- Place: Required field
- Position: Required, dropdown selection
- Photo: Required, image file, max 5MB

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements.

## 📄 License

This project is open source and available under the MIT License.

## 🐛 Known Limitations

- Data is stored locally (not synced across devices)
- No backend integration
- Simple authentication (not production-ready security)
- Photo storage in base64 may impact localStorage limits for large numbers of players

## 🔮 Future Enhancements

- Backend API integration
- Real authentication system
- Cloud storage for photos
- Export player data to CSV/PDF
- Player statistics and analytics
- Team formation features
