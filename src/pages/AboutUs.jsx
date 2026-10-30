import PublicHeader from '../components/PublicHeader';
import './Home.css';

const AboutUs = () => {
  return (
    <div className="home-container">
      <PublicHeader />

      <section className="home-about home-about-page">
        <div className="home-about-card">
          <h2>About Us</h2>
          <p>
            We bring cricket tournaments to life — handling player registrations, team auctions
            and schedules in one simple, beautiful platform. Browse upcoming tournaments on the
            calendar, register as a player, and track every match day in one place.
          </p>
          <div className="home-about-stats">
            <div className="home-about-stat">
              <strong>🏆</strong>
              <span>Tournaments Managed</span>
            </div>
            <div className="home-about-stat">
              <strong>👥</strong>
              <span>Players Registered</span>
            </div>
            <div className="home-about-stat">
              <strong>📸</strong>
              <span>Memories Captured</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
