import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <PublicHeader />

      <p className="home-tagline">
        Manage players, tournaments and registrations all in one place.
      </p>

      <div className="home-landing-links">
        <Link to="/about" className="home-landing-card">
          <span className="home-landing-icon">ℹ️</span>
          <h3>About Us</h3>
          <p>Learn how we run player registrations, auctions and tournaments.</p>
        </Link>
        <Link to="/calendar" className="home-landing-card">
          <span className="home-landing-icon">📅</span>
          <h3>Calendar</h3>
          <p>Browse upcoming and past tournaments, and see registered players.</p>
        </Link>
      </div>
    </div>
  );
};

export default Home;
