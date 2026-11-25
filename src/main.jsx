import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Some mobile browsers (notably iOS Safari) ignore the viewport meta tag's
// "user-scalable=no" for accessibility reasons, so pinch-to-zoom can still
// happen even with that set. Block it at the gesture/touch level too:
// - "gesturestart" is iOS Safari's pinch-zoom gesture event.
// - A touchmove with 2+ touch points is a pinch gesture on any browser.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('touchmove', (e) => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
