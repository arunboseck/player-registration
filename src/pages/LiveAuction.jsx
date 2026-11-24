import { useState, useEffect } from 'react';
import PublicHeader from '../components/PublicHeader';
import './LiveAuction.css';

const STORAGE_KEY = 'liveAuctionIframeUrl';
const DEFAULT_URL = 'http://localhost:3000';

const LiveAuction = () => {
  const [savedUrl, setSavedUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
    setSavedUrl(stored);
    setInputUrl(stored);
  }, []);

  const handleLoad = (e) => {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    if (!trimmed) return;
    localStorage.setItem(STORAGE_KEY, trimmed);
    setSavedUrl(trimmed);
    setIframeError(false);
    setShowSettings(false);
  };

  return (
    <div className="live-auction-page">
      <PublicHeader />
      <div className="live-auction-container">
        <div className="live-auction-top">
          <h1>🔴 Live Auction</h1>
          <button
            className="live-auction-settings-btn"
            onClick={() => setShowSettings((s) => !s)}
          >
            {showSettings ? 'Close' : '⚙️ Set Source URL'}
          </button>
        </div>

        {showSettings && (
          <form className="live-auction-settings-panel" onSubmit={handleLoad}>
            <label htmlFor="auction-url">
              Auction screen URL (e.g. <code>http://localhost:3000</code>, or a public
              tunnel URL like ngrok so others can view it too)
            </label>
            <div className="live-auction-settings-row">
              <input
                id="auction-url"
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="http://localhost:3000"
              />
              <button type="submit">Load</button>
            </div>
            <p className="live-auction-hint">
              Note: a plain <code>localhost</code> URL only works for viewers on the same
              computer the auction is running on. To let other people watch, expose your
              local server with a tunnel (e.g. ngrok) and paste that public URL here instead.
            </p>
          </form>
        )}

        {savedUrl ? (
          <div className="live-auction-frame-wrapper">
            <iframe
              key={savedUrl}
              src={savedUrl}
              title="Live Auction"
              className="live-auction-iframe"
              onError={() => setIframeError(true)}
              allow="fullscreen"
            />
          </div>
        ) : (
          <p className="live-auction-empty">No source URL set yet.</p>
        )}

        {iframeError && (
          <p className="live-auction-error">
            Couldn't load the page at <code>{savedUrl}</code>. Make sure the local server is
            running and reachable from this browser.
          </p>
        )}
      </div>
    </div>
  );
};

export default LiveAuction;
