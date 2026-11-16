import { useState, useEffect } from 'react';
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
      const result = editingBan ? await updateBan(editingBan.id, form) : await banPlayer(form);
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
                    <td>{ban.startDate} &rarr; {ban.endDate}</td>
                    <td>{ban.reason || '—'}</td>
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
                          <strong>{p.name}</strong> <span>{p.mobile}</span>
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
                  <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div>
                  <label>End Date</label>
                  <input type="date" value={form.endDate} min={form.startDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label>Reason (optional)</label>
                <textarea rows="3" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder="e.g. Misconduct during last tournament" />
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
