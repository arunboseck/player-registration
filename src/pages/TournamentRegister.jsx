import { useState, useEffect, useRef } from 'react';
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
  const [dob, setDob] = useState({ day: '', month: '', year: '' });
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  useEffect(() => {
    const loadTournament = async () => {
      const tournamentData = await getTournamentById(id);
      if (tournamentData) {
        setTournament(tournamentData);
      }
      // If tournament is not found, we'll show an error message instead of redirecting
    };
    loadTournament();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDobChange = (field, value) => {
    // Allow only numbers
    const numericValue = value.replace(/[^0-9]/g, '');

    if (field === 'day') {
      if (numericValue.length <= 2) {
        const dayValue = numericValue === '' ? '' : Math.min(parseInt(numericValue) || 0, 31).toString();
        setDob((prev) => ({ ...prev, day: dayValue }));
        if (numericValue.length === 2) {
          monthRef.current?.focus();
        }
      }
    } else if (field === 'month') {
      if (numericValue.length <= 2) {
        const monthValue = numericValue === '' ? '' : Math.min(parseInt(numericValue) || 0, 12).toString();
        setDob((prev) => ({ ...prev, month: monthValue }));
        if (numericValue.length === 2) {
          yearRef.current?.focus();
        }
      }
    } else if (field === 'year') {
      if (numericValue.length <= 4) {
        setDob((prev) => ({ ...prev, year: numericValue }));
      }
    }

    // Update formData with combined date
    const newDob = { ...dob, [field]: numericValue };
    if (newDob.day && newDob.month && newDob.year && newDob.year.length === 4) {
      const formattedDate = `${newDob.year}-${newDob.month.padStart(2, '0')}-${newDob.day.padStart(2, '0')}`;
      setFormData((prev) => ({ ...prev, dateOfBirth: formattedDate }));
    }
  };

  const handleDobKeyDown = (field, e) => {
    // Handle backspace to go to previous field
    if (e.key === 'Backspace') {
      if (field === 'month' && dob.month === '') {
        dayRef.current?.focus();
      } else if (field === 'year' && dob.year === '') {
        monthRef.current?.focus();
      }
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const result = await addTournamentRegistration(id, formData);

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
                <label>Date of Birth (DD/MM/YYYY) *</label>
                <div className="dob-input-container">
                  <input
                    ref={dayRef}
                    type="text"
                    placeholder="DD"
                    value={dob.day}
                    onChange={(e) => handleDobChange('day', e.target.value)}
                    onKeyDown={(e) => handleDobKeyDown('day', e)}
                    maxLength={2}
                    className="dob-input"
                    required
                  />
                  <span className="dob-separator">/</span>
                  <input
                    ref={monthRef}
                    type="text"
                    placeholder="MM"
                    value={dob.month}
                    onChange={(e) => handleDobChange('month', e.target.value)}
                    onKeyDown={(e) => handleDobKeyDown('month', e)}
                    maxLength={2}
                    className="dob-input"
                    required
                  />
                  <span className="dob-separator">/</span>
                  <input
                    ref={yearRef}
                    type="text"
                    placeholder="YYYY"
                    value={dob.year}
                    onChange={(e) => handleDobChange('year', e.target.value)}
                    onKeyDown={(e) => handleDobKeyDown('year', e)}
                    maxLength={4}
                    className="dob-input dob-input-year"
                    required
                  />
                </div>
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
