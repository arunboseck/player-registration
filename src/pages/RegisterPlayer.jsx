import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addPlayer, getPlayerByMobile } from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import './RegisterPlayer.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const POSITIONS = [
  'ALL ROUNDER', 'LEFT ARM ORTHODOX (BOWLING)', 'LEFT ARM CHINAMAN (BOWLING)',
  'LEFT ARM MEDIUM FAST (BOWLING)', 'LEFT ARM FAST MEDIUM (BOWLING)', 'LEFT ARM FAST (BOWLING)',
  'LEFT HAND BATTING (BATTER)', 'RIGHT ARM OFF BREAK (BOWLING)', 'RIGHT ARM LEG BREAK (BOWLING)',
  'RIGHT ARM MEDIUM FAST (BOWLING)', 'RIGHT ARM FAST MEDIUM (BOWLING)', 'RIGHT ARM FAST (BOWLING)',
  'RIGHT HAND BATTING (BATTER)', 'WICKET KEEPER BATTER'
];

const RegisterPlayer = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '', mobile: '', dateOfBirth: '', bloodGroup: '', place: '', position: '', photo: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Check if mobile number already exists
    const existingPlayer = await getPlayerByMobile(formData.mobile);
    if (existingPlayer) {
      setError(`A player with mobile number ${formData.mobile} already exists: ${existingPlayer.name}`);
      setLoading(false);
      return;
    }

    try {
      await addPlayer(formData);
      navigate('/players');
    } catch (err) {
      setError('Failed to register player. Please try again.');
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(''); // Clear error when user types
  };

  return (
    <div className="register-container">
      <Navigation />
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>🏏 Cricket Player Management</h1>
        </div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-nav">Dashboard</button>
          <button onClick={() => navigate('/players')} className="btn-nav">All Players</button>
          <button onClick={() => { logout(); navigate('/'); }} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="register-content">
        <div className="register-header">
          <h2>Register New Player</h2>
          <p>Add a new player to the cricket management system</p>
        </div>

        {error && (
          <div className="error-alert">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter player's full name"
                required
              />
            </div>
            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter mobile number"
                pattern="[0-9]{10}"
                title="Please enter a valid 10-digit mobile number"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Blood Group</label>
              <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                <option value="">Select Blood Group</option>
                {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Place *</label>
              <input
                type="text"
                name="place"
                value={formData.place}
                onChange={handleChange}
                placeholder="Enter place/location"
                required
              />
            </div>
            <div className="form-group">
              <label>Position *</label>
              <select name="position" value={formData.position} onChange={handleChange} required>
                <option value="">Select Position</option>
                {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group form-group-full">
            <label>Player Photo (Optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="file-input"
            />
            {formData.photo && (
              <div className="photo-preview">
                <img src={formData.photo} alt="Preview" />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/players')}
              className="btn-cancel"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Register Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPlayer;
