import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getTournaments } from '../utils/firebaseStorage';
import {
  ROLES,
  ROLE_LABELS,
  getAllUsers,
  createUserAccount,
  updateUserProfile,
  setUserStatus,
  deleteUserProfile
} from '../utils/userManagement';
import Modal from '../components/Modal';
import { useModal } from '../hooks/useModal';
import LoadingSpinner from '../components/LoadingSpinner';
import './UserManagement.css';

const emptyForm = { name: '', email: '', password: '', role: ROLES.TOURNAMENT_ORGANIZER, assignedTournaments: [] };

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const { modalState, hideModal, showSuccess, showError, showConfirm } = useModal();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [usersList, tournamentsList] = await Promise.all([getAllUsers(), getTournaments()]);
    setUsers(usersList);
    setTournaments(tournamentsList);
    setLoading(false);
  };

  const openAddForm = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (u) => {
    setEditingUser(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, assignedTournaments: u.assignedTournaments || [] });
    setShowForm(true);
  };

  const toggleTournament = (tid) => {
    setForm((prev) => ({
      ...prev,
      assignedTournaments: prev.assignedTournaments.includes(tid)
        ? prev.assignedTournaments.filter((t) => t !== tid)
        : [...prev.assignedTournaments, tid]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      if (editingUser) {
        const result = await updateUserProfile(editingUser.uid, {
          name: form.name,
          role: form.role,
          assignedTournaments: form.role === ROLES.TOURNAMENT_ORGANIZER ? form.assignedTournaments : []
        });
        if (result.success) {
          await showSuccess(`${form.name} updated successfully.`);
          setShowForm(false);
          loadData();
        } else {
          await showError(result.error || 'Failed to update user.');
        }
      } else {
        if (!form.password || form.password.length < 6) {
          await showError('Password must be at least 6 characters.');
          setSaving(false);
          return;
        }
        const result = await createUserAccount(form);
        if (result.success) {
          await showSuccess(`${form.name} added as ${ROLE_LABELS[form.role]}.`);
          setShowForm(false);
          loadData();
        } else {
          await showError(result.error || 'Failed to create user.');
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (u) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    const confirmed = await showConfirm(
      `${newStatus === 'inactive' ? 'Deactivate' : 'Activate'} ${u.name}? ${newStatus === 'inactive' ? 'They will lose access immediately.' : 'They will regain access.'}`,
      newStatus === 'inactive' ? 'Deactivate User' : 'Activate User'
    );
    if (!confirmed) return;
    await setUserStatus(u.uid, newStatus);
    loadData();
  };

  const handleDelete = async (u) => {
    const confirmed = await showConfirm(
      `Remove ${u.name}'s access to the system? Their Firebase login will still exist until removed from the Firebase Console.`,
      'Remove User'
    );
    if (!confirmed) return;
    await deleteUserProfile(u.uid);
    loadData();
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="players-page">
      <div className="players-content">
        <div className="players-header">
          <div>
            <h2>👥 User Management</h2>
            <p className="tournament-subtitle">Manage Super Admins and Tournament Organizers</p>
          </div>
          <div className="header-actions">
            <button className="btn-download btn-pdf" onClick={openAddForm}>➕ Add User</button>
          </div>
        </div>

        <div className="user-table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Assigned Tournaments</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.uid}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td><span className={`role-badge role-${u.role}`}>{ROLE_LABELS[u.role] || u.role}</span></td>
                  <td>{u.role === ROLES.TOURNAMENT_ORGANIZER ? (u.assignedTournaments || []).length : '—'}</td>
                  <td><span className={`status-badge status-${u.status}`}>{u.status}</span></td>
                  <td className="user-actions">
                    <button onClick={() => openEditForm(u)}>Edit</button>
                    <button onClick={() => handleToggleStatus(u)} disabled={u.uid === currentUser.uid}>
                      {u.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(u)} disabled={u.uid === currentUser.uid}>Remove</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center' }}>No users found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>{editingUser ? 'Edit User' : 'Add New User'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required disabled={!!editingUser} />
              </div>
              {!editingUser && (
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
                </div>
              )}
              <div className="form-group">
                <label>Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                  <option value={ROLES.TOURNAMENT_ORGANIZER}>Tournament Organizer</option>
                </select>
              </div>
              {form.role === ROLES.TOURNAMENT_ORGANIZER && (
                <div className="form-group">
                  <label>Assigned Tournaments</label>
                  <div className="tournament-checklist">
                    {tournaments.map((t) => (
                      <label key={t.id} className="tournament-checklist-item">
                        <input
                          type="checkbox"
                          checked={form.assignedTournaments.includes(t.id)}
                          onChange={() => toggleTournament(t.id)}
                        />
                        {t.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
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

export default UserManagement;
