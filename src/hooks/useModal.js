import { useState } from 'react';

export const useModal = () => {
  const [modalState, setModalState] = useState({
    show: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
    onConfirm: null,
    onCancel: null,
    icon: null
  });

  const showModal = (config) => {
    setModalState({
      show: true,
      title: config.title || '',
      message: config.message || '',
      type: config.type || 'info',
      confirmText: config.confirmText || 'OK',
      cancelText: config.cancelText || 'Cancel',
      showCancel: config.showCancel || false,
      onConfirm: config.onConfirm || null,
      icon: config.icon || null
    });
  };

  const hideModal = () => {
    setModalState(prev => ({ ...prev, show: false }));
  };

  const showAlert = (message, title = '') => {
    return new Promise((resolve) => {
      showModal({
        message,
        title,
        type: 'info',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => {
          hideModal();
          resolve(true);
        }
      });
    });
  };

  const showSuccess = (message, title = 'Success') => {
    return new Promise((resolve) => {
      showModal({
        message,
        title,
        type: 'success',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => {
          hideModal();
          resolve(true);
        }
      });
    });
  };

  const showError = (message, title = 'Error') => {
    return new Promise((resolve) => {
      showModal({
        message,
        title,
        type: 'error',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => {
          hideModal();
          resolve(true);
        }
      });
    });
  };

  const showWarning = (message, title = 'Warning') => {
    return new Promise((resolve) => {
      showModal({
        message,
        title,
        type: 'warning',
        confirmText: 'OK',
        showCancel: false,
        onConfirm: () => {
          hideModal();
          resolve(true);
        }
      });
    });
  };

  const showConfirm = (message, title = 'Confirm') => {
    return new Promise((resolve) => {
      const originalHide = () => {
        hideModal();
        resolve(false); // Resolve false when canceled
      };

      setModalState({
        show: true,
        title,
        message,
        type: 'confirm',
        confirmText: 'Confirm',
        cancelText: 'Cancel',
        showCancel: true,
        onConfirm: () => {
          hideModal();
          resolve(true); // Resolve true when confirmed
        },
        onCancel: originalHide,
        icon: null
      });
    });
  };

  const handleCancel = () => {
    if (modalState.onCancel) {
      modalState.onCancel();
    } else {
      hideModal();
    }
  };

  return {
    modalState,
    showModal,
    hideModal,
    showAlert,
    showSuccess,
    showError,
    showWarning,
    showConfirm,
    handleCancel
  };
};
