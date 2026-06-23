import { useState } from 'react';
import { addPlayer } from '../utils/storage';
import './PublicRegister.css';

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

const PublicRegister = () => {
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
  const [submitted, setSubmitted] = useState(false);

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
        addPlayer(formData);
        setSuccess(true);
        setSubmitted(true);
        // Reset form
        setFormData({
          name: '',
          mobile: '',
          dateOfBirth: '',
          bloodGroup: '',
          place: '',
          position: '',
          photo: null,
        });
        setPhotoPreview(null);
      } catch (error) {
        setErrors({ submit: 'Failed to register. Please try again.' });
      }
    }
  };

  const handleRegisterAnother = () => {
    setSubmitted(false);
    setSuccess(false);
  };

  if (submitted) {
    return (
      <div className="public-register-container">
        <div className="success-screen">
          <div className="success-icon">✓</div>
          <h1>Registration Successful!</h1>
          <p>Thank you for registering. Your details have been submitted successfully.</p>
          <button onClick={handleRegisterAnother} className="btn-primary">
            Register Another Player
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-register-container">
      <div className="public-header">
        <h1>🏏 Cricket Player Registration</h1>
        <p>Please fill in all your details to complete your registration</p>
      </div>

      <div className="public-register-content">
        {errors.submit && <div className="error-message">{errors.submit}</div>}

        <form onSubmit={handleSubmit} className="public-player-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">
                Name <span className="required">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter your full name"
              />
              {errors.name && <span className="error-text">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="mobile">
                Mobile Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                placeholder="Enter 10-digit mobile number"
              />
              {errors.mobile && <span className="error-text">{errors.mobile}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dateOfBirth">
                Date of Birth <span className="required">*</span>
              </label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
              />
              {errors.dateOfBirth && <span className="error-text">{errors.dateOfBirth}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="bloodGroup">
                Blood Group <span className="required">*</span>
              </label>
              <select
                id="bloodGroup"
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
              >
                <option value="">Select blood group</option>
                {BLOOD_GROUPS.map((group) => (
                  <option key={group} value={group}>
                    {group}
                  </option>
                ))}
              </select>
              {errors.bloodGroup && <span className="error-text">{errors.bloodGroup}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="place">
                Place <span className="required">*</span>
              </label>
              <input
                type="text"
                id="place"
                name="place"
                value={formData.place}
                onChange={handleChange}
                placeholder="Enter your place"
              />
              {errors.place && <span className="error-text">{errors.place}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="position">
                Position of Play <span className="required">*</span>
              </label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
              >
                <option value="">Select your position</option>
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
              {errors.position && <span className="error-text">{errors.position}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="photo">
              Player Photo <span className="required">*</span>
            </label>
            <input
              type="file"
              id="photo"
              name="photo"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            {errors.photo && <span className="error-text">{errors.photo}</span>}
            {photoPreview && (
              <div className="photo-preview">
                <img src={photoPreview} alt="Player preview" />
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit">
              Submit Registration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PublicRegister;
