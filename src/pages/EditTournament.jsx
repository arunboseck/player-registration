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
  });
  const [organizers, setOrganizers] = useState([
    { name: '', mobile: '', photo: '', photoPreview: null }
  ]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [posterPreview, setPosterPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadTournament = async () => {
      const tournament = await getTournamentById(id);
      if (tournament) {
        const { organizers: tournamentOrganizers, organizerName, organizerMobile, organizerPhoto, ...tournamentData } = tournament;
        setFormData(tournamentData);

        // Load existing organizers or convert from old format
        if (tournamentOrganizers && Array.isArray(tournamentOrganizers) && tournamentOrganizers.length > 0) {
          setOrganizers(tournamentOrganizers.map(org => ({
            ...org,
            photoPreview: org.photo || null
          })));
        } else if (organizerName || organizerMobile || organizerPhoto) {
          // Backward compatibility
          setOrganizers([{
            name: organizerName || '',
            mobile: organizerMobile || '',
            photo: organizerPhoto || '',
            photoPreview: organizerPhoto || null
          }]);
        }

        // Set poster preview if exists
        if (tournament.tournamentPoster) {
          setPosterPreview(tournament.tournamentPoster);
        }

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

  const handleOrganizerChange = (index, field, value) => {
    const updatedOrganizers = [...organizers];
    updatedOrganizers[index][field] = value;
    setOrganizers(updatedOrganizers);

    // Clear error for this field
    const errorKey = `organizer_${index}_${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: '' }));
    }
  };

  const handleOrganizerPhotoChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) { // 5MB limit
        setErrors((prev) => ({ ...prev, [`organizer_${index}_photo`]: 'Photo size should be less than 5MB' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedOrganizers = [...organizers];
        updatedOrganizers[index].photo = reader.result;
        updatedOrganizers[index].photoPreview = reader.result;
        setOrganizers(updatedOrganizers);

        if (errors[`organizer_${index}_photo`]) {
          setErrors((prev) => ({ ...prev, [`organizer_${index}_photo`]: '' }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addOrganizer = () => {
    setOrganizers([...organizers, { name: '', mobile: '', photo: '', photoPreview: null }]);
  };

  const removeOrganizer = (index) => {
    if (organizers.length > 1) {
      const updatedOrganizers = organizers.filter((_, i) => i !== index);
      setOrganizers(updatedOrganizers);

      // Remove errors for this organizer
      const newErrors = { ...errors };
      delete newErrors[`organizer_${index}_name`];
      delete newErrors[`organizer_${index}_mobile`];
      delete newErrors[`organizer_${index}_photo`];
      setErrors(newErrors);
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
    if (!formData.auctionDate) newErrors.auctionDate = 'Auction date is required';
    if (formData.auctionDate && formData.startDate && new Date(formData.auctionDate) > new Date(formData.startDate)) {
      newErrors.auctionDate = 'Auction date must be before or on the start date';
    }
    if (!formData.description.trim()) newErrors.description = 'Description is required';

    // Organizer details validation (at least one organizer required)
    organizers.forEach((organizer, index) => {
      if (!organizer.name.trim()) {
        newErrors[`organizer_${index}_name`] = 'Organizer name is required';
      }
      if (!organizer.mobile.trim()) {
        newErrors[`organizer_${index}_mobile`] = 'Organizer mobile number is required';
      } else if (!/^[0-9]{10}$/.test(organizer.mobile.trim())) {
        newErrors[`organizer_${index}_mobile`] = 'Please enter a valid 10-digit mobile number';
      }
      if (!organizer.photo) {
        newErrors[`organizer_${index}_photo`] = 'Organizer photo is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setUploading(true);
      try {
        // Upload all organizer photos to Cloudinary
        console.log('📤 Uploading organizer photos to Cloudinary...');
        const uploadedOrganizers = await Promise.all(
          organizers.map(async (organizer, index) => {
            let photoURL = organizer.photo;
            if (organizer.photo && organizer.photo.startsWith('data:image/')) {
              const tempId = `organizer_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`;
              photoURL = await uploadPhotoToStorage(organizer.photo, tempId);
              console.log(`✅ Organizer ${index + 1} photo uploaded successfully`);
            }
            return {
              name: organizer.name,
              mobile: organizer.mobile,
              photo: photoURL
            };
          })
        );

        // Upload tournament poster to Cloudinary
        let tournamentPosterURL = formData.tournamentPoster || '';
        if (formData.tournamentPoster && formData.tournamentPoster.startsWith('data:image/')) {
          console.log('📤 Uploading tournament poster to Cloudinary...');
          const tempId = `poster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          tournamentPosterURL = await uploadPhotoToStorage(formData.tournamentPoster, tempId);
          console.log('✅ Tournament poster uploaded successfully');
        }

        // Create tournament with organizers array and poster URL
        const tournamentData = {
          ...formData,
          organizers: uploadedOrganizers,
          tournamentPoster: tournamentPosterURL
        };

        await updateTournament(id, tournamentData);
        alert('Tournament updated successfully!');
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

  if (loading) {
    return (
      <div className="register-container">
        <div className="register-content">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <h2>Loading tournament...</h2>
            <p>Please wait while we fetch the tournament details.</p>
          </div>
        </div>
      </div>
    );
  }

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
                <input type="date" name="auctionDate" value={formData.auctionDate} onChange={handleChange} />
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

            {organizers.map((organizer, index) => (
              <div key={index} style={{
                background: '#f9fafb',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '2px solid #e5e7eb',
                position: 'relative'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem'
                }}>
                  <h4 style={{ margin: 0, color: '#4b5563', fontSize: '1.1rem' }}>
                    Organizer {index + 1}
                  </h4>
                  {organizers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeOrganizer(index)}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        border: 'none',
                        padding: '0.5rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                      }}
                      onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      ✕ Remove
                    </button>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Organizer Name *</label>
                    <input
                      type="text"
                      value={organizer.name}
                      onChange={(e) => handleOrganizerChange(index, 'name', e.target.value)}
                      placeholder="Enter organizer name"
                    />
                    {errors[`organizer_${index}_name`] && (
                      <span className="error-message">{errors[`organizer_${index}_name`]}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Organizer Mobile *</label>
                    <input
                      type="tel"
                      value={organizer.mobile}
                      onChange={(e) => handleOrganizerChange(index, 'mobile', e.target.value)}
                      placeholder="Enter 10-digit mobile number"
                      maxLength="10"
                    />
                    {errors[`organizer_${index}_mobile`] && (
                      <span className="error-message">{errors[`organizer_${index}_mobile`]}</span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label>Organizer Photo *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleOrganizerPhotoChange(index, e)}
                    style={{ padding: '0.5rem' }}
                  />
                  {errors[`organizer_${index}_photo`] && (
                    <span className="error-message">{errors[`organizer_${index}_photo`]}</span>
                  )}
                  {organizer.photoPreview && (
                    <div style={{ marginTop: '1rem' }}>
                      <img
                        src={organizer.photoPreview}
                        alt={`Organizer ${index + 1} Preview`}
                        style={{
                          maxWidth: '150px',
                          maxHeight: '150px',
                          borderRadius: '50%',
                          border: '3px solid #f59e0b',
                          objectFit: 'cover'
                        }}
                      />
                      <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#10b981' }}>
                        ✓ Photo uploaded successfully
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div style={{ marginBottom: '2rem' }}>
              <button
                type="button"
                onClick={addOrganizer}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.3)';
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>+</span>
                Add Another Organizer
              </button>
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => navigate('/tournaments')} className="btn-secondary" disabled={uploading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Updating Tournament...' : 'Update Tournament'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditTournament;
