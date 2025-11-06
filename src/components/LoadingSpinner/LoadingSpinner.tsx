import React from "react";
import styles from "./LoadingSpinner.module.scss";

interface LoadingSpinnerProps {
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ text = "Loading..." }) => {
  return (
    <div className={styles["spinner-overlay"]}>
      <div className={styles["spinner-container"]}></div>
      <p className={styles["spinner-text"]}>{text}</p>
    </div>
  );
};

export default LoadingSpinner;