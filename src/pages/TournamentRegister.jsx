import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournamentById, addTournamentRegistration } from '../utils/storage';
import './TournamentRegister.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const POSITIONS = [
  'ALL ROUNDER', 'LEFT ARM MEDIUM (BOWLING)', 'LEFT ARM FAST MEDIUM (BOWLING)',
  'LEFT ARM FAST (BOWLING)', 'LEFT HAND BATTING (BATTER)', 'RIGHT ARM MEDIUM (BOWLING)',
  'RIGHT ARM FAST MEDIUM (BOWLING)', 'RIGHT ARM FAST (BOWLING)', 'RIGHT HAND BATTING (BATTER)',
  'WICKET KEEPER BATTER'
];

const TournamentRegister = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '', mobile: '', dateOfBirth: '', bloodGroup: '', place: '', position: '', photo: ''
  });

  useEffect(() => {
    const tournamentData = getTournamentById(id);
    if (tournamentData) {
      setTournament(tournamentData);
    }
    // If tournament is not found, we'll show an error message instead of redirecting
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      const result = addTournamentRegistration(id, formData);

      if (!result.success) {
        // Player is already registered for this tournament
        setError(true);
        setErrorMessage(result.message);
        setTimeout(() => {
          setError(false);
          setErrorMessage('');
        }, 6000);
        return;
      }

      // Success - registration added
      setSuccess(true);
      setSuccessMessage(result.message);
      setFormData({
        name: '', mobile: '', dateOfBirth: '', bloodGroup: '', place: '', position: '', photo: ''
      });
      setTimeout(() => {
        setSuccess(false);
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      setError(true);
      setErrorMessage('Error registering for tournament. Please try again.');
      setTimeout(() => {
        setError(false);
        setErrorMessage('');
      }, 5000);
    }
  };

  if (!tournament) {
    return (
      <div className="public-register-container">
        <div className="public-register-content">
          <div className="public-header" style={{textAlign: 'center', padding: '3rem 1.5rem'}}>
            <h1 style={{fontSize: '2rem', marginBottom: '1rem', color: '#dc2626'}}>⚠️ Tournament Not Found</h1>
            <p style={{fontSize: '1.1rem', marginBottom: '1.5rem', color: '#64748b'}}>
              The tournament you're trying to register for doesn't exist or the registration link is invalid.
            </p>
            <p style={{fontSize: '0.95rem', color: '#94a3b8'}}>
              Please contact the tournament organizer for the correct registration link.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="public-register-container">
      <div className="public-register-content">
        <div className="public-header">
          <h1>{tournament.name}</h1>
          <p><strong>{tournament.location}</strong></p>
          <p>{new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}</p>
          <p style={{marginTop: '1rem'}}>{tournament.description}</p>
        </div>

        <div className="public-player-form">
          <h2>Register for {tournament.name}</h2>

          {success && (
            <div className="success-message">
              <div style={{fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem'}}>
                ✅ Successfully Registered!
              </div>
              <div style={{fontSize: '0.9rem'}}>
                {successMessage}
              </div>
              <div style={{fontSize: '0.85rem', marginTop: '0.5rem', opacity: '0.9'}}>
                You can register another player.
              </div>
            </div>
          )}

          {error && (
            <div className="error-message">
              <div style={{fontSize: '1.1rem', fontWeight: '700', marginBottom: '0.5rem'}}>
                ⚠️ Registration Failed
              </div>
              <div style={{fontSize: '0.9rem'}}>
                {errorMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Mobile Number *</label>
                <input type="tel" name="mobile" value={formData.mobile} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Date of Birth *</label>
                <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Blood Group *</label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required>
                  <option value="">Select Blood Group</option>
                  {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Place *</label>
                <input type="text" name="place" value={formData.place} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Position *</label>
                <select name="position" value={formData.position} onChange={handleChange} required>
                  <option value="">Select Position</option>
                  {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
            </div>

            <div className="form-group" style={{marginBottom: '1.25rem'}}>
              <label>Player Photo (Optional)</label>
              <input type="file" accept="image/*" onChange={handlePhotoChange} />
            </div>

            <button type="submit" className="submit-button">
              Register for Tournament
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TournamentRegister;
