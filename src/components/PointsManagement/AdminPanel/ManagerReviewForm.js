import React, { useState, useEffect } from 'react';
import { Edit, CheckCircle, XCircle, Star, FileText, Download, ChevronDown, ChevronUp, Check, X, Eye, Image } from 'lucide-react';
import NotificationToast from '../shared/NotificationToast';
import ImagePreviewModal from '../shared/ImagePreviewModal';
import { pointsAPI } from '../../../services/pointsAPI';

// 角色映射函數 - 將系統角色轉換為顯示信息
const getRoleDisplay = (role) => {
  switch(role) {
    case 'boss': return { icon: '👑', name: '董事長', color: 'text-purple-400', bgColor: 'bg-purple-500/20' };
    case 'president': return { icon: '🎖️', name: '總經理', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
    case 'admin': return { icon: '⚙️', name: '管理員', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
    case 'manager': return { icon: '👨‍💼', name: '主管', color: 'text-green-400', bgColor: 'bg-green-500/20' };
    case 'employee': return { icon: '👤', name: '員工', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
    default: return { icon: '❓', name: '未知', color: 'text-gray-500', bgColor: 'bg-gray-500/10' };
  }
};

/**
 * 主管審核表單組件 - 主管審核員工積分提交的核心組件
 * 功能：
 * - 顯示所有待審核的積分提交項目
 * - 支援多項目提交的展開/收合檢視
 * - 檔案預覽功能（圖片、PDF、Word等）
 * - 檔案下載功能
 * - 積分審核（通過/拒絕）
 * - 審核說明備註
 * 
 * 使用位置：AdminPanel > 主管審核頁面
 * API對接：
 * - pointsAPI.getPendingEntries() - 獲取待審核項目
 * - pointsAPI.downloadFile() - 檔案下載
 * 檔案支援：自動識別圖片格式並提供預覽，其他格式提供下載
 */
const ManagerReviewForm = ({ currentUser }) => {
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [managerScore, setManagerScore] = useState({});
  const [reviewComments, setReviewComments] = useState('');
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  
  // 新增：員工分組展開狀態管理
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  
  // 新增：單項審核相關狀態
  const [itemComments, setItemComments] = useState({}); // 每個項目的單獨說明
  const [itemStatuses, setItemStatuses] = useState({}); // 每個項目的審核狀態
  const [processingItems, setProcessingItems] = useState(new Set()); // 正在處理的項目

  // 新增：檔案預覽和下載相關狀態
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    imageSrc: '',
    fileName: '',
    file: null,
    type: 'image'
  });
  const [downloadLoading, setDownloadLoading] = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      console.log('載入待審核的積分提交記錄, 當前用戶:', currentUser);

      let response;
      // 根據用戶角色選擇API端點
      if (currentUser.role === 'boss' || currentUser.role === 'president') {
        // 董事長和總經理可以查看所有部門
        console.log('使用全部門API（董事長/總經理權限）');
        response = await pointsAPI.getPendingEntries();
      } else {
        // 管理員和主管使用部門權限API（含層級過濾）
        console.log('使用部門權限API（管理員/主管權限）, 審核者ID:', currentUser.id);
        response = await pointsAPI.getPendingEntriesByDepartment(currentUser.id);
      }

      console.log('獲取待審核記錄成功:', response);

      // 檢查響應格式並獲取數據
      const pendingData = response.data || response;
      console.log('處理後的待審核數據:', pendingData);

      if (!Array.isArray(pendingData)) {
        console.warn('待審核數據格式不正確:', pendingData);
        setSubmissions([]);
        return;
      }

      // 按員工和提交時間分組，將同一次提交的多個項目合併
      const groupedSubmissions = groupSubmissionsByEmployee(pendingData);
      console.log('分組後的提交記錄:', groupedSubmissions);
      setSubmissions(groupedSubmissions);
    } catch (error) {
      console.error('載入提交記錄失敗:', error);
      // API失敗時顯示空列表
      setSubmissions([]);
    }
  };

  // 按員工分組的邏輯 - 手風琴式顯示
  const groupSubmissionsByEmployee = (entries) => {
    const groups = {};

    entries.forEach(entry => {
      // 按員工ID分組
      const employeeKey = `employee_${entry.employeeId}`;

      if (!groups[employeeKey]) {
        groups[employeeKey] = {
          id: employeeKey,
          employeeId: entry.employeeId,
          employeeName: (entry.employeeName && entry.employeeName.trim()) || '未知員工',
          employeeRole: entry.employeeRole || 'employee',
          employeePosition: entry.employeePosition || '未知職位',
          department: entry.department || '未知部門',
          departmentId: entry.departmentId,
          submissions: [], // 該員工的所有提交記錄
          totalSubmissions: 0,
          totalPoints: 0,
          isExpanded: false // 展開狀態
        };
      }

      // 將每個entry作為獨立的提交記錄
      groups[employeeKey].submissions.push({
        id: entry.id,
        // 添加員工信息到每個 submission 對象
        employeeId: entry.employeeId,
        employeeName: (entry.employeeName && entry.employeeName.trim()) || '未知員工',
        employeeRole: entry.employeeRole || 'employee',
        employeePosition: entry.employeePosition || '未知職位',
        department: entry.department || '未知部門',
        departmentId: entry.departmentId,
        standardName: entry.standardName || '未知項目',
        description: entry.description || '',
        pointsCalculated: entry.pointsCalculated || 0,
        basePoints: entry.basePoints || 0,
        bonusPoints: entry.bonusPoints || 0,
        evidenceFiles: entry.evidenceFiles || null,
        evidenceFileDetails: entry.evidenceFileDetails || [],
        submittedAt: entry.submittedAt || entry.createdAt,
        status: entry.status || 'pending',
        // 為了向後兼容，保持原有的數據結構
        items: [{
          id: entry.id,
          standardName: entry.standardName || '未知項目',
          description: entry.description || '',
          pointsCalculated: entry.pointsCalculated || 0,
          basePoints: entry.basePoints || 0,
          bonusPoints: entry.bonusPoints || 0,
          evidenceFiles: entry.evidenceFiles || null,
          evidenceFileDetails: entry.evidenceFileDetails || [],
          status: entry.status || 'pending'
        }],
        totalPoints: entry.pointsCalculated || 0,
        totalItems: 1,
        submissionDate: entry.submittedAt || entry.createdAt
      });

      // 更新統計信息
      groups[employeeKey].totalSubmissions = groups[employeeKey].submissions.length;
      groups[employeeKey].totalPoints = groups[employeeKey].submissions.reduce(
        (sum, submission) => sum + (submission.pointsCalculated || 0), 0
      );
    });

    // 轉換為數組並按員工姓名排序
    return Object.values(groups).sort((a, b) => a.employeeName.localeCompare(b.employeeName));
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 新增：切換員工分組展開狀態
  const toggleGroupExpansion = (groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
    setManagerScore({});
    setReviewComments('');
    setEditMode(false);
    setItemComments({});
    setItemStatuses({});
    setProcessingItems(new Set());
    
    // 默認展開第一個項目
    if (submission.items && submission.items.length > 0) {
      setExpandedItems({ [submission.items[0].id]: true });
    }
  };

  const toggleItemExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleScoreChange = (itemId, score) => {
    setManagerScore(prev => ({
      ...prev,
      [itemId]: score
    }));
  };

  // 新增：處理單項說明變更
  const handleItemCommentChange = (itemId, comment) => {
    setItemComments(prev => ({
      ...prev,
      [itemId]: comment
    }));
  };

  // 新增：單項核准
  const handleApproveItem = async (item) => {
    if (processingItems.has(item.id)) return;

    setProcessingItems(prev => new Set([...prev, item.id]));
    
    try {
      console.log('單項核准積分記錄:', item.id);

      await pointsAPI.approvePointsEntry(
        item.id,
        currentUser.id,
        itemComments[item.id] || '單項審核通過'
      );

      // 更新項目狀態
      setItemStatuses(prev => ({
        ...prev,
        [item.id]: {
          status: 'approved',
          comment: itemComments[item.id] || '單項審核通過',
          reviewedBy: currentUser.name || currentUser.id,
          reviewedAt: new Date().toLocaleString('zh-TW')
        }
      }));

      showNotification(`項目「${item.standardName}」已核准`, 'success');

      // 觸發全局事件，通知員工面板更新
      window.dispatchEvent(new CustomEvent('pointsApproved', {
        detail: {
          entryId: item.id,
          employeeId: selectedSubmission.employeeId,
          approverId: currentUser.id,
          itemName: item.standardName
        }
      }));

    } catch (error) {
      console.error('單項核准失敗:', error);
      showNotification(`核准「${item.standardName}」失敗：${error.message}`, 'error');
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // 新增：單項拒絕
  const handleRejectItem = async (item) => {
    const comment = itemComments[item.id];
    if (!comment || !comment.trim()) {
      showNotification('請填寫拒絕原因', 'error');
      return;
    }

    if (processingItems.has(item.id)) return;

    setProcessingItems(prev => new Set([...prev, item.id]));
    
    try {
      console.log('單項拒絕積分記錄:', item.id);

      await pointsAPI.rejectPointsEntry(
        item.id,
        currentUser.id,
        comment
      );

      // 更新項目狀態
      setItemStatuses(prev => ({
        ...prev,
        [item.id]: {
          status: 'rejected',
          comment: comment,
          reviewedBy: currentUser.name || currentUser.id,
          reviewedAt: new Date().toLocaleString('zh-TW')
        }
      }));

      showNotification(`項目「${item.standardName}」已拒絕`, 'info');

      // 觸發全局事件，通知員工面板更新
      window.dispatchEvent(new CustomEvent('pointsRejected', {
        detail: {
          entryId: item.id,
          employeeId: selectedSubmission.employeeId,
          rejectedBy: currentUser.id,
          reason: comment,
          itemName: item.standardName
        }
      }));

    } catch (error) {
      console.error('單項拒絕失敗:', error);
      showNotification(`拒絕「${item.standardName}」失敗：${error.message}`, 'error');
    } finally {
      setProcessingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  const handleApprove = async () => {
    if (!selectedSubmission || !selectedSubmission.items) {
      showNotification('沒有選擇有效的提交記錄', 'error');
      return;
    }

    // 過濾出尚未審核的項目
    const pendingItems = selectedSubmission.items.filter(item => !itemStatuses[item.id]);
    
    if (pendingItems.length === 0) {
      showNotification('所有項目都已審核完成', 'info');
      return;
    }

    setLoading(true);
    try {
      console.log('批量核准積分記錄:', selectedSubmission);

      // 批量審核所有未審核項目
      const approvalPromises = pendingItems.map(item =>
        pointsAPI.approvePointsEntry(
          item.id,
          currentUser.id,
          reviewComments || '批量審核通過'
        )
      );

      await Promise.all(approvalPromises);
      console.log('所有積分記錄審核通過');
      
      showNotification(
        `已成功核准 ${selectedSubmission.employeeName} 的 ${pendingItems.length} 個積分項目！`,
        'success'
      );

      // 觸發全局事件，通知員工面板更新
      window.dispatchEvent(new CustomEvent('pointsApproved', {
        detail: {
          submissionId: selectedSubmission.id,
          employeeId: selectedSubmission.employeeId,
          approverId: currentUser.id,
          itemsCount: pendingItems.length
        }
      }));

      // 重新載入列表
      await loadSubmissions();
      setSelectedSubmission(null);
      setReviewComments('');
      setManagerScore({});
      setExpandedItems({});
      setItemComments({});
      setItemStatuses({});
    } catch (error) {
      console.error('批量核准失敗:', error);
      showNotification('核准失敗：' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!reviewComments.trim()) {
      showNotification('請填寫拒絕原因', 'error');
      return;
    }

    if (!selectedSubmission || !selectedSubmission.items) {
      showNotification('沒有選擇有效的提交記錄', 'error');
      return;
    }

    // 過濾出尚未審核的項目
    const pendingItems = selectedSubmission.items.filter(item => !itemStatuses[item.id]);
    
    if (pendingItems.length === 0) {
      showNotification('所有項目都已審核完成', 'info');
      return;
    }

    setLoading(true);
    try {
      console.log('批量拒絕積分記錄:', selectedSubmission);

      // 批量拒絕所有未審核項目
      const rejectionPromises = pendingItems.map(item =>
        pointsAPI.rejectPointsEntry(
          item.id,
          currentUser.id,
          reviewComments
        )
      );

      await Promise.all(rejectionPromises);
      console.log('所有積分記錄已拒絕');
      
      showNotification(
        `已拒絕 ${selectedSubmission.employeeName} 的 ${pendingItems.length} 個積分項目`,
        'info'
      );

      // 觸發全局事件，通知員工面板更新
      window.dispatchEvent(new CustomEvent('pointsRejected', {
        detail: {
          submissionId: selectedSubmission.id,
          employeeId: selectedSubmission.employeeId,
          rejectedBy: currentUser.id,
          reason: reviewComments,
          itemsCount: pendingItems.length
        }
      }));

      // 重新載入列表
      await loadSubmissions();
      setSelectedSubmission(null);
      setReviewComments('');
      setManagerScore({});
      setExpandedItems({});
      setItemComments({});
      setItemStatuses({});
    } catch (error) {
      console.error('批量拒絕失敗:', error);
      showNotification('拒絕失敗：' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // 檢查是否為圖片檔案
  const isImageFile = (fileName) => {
    if (!fileName) return false;
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const extension = '.' + fileName.split('.').pop().toLowerCase();
    return imageExtensions.includes(extension);
  };

  // 獲取檔案預覽URL
  const getFilePreviewUrl = (file) => {
    console.log('生成檔案預覽URL:', file);

    if (file.id && !file.isNew) {
      // 現有檔案：通過API端點，使用完整URL
      const intFileId = parseInt(file.id);
      if (!isNaN(intFileId)) {
        // 使用完整的API URL而不是相對路徑
        const url = `http://localhost:5001/api/fileupload/download/${intFileId}`;
        console.log('生成API下載URL:', url);
        return url;
      }
    }

    if (file.file && file.isNew) {
      // 新檔案：使用Blob URL
      const url = URL.createObjectURL(file.file);
      console.log('生成Blob URL:', url);
      return url;
    }

    if (file.url) {
      // 已有URL
      console.log('使用現有URL:', file.url);
      return file.url;
    }

    console.warn('無法生成檔案預覽URL:', file);
    return null;
  };

  // 預覽檔案
  const previewFile = async (file) => {
    setPreviewLoading(true);
    const startTime = Date.now();
    const minimumLoadingTime = 1000;

    try {
      const fileName = file.fileName || file.name || '未知檔案';
      const fileExtension = fileName.toLowerCase().split('.').pop();
      let fileType = 'document';

      // 判斷檔案類型
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExtension)) {
        fileType = 'image';
      } else {
        // PDF和其他文檔都統一顯示下載提示
        fileType = 'document';
      }

      // 生成預覽URL
      const previewUrl = getFilePreviewUrl(file);
      console.log('生成檔案預覽URL:', {
        fileName: fileName,
        fileType: fileType,
        previewUrl: previewUrl,
        fileInfo: file
      });

      setPreviewModal({
        isOpen: true,
        imageSrc: previewUrl,
        fileName: fileName,
        file: file,
        type: fileType
      });
    } finally {
      // 確保最小加載時間
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minimumLoadingTime) {
        setTimeout(() => {
          setPreviewLoading(false);
        }, minimumLoadingTime - elapsedTime);
      } else {
        setPreviewLoading(false);
      }
    }
  };

  const downloadFile = async (file) => {
    const fileName = file.fileName || file.name || '未知檔案';
    const fileKey = file.id || fileName;
    setDownloadLoading(prev => ({ ...prev, [fileKey]: true }));

    const startTime = Date.now();
    const minimumLoadingTime = 1000;

    try {
      console.log('開始下載檔案:', {
        fileName: fileName,
        fileInfo: file
      });

      showNotification(`正在下載檔案: ${fileName}`, 'info');

      if (file.id && !file.isNew) {
        // 現有檔案：使用API下載
        const intFileId = parseInt(file.id);
        if (isNaN(intFileId)) {
          throw new Error(`無效的檔案ID: ${file.id}`);
        }

        console.log('通過API下載檔案，ID:', intFileId);
        const response = await pointsAPI.downloadFile(intFileId);
        console.log('下載響應:', response);

        // 創建下載連結
        const url = window.URL.createObjectURL(new Blob([response.data || response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        showNotification(`檔案下載成功: ${fileName}`, 'success');
      } else if (file.file && file.isNew) {
        // 新檔案：直接下載Blob
        console.log('下載新檔案Blob');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file.file);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification(`檔案下載成功: ${fileName}`, 'success');
      } else {
        // 其他情況：嘗試使用預覽URL
        const downloadUrl = getFilePreviewUrl(file);
        if (downloadUrl) {
          console.log('使用預覽URL下載:', downloadUrl);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          showNotification(`檔案下載成功: ${fileName}`, 'success');
        } else {
          throw new Error('無法獲取檔案下載URL');
        }
      }
    } catch (error) {
      console.error('下載檔案失敗:', error);
      showNotification(`下載檔案失敗: ${error.message}`, 'error');
    } finally {
      // 確保最小加載時間
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minimumLoadingTime) {
        setTimeout(() => {
          setDownloadLoading(prev => ({ ...prev, [fileKey]: false }));
        }, minimumLoadingTime - elapsedTime);
      } else {
        setDownloadLoading(prev => ({ ...prev, [fileKey]: false }));
      }
    }
  };

  // 獲取項目的審核狀態顯示
  const getItemStatusDisplay = (item) => {
    const status = itemStatuses[item.id];
    if (!status) return null;

    const statusConfig = {
      approved: {
        color: 'text-green-400',
        bgColor: 'bg-green-600/20',
        borderColor: 'border-green-400/50',
        icon: <CheckCircle className="h-4 w-4" />,
        text: '已核准'
      },
      rejected: {
        color: 'text-red-400',
        bgColor: 'bg-red-600/20',
        borderColor: 'border-red-400/50',
        icon: <XCircle className="h-4 w-4" />,
        text: '已拒絕'
      }
    };

    const config = statusConfig[status.status];
    if (!config) return null;

    return (
      <div className={`mt-3 p-3 rounded-lg border ${config.borderColor} ${config.bgColor}`}>
        <div className={`flex items-center space-x-2 ${config.color} mb-2`}>
          {config.icon}
          <span className="font-medium">{config.text}</span>
          <span className="text-xs text-slate-400">
            由 {status.reviewedBy} 於 {status.reviewedAt}
          </span>
        </div>
        {status.comment && (
          <div className="text-sm text-slate-300">
            <span className="text-slate-400">審核說明：</span>
            {status.comment}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6 space-y-6 bg-transparent">
      <h2 className="text-2xl font-bold text-white">👨‍💼 主管審核與評分</h2>

      {/* 權限說明卡片 */}
      <div className="bg-blue-600/10 border border-blue-400/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2 flex items-center">
          <span className="mr-2">📋</span>
          審核權限說明
        </h4>
        <p className="text-blue-200 text-sm">
          {currentUser.role === 'boss' 
            ? '您是董事長，可以審核所有員工、主管、管理員、總經理的積分提交'
            : currentUser.role === 'president'
            ? '您是總經理，可以審核全公司員工、主管、管理員的積分提交'
            : currentUser.role === 'admin'
            ? `您是管理員，可以審核 ${currentUser.departmentName || currentUser.department || '所屬部門'} 的員工、主管積分提交`
            : `您是主管，只能審核 ${currentUser.departmentName || currentUser.department || '所屬部門'} 的員工積分提交`
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[calc(100vh-8rem)]">
        {/* 左側：待審核列表 */}
        <div className="lg:col-span-1 h-full">
          <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg shadow-sm border border-slate-600/50 p-4 h-full flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-4">📋 待審核提交</h3>
            
            {submissions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                  <p>目前沒有待審核的提交</p>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2">
                {submissions.map((employeeGroup) => {
                  const roleDisplay = getRoleDisplay(employeeGroup.employeeRole || 'employee');
                  const isExpanded = expandedGroups.has(employeeGroup.id);
                  
                  return (
                    <div key={employeeGroup.id} className="border border-slate-500/50 rounded-lg">
                      {/* 員工分組標題 - 可點擊展開/收合 */}
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupExpansion(employeeGroup.id);
                        }}
                        className="p-3 cursor-pointer hover:bg-slate-600/30 transition-all rounded-t-lg"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400 text-sm">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                            <span className={`text-lg ${roleDisplay.color}`}>{roleDisplay.icon}</span>
                            <span className="font-medium text-white">{employeeGroup.employeeName}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${roleDisplay.color} ${roleDisplay.bgColor} border border-current border-opacity-30`}>
                              {roleDisplay.name}
                            </span>
                            <span className="text-slate-400 text-sm">({employeeGroup.totalSubmissions})</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-slate-300 mt-1">
                          <span className="text-blue-400">🏢</span>
                          <span className="font-medium">{employeeGroup.department}</span>
                          <span>•</span>
                          <span className="text-blue-300 font-medium">
                            {employeeGroup.totalPoints.toFixed(1)} 總積分
                          </span>
                        </div>
                      </div>
                      
                      {/* 展開的提交列表 */}
                      {isExpanded && (
                        <div className="border-t border-slate-600/50 p-2 space-y-2">
                          {employeeGroup.submissions.map((submission, index) => (
                            <div 
                              key={submission.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectSubmission(submission);
                              }}
                              className={`p-2 rounded cursor-pointer transition-all ${
                                selectedSubmission?.id === submission.id 
                                  ? 'bg-blue-600/50 border border-blue-400/50' 
                                  : 'bg-slate-700/30 hover:bg-slate-600/30 border border-slate-600/30'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="text-sm text-white font-medium">
                                  📝 {submission.standardName}
                                </div>
                                <div className="text-xs text-blue-300 font-medium">
                                  {submission.pointsCalculated.toFixed(1)} 積分
                                </div>
                              </div>
                              <div className="text-xs text-slate-300 mt-1">
                                📅 {new Date(submission.submittedAt).toLocaleDateString('zh-TW')} {new Date(submission.submittedAt).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 右側：審核詳情 */}
        <div className="lg:col-span-2 h-full">
          {selectedSubmission ? (
            <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg shadow-sm border border-slate-600/50 p-6 space-y-6 h-full flex flex-col">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold text-white">
                      {selectedSubmission.employeeName} 的積分提交
                    </h3>
                    {(() => {
                      const roleDisplay = getRoleDisplay(selectedSubmission.employeeRole || 'employee');
                      return (
                        <span className={`inline-flex items-center space-x-1 text-sm px-3 py-1 rounded-full ${roleDisplay.color} ${roleDisplay.bgColor} border border-current border-opacity-30`}>
                          <span>{roleDisplay.icon}</span>
                          <span>{roleDisplay.name}</span>
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-slate-300 flex items-center space-x-2">
                    <span className="text-blue-400">🏢</span>
                    <span>{selectedSubmission.department}</span>
                    <span>•</span>
                    <span>{new Date(selectedSubmission.submissionDate).toLocaleString('zh-TW')}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-300">
                    {selectedSubmission.totalPoints.toFixed(1)}
                  </div>
                  <div className="text-sm text-slate-400">
                    總積分 • {selectedSubmission.totalItems} 個項目
                  </div>
                </div>
              </div>

              {/* 積分項目詳情 */}
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex items-center justify-between flex-shrink-0">
                  <h4 className="text-lg font-semibold text-white">📝 積分項目詳情</h4>
                  <button
                    onClick={() => setEditMode(!editMode)}
                    className="flex items-center space-x-1 text-blue-400 hover:text-blue-300"
                  >
                    <Edit className="h-4 w-4" />
                    <span>{editMode ? '完成編輯' : '編輯評分'}</span>
                  </button>
                </div>

                {/* 所有積分項目列表 */}
                <div className="flex-1 overflow-y-auto space-y-3">
                  {selectedSubmission.items?.map((item, index) => {
                    const isProcessing = processingItems.has(item.id);
                    const itemStatus = itemStatuses[item.id];
                    const isReviewed = !!itemStatus;
                    
                    return (
                      <div key={item.id} className="bg-slate-600/30 rounded-lg border border-slate-500/50">
                        {/* 項目標題（可點擊展開/收起） */}
                        <div 
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-600/50 transition-colors"
                          onClick={() => toggleItemExpanded(item.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-blue-300">項目 {index + 1}</span>
                              <h5 className="font-medium text-white">{item.standardName}</h5>
                              {/* 審核狀態標示 */}
                              {isReviewed && (
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  itemStatus.status === 'approved'
                                    ? 'bg-green-600/20 text-green-400'
                                    : 'bg-red-600/20 text-red-400'
                                }`}>
                                  {itemStatus.status === 'approved' ? '已核准' : '已拒絕'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-300 mt-1 line-clamp-1">
                              積分項目：{item.standardName}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <div className="text-sm text-blue-300 font-medium">
                                {item.pointsCalculated?.toFixed(1)} 積分
                              </div>
                            </div>
                            {expandedItems[item.id] ? (
                              <ChevronUp className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* 項目詳細內容（可展開） */}
                        {expandedItems[item.id] && (
                          <div className="border-t border-slate-500/50 p-4 bg-slate-700/20">
                            <div className="space-y-3">
                              {/* 員工工作說明 */}
                              <div className="bg-blue-600/10 border border-blue-400/30 rounded-lg p-3">
                                <h6 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
                                  📝 員工工作說明
                                </h6>
                                <div className="text-sm text-slate-200 leading-relaxed">
                                  {item.description || (
                                    <span className="text-slate-400 italic">員工未填寫工作說明</span>
                                  )}
                                </div>
                              </div>

                              {/* 積分詳情 */}
                              <div>
                                <div className="text-xs text-slate-400">
                                  基礎積分: {item.basePoints?.toFixed(1)}
                                  {item.bonusPoints > 0 && (
                                    <span className="text-green-400 ml-2">
                                      獎勵積分: +{item.bonusPoints?.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* 主管評分 */}
                              {editMode && !isReviewed && (
                                <div className="p-3 bg-slate-800/50 border border-slate-500/50 rounded">
                                  <label className="block text-sm font-medium text-slate-200 mb-2">
                                    主管評分 (0-5星):
                                  </label>
                                  <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={star}
                                        onClick={() => handleScoreChange(item.id, star)}
                                        className={`p-1 ${
                                          (managerScore[item.id] || 0) >= star
                                            ? 'text-yellow-400'
                                            : 'text-slate-500'
                                        }`}
                                      >
                                        <Star className="h-5 w-5 fill-current" />
                                      </button>
                                    ))}
                                    <span className="ml-2 text-sm text-slate-300">
                                      {managerScore[item.id] || 0} 星
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* 證明文件 */}
                              {(item.evidenceFileDetails && item.evidenceFileDetails.length > 0) || item.evidenceFiles ? (
                                <div>
                                  <h6 className="text-sm font-medium text-slate-200 mb-2">證明文件:</h6>
                                  <div className="space-y-2">
                                    {(() => {
                                      console.log('解析檔案資料:', item);
                                      
                                      // 優先使用新的 evidenceFileDetails 字段
                                      if (item.evidenceFileDetails && Array.isArray(item.evidenceFileDetails) && item.evidenceFileDetails.length > 0) {
                                        console.log('使用 evidenceFileDetails:', item.evidenceFileDetails);
                                        return item.evidenceFileDetails.map((file, fileIndex) => {
                                          // 確保檔案物件格式正確
                                          if (typeof file === 'object' && file !== null) {
                                            const fileName = file.fileName || `檔案${fileIndex + 1}`;
                                            const isImage = isImageFile(fileName);
                                            const fileKey = file.id || fileName;
                                            const isDownloading = downloadLoading[fileKey];

                                            return (
                                              <div key={fileIndex} className="flex items-center justify-between text-sm bg-slate-800/50 p-3 rounded border border-slate-500/50">
                                                <div className="flex-1">
                                                  <div className="flex items-center space-x-2">
                                                    {isImage ? (
                                                      <Image className="h-4 w-4 text-blue-400" />
                                                    ) : (
                                                      <FileText className="h-4 w-4 text-slate-400" />
                                                    )}
                                                    <div className="text-slate-200 font-medium">{fileName}</div>
                                                  </div>
                                                  <div className="text-xs text-slate-400 mt-1">
                                                    {file.fileSize ? `${(file.fileSize / 1024 / 1024).toFixed(2)} MB` : '大小未知'} • 
                                                    {file.contentType || '類型未知'}
                                                  </div>
                                                </div>
                                                <div className="flex items-center space-x-2 ml-3">
                                                  {isImage && (
                                                    <button
                                                      onClick={() => previewFile(file)}
                                                      disabled={previewLoading}
                                                      className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded border border-blue-500/30 transition-colors"
                                                      title="預覽圖片"
                                                    >
                                                      <Eye className="h-3.5 w-3.5" />
                                                    </button>
                                                  )}
                                                  <button
                                                    onClick={() => downloadFile(file)}
                                                    disabled={isDownloading}
                                                    className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-600/20 rounded border border-green-500/30 transition-colors flex items-center space-x-1"
                                                    title="下載檔案"
                                                  >
                                                    {isDownloading ? (
                                                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-green-400"></div>
                                                    ) : (
                                                      <Download className="h-3.5 w-3.5" />
                                                    )}
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          } else {
                                            console.warn('檔案物件格式錯誤:', file);
                                            return (
                                              <div key={fileIndex} className="text-sm text-slate-400">
                                                檔案資料格式錯誤: {JSON.stringify(file)}
                                              </div>
                                            );
                                          }
                                        });
                                      }
                                      
                                      // 向後兼容：使用原有的 evidenceFiles 字段
                                      else if (item.evidenceFiles) {
                                        console.log('使用 evidenceFiles:', item.evidenceFiles);
                                        try {
                                          let files;
                                          if (typeof item.evidenceFiles === 'string') {
                                            files = JSON.parse(item.evidenceFiles);
                                          } else {
                                            files = item.evidenceFiles;
                                          }

                                          console.log('解析後的files:', files);

                                          if (Array.isArray(files) && files.length > 0) {
                                            return files.map((file, fileIndex) => {
                                              // 檢查檔案是否為數字（檔案ID）
                                              if (typeof file === 'number') {
                                                // 檔案是ID，需要模擬檔案物件
                                                const mockFile = {
                                                  id: file,
                                                  fileName: `檔案${fileIndex + 1}`,
                                                  fileSize: null,
                                                  contentType: null
                                                };
                                                
                                                const fileName = mockFile.fileName;
                                                const isImage = false; // 無法確定類型，默認為文檔
                                                const fileKey = mockFile.id;
                                                const isDownloading = downloadLoading[fileKey];

                                                return (
                                                  <div key={fileIndex} className="flex items-center justify-between text-sm bg-slate-800/50 p-3 rounded border border-slate-500/50">
                                                    <div className="flex-1">
                                                      <div className="flex items-center space-x-2">
                                                        <FileText className="h-4 w-4 text-slate-400" />
                                                        <div className="text-slate-200 font-medium">{fileName}</div>
                                                      </div>
                                                      <div className="text-xs text-slate-400 mt-1">
                                                        檔案ID: {file}
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2 ml-3">
                                                      <button
                                                        onClick={() => downloadFile(mockFile)}
                                                        disabled={isDownloading}
                                                        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-600/20 rounded border border-green-500/30 transition-colors flex items-center space-x-1"
                                                        title="下載檔案"
                                                      >
                                                        {isDownloading ? (
                                                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-green-400"></div>
                                                        ) : (
                                                          <Download className="h-3.5 w-3.5" />
                                                        )}
                                                      </button>
                                                    </div>
                                                  </div>
                                                );
                                              } else if (typeof file === 'object' && file !== null) {
                                                // 正常的檔案物件
                                                const fileName = file.name || file.fileName || `檔案${fileIndex + 1}`;
                                                const isImage = isImageFile(fileName);
                                                const fileKey = file.id || fileName;
                                                const isDownloading = downloadLoading[fileKey];

                                                return (
                                                  <div key={fileIndex} className="flex items-center justify-between text-sm bg-slate-800/50 p-3 rounded border border-slate-500/50">
                                                    <div className="flex-1">
                                                      <div className="flex items-center space-x-2">
                                                        {isImage ? (
                                                          <Image className="h-4 w-4 text-blue-400" />
                                                        ) : (
                                                          <FileText className="h-4 w-4 text-slate-400" />
                                                        )}
                                                        <div className="text-slate-200 font-medium">{fileName}</div>
                                                      </div>
                                                      <div className="text-xs text-slate-400 mt-1">
                                                        {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : '大小未知'}
                                                        {file.type && ` • ${file.type}`}
                                                      </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2 ml-3">
                                                      {isImage && (
                                                        <button
                                                          onClick={() => previewFile(file)}
                                                          disabled={previewLoading}
                                                          className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded border border-blue-500/30 transition-colors"
                                                          title="預覽圖片"
                                                        >
                                                          <Eye className="h-3.5 w-3.5" />
                                                        </button>
                                                      )}
                                                      <button
                                                        onClick={() => downloadFile(file)}
                                                        disabled={isDownloading}
                                                        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-600/20 rounded border border-green-500/30 transition-colors flex items-center space-x-1"
                                                        title="下載檔案"
                                                      >
                                                        {isDownloading ? (
                                                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-green-400"></div>
                                                        ) : (
                                                          <Download className="h-3.5 w-3.5" />
                                                        )}
                                                      </button>
                                                    </div>
                                                  </div>
                                                );
                                              } else {
                                                console.warn('未知的檔案格式:', file);
                                                return (
                                                  <div key={fileIndex} className="text-sm text-slate-400">
                                                    未知檔案格式: {JSON.stringify(file)}
                                                  </div>
                                                );
                                              }
                                            });
                                          } else {
                                            return <div className="text-sm text-slate-400">無檔案資料</div>;
                                          }
                                        } catch (error) {
                                          console.error('解析檔案資料失敗:', error, 'evidenceFiles:', item.evidenceFiles);
                                          return <div className="text-sm text-slate-400">檔案資料格式錯誤: {error.message}</div>;
                                        }
                                      }
                                      
                                      else {
                                        console.log('無檔案資料');
                                        return <div className="text-sm text-slate-400">無檔案資料</div>;
                                      }
                                    })()}
                                  </div>
                                </div>
                              ) : null}

                              {/* 單項審核說明欄位和按鈕 */}
                              {!isReviewed && (
                                <div className="border-t border-slate-500/50 pt-3 mt-3">
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium text-slate-200 mb-2">
                                        審核說明:
                                      </label>
                                      <textarea
                                        value={itemComments[item.id] || ''}
                                        onChange={(e) => handleItemCommentChange(item.id, e.target.value)}
                                        placeholder="請填寫審核意見或拒絕原因..."
                                        rows={2}
                                        className="w-full px-3 py-2 bg-slate-800 border border-slate-500 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm"
                                      />
                                    </div>
                                    
                                    <div className="flex justify-end space-x-2">
                                      <button
                                        onClick={() => handleRejectItem(item)}
                                        disabled={isProcessing}
                                        className="px-3 py-1.5 border border-red-400/50 text-red-300 rounded-md hover:bg-red-600/20 disabled:opacity-50 flex items-center space-x-1 text-sm"
                                      >
                                        {isProcessing ? (
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-300"></div>
                                        ) : (
                                          <X className="h-3 w-3" />
                                        )}
                                        <span>拒絕</span>
                                      </button>
                                      <button
                                        onClick={() => handleApproveItem(item)}
                                        disabled={isProcessing}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1 text-sm"
                                      >
                                        {isProcessing ? (
                                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                        ) : (
                                          <Check className="h-3 w-3" />
                                        )}
                                        <span>核准</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* 審核結果顯示 */}
                              {getItemStatusDisplay(item)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 批量審核意見 */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  批量審核意見:
                </label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder="請填寫批量審核意見、建議或拒絕原因..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-500 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              {/* 審核按鈕 */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleReject}
                  disabled={loading}
                  className="px-4 py-2 border border-red-400/50 text-red-300 rounded-md hover:bg-red-600/20 disabled:opacity-50 flex items-center space-x-2"
                >
                  <XCircle className="h-4 w-4" />
                  <span>批量拒絕</span>
                </button>
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>處理中...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>批量核准</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg shadow-sm border border-slate-600/50 h-full flex items-center justify-center">
              <div className="text-center">
                <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">選擇要審核的提交</h3>
                <p className="text-slate-300">請從左側列表選擇一個待審核的積分提交</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 通知組件 */}
      <NotificationToast 
        notification={notification} 
        onClose={() => setNotification(null)} 
      />

      {/* 圖片預覽模態框 */}
      <ImagePreviewModal
        isOpen={previewModal.isOpen && previewModal.type === 'image'}
        onClose={() => setPreviewModal({ isOpen: false, imageSrc: '', fileName: '', file: null, type: 'image' })}
        imageSrc={previewModal.imageSrc}
        fileName={previewModal.fileName}
        onDownload={() => {
          if (previewModal.file) {
            downloadFile(previewModal.file);
          }
        }}
      />

      {/* 文檔預覽模態框 */}
      {previewModal.isOpen && previewModal.type === 'document' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4 border border-slate-600">
            <div className="text-center">
              <FileText className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">文檔預覽不可用</h3>
              <p className="text-slate-300 mb-6">
                此檔案類型無法直接預覽，請下載後使用對應軟體開啟。
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    if (previewModal.file) {
                      downloadFile(previewModal.file);
                    }
                    setPreviewModal({ isOpen: false, imageSrc: '', fileName: '', file: null, type: 'image' });
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  下載檔案
                </button>
                <button
                  onClick={() => setPreviewModal({ isOpen: false, imageSrc: '', fileName: '', file: null, type: 'image' })}
                  className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700 transition-colors"
                >
                  關閉
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerReviewForm;
