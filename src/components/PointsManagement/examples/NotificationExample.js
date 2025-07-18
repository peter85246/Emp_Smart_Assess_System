import React from 'react';
import useNotification from '../hooks/useNotification';
import useConfirmDialog from '../hooks/useConfirmDialog';
import NotificationToast from '../shared/NotificationToast';
import ConfirmDialog from '../shared/ConfirmDialog';

// 這是一個示例組件，展示如何使用通知和確認對話框
const NotificationExample = () => {
  const { 
    notification, 
    showSuccess, 
    showError, 
    showWarning, 
    showInfo, 
    hideNotification 
  } = useNotification();

  const { 
    dialogState, 
    confirmDelete, 
    confirmAction, 
    handleCancel 
  } = useConfirmDialog();

  const handleSuccessClick = () => {
    showSuccess('操作成功完成！');
  };

  const handleErrorClick = () => {
    showError('發生錯誤，請重試');
  };

  const handleWarningClick = () => {
    showWarning('請注意：此操作可能有風險');
  };

  const handleInfoClick = () => {
    showInfo('這是一條資訊提示');
  };

  const handleDeleteClick = async () => {
    try {
      await confirmDelete('這個項目', () => {
        // 執行刪除邏輯
        console.log('項目已刪除');
        showSuccess('項目刪除成功！');
      });
    } catch (error) {
      // 用戶取消了操作
      console.log('用戶取消刪除');
    }
  };

  const handleActionClick = async () => {
    try {
      await confirmAction('提交表單', () => {
        // 執行提交邏輯
        console.log('表單已提交');
        showSuccess('表單提交成功！');
      });
    } catch (error) {
      // 用戶取消了操作
      console.log('用戶取消提交');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">通知系統示例</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={handleSuccessClick}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          成功通知
        </button>
        
        <button
          onClick={handleErrorClick}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          錯誤通知
        </button>
        
        <button
          onClick={handleWarningClick}
          className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          警告通知
        </button>
        
        <button
          onClick={handleInfoClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          資訊通知
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
        <button
          onClick={handleDeleteClick}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          刪除確認對話框
        </button>
        
        <button
          onClick={handleActionClick}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          操作確認對話框
        </button>
      </div>

      {/* 使用方法說明 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">使用方法</h3>
        <div className="text-sm text-gray-700 space-y-2">
          <p><strong>通知系統：</strong></p>
          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`// 1. 導入Hook
import useNotification from '../hooks/useNotification';

// 2. 在組件中使用
const { notification, showSuccess, showError, hideNotification } = useNotification();

// 3. 顯示通知
showSuccess('操作成功！');
showError('發生錯誤！');

// 4. 渲染通知組件
<NotificationToast notification={notification} onClose={hideNotification} />`}
          </pre>
          
          <p><strong>確認對話框：</strong></p>
          <pre className="bg-white p-2 rounded text-xs overflow-x-auto">
{`// 1. 導入Hook
import useConfirmDialog from '../hooks/useConfirmDialog';

// 2. 在組件中使用
const { dialogState, confirmDelete, handleCancel } = useConfirmDialog();

// 3. 顯示確認對話框
await confirmDelete('項目名稱', () => {
  // 確認後的回調
});

// 4. 渲染對話框組件
<ConfirmDialog {...dialogState} onClose={handleCancel} />`}
          </pre>
        </div>
      </div>

      {/* 渲染通知和對話框 */}
      <NotificationToast 
        notification={notification} 
        onClose={hideNotification} 
      />
      
      <ConfirmDialog 
        {...dialogState} 
        onClose={handleCancel} 
      />
    </div>
  );
};

export default NotificationExample;
