import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <div className="home-box">
        <h1>🏏 Player Management System</h1>
        <p className="home-tagline">
          Manage players, tournaments and registrations all in one place.
        </p>
        <Link to="/admin-login" className="btn-admin-login">
          Admin Login
        </Link>
      </div>
    </div>
  );
};

export default Home;
