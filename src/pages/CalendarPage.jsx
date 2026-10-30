import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import { getTournaments, getTournamentRegistrations } from '../utils/firebaseStorage';
import { getTournamentPlayDates } from '../utils/tournamentDays';
import './Home.css';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const toDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const isRegistrationClosed = (tournament) => {
  const now = new Date();
  if (tournament.auctionDate && new Date(tournament.auctionDate) <= now) return true;
  if (tournament.endDate && new Date(tournament.endDate) < now) return true;
  return false;
};

const buildMonthCells = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = startWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month - 1, daysInPrevMonth - i), outside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: new Date(year, month, d), outside: false });
  }
  let next = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, next++), outside: true });
  }
  return cells;
};

const CalendarPage = () => {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTournaments, setSelectedTournaments] = useState([]);
  const [posterLightbox, setPosterLightbox] = useState(null); // { src, rect }
  const [posterZoomed, setPosterZoomed] = useState(false);
  const [slideDirection, setSlideDirection] = useState('right');
  const [playersModal, setPlayersModal] = useState(null); // { tournamentName, players, loading }

  useEffect(() => {
    const loadTournaments = async () => {
      setLoading(true);
      const all = await getTournaments();
      setTournaments(all.filter((t) => t.status !== 'Cancelled' && t.startDate && t.endDate));
      setLoading(false);
    };
    loadTournaments();
  }, []);

  // Map of dateKey -> list of tournaments confirmed on that date
  const tournamentsByDate = useMemo(() => {
    const map = {};
    tournaments.forEach((tournament) => {
      const playDates = getTournamentPlayDates(tournament);
      playDates.forEach((key) => {
        if (!map[key]) map[key] = [];
        map[key].push(tournament);
      });
    });
    return map;
  }, [tournaments]);

  const cells = useMemo(
    () => buildMonthCells(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const goToPrevMonth = () => {
    setSlideDirection('left');
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setSlideDirection('right');
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const goToToday = () => {
    const target = today.getFullYear() * 12 + today.getMonth();
    const current = currentYear * 12 + currentMonth;
    setSlideDirection(target >= current ? 'right' : 'left');
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  };

  const handleDateClick = (cell) => {
    const key = toDateKey(cell.date);
    const matches = tournamentsByDate[key];
    if (!matches || matches.length === 0) return;
    setSelectedDate(cell.date);
    setSelectedTournaments(matches);
  };

  const closeModal = () => {
    setSelectedDate(null);
    setSelectedTournaments([]);
  };

  const openPosterLightbox = (e, src) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setPosterLightbox({ src, rect, fitted: null });
    setPosterZoomed(false);

    // Compute the image's own aspect ratio so the expanded view hugs the
    // poster instead of sitting inside an oversized, letterboxed box.
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

    // Allow the browser to paint the start position before transitioning to full screen
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPosterZoomed(true));
    });
  };

  const closePosterLightbox = () => {
    setPosterZoomed(false);
    // Wait for the shrink animation to finish before unmounting
    setTimeout(() => setPosterLightbox(null), 300);
  };

  const openPlayersModal = async (tournament) => {
    setPlayersModal({ tournamentName: tournament.name, players: [], loading: true });
    const registrations = await getTournamentRegistrations(tournament.id);
    const sorted = [...registrations].sort((a, b) => {
      const aHasOrder = typeof a.sortOrder === 'number';
      const bHasOrder = typeof b.sortOrder === 'number';
      if (aHasOrder && bHasOrder) return a.sortOrder - b.sortOrder;
      if (aHasOrder) return -1;
      if (bHasOrder) return 1;
      return new Date(a.registeredAt || 0) - new Date(b.registeredAt || 0);
    });
    setPlayersModal({ tournamentName: tournament.name, players: sorted, loading: false });
  };

  const closePlayersModal = () => setPlayersModal(null);

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const now = new Date();
  const upcomingCount = tournaments.filter((t) => !isRegistrationClosed(t)).length;
  const pastCount = tournaments.length - upcomingCount;
  const thisMonthCount = tournaments.filter((t) => {
    const start = new Date(t.startDate);
    const end = new Date(t.endDate);
    return (
      (start.getFullYear() === now.getFullYear() && start.getMonth() === now.getMonth()) ||
      (end.getFullYear() === now.getFullYear() && end.getMonth() === now.getMonth())
    );
  }).length;

  return (
    <div className="home-container">
      <PublicHeader />

      {/* ==================== Hero ==================== */}
      <section className="about-hero calendar-hero">
        <span className="about-hero-badge">📅 Tournament Calendar</span>
        <h1 className="about-hero-title">Every Match, <br /> At a Glance.</h1>
        <p className="about-hero-subtitle">
          Browse every tournament by date, check posters and venues, register in a click, and see
          who's already signed up — all live from our database.
        </p>

        {!loading && (
          <div className="calendar-quick-stats">
            <div className="calendar-quick-stat">
              <strong>{tournaments.length}</strong>
              <span>Total Tournaments</span>
            </div>
            <div className="calendar-quick-stat">
              <strong>{upcomingCount}</strong>
              <span>Upcoming / Ongoing</span>
            </div>
            <div className="calendar-quick-stat">
              <strong>{thisMonthCount}</strong>
              <span>This Month</span>
            </div>
            <div className="calendar-quick-stat">
              <strong>{pastCount}</strong>
              <span>Concluded</span>
            </div>
          </div>
        )}
      </section>

      <div className="calendar-card">
        <div className="calendar-header">
          <button className="calendar-nav-btn" onClick={goToPrevMonth} aria-label="Previous month">
            ‹
          </button>
          <div className="calendar-title">
            <h2>{MONTH_NAMES[currentMonth]} {currentYear}</h2>
            <button className="calendar-today-btn" onClick={goToToday}>Today</button>
          </div>
          <button className="calendar-nav-btn" onClick={goToNextMonth} aria-label="Next month">
            ›
          </button>
        </div>

        <div className="calendar-weekdays">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className={['calendar-weekday', day === 'Sun' ? 'calendar-weekday-sunday' : ''].filter(Boolean).join(' ')}
            >
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="calendar-loading">Loading tournaments…</div>
        ) : (
          <div className="calendar-grid-viewport">
            <div
              key={`${currentYear}-${currentMonth}`}
              className={`calendar-grid calendar-grid-slide-${slideDirection}`}
            >
            {cells.map((cell, index) => {
              const key = toDateKey(cell.date);
              const matches = tournamentsByDate[key] || [];
              const hasTournament = matches.length > 0;
              const isToday = isSameDay(cell.date, today);
              const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const isPast = cell.date < todayStart && !isToday;
              const isSunday = cell.date.getDay() === 0;

              return (
                <div
                  key={index}
                  className={[
                    'calendar-cell',
                    cell.outside ? 'calendar-cell-outside' : '',
                    hasTournament ? 'calendar-cell-event' : '',
                    hasTournament && isPast ? 'calendar-cell-event-past' : '',
                    isToday ? 'calendar-cell-today' : '',
                    isSunday ? 'calendar-cell-sunday' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleDateClick(cell)}
                >
                  <span className="calendar-cell-number">{cell.date.getDate()}</span>
                  {hasTournament && (
                    <span
                      className={[
                        'calendar-event-label',
                        isPast ? 'calendar-event-label-past' : '',
                      ].filter(Boolean).join(' ')}
                      title={matches.map((t) => t.name).join(', ')}
                    >
                      {matches.length === 1 ? matches[0].name : `${matches.length} Tournaments`}
                    </span>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}

        <div className="calendar-legend">
          <span className="calendar-legend-item">
            <span className="calendar-legend-dot" />
            <span>Upcoming / ongoing tournament</span>
          </span>
          <span className="calendar-legend-item">
            <span className="calendar-legend-dot calendar-legend-dot-past" />
            <span>Past tournament</span>
          </span>
        </div>
      </div>

      {selectedDate && (
        <div className="tournament-modal-overlay" onClick={closeModal}>
          <div className="tournament-modal" onClick={(e) => e.stopPropagation()}>
            <button className="tournament-modal-close" onClick={closeModal} aria-label="Close">×</button>
            <h3 className="tournament-modal-date">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <div className="tournament-modal-list">
              {selectedTournaments.map((tournament) => (
                <div key={tournament.id} className="tournament-modal-item">
                  {tournament.tournamentPoster && (
                    <img
                      src={tournament.tournamentPoster}
                      alt={tournament.name}
                      className="tournament-modal-poster tournament-modal-poster-clickable"
                      onClick={(e) => openPosterLightbox(e, tournament.tournamentPoster)}
                    />
                  )}
                  <div className="tournament-modal-info">
                    <h4>{tournament.name}</h4>
                    <p className="tournament-modal-location">📍 {tournament.location}</p>
                    <p className="tournament-modal-dates">
                      🗓️ {new Date(tournament.startDate).toLocaleDateString()} – {new Date(tournament.endDate).toLocaleDateString()}
                    </p>
                    {tournament.description && (
                      <div
                        className="tournament-modal-description"
                        dangerouslySetInnerHTML={{ __html: tournament.description }}
                      />
                    )}
                    <div className="tournament-modal-actions">
                      {isRegistrationClosed(tournament) ? (
                        <span className="btn-register-tournament btn-register-closed">
                          Registration Closed
                        </span>
                      ) : (
                        <Link to={`/tournament-register/${tournament.id}`} className="btn-register-tournament">
                          Register for this Tournament
                        </Link>
                      )}
                      <button
                        type="button"
                        className="btn-view-players"
                        onClick={() => openPlayersModal(tournament)}
                      >
                        View Registered Players
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
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

      {playersModal && (
        <div className="players-modal-overlay" onClick={closePlayersModal}>
          <div className="players-modal" onClick={(e) => e.stopPropagation()}>
            <button className="tournament-modal-close" onClick={closePlayersModal} aria-label="Close">×</button>
            <h3 className="players-modal-title">{playersModal.tournamentName}</h3>
            <p className="players-modal-subtitle">
              Registered Players{!playersModal.loading && ` (${playersModal.players.length})`}
            </p>

            {playersModal.loading ? (
              <div className="calendar-loading">Loading players…</div>
            ) : playersModal.players.length === 0 ? (
              <div className="calendar-loading">No players registered yet.</div>
            ) : (
              <div className="players-modal-grid">
                {playersModal.players.map((player, index) => (
                  <div key={player.id || index} className="player-card">
                    <div className="player-card-photo">
                      {player.photo ? (
                        <img
                          src={player.photo}
                          alt={player.name}
                          className="player-card-photo-clickable"
                          onClick={(e) => openPosterLightbox(e, player.photo)}
                        />
                      ) : (
                        <span className="player-card-photo-placeholder">👤</span>
                      )}
                    </div>
                    <h4 className="player-card-name">{player.name}</h4>
                    <p className="player-card-id">ID: {index + 1}</p>
                    {player.mobile && <p className="player-card-mobile">📞 {player.mobile}</p>}
                    <p className="player-card-position">{player.position}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarPage;
