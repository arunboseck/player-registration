import { Link } from 'react-router-dom';
import PublicHeader from '../components/PublicHeader';
import './Home.css';

const ORGANIZER_FEATURES = [
  { icon: '📋', text: 'Open player registrations with a shareable link — no app download needed' },
  { icon: '🖼️', text: 'Collect player photos, mobile numbers and details in one clean form' },
  { icon: '🔁', text: 'Drag & drop to reorder registered players exactly how you need them' },
  { icon: '🔍', text: 'Search the player database and add past players to a new tournament in one click' },
  { icon: '🚫', text: 'Automatic duplicate detection by mobile number — no double entries' },
  { icon: '📅', text: 'Run multi-day tournaments with a visual calendar of every match day' },
  { icon: '📄', text: 'Export a polished, print-ready PDF of the full player list instantly' },
  { icon: '🖼️', text: 'Upload a tournament poster and showcase it across the public pages' },
];

const PLAYER_FEATURES = [
  { icon: '⚡', text: 'Register for a tournament in under a minute on any phone' },
  { icon: '🙋', text: '"Quick Join" auto-fills your details if you have registered with us before' },
  { icon: '📸', text: 'Add your photo so organizers and team owners recognize you instantly' },
  { icon: '🕒', text: 'Your registration date & time is recorded automatically, with full transparency' },
  { icon: '📆', text: 'Browse the calendar to see every upcoming tournament and never miss registration' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: '🏗️',
    title: 'Organizer Creates a Tournament',
    text: 'Add the tournament name, venue, dates and poster. The tournament instantly appears on the public Calendar for everyone to see.',
  },
  {
    step: '02',
    icon: '📝',
    title: 'Players Register Online',
    text: 'Players open the tournament link, fill in their details and photo, and submit — no sign-up or app install required.',
  },
  {
    step: '03',
    icon: '🗂️',
    title: 'Organizer Manages the List',
    text: 'View every registration live, reorder players by drag-and-drop, add players from the existing database, and remove duplicates automatically.',
  },
  {
    step: '04',
    icon: '📤',
    title: 'Export & Share',
    text: 'Download a clean, print-ready PDF of the full player list — ready for auction day, team selection or sharing with co-organizers.',
  },
];

const AboutUs = () => {
  return (
    <div className="home-container">
      <PublicHeader />

      {/* ==================== Hero ==================== */}
      <section className="about-hero">
        <span className="about-hero-badge">🏏 About Us</span>
        <h1 className="about-hero-title">
          Transparent Registrations. <br /> Smarter Tournament Management.
        </h1>
        <p className="about-hero-subtitle">
          Our Player Management System is a modern platform built to make cricket tournament
          registrations simple, fast and transparent — for organizers running the event, and
          for players who just want to sign up and play.
        </p>
      </section>

      {/* ==================== Mission ==================== */}
      <section className="home-about home-about-page">
        <div className="home-about-card about-mission-card">
          <h2>Our Mission</h2>
          <p>
            We believe registering for a tournament should be effortless — not a mess of WhatsApp
            messages, paper forms and spreadsheets. Our platform lets organizers open a tournament,
            share one link, and watch registrations come in live, complete with photos, contact
            details and timestamps.
          </p>
          <p style={{ marginTop: '0.9rem' }}>
            Every player is recorded once in our central database, so returning players can
            register for a new tournament in seconds with "Quick Join" — no retyping details,
            no duplicate entries, no confusion on tournament day.
          </p>
        </div>
      </section>

      {/* ==================== How It Works ==================== */}
      <section className="home-section about-steps-section">
        <h2 className="home-section-title">⚙️ How It Works</h2>
        <div className="about-steps-grid">
          {HOW_IT_WORKS.map((item) => (
            <div key={item.step} className="about-step-card">
              <span className="about-step-number">{item.step}</span>
              <span className="about-step-icon">{item.icon}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================== Feature Columns ==================== */}
      <section className="home-section about-features-section">
        <div className="about-features-grid">
          <div className="about-feature-column">
            <h3 className="about-feature-heading">🧑‍💼 For Organizers</h3>
            <ul className="about-feature-list">
              {ORGANIZER_FEATURES.map((f, i) => (
                <li key={i}>
                  <span className="about-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="about-feature-column">
            <h3 className="about-feature-heading">🏃 For Players</h3>
            <ul className="about-feature-list">
              {PLAYER_FEATURES.map((f, i) => (
                <li key={i}>
                  <span className="about-feature-icon">{f.icon}</span>
                  <span>{f.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="about-cta-section">
        <div className="about-cta-card">
          <h2>Ready to get started?</h2>
          <p>Browse upcoming tournaments or register as a player in just a minute.</p>
          <div className="about-cta-actions">
            <Link to="/calendar" className="about-cta-btn about-cta-btn-primary">📅 View Tournaments</Link>
            <Link to="/" className="about-cta-btn about-cta-btn-secondary">🏠 Back to Home</Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
