import { useEffect } from 'react';
import './Modal.css';

const Modal = ({
  show,
  onClose,
  onConfirm,
  onCancel,
  title,
  message,
  type = 'info', // 'info', 'success', 'warning', 'error', 'confirm'
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
  icon = null
}) => {
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show]);

  if (!show) return null;

  const getIcon = () => {
    if (icon) return icon;
    
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'confirm':
        return '❓';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getIconClass = () => {
    switch (type) {
      case 'success':
        return 'modal-icon-success';
      case 'error':
        return 'modal-icon-error';
      case 'warning':
        return 'modal-icon-warning';
      case 'confirm':
        return 'modal-icon-confirm';
      case 'info':
      default:
        return 'modal-icon-info';
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      if (onCancel) {
        onCancel();
      } else {
        onClose();
      }
    }
  };

  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  return (
    <div className="custom-modal-overlay" onClick={handleOverlayClick}>
      <div className="custom-modal-container">
        <div className={`custom-modal-icon ${getIconClass()}`}>
          <span className="icon-emoji">{getIcon()}</span>
        </div>
        
        <div className="custom-modal-content">
          {title && <h3 className="custom-modal-title">{title}</h3>}
          <p className="custom-modal-message">{message}</p>
        </div>

        <div className="custom-modal-actions">
          {showCancel && (
            <button
              className="custom-modal-btn custom-modal-btn-cancel"
              onClick={handleCancelClick}
            >
              {cancelText}
            </button>
          )}
          <button
            className={`custom-modal-btn custom-modal-btn-confirm ${type === 'error' ? 'btn-error' : ''} ${type === 'success' ? 'btn-success' : ''}`}
            onClick={handleConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
