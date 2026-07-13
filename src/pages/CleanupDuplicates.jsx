import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cleanupDuplicateRegistrations, migrateToUniqueKeys } from '../utils/cleanupDuplicates';
import { useAuth } from '../contexts/AuthContext';
import './Players.css';

const CleanupDuplicates = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tournamentId, setTournamentId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleCleanup = async () => {
    if (!tournamentId.trim()) {
      setError('Please enter a tournament ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const cleanupResult = await cleanupDuplicateRegistrations(tournamentId);
      setResult(cleanupResult);
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleMigrate = async () => {
    if (!tournamentId.trim()) {
      setError('Please enter a tournament ID');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const migrateResult = await migrateToUniqueKeys(tournamentId);
      setResult({ ...migrateResult, migrated: true });
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="players-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>🏏 Cricket Player Management</h1>
        </div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-nav">Dashboard</button>
          <button onClick={() => navigate('/tournaments')} className="btn-nav">Tournaments</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="players-content">
        <div className="players-header">
          <h2>🧹 Cleanup Duplicate Registrations</h2>
          <p style={{ color: '#6b7280', marginTop: '0.5rem' }}>
            Remove duplicate entries and migrate to the new unique key system
          </p>
        </div>

        <div className="form-container" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <div className="form-group">
            <label>Tournament ID</label>
            <input
              type="text"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              placeholder="Enter tournament ID (e.g., -Ovp3ZGr8abllII9h4ZJ)"
              style={{ width: '100%' }}
            />
            <small style={{ color: '#6b7280', display: 'block', marginTop: '0.5rem' }}>
              You can find the tournament ID in the URL of the tournament registrations page
            </small>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button
              onClick={handleCleanup}
              disabled={loading}
              className="submit-button"
              style={{ flex: 1 }}
            >
              {loading ? '⏳ Processing...' : '🧹 Cleanup Duplicates Only'}
            </button>

            <button
              onClick={handleMigrate}
              disabled={loading}
              className="submit-button"
              style={{ flex: 1, background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
            >
              {loading ? '⏳ Processing...' : '✅ Cleanup + Migrate'}
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#fee2e2',
              border: '2px solid #ef4444',
              borderRadius: '12px',
              color: '#991b1b'
            }}>
              <strong>Error:</strong> {error}
            </div>
          )}

          {result && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              background: '#dcfce7',
              border: '2px solid #10b981',
              borderRadius: '12px',
              color: '#065f46'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#065f46' }}>✅ Success!</h3>
              
              {result.migrated ? (
                <>
                  <p><strong>Migration Complete:</strong></p>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    <li>Unique keys created: {result.keysCreated || 0}</li>
                    <li>System is now protected against duplicates</li>
                  </ul>
                </>
              ) : (
                <>
                  <p><strong>Cleanup Complete:</strong></p>
                  <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                    <li>Duplicates found: {result.duplicatesFound}</li>
                    <li>Duplicates removed: {result.duplicatesRemoved}</li>
                  </ul>
                  
                  {result.deletedEntries && result.deletedEntries.length > 0 && (
                    <details style={{ marginTop: '1rem' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                        View deleted entries ({result.deletedEntries.length})
                      </summary>
                      <ul style={{ marginTop: '0.5rem' }}>
                        {result.deletedEntries.map((entry, idx) => (
                          <li key={idx}>
                            {entry.name} - {entry.mobile}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CleanupDuplicates;
