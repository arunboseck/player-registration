import { useState, useEffect } from 'react';
import PublicHeader from '../components/PublicHeader';
import { getLiveAuctionSettings } from '../utils/firebaseStorage';
import LoadingSpinner from '../components/LoadingSpinner';
import './LiveAuction.css';

// Public, read-only page. The source URL and on/off switch are configured
// by an admin on the Settings page (/settings) and stored in Firebase —
// visitors here cannot change it.
const LiveAuction = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({ url: '', enabled: false });
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    let mounted = true;
    getLiveAuctionSettings().then((data) => {
      if (mounted) {
        setSettings(data);
        setLoading(false);
      }
    });
    return () => { mounted = false; };
  }, []);

  return (
    <div className="live-auction-page">
      <PublicHeader />
      <div className="live-auction-container">
        <div className="live-auction-top">
          <h1>🔴 Live Auction</h1>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : !settings.enabled || !settings.url ? (
          <p className="live-auction-empty">
            No live auction is currently being streamed. Please check back later.
          </p>
        ) : (
          <>
            <div className="live-auction-frame-wrapper">
              <iframe
                key={settings.url}
                src={settings.url}
                title="Live Auction"
                className="live-auction-iframe"
                onError={() => setIframeError(true)}
                allow="fullscreen"
              />
            </div>
            {iframeError && (
              <p className="live-auction-error">
                Couldn't load the live auction feed right now. Please try again shortly.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LiveAuction;
