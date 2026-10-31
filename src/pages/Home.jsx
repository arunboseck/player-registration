import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import { getTournaments, getPlayersCount, getTournamentRegistrations } from '../utils/firebaseStorage';
import './Home.css';

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

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTournaments: 0,
    totalPlayers: 0,
    totalRegistrations: 0,
    upcomingCount: 0,
  });
  const [upcomingTournaments, setUpcomingTournaments] = useState([]);
  const [recentTournaments, setRecentTournaments] = useState([]);
  const [posterLightbox, setPosterLightbox] = useState(null); // { src, rect, fitted }
  const [posterZoomed, setPosterZoomed] = useState(false);

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true);
      try {
        const [allTournaments, totalPlayers] = await Promise.all([
          getTournaments(),
          getPlayersCount(),
        ]);

        const valid = allTournaments.filter((t) => t.status !== 'Cancelled' && t.startDate && t.endDate);
        const now = new Date();

        const upcoming = valid
          .filter((t) => !isRegistrationClosed(t))
          .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

        const past = valid
          .filter((t) => isRegistrationClosed(t))
          .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

        // Registration counts across every tournament, fetched in parallel.
        const counts = await Promise.all(
          valid.map((t) => getTournamentRegistrations(t.id).then((regs) => regs.length).catch(() => 0))
        );
        const totalRegistrations = counts.reduce((sum, c) => sum + c, 0);

        setStats({
          totalTournaments: valid.length,
          totalPlayers,
          totalRegistrations,
          upcomingCount: upcoming.filter((t) => new Date(t.startDate) >= now).length,
        });
        setUpcomingTournaments(upcoming.slice(0, 3));
        setRecentTournaments(past.slice(0, 3));
      } catch (err) {
        console.error('Error loading home page data:', err);
      }
      setLoading(false);
    };
    loadHomeData();
  }, []);

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

  return (
    <div className="home-container">
      <PublicHeader />

      {/* ==================== Hero ==================== */}
      <section className="home-hero">
        <span className="about-hero-badge">🏏 Player Management System</span>
        <h1 className="about-hero-title">
          Manage Tournaments <br /> Like a Pro.
        </h1>
        <p className="about-hero-subtitle">
          Create tournaments, open player registrations, track every sign-up live and export a
          print-ready player list — all from one simple, beautiful platform.
        </p>

        <div className="home-hero-actions">
          <Link to="/calendar" className="about-cta-btn about-cta-btn-primary">📅 Browse Tournaments</Link>
          <Link to="/about" className="about-cta-btn about-cta-btn-secondary">ℹ️ How It Works</Link>
        </div>

        {/* ==================== Live Stats ==================== */}
        <div className="home-stats">
          <div className="home-stat-card">
            <span className="home-stat-icon">🏆</span>
            {loading ? <span className="stat-spinner" /> : <strong>{stats.totalTournaments}</strong>}
            <span>Tournaments Hosted</span>
          </div>
          <div className="home-stat-card">
            <span className="home-stat-icon">👥</span>
            {loading ? <span className="stat-spinner" /> : <strong>{stats.totalPlayers}</strong>}
            <span>Registered Players</span>
          </div>
          <div className="home-stat-card">
            <span className="home-stat-icon">📝</span>
            {loading ? <span className="stat-spinner" /> : <strong>{stats.totalRegistrations}</strong>}
            <span>Tournament Sign-ups</span>
          </div>
          <div className="home-stat-card">
            <span className="home-stat-icon">🔥</span>
            {loading ? <span className="stat-spinner" /> : <strong>{stats.upcomingCount}</strong>}
            <span>Upcoming Events</span>
          </div>
        </div>
      </section>

      {/* ==================== Feature Highlights ==================== */}
      <section className="home-section home-highlights-section">
        <div className="home-highlights-grid">
          <div className="home-highlight-card">
            <span className="home-highlight-icon icon-registration">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" fill="url(#gradReg)" />
                <circle cx="25" cy="24" r="8" fill="#fff" />
                <path d="M11 48c0-8 6.3-13 14-13s14 5 14 13" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" fill="none" />
                <path d="M40 22h13M40 29h13M40 36h8" stroke="#fff" strokeOpacity="0.9" strokeWidth="3" strokeLinecap="round" />
                <defs>
                  <linearGradient id="gradReg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#34d399" />
                    <stop offset="1" stopColor="#059669" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <h3>Player Registration</h3>
            <p>Share one link — players register in under a minute, with photo and contact details.</p>
          </div>
          <div className="home-highlight-card">
            <span className="home-highlight-icon icon-tournament">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" fill="url(#gradTour)" />
                <path d="M22 16h20v14c0 5.5-4.5 10-10 10s-10-4.5-10-10V16z" fill="#fff" />
                <path d="M22 18h-6a2 2 0 00-2 2c0 5 3.5 8 7 8.5M42 18h6a2 2 0 012 2c0 5-3.5 8-7 8.5" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" />
                <rect x="29" y="40" width="6" height="6" fill="#fff" />
                <rect x="23" y="46" width="18" height="4" rx="2" fill="#fff" />
                <defs>
                  <linearGradient id="gradTour" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#fbbf24" />
                    <stop offset="1" stopColor="#d97706" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <h3>Tournament Management</h3>
            <p>Create multi-day tournaments with posters, venues and a live calendar view.</p>
          </div>
          <div className="home-highlight-card">
            <span className="home-highlight-icon icon-reorder">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" fill="url(#gradReorder)" />
                <rect x="18" y="20" width="22" height="7" rx="2.5" fill="#fff" />
                <rect x="18" y="31" width="28" height="7" rx="2.5" fill="#fff" opacity="0.9" />
                <rect x="18" y="42" width="16" height="7" rx="2.5" fill="#fff" opacity="0.75" />
                <path d="M47 18l4 5h-8l4-5zM47 49l4-5h-8l4 5z" fill="#fff" />
                <defs>
                  <linearGradient id="gradReorder" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#818cf8" />
                    <stop offset="1" stopColor="#4f46e5" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <h3>Drag & Drop Ordering</h3>
            <p>Reorder registered players exactly how you need them, saved instantly.</p>
          </div>
          <div className="home-highlight-card">
            <span className="home-highlight-icon icon-pdf">
              <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="32" cy="32" r="30" fill="url(#gradPdf)" />
                <path d="M21 14h15l8 8v26a2 2 0 01-2 2H21a2 2 0 01-2-2V16a2 2 0 012-2z" fill="#fff" />
                <path d="M36 14v8h8" fill="#fbcfe8" />
                <path d="M36 14l8 8h-6a2 2 0 01-2-2v-6z" fill="#f3f4f6" />
                <text x="32" y="38" textAnchor="middle" fontSize="9" fontWeight="700" fill="#dc2626">PDF</text>
                <path d="M24 44h16" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
                <defs>
                  <linearGradient id="gradPdf" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#f87171" />
                    <stop offset="1" stopColor="#dc2626" />
                  </linearGradient>
                </defs>
              </svg>
            </span>
            <h3>PDF Export</h3>
            <p>Download a clean, print-ready player list for auction day or team selection.</p>
          </div>
        </div>
      </section>

      {/* ==================== Upcoming Tournaments ==================== */}
      {!loading && upcomingTournaments.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">🚀 Upcoming Tournaments</h2>
          <div className="home-tournament-grid">
            {upcomingTournaments.map((tournament) => (
              <div key={tournament.id} className="home-tournament-card">
                {tournament.tournamentPoster ? (
                  <img
                    src={tournament.tournamentPoster}
                    alt={tournament.name}
                    className="home-tournament-poster home-tournament-poster-clickable"
                    onClick={(e) => openPosterLightbox(e, tournament.tournamentPoster)}
                  />
                ) : (
                  <div className="home-tournament-poster home-tournament-poster-placeholder">🏏</div>
                )}
                <div className="home-tournament-body">
                  <h3>{tournament.name}</h3>
                  <p className="home-tournament-meta">📍 {tournament.location}</p>
                  <p className="home-tournament-meta">🗓️ {formatDateRange(tournament.startDate, tournament.endDate)}</p>
                  <div className="home-tournament-actions">
                    {isRegistrationClosed(tournament) ? (
                      <span className="btn-register-tournament btn-register-closed">Registration Closed</span>
                    ) : (
                      <Link to={`/tournament-register/${tournament.id}`} className="btn-register-tournament">
                        Register Now
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ==================== Recently Concluded ==================== */}
      {!loading && recentTournaments.length > 0 && (
        <section className="home-section">
          <h2 className="home-section-title">🏁 Recently Concluded</h2>
          <div className="home-tournament-grid">
            {recentTournaments.map((tournament) => (
              <div key={tournament.id} className="home-tournament-card home-tournament-card-past">
                {tournament.tournamentPoster ? (
                  <img
                    src={tournament.tournamentPoster}
                    alt={tournament.name}
                    className="home-tournament-poster home-tournament-poster-clickable"
                    onClick={(e) => openPosterLightbox(e, tournament.tournamentPoster)}
                  />
                ) : (
                  <div className="home-tournament-poster home-tournament-poster-placeholder">🏏</div>
                )}
                <div className="home-tournament-body">
                  <h3>{tournament.name}</h3>
                  <p className="home-tournament-meta">📍 {tournament.location}</p>
                  <p className="home-tournament-meta">🗓️ {formatDateRange(tournament.startDate, tournament.endDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="home-landing-links">
        <Link to="/about" className="home-landing-card">
          <span className="home-landing-icon">ℹ️</span>
          <h3>About Us</h3>
          <p>Learn how we run player registrations, auctions and tournaments.</p>
        </Link>
        <Link to="/calendar" className="home-landing-card">
          <span className="home-landing-icon">📅</span>
          <h3>Calendar</h3>
          <p>Browse upcoming and past tournaments, and see registered players.</p>
        </Link>
      </div>

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

export default Home;
