import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPlayers, updatePlayer } from '../utils/storage';
import { useAuth } from '../contexts/AuthContext';
import './RegisterPlayer.css';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const POSITIONS = [
  'ALL ROUNDER',
  'LEFT ARM MEDIUM (BOWLING)',
  'LEFT ARM FAST MEDIUM (BOWLING)',
  'LEFT ARM FAST (BOWLING)',
  'LEFT HAND BATTING (BATTER)',
  'RIGHT ARM MEDIUM (BOWLING)',
  'RIGHT ARM FAST MEDIUM (BOWLING)',
  'RIGHT ARM FAST (BOWLING)',
  'RIGHT HAND BATTING (BATTER)',
  'WICKET KEEPER BATTER',
];

const EditPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    dateOfBirth: '',
    bloodGroup: '',
    place: '',
    position: '',
    photo: null,
  });
  const [photoPreview, setPhotoPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load player data
    const players = getPlayers();
    const player = players.find(p => p.id === id);
    
    if (player) {
      setFormData({
        name: player.name,
        mobile: player.mobile,
        dateOfBirth: player.dateOfBirth,
        bloodGroup: player.bloodGroup,
        place: player.place,
        position: player.position,
        photo: player.photo,
      });
      setPhotoPreview(player.photo);
    } else {
      navigate('/players');
    }
    setLoading(false);
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrors((prev) => ({ ...prev, photo: 'Please select an image file' }));
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, photo: 'Image size should be less than 5MB' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
        setFormData((prev) => ({
          ...prev,
          photo: reader.result,
        }));
      };
      reader.readAsDataURL(file);
      setErrors((prev) => ({ ...prev, photo: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.bloodGroup) {
      newErrors.bloodGroup = 'Blood group is required';
    }

    if (!formData.place.trim()) {
      newErrors.place = 'Place is required';
    }

    if (!formData.position) {
      newErrors.position = 'Position of play is required';
    }

    if (!formData.photo) {
      newErrors.photo = 'Player photo is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(false);

    if (validateForm()) {
      try {
        updatePlayer(id, formData);
        setSuccess(true);
        setTimeout(() => {
          navigate('/players');
        }, 1500);
      } catch (error) {
        setErrors({ submit: 'Failed to update player. Please try again.' });
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="register-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Cricket Player Management</h1>
        </div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-nav">
            Dashboard
          </button>
          <button onClick={() => navigate('/players')} className="btn-nav">
            Players
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="register-content">
        <h2>Edit Player Details</h2>
        {success && (
          <div className="success-message">
            Player updated successfully! Redirecting to players list...
          </div>
        )}
        {errors.submit && <div className="error-message">{errors.submit}</div>}

        <form onSubmit={handleSubmit} className="player-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name <span className="required">*</span></label>
              <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Enter player name" />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="mobile">Mobile Number <span className="required">*</span></label>
              <input type="tel" id="mobile" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="Enter 10-digit mobile number" />
              {errors.mobile && <span className="error-text">{errors.mobile}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateOfBirth">Date of Birth <span className="required">*</span></label>
              <input type="date" id="dateOfBirth" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleChange} />
              {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="bloodGroup">Blood Group <span className="required">*</span></label>
              <select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              {errors.bloodGroup && <span className="error-text">{errors.bloodGroup}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="place">Place <span className="required">*</span></label>
              <input type="text" id="place" name="place" value={formData.place} onChange={handleChange} placeholder="Enter place" />
              {errors.place && <span className="error-text">{errors.place}</span>}
            </div>
            <div className="form-group">
              <label htmlFor="position">Position of Play <span className="required">*</span></label>
              <select id="position" name="position" value={formData.position} onChange={handleChange}>
                <option value="">Select position</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
              {errors.position && <span className="error-text">{errors.position}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="photo">Player Photo <span className="required">*</span></label>
            <input type="file" id="photo" name="photo" accept="image/*" onChange={handlePhotoChange} />
            {errors.photo && <span className="error-text">{errors.photo}</span>}
            {photoPreview && (
              <div className="photo-preview">
                <img src={photoPreview} alt="Player preview" />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">Update Player</button>
            <button type="button" onClick={() => navigate('/players')} className="btn-cancel">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPlayer;
