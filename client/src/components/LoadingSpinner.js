import React from 'react';

const LoadingSpinner = ({ size = 'medium', text = 'Đang tải...', fullScreen = true }) => {
  const sizeClasses = {
    small: 'spinner-sm',
    medium: 'spinner',
    large: 'spinner-lg',
    xl: 'spinner-xl'
  };

  const containerClass = fullScreen ? 'loading-overlay' : 'loading-container';

  return (
    <div className={containerClass}>
      <div className="loading-container">
        <div className={`spinner ${sizeClasses[size]}`}></div>
        {text && (
          <p className="loading-text">{text}</p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
