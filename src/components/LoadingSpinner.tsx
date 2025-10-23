import React from "react";
import styles from "./LoadingSpinner.module.scss";

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = "Yükleniyor...",
}) => {
  return (
    <div className={styles.spinnerOverlay}>
      <div className={styles.spinnerContainer}></div>
      {text && <p className={styles.spinnerText}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;