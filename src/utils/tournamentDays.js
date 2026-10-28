// Helpers for working with the optional "specific tournament days" feature.
// A tournament normally runs every day between startDate and endDate, but
// some tournaments (e.g. weekend-only leagues) only play on certain days
// within that range. `tournamentDays` (array of 'YYYY-MM-DD' strings) stores
// those specific days; when empty/missing, every day in the range applies.

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Returns an array of 'YYYY-MM-DD' strings for every day between start and
// end (inclusive). Returns [] if either date is missing/invalid.
export const generateDateRange = (startStr, endStr) => {
  if (!startStr || !endStr) return [];
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  if (!sy || !sm || !sd || !ey || !em || !ed) return [];

  const start = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);
  if (start > end) return [];

  const days = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const y = cursor.getFullYear();
    const m = String(cursor.getMonth() + 1).padStart(2, '0');
    const d = String(cursor.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${d}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

// Given a tournament's date range and optional tournamentDays override,
// returns the list of 'YYYY-MM-DD' strings on which it actually takes place.
export const getTournamentPlayDates = (tournament) => {
  const fullRange = generateDateRange(tournament.startDate, tournament.endDate);
  if (Array.isArray(tournament.tournamentDays) && tournament.tournamentDays.length > 0) {
    const fullRangeSet = new Set(fullRange);
    return tournament.tournamentDays.filter((d) => fullRangeSet.has(d));
  }
  return fullRange;
};

export const getWeekdayLabel = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return WEEKDAY_SHORT[new Date(y, m - 1, d).getDay()];
};

export const formatDayNumber = (dateStr) => {
  const [, , d] = dateStr.split('-');
  return Number(d);
};
