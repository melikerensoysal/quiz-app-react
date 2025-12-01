import React from 'react';
import styles from './error-cover.module.scss';
import { useNavigate } from 'react-router-dom';

interface ErrorCoverProps {
  title?: string;
  message: string;
  buttonText?: string;
  onRetry?: () => void;
  icon?: string;
}

const ErrorCover: React.FC<ErrorCoverProps> = ({ 
  title = "Something Went Wrong", 
  message, 
  buttonText = "Return to Home", 
  onRetry,
  icon = "⚠️"
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onRetry) {
      onRetry();
    } else {
      navigate('/');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.icon}>{icon}</div>
        <h2 className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        
        <button className={styles.button} onClick={handleAction}>
          {buttonText}
        </button>
      </div>
    </div>
  );
};

export default ErrorCover;