import './LoadingSpinner.css';

const LoadingSpinner = ({ message = "Loading...", subMessage = "Please wait while we fetch the data..." }) => {
  return (
    <div className="cricket-loading-container">
      <div className="cricket-loading-card">
        <div className="cricket-animation">
          <div className="cricket-bat"></div>
          <div className="cricket-ball"></div>
        </div>
        <h3 className="loading-title">{message}</h3>
        <p className="loading-subtitle">{subMessage}</p>
        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
