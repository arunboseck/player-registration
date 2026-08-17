import { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { getTournamentById, addTournamentRegistration, uploadPhotoToStorage, getPlayerByMobile, addPlayer } from '../utils/firebaseStorage';
import { ref as dbRef, get } from 'firebase/database';
import { database } from '../firebase/config';
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
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', mobile: '', dateOfBirth: '', bloodGroup: '', place: '', position: '', photo: ''
  });
  const [dob, setDob] = useState({ day: '', month: '', year: '' });
  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  // Two-step registration states
  const [showSearch, setShowSearch] = useState(true);
  const [searchMobile, setSearchMobile] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundPlayer, setFoundPlayer] = useState(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [alreadyRegisteredPlayer, setAlreadyRegisteredPlayer] = useState(null);

  useEffect(() => {
    const loadTournament = async () => {
      try {
        setLoading(true);
        const tournamentData = await getTournamentById(id);
        if (tournamentData) {
          setTournament(tournamentData);
        }
      } catch (error) {
        console.error('Error loading tournament:', error);
      } finally {
        setLoading(false);
      }
    };
    loadTournament();
  }, [id]);

  const handleSearchPlayer = async () => {
    if (!searchMobile.trim() || searchMobile.length < 10) {
      setError(true);
      setErrorMessage('Please enter a valid 10-digit mobile number');
      setTimeout(() => setError(false), 3000);
      return;
    }

    setSearching(true);
    setFoundPlayer(null);
    setAlreadyRegistered(false);
    setAlreadyRegisteredPlayer(null);

    try {
      const player = await getPlayerByMobile(searchMobile.trim());

      if (player) {
        // Check if player is already registered for this tournament
        const sanitizedMobile = searchMobile.trim().replace(/[^0-9]/g, '');
        const uniqueRegistrationKey = `${id}_${sanitizedMobile}`;
        const uniqueCheckRef = dbRef(database, `tournament_registrations_unique/${uniqueRegistrationKey}`);
        const uniqueSnapshot = await get(uniqueCheckRef);

        if (uniqueSnapshot.exists()) {
          // Player is already registered
          console.log('Already registered player data:', player);
          console.log('Player photo URL:', player.photo);
          setAlreadyRegistered(true);
          setAlreadyRegisteredPlayer({
            ...player,
            tournamentName: tournament.name
          });
        } else {
          // Player found and not registered yet
          setFoundPlayer(player);
        }
      } else {
        setError(true);
        setErrorMessage('No player found with this mobile number. Click "Register New Player" to continue.');
        setTimeout(() => setError(false), 5000);
      }
    } catch (error) {
      console.error('Error searching player:', error);
      setError(true);
      setErrorMessage('Error searching for player. Please try again.');
      setTimeout(() => setError(false), 3000);
    } finally {
      setSearching(false);
    }
  };

  const handleQuickJoin = async () => {
    if (!foundPlayer) return;

    setSubmitting(true);
    setIsSubmitting(true);

    try {
      const registrationData = {
        name: foundPlayer.name,
        mobile: foundPlayer.mobile,
        dateOfBirth: foundPlayer.dateOfBirth,
        bloodGroup: foundPlayer.bloodGroup,
        place: foundPlayer.place,
        position: foundPlayer.position,
        photo: foundPlayer.photo || '',
        registeredAt: new Date().toISOString(),
      };

      const result = await addTournamentRegistration(id, registrationData);

      if (!result.success) {
        // Player is already registered - show the already registered modal
        setAlreadyRegistered(true);
        setAlreadyRegisteredPlayer({
          ...foundPlayer,
          tournamentName: tournament.name
        });
        setFoundPlayer(null);
      } else {
        // Success - show success message and reset
        setSuccess(true);
        setSuccessMessage(`🎉 ${foundPlayer.name} successfully registered for ${tournament.name}!`);

        // Reset search form after 3 seconds
        setTimeout(() => {
          setFoundPlayer(null);
          setSearchMobile('');
          setSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error('Error registering player:', error);
      setError(true);
      setErrorMessage('Failed to register. Please try again.');
      setTimeout(() => setError(false), 4000);
    } finally {
      setSubmitting(false);
      setIsSubmitting(false);
    }
  };

  const handleShowRegisterForm = () => {
    setShowSearch(false);
    setShowRegisterForm(true);
    // Pre-fill mobile if searched
    if (searchMobile.trim()) {
      setFormData(prev => ({ ...prev, mobile: searchMobile.trim() }));
    }
  };

  const handleBackToSearch = () => {
    setShowSearch(true);
    setShowRegisterForm(false);
    setFoundPlayer(null);
    setSearchMobile('');
  };

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
        // Store base64 temporarily for preview and later upload to Cloudinary
        setFormData((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent multiple submissions
    if (submitting) {
      return;
    }

    // Validate photo is uploaded
    if (!formData.photo) {
      setError(true);
      setErrorMessage('Player photo is required. Please upload a photo before submitting.');
      setTimeout(() => {
        setError(false);
        setErrorMessage('');
      }, 5000);
      return;
    }

    // Validate mobile number format
    if (!formData.mobile || formData.mobile.length < 10) {
      setError(true);
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      setTimeout(() => {
        setError(false);
        setErrorMessage('');
      }, 5000);
      return;
    }

    // Check for recent submission lock (prevents double-click and race conditions)
    const lockKey = `registration_lock_${id}_${formData.mobile}`;
    const lockTime = localStorage.getItem(lockKey);
    if (lockTime && Date.now() - parseInt(lockTime) < 5000) {
      setError(true);
      setErrorMessage('Please wait a moment before submitting again.');
      setTimeout(() => {
        setError(false);
        setErrorMessage('');
      }, 3000);
      return;
    }

    // Set lock
    localStorage.setItem(lockKey, Date.now().toString());
    setSubmitting(true);
    setIsSubmitting(true);
    setIsSubmitting(true);

    try {
      // Upload photo to Cloudinary first (if it's base64)
      let photoURL = formData.photo;
      if (formData.photo && formData.photo.startsWith('data:image/')) {
        console.log('📤 Uploading photo to Cloudinary...');
        try {
          // Generate a unique ID for this registration photo
          const tempId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          photoURL = await uploadPhotoToStorage(formData.photo, tempId);
          console.log('✅ Photo uploaded to Cloudinary:', photoURL.substring(0, 50) + '...');
        } catch (photoError) {
          console.error('❌ Photo upload failed:', photoError);
          setError(true);
          setErrorMessage('Failed to upload photo. Please try again.');
          setSubmitting(false);
          setIsSubmitting(false);
          localStorage.removeItem(lockKey);
          setTimeout(() => {
            setError(false);
            setErrorMessage('');
          }, 5000);
          return;
        }
      }

      // Step 1: Add player to main players list (with Cloudinary URL)
      // addPlayer now handles duplicate checking internally
      console.log('📝 Adding player to main players list...');
      const playerData = {
        name: formData.name,
        mobile: formData.mobile,
        dateOfBirth: formData.dateOfBirth,
        bloodGroup: formData.bloodGroup,
        place: formData.place,
        position: formData.position,
        photo: photoURL // Cloudinary URL
      };

      await addPlayer(playerData);
      console.log('✅ Player check/add complete');

      // Step 2: Add tournament registration with Cloudinary URL
      console.log('🏆 Registering player for tournament...');
      const registrationData = {
        ...formData,
        photo: photoURL
      };
      const result = await addTournamentRegistration(id, registrationData);

      if (!result.success) {
        // Player is already registered for this tournament
        setError(true);
        setErrorMessage(result.message);
        setSubmitting(false);
        setIsSubmitting(false);
        setIsSubmitting(false);
        // Remove lock on error
        localStorage.removeItem(lockKey);
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
      setDob({ day: '', month: '', year: '' }); // Reset date fields

      // Keep submitting true for a bit longer to prevent rapid re-submission
      setTimeout(() => {
        setSubmitting(false);
        setIsSubmitting(false);
        setIsSubmitting(false);
        // Remove lock after successful submission
        localStorage.removeItem(lockKey);
      }, 3000);

      setTimeout(() => {
        setSuccess(false);
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      setError(true);
      setErrorMessage('Error registering for tournament. Please try again.');
      setSubmitting(false);
        setIsSubmitting(false);
        setIsSubmitting(false);
      setTimeout(() => {
        setError(false);
        setErrorMessage('');
      }, 5000);
    }
  };

  // Show loading state while tournament is being fetched
  if (loading) {
    return (
      <div className="public-register-container">
        <div className="public-register-content">
          <div className="public-header" style={{textAlign: 'center', padding: '3rem 1.5rem'}}>
            <div className="loading-spinner" style={{
              margin: '2rem auto',
              width: '50px',
              height: '50px',
              border: '4px solid #f3f4f6',
              borderTop: '4px solid #667eea',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <h2 style={{fontSize: '1.5rem', marginTop: '1rem', color: '#64748b'}}>Loading Tournament...</h2>
            <p style={{fontSize: '0.95rem', color: '#94a3b8', marginTop: '0.5rem'}}>
              Please wait while we load the registration form.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if tournament not found after loading
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

        {/* Main Layout with Organizer Sidebar and Registration Form */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '300px 1fr',
          gap: '2rem',
          marginTop: '2rem',
          alignItems: 'start'
        }}>
          {/* Tournament Poster & Organizer Details Sidebar - Left */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            position: 'sticky',
            top: '2rem'
          }}>
            {/* Tournament Poster Card */}
            <div style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '16px',
              padding: '2rem',
              color: 'white',
              boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                marginBottom: '1rem',
                lineHeight: '1.2'
              }}>
                🏏 {tournament.name}
              </div>
              <div style={{
                fontSize: '1.1rem',
                fontWeight: '500',
                marginBottom: '0.75rem',
                opacity: '0.95'
              }}>
                📍 {tournament.location}
              </div>
              <div style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '8px',
                padding: '0.75rem',
                fontSize: '0.95rem',
                fontWeight: '500',
                backdropFilter: 'blur(10px)'
              }}>
                📅 {new Date(tournament.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {new Date(tournament.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            {/* Organizer Details Card */}
            {tournament.organizerName && (
              <div style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '16px',
                padding: '1.75rem',
                color: 'white',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
              }}>
                <h3 style={{
                  fontSize: '1.2rem',
                  marginBottom: '1.25rem',
                  fontWeight: '600',
                  textAlign: 'center',
                  borderBottom: '2px solid rgba(255,255,255,0.3)',
                  paddingBottom: '0.75rem'
                }}>
                  Tournament Organizer
                </h3>

                {tournament.organizerPhoto && (
                  <div style={{
                    textAlign: 'center',
                    marginBottom: '1.25rem'
                  }}>
                    <img
                      src={tournament.organizerPhoto}
                      alt={tournament.organizerName}
                      style={{
                        width: '100px',
                        height: '100px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '4px solid rgba(255,255,255,0.9)',
                        boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
                      }}
                    />
                  </div>
                )}

                <div style={{
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '1.1rem',
                  backdropFilter: 'blur(10px)'
                }}>
                  <div style={{ marginBottom: '0.9rem' }}>
                    <div style={{
                      fontSize: '0.8rem',
                      opacity: '0.9',
                      marginBottom: '0.35rem',
                      fontWeight: '500'
                    }}>
                      Name
                    </div>
                    <div style={{
                      fontSize: '1.05rem',
                      fontWeight: '600'
                    }}>
                      {tournament.organizerName}
                    </div>
                  </div>

                  <div>
                    <div style={{
                      fontSize: '0.8rem',
                      opacity: '0.9',
                      marginBottom: '0.35rem',
                      fontWeight: '500'
                    }}>
                      Contact
                    </div>
                    <div style={{
                      fontSize: '1.05rem',
                      fontWeight: '600',
                      letterSpacing: '0.5px'
                    }}>
                      📞 {tournament.organizerMobile}
                    </div>
                  </div>
                </div>

                <div style={{
                  marginTop: '1.25rem',
                  padding: '0.85rem',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  lineHeight: '1.5',
                  textAlign: 'center'
                }}>
                  For queries, contact the organizer
                </div>
              </div>
            )}
          </div>

          {/* Registration Form - Right */}
          <div className="public-player-form">
            <h2>Register for {tournament.name}</h2>

          {/* Search Player Section */}
          {showSearch && !showRegisterForm && (
            <div className="search-player-section">
              <div className="search-header">
                <h3>🔍 Search Existing Player</h3>
                <p>Enter your mobile number to check if you're already registered in our system</p>
              </div>

              <div className="search-box-container">
                <input
                  type="tel"
                  placeholder="Enter 10-digit mobile number"
                  value={searchMobile}
                  onChange={(e) => setSearchMobile(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchPlayer()}
                  maxLength="10"
                  className="search-mobile-input"
                  disabled={searching}
                />
                <button
                  onClick={handleSearchPlayer}
                  disabled={searching || searchMobile.length !== 10}
                  className="btn-search-player"
                >
                  {searching ? '🔍 Searching...' : '🔍 Search Player'}
                </button>
              </div>

              {/* Found Player Card */}
              {foundPlayer && (
                <div className="found-player-card">
                  <div className="found-player-header">
                    <h4>✅ Player Found!</h4>
                  </div>
                  <div className="found-player-details">
                    {foundPlayer.photo && (
                      <div className="found-player-photo">
                        <img src={foundPlayer.photo} alt={foundPlayer.name} />
                      </div>
                    )}
                    <div className="found-player-info">
                      <p><strong>Name:</strong> {foundPlayer.name}</p>
                      <p><strong>Mobile:</strong> {foundPlayer.mobile}</p>
                      <p><strong>Position:</strong> {foundPlayer.position}</p>
                      <p><strong>Place:</strong> {foundPlayer.place}</p>
                      <p><strong>Blood Group:</strong> {foundPlayer.bloodGroup}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleQuickJoin}
                    disabled={submitting}
                    className="btn-quick-join"
                  >
                    {submitting ? '⏳ Joining Tournament...' : '✅ Join This Tournament'}
                  </button>
                </div>
              )}

              <div className="register-new-section">
                <div className="divider">
                  <span>OR</span>
                </div>
                <p>Not registered in our system yet?</p>
                <button
                  onClick={handleShowRegisterForm}
                  className="btn-register-new"
                >
                  📝 Register as New Player
                </button>
              </div>
            </div>
          )}

          {/* Already Registered Modal - MOVED TO PORTAL AT END OF FILE */}

          {/* Full Registration Form */}
          {showRegisterForm && !showSearch && (
            <div className="full-registration-section">
              <button onClick={handleBackToSearch} className="btn-back-to-search">
                ← Back to Search
              </button>
              <div className="form-header">
                <h3>New Player Registration</h3>
                <p>Fill in the details below to register for the tournament</p>
              </div>

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
                  <label>Player Photo *</label>
                  <input type="file" accept="image/*" onChange={handlePhotoChange} required />
                  {formData.photo && (
                    <div className="photo-preview">
                      <img src={formData.photo} alt="Preview" />
                      <span className="photo-uploaded">✓ Photo uploaded</span>
                    </div>
                  )}
                </div>

                <button type="submit" className="submit-button" disabled={submitting} style={{
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  pointerEvents: submitting ? 'none' : 'auto'
                }}>
                  {submitting ? '⏳ Processing... Please wait' : '✓ Register for Tournament'}
                </button>
              </form>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Success Modal - Rendered DIRECTLY to document.body */}
      {success && ReactDOM.createPortal(
        <div className="message-lightbox-overlay modal-overlay-v2" onClick={() => setSuccess(false)}>
          <div className="message-lightbox success-lightbox" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-icon success-icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="lightbox-title">Successfully Registered! 🎉</h3>
            <p className="lightbox-message">{successMessage}</p>
            <p className="lightbox-submessage">Want to register another player? Click continue below.</p>
            <button className="lightbox-button success-button" onClick={() => {
              setSuccess(false);
              setSuccessMessage('');
            }}>
              Register Another Player
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Error Modal - Rendered DIRECTLY to document.body */}
      {error && ReactDOM.createPortal(
        <div className="message-lightbox-overlay modal-overlay-v2" onClick={() => setError(false)}>
          <div className="message-lightbox error-lightbox" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-icon error-icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.385 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="lightbox-title">Registration Failed ⚠️</h3>
            <p className="lightbox-message">{errorMessage}</p>
            <button className="lightbox-button error-button" onClick={() => setError(false)}>
              Try Again
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Already Registered Modal - Rendered DIRECTLY to document.body */}
      {alreadyRegistered && alreadyRegisteredPlayer && ReactDOM.createPortal(
        <div className="message-lightbox-overlay modal-overlay-v2" onClick={() => setAlreadyRegistered(false)}>
          <div className="message-lightbox warning-lightbox" onClick={(e) => e.stopPropagation()}>
            <div className="lightbox-icon warning-icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="lightbox-title">Already Registered!</h3>

            {/* Player Photo & Details */}
            <div className="lightbox-player-profile">
              {alreadyRegisteredPlayer.photo ? (
                <div className="lightbox-photo-container">
                  <img
                    src={alreadyRegisteredPlayer.photo}
                    alt={alreadyRegisteredPlayer.name}
                    className="lightbox-player-photo"
                    onError={(e) => {
                      console.log('Photo failed to load:', alreadyRegisteredPlayer.photo);
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              ) : (
                <div className="lightbox-photo-container lightbox-photo-placeholder">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{width: '60%', height: '60%', color: '#9ca3af'}}>
                    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <p className="lightbox-player-name">{alreadyRegisteredPlayer.name}</p>
              <p className="lightbox-player-mobile">{alreadyRegisteredPlayer.mobile}</p>
            </div>

            <p className="lightbox-message">
              You have already registered for <strong>{alreadyRegisteredPlayer.tournamentName}</strong>!
            </p>
            <p className="lightbox-submessage">
              We look forward to seeing you at the tournament. Good luck! 🏆
            </p>
            <button className="lightbox-button warning-button" onClick={() => {
              setAlreadyRegistered(false);
              setSearchMobile('');
              setAlreadyRegisteredPlayer(null);
            }}>
              Got it!
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default TournamentRegister;
