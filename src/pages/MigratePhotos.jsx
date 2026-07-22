import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { migrateAllPhotosToStorage } from '../utils/migratePhotosToStorage';
import LoadingSpinner from '../components/LoadingSpinner';
import './Players.css';

const MigratePhotos = () => {
  const navigate = useNavigate();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);

  const handleMigrate = async () => {
    if (!window.confirm('This will convert all base64 photos to Cloudinary URLs (FREE cloud storage). Continue?')) {
      return;
    }

    setMigrating(true);
    setResult(null);

    try {
      const migrationResult = await migrateAllPhotosToStorage();
      setResult(migrationResult);
    } catch (error) {
      setResult({
        success: false,
        error: error.message
      });
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="players-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Photo Migration Tool</h1>
        </div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-nav">
            Back to Dashboard
          </button>
        </div>
      </nav>

      <div className="players-content">
        <div className="migration-panel" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2>Migrate Photos to Cloudinary (FREE)</h2>
          
          <div className="info-box" style={{ 
            padding: '20px', 
            backgroundColor: '#f0f9ff', 
            border: '1px solid #3b82f6',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginTop: 0, color: '#1e40af' }}>📸 What This Does:</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li><strong>Converts</strong> all base64-encoded photos in the database</li>
              <li><strong>Uploads</strong> them to Cloudinary (FREE cloud storage)</li>
              <li><strong>Replaces</strong> base64 data with lightweight URLs</li>
              <li><strong>Result:</strong> 99% smaller database, 100x faster loading!</li>
            </ul>

            <h3 style={{ color: '#1e40af' }}>⚠️ Before You Start:</h3>
            <ul style={{ lineHeight: '1.8' }}>
              <li>Make sure Cloudinary credentials are configured (check console logs if errors occur)</li>
              <li>This process may take 5-10 minutes for 170 players</li>
              <li>Do not close this page during migration</li>
              <li>Safe to run multiple times (skips already-migrated photos)</li>
            </ul>
          </div>

          {migrating && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <LoadingSpinner />
              <p style={{ marginTop: '20px', fontSize: '18px' }}>
                Migrating photos to Cloudinary... This may take several minutes.
              </p>
              <p style={{ color: '#6b7280' }}>
                Check the browser console for progress updates.
              </p>
            </div>
          )}

          {result && !migrating && (
            <div className={`result-box ${result.success ? 'success' : 'error'}`} style={{
              padding: '20px',
              backgroundColor: result.success ? '#f0fdf4' : '#fef2f2',
              border: `1px solid ${result.success ? '#22c55e' : '#ef4444'}`,
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ 
                marginTop: 0, 
                color: result.success ? '#15803d' : '#dc2626' 
              }}>
                {result.success ? '✅ Migration Complete!' : '❌ Migration Failed'}
              </h3>
              
              {result.success && (
                <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
                  <p><strong>Total players:</strong> {result.total}</p>
                  <p><strong>Migrated:</strong> {result.migrated} photos</p>
                  <p><strong>Skipped:</strong> {result.skipped} (already using URLs or no photo)</p>
                  <p><strong>Failed:</strong> {result.failed}</p>
                  <p><strong>Duration:</strong> {result.duration}</p>
                  
                  {result.migrated > 0 && (
                    <div style={{
                      marginTop: '20px',
                      padding: '15px',
                      backgroundColor: '#dcfce7',
                      borderRadius: '6px'
                    }}>
                      <strong>🎉 Success!</strong> Your photos are now stored in Cloudinary (FREE cloud storage).
                      <br/>
                      The players page should now load <strong>100x faster</strong>!
                    </div>
                  )}
                </div>
              )}
              
              {!result.success && (
                <p style={{ color: '#dc2626' }}>
                  Error: {result.error}
                </p>
              )}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="btn-add"
              style={{ 
                fontSize: '18px', 
                padding: '15px 40px',
                cursor: migrating ? 'not-allowed' : 'pointer',
                opacity: migrating ? 0.5 : 1
              }}
            >
              {migrating ? 'Migrating...' : '🚀 Start Migration'}
            </button>
          </div>

          <div style={{
            marginTop: '30px',
            padding: '15px',
            backgroundColor: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '6px',
            fontSize: '14px'
          }}>
            <strong>💡 Tip:</strong> After migration completes, new players will automatically
            use Cloudinary for photos. No further action needed!
          </div>
        </div>
      </div>
    </div>
  );
};

export default MigratePhotos;
