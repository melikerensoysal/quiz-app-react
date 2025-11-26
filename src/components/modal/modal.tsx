import React from "react";
import styles from "./modal.module.scss";

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  show: boolean;
}

const Modal: React.FC<ModalProps> = ({ title, children, onClose, show }) => {
  if (!show) {
    return null;
  }

  return (
    <div className={styles["modal-backdrop"]} onClick={onClose}>
      <div
        className={styles["modal-content"]}
        onClick={(e) => e.stopPropagation()} 
      >
        <div className={styles["modal-header"]}>
          <h3 className={styles["modal-title"]}>{title}</h3>
          <button onClick={onClose} className={styles["close-button"]}>
            &times;
          </button>
        </div>
        <div className={styles["modal-body"]}>{children}</div>
      </div>
    </div>
  );
};

export default Modal;