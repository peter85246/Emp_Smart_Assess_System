import { useState, useCallback } from 'react';

const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '確認',
    cancelText: '取消',
    type: 'warning',
    onConfirm: null
  });

  const showConfirmDialog = useCallback(({
    title = '確認操作',
    message = '確定要執行此操作嗎？',
    confirmText = '確認',
    cancelText = '取消',
    type = 'warning',
    onConfirm
  }) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          resolve(true);
          hideDialog();
          if (onConfirm) onConfirm();
        }
      });
    });
  }, []);

  const hideDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleCancel = useCallback(() => {
    hideDialog();
  }, [hideDialog]);

  // 便捷方法
  const confirmDelete = useCallback((itemName = '此項目', onConfirm) => {
    return showConfirmDialog({
      title: '確認刪除',
      message: `確定要刪除${itemName}嗎？刪除後將無法恢復。`,
      confirmText: '確認刪除',
      cancelText: '取消',
      type: 'danger',
      onConfirm
    });
  }, [showConfirmDialog]);

  const confirmAction = useCallback((actionName = '此操作', onConfirm) => {
    return showConfirmDialog({
      title: '確認操作',
      message: `確定要執行${actionName}嗎？`,
      confirmText: '確認',
      cancelText: '取消',
      type: 'warning',
      onConfirm
    });
  }, [showConfirmDialog]);

  return {
    dialogState,
    showConfirmDialog,
    hideDialog,
    handleCancel,
    confirmDelete,
    confirmAction
  };
};

export default useConfirmDialog;
