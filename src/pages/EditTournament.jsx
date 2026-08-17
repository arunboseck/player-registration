import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTournamentById, updateTournament, uploadPhotoToStorage } from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import './RegisterPlayer.css';

const TOURNAMENT_STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

const EditTournament = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    auctionDate: '',
    status: 'Upcoming',
    description: '',
    tournamentPoster: '',
    organizerName: '',
    organizerMobile: '',
    organizerPhoto: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [posterPreview, setPosterPreview] = useState(null);
  const [organizerPhotoPreview, setOrganizerPhotoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadTournament = async () => {
      const tournament = await getTournamentById(id);
      if (tournament) {
        setFormData(tournament);
        setLoading(false);
      } else {
        alert('Tournament not found!');
        navigate('/tournaments');
      }
    };
    loadTournament();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setErrors((prev) => ({ ...prev, tournamentPoster: 'Poster size should be less than 5MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, tournamentPoster: reader.result }));
        setPosterPreview(reader.result);
        if (errors.tournamentPoster) {
          setErrors((prev) => ({ ...prev, tournamentPoster: '' }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOrganizerPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        setErrors((prev) => ({ ...prev, organizerPhoto: 'Photo size should be less than 5MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, organizerPhoto: reader.result }));
        setOrganizerPhotoPreview(reader.result);
        if (errors.organizerPhoto) {
          setErrors((prev) => ({ ...prev, organizerPhoto: '' }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tournament name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!formData.auctionDate) newErrors.auctionDate = 'Auction date is required';
    if (formData.auctionDate && formData.startDate && new Date(formData.auctionDate) > new Date(formData.startDate)) {
      newErrors.auctionDate = 'Auction date must be before or on the start date';
    }
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    // Organizer details validation
    if (!formData.organizerName || !formData.organizerName.trim()) newErrors.organizerName = 'Organizer name is required';
    if (!formData.organizerMobile || !formData.organizerMobile.trim()) {
      newErrors.organizerMobile = 'Organizer mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.organizerMobile.trim())) {
      newErrors.organizerMobile = 'Please enter a valid 10-digit mobile number';
    }
    if (!formData.organizerPhoto) newErrors.organizerPhoto = 'Organizer photo is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setUploading(true);
      try {
        // Upload tournament poster if it's a new file
        let tournamentPosterURL = formData.tournamentPoster;
        if (formData.tournamentPoster && formData.tournamentPoster.startsWith('data:image/')) {
          console.log('📤 Uploading tournament poster...');
          const tempId = `poster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          tournamentPosterURL = await uploadPhotoToStorage(formData.tournamentPoster, tempId);
        }

        // Upload organizer photo if it's a new file
        let organizerPhotoURL = formData.organizerPhoto;
        if (formData.organizerPhoto && formData.organizerPhoto.startsWith('data:image/')) {
          console.log('📤 Uploading organizer photo...');
          const tempId = `organizer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          organizerPhotoURL = await uploadPhotoToStorage(formData.organizerPhoto, tempId);
        }

        const updatedData = {
          ...formData,
          tournamentPoster: tournamentPosterURL,
          organizerPhoto: organizerPhotoURL
        };

        await updateTournament(id, updatedData);
        alert('Tournament updated successfully!');
        navigate('/tournaments');
      } catch (error) {
        console.error('Error updating tournament:', error);
        alert('Error updating tournament. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#667eea'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="register-container">
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

      <div className="register-content">
        <div className="register-form-container">
          <h2>Edit Tournament</h2>
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-group">
                <label>Tournament Name *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Enter tournament name" />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label>Location *</label>
                <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="Enter location" />
                {errors.location && <span className="error-message">{errors.location}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
                {errors.startDate && <span className="error-message">{errors.startDate}</span>}
              </div>
              <div className="form-group">
                <label>End Date *</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} />
                {errors.endDate && <span className="error-message">{errors.endDate}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Auction Date *</label>
                <input type="date" name="auctionDate" value={formData.auctionDate || ''} onChange={handleChange} />
                {errors.auctionDate && <span className="error-message">{errors.auctionDate}</span>}
                <small style={{display: 'block', marginTop: '0.5rem', color: '#6b7280', fontSize: '0.85rem'}}>
                  Registration will be disabled once auction date is reached
                </small>
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select name="status" value={formData.status} onChange={handleChange}>
                  {TOURNAMENT_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description *</label>
              <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Enter tournament description" rows="4" />
              {errors.description && <span className="error-message">{errors.description}</span>}
            </div>

            <div className="form-group">
              <label>Tournament Poster (Optional)</label>
              <input type="file" accept="image/*" onChange={handlePosterChange} style={{ padding: '0.5rem' }} />
              {errors.tournamentPoster && <span className="error-message">{errors.tournamentPoster}</span>}
              {(posterPreview || formData.tournamentPoster) && (
                <div style={{ marginTop: '1rem' }}>
                  <img src={posterPreview || formData.tournamentPoster} alt="Tournament Poster Preview"
                    style={{ maxWidth: '300px', maxHeight: '400px', borderRadius: '8px', border: '2px solid #e5e7eb', objectFit: 'contain' }} />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#10b981' }}>
                    ✓ {posterPreview ? 'New poster uploaded' : 'Current poster'}
                  </p>
                </div>
              )}
            </div>

            <div className="form-section-divider">
              <h3>Organizer Details</h3>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Organizer Name *</label>
                <input type="text" name="organizerName" value={formData.organizerName || ''} onChange={handleChange} placeholder="Enter organizer name" />
                {errors.organizerName && <span className="error-message">{errors.organizerName}</span>}
              </div>
              <div className="form-group">
                <label>Organizer Mobile *</label>
                <input type="tel" name="organizerMobile" value={formData.organizerMobile || ''} onChange={handleChange} placeholder="Enter 10-digit mobile number" maxLength="10" />
                {errors.organizerMobile && <span className="error-message">{errors.organizerMobile}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Organizer Photo *</label>
              <input type="file" accept="image/*" onChange={handleOrganizerPhotoChange} style={{ padding: '0.5rem' }} />
              {errors.organizerPhoto && <span className="error-message">{errors.organizerPhoto}</span>}
              {(organizerPhotoPreview || formData.organizerPhoto) && (
                <div style={{ marginTop: '1rem' }}>
                  <img src={organizerPhotoPreview || formData.organizerPhoto} alt="Organizer Photo Preview"
                    style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #e5e7eb' }} />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#10b981' }}>
                    ✓ {organizerPhotoPreview ? 'New photo uploaded' : 'Current photo'}
                  </p>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/tournaments')} className="btn-secondary">Cancel</button>
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? '⏳ Updating...' : 'Update Tournament'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTournament;
