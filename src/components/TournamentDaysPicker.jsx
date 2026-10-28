import { useEffect, useRef } from 'react';
import {
  generateDateRange,
  getWeekdayLabel,
  formatDayNumber,
} from '../utils/tournamentDays';
import './TournamentDaysPicker.css';

// Lets the user pick specific play-days within a tournament's start/end
// date range (e.g. "only Sundays" for a 5-week league). `value` is an array
// of 'YYYY-MM-DD' strings; an empty array means "every day in range".
const TournamentDaysPicker = ({ startDate, endDate, value, onChange }) => {
  const dayList = generateDateRange(startDate, endDate);
  const prevDayListRef = useRef([]);
  const initializedRef = useRef(false);
  const initialValueRef = useRef(value);

  useEffect(() => {
    if (dayList.length === 0) {
      prevDayListRef.current = [];
      return;
    }

    if (!initializedRef.current) {
      initializedRef.current = true;
      const preset = initialValueRef.current;
      const dayListSet = new Set(dayList);
      const presetFiltered = Array.isArray(preset)
        ? preset.filter((d) => dayListSet.has(d))
        : [];
      onChange(presetFiltered.length > 0 ? presetFiltered : dayList);
      prevDayListRef.current = dayList;
      return;
    }

    const prevDaySet = new Set(prevDayListRef.current);
    const prevSelectedSet = new Set(value);
    const next = dayList.filter((d) => (prevDaySet.has(d) ? prevSelectedSet.has(d) : true));
    prevDayListRef.current = dayList;
    if (next.length !== value.length || next.some((d, i) => d !== value[i])) {
      onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayList.join(',')]);

  if (dayList.length === 0) {
    return (
      <p className="tournament-days-hint">Select a start and end date to choose specific tournament days.</p>
    );
  }

  const selectedSet = new Set(value);

  const toggleDay = (day) => {
    onChange(selectedSet.has(day) ? value.filter((d) => d !== day) : [...value, day].sort());
  };

  const selectAll = () => onChange(dayList);
  const clearAll = () => onChange([]);
  const selectByWeekday = (weekdays) => {
    onChange(dayList.filter((d) => weekdays.includes(getWeekdayLabel(d))));
  };

  return (
    <div className="tournament-days-picker">
      <div className="tournament-days-quick-actions">
        <button type="button" onClick={selectAll}>All Days</button>
        <button type="button" onClick={() => selectByWeekday(['Sun'])}>Sundays Only</button>
        <button type="button" onClick={() => selectByWeekday(['Sat', 'Sun'])}>Weekends Only</button>
        <button type="button" onClick={clearAll}>Clear</button>
      </div>
      <div className="tournament-days-grid">
        {dayList.map((day) => {
          const checked = selectedSet.has(day);
          return (
            <label
              key={day}
              className={`tournament-day-chip ${checked ? 'tournament-day-chip-checked' : ''}`}
            >
              <input type="checkbox" checked={checked} onChange={() => toggleDay(day)} />
              <span className="tournament-day-chip-weekday">{getWeekdayLabel(day)}</span>
              <span className="tournament-day-chip-number">{formatDayNumber(day)}</span>
            </label>
          );
        })}
      </div>
      <p className="tournament-days-summary">
        {value.length} of {dayList.length} day{dayList.length === 1 ? '' : 's'} selected
        {value.length === dayList.length ? ' (every day in range)' : ''}
      </p>
    </div>
  );
};

export default TournamentDaysPicker;
