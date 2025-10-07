import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', fullscreen = false, message = 'Chargement...' }) => {
  const sizeClass = `spinner-${size}`;
  
  if (fullscreen) {
    return (
      <div className="loading-overlay">
        <div className="loading-content">
          <div className={`spinner ${sizeClass}`}></div>
          {message && <p className="loading-message">{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <div className={`spinner ${sizeClass}`}></div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
};

export default LoadingSpinner;
