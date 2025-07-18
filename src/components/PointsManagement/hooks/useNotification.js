import { useState, useCallback } from 'react';

const useNotification = (defaultDuration = 3000) => {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback((message, type = 'info', duration = defaultDuration) => {
    setNotification({ message, type });
    
    if (duration > 0) {
      setTimeout(() => {
        setNotification(null);
      }, duration);
    }
  }, [defaultDuration]);

  const hideNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const showSuccess = useCallback((message, duration) => {
    showNotification(message, 'success', duration);
  }, [showNotification]);

  const showError = useCallback((message, duration) => {
    showNotification(message, 'error', duration);
  }, [showNotification]);

  const showWarning = useCallback((message, duration) => {
    showNotification(message, 'warning', duration);
  }, [showNotification]);

  const showInfo = useCallback((message, duration) => {
    showNotification(message, 'info', duration);
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
};

export default useNotification;
