import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments } from '../utils/firebaseStorage';
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

const Home = () => {
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
    setPosterLightbox({ src, rect });
    setPosterZoomed(false);
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

  const isSameDay = (a, b) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="home-header-brand">
          <span className="home-header-icon">🏏</span>
          <span className="home-header-title">Player Management System</span>
        </div>
        <Link to="/admin-login" className="home-header-link">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>Admin Login</span>
        </Link>
      </header>

      <p className="home-tagline">
        Manage players, tournaments and registrations all in one place.
      </p>

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
            <span>Upcoming / ongoing tournament — click to view details</span>
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
                    {isRegistrationClosed(tournament) ? (
                      <span className="btn-register-tournament btn-register-closed">
                        Registration Closed
                      </span>
                    ) : (
                      <Link to={`/tournament-register/${tournament.id}`} className="btn-register-tournament">
                        Register for this Tournament
                      </Link>
                    )}
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
                ? {}
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
