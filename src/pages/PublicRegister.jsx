import { useState } from 'react';
import { addPlayer } from '../utils/storage';
import './PublicRegister.css';

const POSITIONS = ['Batsman', 'Bowler', 'All-rounder', 'Wicket-keeper'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const PublicRegister = () => {
  const [formData, setFormData] = useState({
    name: '', mobile: '', dob: '', bloodGroup: '', place: '', position: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    addPlayer(formData);
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', mobile: '', dob: '', bloodGroup: '', place: '', position: '' });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="public-register-container">
      <div className="public-register-box">
        <h1>🏏 Cricket Player Registration</h1>
        <p>Register yourself as a cricket player</p>
        {submitted && <div className="success-message">✅ Registration Successful!</div>}
        <form onSubmit={handleSubmit} className="public-form">
          <input type="text" name="name" placeholder="Full Name *" value={formData.name} 
            onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          <input type="tel" name="mobile" placeholder="Mobile Number *" value={formData.mobile}
            onChange={(e) => setFormData({...formData, mobile: e.target.value})} required />
          <input type="date" name="dob" value={formData.dob}
            onChange={(e) => setFormData({...formData, dob: e.target.value})} required />
          <select name="bloodGroup" value={formData.bloodGroup}
            onChange={(e) => setFormData({...formData, bloodGroup: e.target.value})}>
            <option value="">Blood Group (Optional)</option>
            {BLOOD_GROUPS.map(bg => <option key={bg} value={bg}>{bg}</option>)}
          </select>
          <input type="text" name="place" placeholder="Place *" value={formData.place}
            onChange={(e) => setFormData({...formData, place: e.target.value})} required />
          <select name="position" value={formData.position}
            onChange={(e) => setFormData({...formData, position: e.target.value})} required>
            <option value="">Select Playing Position *</option>
            {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
          </select>
          <button type="submit">Register</button>
        </form>
      </div>
    </div>
  );
};

export default PublicRegister;
