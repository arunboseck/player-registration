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
            <strong>{loading ? '—' : stats.totalTournaments}</strong>
            <span>Tournaments Hosted</span>
          </div>
          <div className="home-stat-card">
            <span className="home-stat-icon">👥</span>
            <strong>{loading ? '—' : stats.totalPlayers}</strong>
            <span>Registered Players</span>
          </div>
          <div className="home-stat-card">
            <span className="home-stat-icon">📝</span>
            <strong>{loading ? '—' : stats.totalRegistrations}</strong>
            <span>Tournament Sign-ups</span>
          </div>
          <div className="home-stat-card">
            <span className="home-stat-icon">🔥</span>
            <strong>{loading ? '—' : stats.upcomingCount}</strong>
            <span>Upcoming Events</span>
          </div>
        </div>
      </section>

      {/* ==================== Feature Highlights ==================== */}
      <section className="home-section home-highlights-section">
        <div className="home-highlights-grid">
          <div className="home-highlight-card">
            <span className="home-highlight-icon">📝</span>
            <h3>Player Registration</h3>
            <p>Share one link — players register in under a minute, with photo and contact details.</p>
          </div>
          <div className="home-highlight-card">
            <span className="home-highlight-icon">🏗️</span>
            <h3>Tournament Management</h3>
            <p>Create multi-day tournaments with posters, venues and a live calendar view.</p>
          </div>
          <div className="home-highlight-card">
            <span className="home-highlight-icon">🔁</span>
            <h3>Drag & Drop Ordering</h3>
            <p>Reorder registered players exactly how you need them, saved instantly.</p>
          </div>
          <div className="home-highlight-card">
            <span className="home-highlight-icon">📄</span>
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
                    className="home-tournament-poster"
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
                    className="home-tournament-poster"
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
    </div>
  );
};

export default Home;
