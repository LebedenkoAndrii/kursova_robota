import React from "react";
import "./Modal.css";

const Modal = ({ message, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <p>{message}</p>
        <button className="modal-button" onClick={onClose}>
          Ok
        </button>
      </div>
    </div>
  );
};

export default Modal;
