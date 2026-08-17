import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addTournament, uploadPhotoToStorage } from '../utils/firebaseStorage';
import { useAuth } from '../contexts/AuthContext';
import './RegisterPlayer.css';

const TOURNAMENT_STATUSES = ['Upcoming', 'Ongoing', 'Completed', 'Cancelled'];

const AddTournament = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    status: 'Upcoming',
    description: '',
    organizerName: '',
    organizerMobile: '',
    organizerPhoto: '',
    tournamentPoster: '',
  });
  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        setErrors((prev) => ({ ...prev, organizerPhoto: 'Photo size should be less than 5MB' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, organizerPhoto: reader.result }));
        setPhotoPreview(reader.result);
        if (errors.organizerPhoto) {
          setErrors((prev) => ({ ...prev, organizerPhoto: '' }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePosterChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Tournament name is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.endDate) < new Date(formData.startDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    // Organizer details validation
    if (!formData.organizerName.trim()) newErrors.organizerName = 'Organizer name is required';
    if (!formData.organizerMobile.trim()) {
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
        // Upload organizer photo to Cloudinary first
        let organizerPhotoURL = formData.organizerPhoto;
        if (formData.organizerPhoto && formData.organizerPhoto.startsWith('data:image/')) {
          console.log('📤 Uploading organizer photo to Cloudinary...');
          const tempId = `organizer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          organizerPhotoURL = await uploadPhotoToStorage(formData.organizerPhoto, tempId);
          console.log('✅ Organizer photo uploaded successfully');
        }

        // Upload tournament poster to Cloudinary
        let tournamentPosterURL = formData.tournamentPoster;
        if (formData.tournamentPoster && formData.tournamentPoster.startsWith('data:image/')) {
          console.log('📤 Uploading tournament poster to Cloudinary...');
          const tempId = `poster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          tournamentPosterURL = await uploadPhotoToStorage(formData.tournamentPoster, tempId);
          console.log('✅ Tournament poster uploaded successfully');
        }

        // Create tournament with organizer photo URL and poster URL
        const tournamentData = {
          ...formData,
          organizerPhoto: organizerPhotoURL,
          tournamentPoster: tournamentPosterURL
        };

        await addTournament(tournamentData);
        alert('Tournament created successfully!');
        navigate('/tournaments');
      } catch (error) {
        console.error('Error creating tournament:', error);
        alert('Error creating tournament. Please try again.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="register-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>Cricket Player Management</h1>
        </div>
        <div className="navbar-actions">
          <button onClick={() => navigate('/dashboard')} className="btn-nav">Dashboard</button>
          <button onClick={() => navigate('/tournaments')} className="btn-nav">Tournaments</button>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>

      <div className="register-content">
        <div className="register-form-container">
          <h2>Create New Tournament</h2>
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
              <input
                type="file"
                accept="image/*"
                onChange={handlePosterChange}
                style={{ padding: '0.5rem' }}
              />
              {errors.tournamentPoster && <span className="error-message">{errors.tournamentPoster}</span>}
              {posterPreview && (
                <div style={{ marginTop: '1rem' }}>
                  <img
                    src={posterPreview}
                    alt="Tournament Poster Preview"
                    style={{
                      maxWidth: '300px',
                      maxHeight: '400px',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      objectFit: 'contain'
                    }}
                  />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#10b981' }}>
                    ✓ Poster uploaded successfully
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
                <input
                  type="text"
                  name="organizerName"
                  value={formData.organizerName}
                  onChange={handleChange}
                  placeholder="Enter organizer name"
                />
                {errors.organizerName && <span className="error-message">{errors.organizerName}</span>}
              </div>
              <div className="form-group">
                <label>Organizer Mobile *</label>
                <input
                  type="tel"
                  name="organizerMobile"
                  value={formData.organizerMobile}
                  onChange={handleChange}
                  placeholder="Enter 10-digit mobile number"
                  maxLength="10"
                />
                {errors.organizerMobile && <span className="error-message">{errors.organizerMobile}</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Organizer Photo *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                style={{ padding: '0.5rem' }}
              />
              {errors.organizerPhoto && <span className="error-message">{errors.organizerPhoto}</span>}
              {photoPreview && (
                <div style={{ marginTop: '1rem' }}>
                  <img
                    src={photoPreview}
                    alt="Organizer Preview"
                    style={{
                      maxWidth: '150px',
                      maxHeight: '150px',
                      border: '2px solid #ddd',
                      borderRadius: '8px',
                      objectFit: 'cover'
                    }}
                  />
                </div>
              )}
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/tournaments')} className="btn-secondary" disabled={uploading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Creating Tournament...' : 'Create Tournament'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddTournament;
