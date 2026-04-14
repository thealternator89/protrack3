import React from 'react';

interface LoadingSpinnerProps {
  centered?: boolean;
  padding?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  centered = true, 
  padding = 'p-4',
  className = ''
}) => {
  const containerClass = `${centered ? 'text-center' : ''} ${padding} ${className}`;
  
  return (
    <div className={containerClass}>
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export const ButtonSpinner: React.FC<{ label: string; className?: string }> = ({ 
  label, 
  className = 'me-2' 
}) => (
  <>
    <span className={`spinner-border spinner-border-sm ${className}`} role="status" aria-hidden="true"></span>
    {label}
  </>
);

export default LoadingSpinner;
