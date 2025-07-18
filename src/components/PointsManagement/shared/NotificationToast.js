import React from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const NotificationToast = ({ notification, onClose }) => {
  if (!notification) return null;

  const { message, type = 'info' } = notification;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border ${getStyles()}`}>
        {getIcon()}
        <span className="font-medium">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;
