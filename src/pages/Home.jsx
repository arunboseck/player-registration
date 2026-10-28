import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getTournaments } from '../utils/firebaseStorage';
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

const parseDateOnly = (value) => {
  if (!value) return null;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
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
      const start = parseDateOnly(tournament.startDate);
      const end = parseDateOnly(tournament.endDate);
      if (!start || !end) return;
      const cursor = new Date(start);
      while (cursor <= end) {
        const key = toDateKey(cursor);
        if (!map[key]) map[key] = [];
        map[key].push(tournament);
        cursor.setDate(cursor.getDate() + 1);
      }
    });
    return map;
  }, [tournaments]);

  const cells = useMemo(
    () => buildMonthCells(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const goToPrevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  };

  const goToToday = () => {
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
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
        </div>

        {loading ? (
          <div className="calendar-loading">Loading tournaments…</div>
        ) : (
          <div className="calendar-grid">
            {cells.map((cell, index) => {
              const key = toDateKey(cell.date);
              const matches = tournamentsByDate[key] || [];
              const hasTournament = matches.length > 0;
              const isToday = isSameDay(cell.date, today);

              return (
                <div
                  key={index}
                  className={[
                    'calendar-cell',
                    cell.outside ? 'calendar-cell-outside' : '',
                    hasTournament ? 'calendar-cell-event' : '',
                    isToday ? 'calendar-cell-today' : '',
                  ].filter(Boolean).join(' ')}
                  onClick={() => handleDateClick(cell)}
                >
                  <span className="calendar-cell-number">{cell.date.getDate()}</span>
                  {hasTournament && (
                    <span
                      className="calendar-event-label"
                      title={matches.map((t) => t.name).join(', ')}
                    >
                      {matches.length === 1 ? matches[0].name : `${matches.length} Tournaments`}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="calendar-legend">
          <span className="calendar-legend-dot" />
          <span>Tournament confirmed on this date — click to view details</span>
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
                      className="tournament-modal-poster"
                    />
                  )}
                  <div className="tournament-modal-info">
                    <h4>{tournament.name}</h4>
                    <p className="tournament-modal-location">📍 {tournament.location}</p>
                    <p className="tournament-modal-dates">
                      🗓️ {new Date(tournament.startDate).toLocaleDateString()} – {new Date(tournament.endDate).toLocaleDateString()}
                    </p>
                    {tournament.description && (
                      <p className="tournament-modal-description">{tournament.description}</p>
                    )}
                    <Link to={`/tournament-register/${tournament.id}`} className="btn-register-tournament">
                      Register for this Tournament
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
