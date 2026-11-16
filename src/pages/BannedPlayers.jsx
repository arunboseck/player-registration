import { useState, useEffect, useRef } from 'react';
import { searchPlayers, banPlayer, updateBan, unbanPlayer, getAllBans } from '../utils/firebaseStorage';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import LoadingSpinner from '../components/LoadingSpinner';
import '../pages/UserManagement.css';
import './BannedPlayers.css';

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyForm = { playerId: '', playerName: '', mobile: '', startDate: todayStr(), endDate: '', reason: '' };

const getBanStatus = (ban) => {
  const today = todayStr();
  if (ban.endDate < today) return { label: 'Expired', cls: 'expired' };
  if (ban.startDate > today) return { label: 'Upcoming', cls: 'upcoming' };
  return { label: '🚫 Active Ban', cls: 'active' };
};

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const toDateStr = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const formatDisplayDate = (value) => {
  if (!value) return '';
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Custom calendar-popup date picker, styled to match the app's Calendar page. */
const CalendarDatePicker = ({ value, onChange, min, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => new Date(`${value || todayStr()}T00:00:00`));
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openPicker = () => {
    setViewDate(new Date(`${value || todayStr()}T00:00:00`));
    setOpen((o) => !o);
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isDisabled = (d) => {
    if (!min) return false;
    return toDateStr(year, month, d) < min;
  };

  const selectDay = (d) => {
    if (isDisabled(d)) return;
    onChange(toDateStr(year, month, d));
    setOpen(false);
  };

  const today = todayStr();

  return (
    <div className="cal-picker" ref={wrapperRef}>
      <button type="button" className="cal-picker-trigger" onClick={openPicker}>
        <span className={value ? 'cal-picker-value' : 'cal-picker-placeholder'}>
          {value ? formatDisplayDate(value) : placeholder || 'Select date'}
        </span>
        <span className="cal-picker-icon">📅</span>
      </button>
      {open && (
        <div className="cal-picker-popup">
          <div className="cal-picker-nav">
            <button type="button" onClick={() => setViewDate(new Date(year, month - 1, 1))}>‹</button>
            <span>{MONTH_NAMES[month]} {year}</span>
            <button type="button" onClick={() => setViewDate(new Date(year, month + 1, 1))}>›</button>
          </div>
          <div className="cal-picker-weekdays">
            {WEEKDAYS.map((w, i) => <span key={i}>{w}</span>)}
          </div>
          <div className="cal-picker-grid">
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} className="cal-picker-cell cal-picker-empty" />;
              const dStr = toDateStr(year, month, d);
              return (
                <button
                  type="button"
                  key={dStr}
                  disabled={isDisabled(d)}
                  className={`cal-picker-cell cal-picker-day${value === dStr ? ' selected' : ''}${dStr === today ? ' today' : ''}`}
                  onClick={() => selectDay(d)}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div className="cal-picker-footer">
            <button
              type="button"
              className="cal-picker-today-btn"
              onClick={() => { if (!min || today >= min) { onChange(today); setOpen(false); } }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/** Minimal rich-text editor for the ban reason, with a basic formatting toolbar. */
const ReasonEditor = ({ initialValue, onChange }) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) editorRef.current.innerHTML = initialValue || '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exec = (cmd) => {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || '');
  };

  return (
    <div className="reason-editor">
      <div className="reason-editor-toolbar">
        <button type="button" title="Bold" onClick={() => exec('bold')}><b>B</b></button>
        <button type="button" title="Italic" onClick={() => exec('italic')}><i>I</i></button>
        <button type="button" title="Underline" onClick={() => exec('underline')}><u>U</u></button>
        <button type="button" title="Bullet list" onClick={() => exec('insertUnorderedList')}>• List</button>
      </div>
      <div
        ref={editorRef}
        className="reason-editor-content"
        contentEditable
        data-placeholder="e.g. Misconduct during last tournament"
        onInput={() => onChange(editorRef.current?.innerHTML || '')}
      />
    </div>
  );
};

const BannedPlayers = () => {
  const [bans, setBans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBan, setEditingBan] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const { modalState, hideModal, showSuccess, showError, showConfirm } = useModal();

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    setBans(await getAllBans());
    setLoading(false);
  };

  const openAddForm = () => {
    setEditingBan(null);
    setForm(emptyForm);
    setSearchTerm('');
    setSearchResults([]);
    setShowForm(true);
  };

  const openEditForm = (ban) => {
    setEditingBan(ban);
    setForm({ playerId: ban.playerId, playerName: ban.playerName, mobile: ban.mobile, startDate: ban.startDate, endDate: ban.endDate, reason: ban.reason || '' });
    setShowForm(true);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true);
    setSearchResults(await searchPlayers(searchTerm.trim()));
    setSearching(false);
  };

  const selectPlayer = (p) => {
    setForm({ ...form, playerId: p.id, playerName: p.name, mobile: p.mobile });
    setSearchResults([]);
    setSearchTerm('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!form.playerId) { await showError('Please search for and select a player to ban.'); return; }
    if (!form.endDate || form.endDate < form.startDate) { await showError('End date must be on or after the start date.'); return; }

    setSaving(true);
    try {
      const cleanReason = (form.reason || '').replace(/<br\s*\/?>/gi, '').replace(/<[^>]+>/g, '').trim() ? form.reason : '';
      const payload = { ...form, reason: cleanReason };
      const result = editingBan ? await updateBan(editingBan.id, payload) : await banPlayer(payload);
      if (result.success) {
        await showSuccess(`${form.playerName} is now flagged as banned from ${form.startDate} to ${form.endDate}.`, '🚫 Ban Saved');
        setShowForm(false);
        loadData();
      } else {
        await showError(result.error || 'Failed to save ban.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (ban) => {
    const confirmed = await showConfirm(`Lift the ban on ${ban.playerName}? They will be able to register for tournaments again immediately.`, 'Remove Ban');
    if (!confirmed) return;
    await unbanPlayer(ban.id);
    loadData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="players-page banned-players-page">
      <div className="players-content">
        <div className="players-header">
          <div>
            <h2>🚫 Banned Players</h2>
            <p className="tournament-subtitle">Flag players as banned to block them from tournament registration during a date range</p>
          </div>
          <div className="header-actions">
            <button className="btn-download btn-pdf btn-ban-add" onClick={openAddForm}>➕ Ban a Player</button>
          </div>
        </div>

        <div className="user-table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Mobile</th>
                <th>Ban Period</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bans.map((ban) => {
                const status = getBanStatus(ban);
                return (
                  <tr key={ban.id} className={status.cls === 'active' ? 'row-active-ban' : ''}>
                    <td>{ban.playerName}</td>
                    <td>{ban.mobile}</td>
                    <td>{formatDisplayDate(ban.startDate)} &rarr; {formatDisplayDate(ban.endDate)}</td>
                    <td>
                      {ban.reason
                        ? <span className="ban-reason-cell" dangerouslySetInnerHTML={{ __html: ban.reason }} />
                        : '—'}
                    </td>
                    <td><span className={`ban-status-badge ban-${status.cls}`}>{status.label}</span></td>
                    <td className="user-actions">
                      <button onClick={() => openEditForm(ban)}>Edit</button>
                      <button className="btn-danger" onClick={() => handleRemove(ban)}>Remove Ban</button>
                    </td>
                  </tr>
                );
              })}
              {bans.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No banned players. 🎉</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box ban-modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{editingBan ? 'Edit Ban' : '🚫 Ban a Player'}</h3>
            <form onSubmit={handleSubmit}>
              {!editingBan && (
                <div className="form-group">
                  <label>Search Player (name or mobile)</label>
                  <div className="ban-search-row">
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Type to search..." />
                    <button type="button" onClick={handleSearch} disabled={searching}>{searching ? '...' : 'Search'}</button>
                  </div>
                  {searchResults.length > 0 && (
                    <div className="ban-search-results">
                      {searchResults.map((p) => (
                        <div key={p.id} className="ban-search-result-item" onClick={() => selectPlayer(p)}>
                          <div className="ban-result-avatar">
                            {p.photo
                              ? <img src={p.photo} alt={p.name} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                              : null}
                            <span className="ban-result-avatar-fallback" style={{ display: p.photo ? 'none' : 'flex' }}>
                              {p.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ban-result-info">
                            <strong>{p.name}</strong>
                            <span>{p.mobile}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {form.playerId && (
                <div className="ban-selected-player">
                  Selected: <strong>{form.playerName}</strong> ({form.mobile})
                </div>
              )}

              <div className="form-group ban-date-row">
                <div>
                  <label>Start Date</label>
                  <CalendarDatePicker
                    value={form.startDate}
                    onChange={(val) => setForm({ ...form, startDate: val, endDate: form.endDate && form.endDate < val ? '' : form.endDate })}
                    placeholder="Start date"
                  />
                </div>
                <div>
                  <label>End Date</label>
                  <CalendarDatePicker
                    value={form.endDate}
                    onChange={(val) => setForm({ ...form, endDate: val })}
                    min={form.startDate}
                    placeholder="End date"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Reason (optional)</label>
                <ReasonEditor
                  key={editingBan ? editingBan.id : 'new-ban'}
                  initialValue={form.reason}
                  onChange={(html) => setForm((prev) => ({ ...prev, reason: html }))}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-ban-submit" disabled={saving}>{saving ? 'Saving...' : editingBan ? 'Update Ban' : 'Ban Player'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Modal
        show={modalState.show}
        onClose={hideModal}
        onConfirm={modalState.onConfirm}
        onCancel={modalState.onCancel}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
        icon={modalState.icon}
      />
    </div>
  );
};

export default BannedPlayers;
