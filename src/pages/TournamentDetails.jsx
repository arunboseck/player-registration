import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import { getTournamentById, getTournamentRegistrations } from '../utils/firebaseStorage';
import './Home.css';
import './TournamentDetails.css';

const isRegistrationClosed = (tournament) => {
  const now = new Date();
  if (tournament.auctionDate && new Date(tournament.auctionDate) <= now) return true;
  if (tournament.endDate && new Date(tournament.endDate) < now) return true;
  return false;
};

const formatDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const opts = { day: 'numeric', month: 'short', year: 'numeric' };
  if (startDate === endDate) return start.toLocaleDateString('en-US', opts);
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
};

const TournamentDetails = () => {
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [registrationsCount, setRegistrationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [posterLightbox, setPosterLightbox] = useState(null);
  const [posterZoomed, setPosterZoomed] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setNotFound(false);
      const data = await getTournamentById(id);
      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      setTournament(data);
      const regs = await getTournamentRegistrations(id).catch(() => []);
      setRegistrationsCount(regs.length);
      setLoading(false);
    };
    load();
  }, [id]);

  const openPosterLightbox = (e, src) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosterLightbox({ src, rect, fitted: null });
    setPosterZoomed(false);

    const img = new Image();
    img.onload = () => {
      const maxW = Math.min(window.innerWidth * 0.9, 700);
      const maxH = Math.min(window.innerHeight * 0.85, 900);
      const ratio = img.naturalWidth / img.naturalHeight;
      let width = maxW;
      let height = width / ratio;
      if (height > maxH) {
        height = maxH;
        width = height * ratio;
      }
      setPosterLightbox((prev) => (prev && prev.src === src ? { ...prev, fitted: { width, height } } : prev));
    };
    img.src = src;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPosterZoomed(true));
    });
  };

  const closePosterLightbox = () => {
    setPosterZoomed(false);
    setTimeout(() => setPosterLightbox(null), 300);
  };

  if (loading) {
    return (
      <div className="home-container">
        <PublicHeader />
        <div className="calendar-loading" style={{ margin: '4rem auto' }}>Loading tournament…</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="home-container">
        <PublicHeader />
        <div className="td-not-found">
          <h2>Tournament not found</h2>
          <p>It may have been removed, or the link is incorrect.</p>
          <Link to="/calendar" className="about-cta-btn about-cta-btn-primary">📅 Browse Tournaments</Link>
        </div>
      </div>
    );
  }

  const closed = isRegistrationClosed(tournament);

  return (
    <div className="home-container">
      <PublicHeader />

      <section className="td-hero">
        <div className="td-hero-poster">
          {tournament.tournamentPoster ? (
            <img
              src={tournament.tournamentPoster}
              alt={tournament.name}
              className="td-poster-img td-poster-img-clickable"
              onClick={(e) => openPosterLightbox(e, tournament.tournamentPoster)}
            />
          ) : (
            <div className="td-poster-img td-poster-placeholder">🏏</div>
          )}
        </div>
        <div className="td-hero-info">
          <span className={`td-status-badge ${closed ? 'td-status-closed' : 'td-status-open'}`}>
            {closed ? 'Registration Closed' : 'Registration Open'}
          </span>
          <h1 className="td-title">{tournament.name}</h1>
          <p className="td-meta">📍 {tournament.location}</p>
          <p className="td-meta">🗓️ {formatDateRange(tournament.startDate, tournament.endDate)}</p>
          {tournament.auctionDate && (
            <p className="td-meta">🔨 Auction: {new Date(tournament.auctionDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          )}
          <p className="td-meta">👥 {registrationsCount} Player{registrationsCount === 1 ? '' : 's'} Registered</p>
          {tournament.paymentEnabled && tournament.entryFee && (
            <p className="td-meta">💳 Entry Fee: ₹{tournament.entryFee}</p>
          )}

          <div className="td-actions">
            {closed ? (
              <span className="btn-register-tournament btn-register-closed">Registration Closed</span>
            ) : (
              <Link to={`/tournament-register/${tournament.id}`} className="btn-register-tournament">
                Register Now
              </Link>
            )}
            <Link to="/calendar" className="about-cta-btn about-cta-btn-secondary">📅 Back to Calendar</Link>
          </div>
        </div>
      </section>

      {tournament.description && (
        <section className="home-section td-description-section">
          <h2 className="home-section-title">About this Tournament</h2>
          <div
            className="td-description"
            dangerouslySetInnerHTML={{ __html: tournament.description }}
          />
        </section>
      )}

      {posterLightbox && (
        <div
          className={`poster-lightbox-overlay ${posterZoomed ? 'poster-lightbox-overlay-visible' : ''}`}
          onClick={closePosterLightbox}
        >
          <img
            src={posterLightbox.src}
            alt="Tournament poster"
            className="poster-lightbox-image"
            style={
              posterZoomed
                ? posterLightbox.fitted
                  ? { width: posterLightbox.fitted.width, height: posterLightbox.fitted.height }
                  : {}
                : {
                    top: posterLightbox.rect.top,
                    left: posterLightbox.rect.left,
                    width: posterLightbox.rect.width,
                    height: posterLightbox.rect.height,
                  }
            }
          />
          <button className="poster-lightbox-close" onClick={closePosterLightbox} aria-label="Close">×</button>
        </div>
      )}
    </div>
  );
};

export default TournamentDetails;
