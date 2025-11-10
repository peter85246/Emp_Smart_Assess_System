import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Calendar, Tag, FileText, Edit, Trash2, X, Download, Eye, Image, Loader, Save } from 'lucide-react';
import { workLogAPI, fileUploadAPI } from '../../../services/pointsAPI';
import { pointsConfig, pointsUtils } from '../../../config/pointsConfig';
import axios from 'axios';
import useNotification from '../hooks/useNotification';
import useConfirmDialog from '../hooks/useConfirmDialog';
import NotificationToast from '../shared/NotificationToast';
import ConfirmDialog from '../shared/ConfirmDialog';
import ImagePreviewModal from '../shared/ImagePreviewModal';

/**
 * 工作日誌記錄組件 - 員工記錄日常工作的核心組件
 * 功能：
 * - 新增/編輯/刪除工作日誌
 * - 支援檔案附件上傳（圖片、PDF、Word等）
 * - 工作日誌分類管理
 * - 標籤系統
 * - 搜尋和篩選功能
 * - 檔案預覽和下載
 * 
 * 使用位置：EmployeePanel > 工作日誌頁面
 * API對接：
 * - workLogAPI.getEmployeeWorkLogs() - 獲取工作日誌
 * - workLogAPI.createWorkLog() - 創建工作日誌
 * - workLogAPI.updateWorkLog() - 更新工作日誌
 * - fileUploadAPI.uploadFile() - 檔案上傳
 * 
 * 特色功能：
 * - 智能日期處理（修復時區問題）
 * - 拖拽式檔案上傳
 * - 即時搜尋與分類篩選
 */
const WorkLogEntry = () => {
  const [workLogs, setWorkLogs] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    tags: '',
    attachments: []
  });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState({});
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    imageSrc: '',
    fileName: '',
    file: null,
    type: 'image'
  });

  // 新增所有需要的狀態變數
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingFiles, setPendingFiles] = useState([]);

  const { notification, showNotification, hideNotification } = useNotification();
  const { dialogState, showConfirmDialog, handleCancel } = useConfirmDialog();

  const employeeId = JSON.parse(localStorage.getItem('user'))?.id;

  // 從 pointsConfig 中獲取分類ID的函數
  // 修復獲取分類ID的函數
  const getCategoryId = useCallback((categoryName) => {
    console.log('查找分類ID，分類名稱:', categoryName);
    console.log('可用的工作日誌分類:', pointsConfig.workLogCategories);
    console.log('可用的積分類型:', pointsConfig.pointsTypes);
    
    // 首先在工作日誌分類中查找
    const workLogCategory = pointsConfig.workLogCategories.find(cat => cat.name === categoryName);
    if (workLogCategory) {
      console.log('在工作日誌分類中找到:', workLogCategory);
      return workLogCategory.id;
    }
    
    // 如果在工作日誌分類中找不到，嘗試在積分類型中查找
    const pointsTypeEntry = Object.entries(pointsConfig.pointsTypes).find(([key, type]) => type.name === categoryName);
    if (pointsTypeEntry) {
      const [key, type] = pointsTypeEntry;
      console.log('在積分類型中找到:', type, '鍵值:', key);
      // 根據鍵值映射到對應的ID
      const keyToIdMap = {
        'general': 1,        // 一般積分項目
        'professional': 2,   // 專業積分項目
        'management': 3,     // 管理積分項目
        'temporary': 4,      // 臨時工作項目
        'misc': 5           // 雜項事件
      };
      const mappedId = keyToIdMap[key] || 1; // 預設為1（一般積分項目）
      console.log('映射的ID:', mappedId);
      return mappedId;
    }
    
    console.warn('找不到分類ID，使用預設值1');
    return 1; // 預設為「一般積分項目」
  }, []);

  // 檔案上傳函數
  const uploadFiles = useCallback(async (files) => {
    const uploadedFiles = [];
    setUploadingFiles(true);
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fileUploadAPI.uploadFile(formData);
        
        if (response.success) {
          uploadedFiles.push({
            id: response.fileId,
            name: file.name,
            size: file.size,
            type: file.type,
            url: response.fileUrl,
            uploadDate: new Date().toISOString(),
            isNew: true
          });
        } else {
          throw new Error(`檔案 ${file.name} 上傳失敗`);
        }
      }
      return uploadedFiles;
    } catch (error) {
      console.error('檔案上傳失敗:', error);
      showNotification('檔案上傳失敗', 'error');
      return [];
    } finally {
      setUploadingFiles(false);
    }
  }, [showNotification]);

  useEffect(() => {
    if (employeeId) {
      loadWorkLogs();
    }
  }, [employeeId]);

  const loadWorkLogs = async () => {
    try {
      console.log('開始載入工作日誌，員工ID:', employeeId);
      const response = await workLogAPI.getEmployeeWorkLogs(employeeId);
      
      let workLogsData = Array.isArray(response) ? response :
                        Array.isArray(response.data) ? response.data :
                        response.data?.data || [];

      if (workLogsData.length > 0) {
        // 對每個工作日誌處理附件
        const transformedWorkLogs = workLogsData.map(log => {
          let attachments = [];
          
          // 解析 attachments 字符串
          if (log.attachments) {
            try {
              attachments = typeof log.attachments === 'string' 
                ? JSON.parse(log.attachments)
                : log.attachments;
            } catch (error) {
              console.error(`解析工作日誌 ${log.id} 的附件失敗:`, error);
            }
          }

          return {
            id: log.id,
            title: log.title || '工作日誌',
            content: log.content || '',
            category: getCategoryName(log.category || log.categoryId),
            tags: log.tags || '',
            logDate: log.logDate ? new Date(log.logDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            createdAt: log.createdAt || new Date().toISOString(),
            attachments: attachments.map(attachment => ({
              id: attachment.id,
              name: attachment.name,
              size: attachment.size,
              type: attachment.type,
              url: attachment.url,
              uploadDate: attachment.uploadDate
            }))
          };
        });
        
        setWorkLogs(transformedWorkLogs);
        console.log('轉換後的工作日誌:', transformedWorkLogs);
      } else {
        console.log('沒有工作日誌數據');
        setWorkLogs([]);
      }
    } catch (error) {
      console.error('載入工作日誌失敗:', error);
      setWorkLogs([]);
    }
  };

  // 解析附件數據
  const parseAttachments = (attachments) => {
    if (!attachments) return [];
    
    try {
      if (typeof attachments === 'string') {
        return JSON.parse(attachments);
      }
      if (Array.isArray(attachments)) {
        return attachments;
      }
      return [];
    } catch (error) {
      console.error('解析附件失敗:', error);
      return [];
    }
  };

  // 獲取分類名稱的輔助函數（根據md指南修復）
  const getCategoryName = (category) => {
    let categoryName = '一般積分項目'; // 預設值
    
    if (category) {
      if (typeof category === 'object' && category.name) {
        // LogCategory 對象格式
        categoryName = category.name;
      } else if (typeof category === 'string') {
        // 字符串格式處理
        if (pointsConfig.pointsTypes[category]) {
          categoryName = pointsConfig.pointsTypes[category].name;
        } else if (Object.values(pointsConfig.pointsTypes).find(type => type.name === category)) {
          categoryName = category;
        }
      } else if (typeof category === 'number') {
        // 如果是數字ID，根據ID映射
        const categoryKeys = Object.keys(pointsConfig.pointsTypes);
        const categoryKey = categoryKeys[category - 1];
        categoryName = categoryKey ? pointsConfig.pointsTypes[categoryKey].name : '一般積分項目';
      }
    }
    
    return categoryName;
  };

  // 檔案上傳處理
  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploadingFiles(true);
    const startTime = Date.now();
    const minimumLoadingTime = 2000;

    try {
      const uploadedFiles = [];
      
      for (const file of files) {
        // 驗證檔案
        const validation = pointsUtils.validateFile(file);
        if (!validation.isValid) {
          showNotification(validation.errors[0], 'error');
          continue;
        }

        // 檢查檔案數量限制
        if (formData.attachments.length + uploadedFiles.length >= pointsConfig.fileUpload.maxFiles) {
          showNotification(`最多只能上傳 ${pointsConfig.fileUpload.maxFiles} 個檔案`, 'error');
          break;
        }

        // 準備上傳資料
        const formDataObj = new FormData();
        formDataObj.append('file', file);
        formDataObj.append('entityType', 'WorkLog');
        formDataObj.append('entityId', editingLog ? editingLog.id : 0);
        formDataObj.append('uploadedBy', employeeId);

        // 上傳到後端
        try {
          const response = await axios.post(
            `${pointsConfig.apiEndpoints.base}/fileupload/upload`,
            formDataObj,
            {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }
          );

          if (response.data) {
            uploadedFiles.push({
              id: response.data.id,
              name: response.data.fileName,
              size: file.size,
              type: file.type,
              url: `${pointsConfig.apiEndpoints.base}/fileupload/download/${response.data.id}`,
              uploadDate: new Date().toISOString()
            });
          }
        } catch (uploadError) {
          console.error(`檔案 ${file.name} 上傳失敗:`, uploadError);
          showNotification(`檔案 ${file.name} 上傳失敗`, 'error');
        }
      }

      if (uploadedFiles.length > 0) {
        setFormData(prev => ({
          ...prev,
          attachments: [...prev.attachments, ...uploadedFiles]
        }));
        showNotification(`成功上傳 ${uploadedFiles.length} 個檔案`, 'success');
      }
    } catch (error) {
      console.error('檔案上傳處理失敗:', error);
      showNotification('檔案上傳失敗，請重試', 'error');
    } finally {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minimumLoadingTime) {
        setTimeout(() => {
          setUploadingFiles(false);
        }, minimumLoadingTime - elapsedTime);
      } else {
        setUploadingFiles(false);
      }
    }
  };

  // 移除檔案
  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // 檢查是否為圖片檔案
  const isImageFile = (fileName) => {
    if (!fileName) return false;
    try {
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
      const extension = '.' + fileName.split('.').pop().toLowerCase();
      return imageExtensions.includes(extension);
    } catch (error) {
      console.warn('檢查檔案類型失敗:', error);
      return false;
    }
  };

  // 獲取檔案預覽URL
  const getFilePreviewUrl = (file) => {
    if (!file || !file.id) return null;
    return `${pointsConfig.apiEndpoints.base}/fileupload/download/${file.id}`;
  };

  // 預覽檔案（帶loading效果）
  const previewFile = async (file) => {
    setPreviewLoading(true);
    const startTime = Date.now();
    const minimumLoadingTime = 2000;

    try {
      const fileName = file.name || file.FileName || '未知檔案';
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

  // 下載檔案（帶loading效果）
  const downloadFile = async (file) => {
    if (!file || !file.id) {
      showNotification('無效的檔案', 'error');
      return;
    }

    const fileName = file.name || '未知檔案';
    setDownloadLoading(prev => ({ ...prev, [file.id]: true }));

    const startTime = Date.now();
    const minimumLoadingTime = 2000;

    try {
      // 使用後端 API 下載檔案
      window.open(`${pointsConfig.apiEndpoints.base}/fileupload/download/${file.id}`);
      showNotification(`正在下載 ${fileName}`, 'success');
    } catch (error) {
      console.error('下載檔案失敗:', error);
      showNotification('下載失敗，請重試', 'error');
    } finally {
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < minimumLoadingTime) {
        setTimeout(() => {
          setDownloadLoading(prev => ({ ...prev, [file.id]: false }));
        }, minimumLoadingTime - elapsedTime);
      } else {
        setDownloadLoading(prev => ({ ...prev, [file.id]: false }));
      }
    }
  };

  // 格式化檔案大小
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // 驗證表單
    if (!formData.title.trim()) {
      showNotification('請輸入標題', 'error');
      return;
    }

    if (!formData.category) {
      showNotification('請選擇分類', 'error');
      return;
    }

    // 處理附件上傳
    let finalAttachments = [...(formData.attachments || [])];
    
    if (pendingFiles.length > 0) {
      const uploadedFiles = await uploadFiles(pendingFiles);
      finalAttachments = [...finalAttachments, ...uploadedFiles];
    }

    const categoryId = getCategoryId(formData.category);
    if (!categoryId) {
      throw new Error('無效的分類選擇');
    }

    const now = new Date();
    const localDate = new Date(now.getTime() - (now.getTimezoneOffset() * 60000));
    
    const workLogData = {
      EmployeeId: parseInt(employeeId),
      Title: formData.title?.toString() || '',
      Content: formData.content?.toString() || '',
      CategoryId: parseInt(categoryId),
      Tags: formData.tags?.toString() || '',
      LogDate: localDate.toISOString(),
      Attachments: finalAttachments.length > 0 ? JSON.stringify(finalAttachments) : null,
      UpdatedAt: localDate.toISOString()
    };

    // 驗證必要字段
    if (!workLogData.EmployeeId || isNaN(workLogData.EmployeeId)) {
      throw new Error('員工ID無效');
    }
    if (!workLogData.Title || workLogData.Title.trim() === '') {
      throw new Error('標題不能為空');
    }
    if (!workLogData.CategoryId || isNaN(workLogData.CategoryId)) {
      throw new Error('分類ID無效');
    }

    console.log('提交的工作日誌數據:', workLogData);

    let isSuccess = false;
    let resultMessage = '';

    if (editingLog) {
      // 編輯模式：檢查是否需要審核
      try {
        // 添加 ID 到更新數據中
        const updateData = {
          ...workLogData,
          Id: editingLog.id
        };
        
        const response = await workLogAPI.updateWorkLog(editingLog.id, updateData);
        
        /* 審核功能設計（目前停用）
        // 根據返回狀態顯示不同提示
        if (response.status === 'edit_pending') {
          resultMessage = '工作記錄已提交編輯申請，等待主管審核！';
          showNotification(resultMessage, 'info');
        } else {
          resultMessage = '工作記錄更新成功！';
          showNotification(resultMessage, 'success');
        }
        */

        // 直接顯示編輯成功提示
        resultMessage = '工作日誌編輯成功！';
        showNotification(resultMessage, 'success');
        isSuccess = true;
      } catch (error) {
        console.error('更新工作日誌失敗:', error);
        throw error;
      }
    } else {
      // 新增模式
      const response = await workLogAPI.createWorkLog(workLogData);
      
      if (response.pointsClaimed > 0) {
        resultMessage = `工作記錄儲存成功！獲得 ${response.pointsClaimed} 積分！`;
        showNotification(resultMessage, 'success');
        
        // 同步更新積分到積分管理系統
        try {
          await fetch('/api/points/add', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              employeeId: workLogData.EmployeeId,
              points: response.pointsClaimed,
              type: 'worklog_submission',
              description: `工作日誌：${workLogData.Title}`,
              date: workLogData.LogDate
            })
          });
        } catch (error) {
          console.error('同步積分失敗:', error);
        }
      } else {
        resultMessage = '工作記錄儲存成功！（今日已填寫過工作日誌）';
        showNotification(resultMessage, 'success');
      }
      isSuccess = true;
    }

    if (isSuccess) {
      resetForm();
      setPendingFiles([]);
      await loadWorkLogs();
    }

    } catch (error) {
      console.error('提交工作日誌失敗:', error);
      showNotification(error.message || '操作失敗，請稍後再試', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      category: '',
      tags: '',
      attachments: []
    });
    setShowForm(false);
    setEditingLog(null);
  };

  // 修改編輯處理函數
  const handleEdit = (log) => {
    // 檢查是否可以編輯
    if (log.status === 'edit_pending') {
      showNotification('此工作日誌正在等待編輯審核，暫時無法再次編輯', 'warning');
      return;
    }

    // 檢查編輯次數限制
    const editCount = workLogAPI.getWorkLogEditCount(log.id);
    if (editCount >= 2) {
      showNotification('此工作日誌已達到最大編輯次數限制（2次）', 'error');
      return;
    }

    // 顯示剩餘編輯次數提示
    const remainingEdits = 2 - editCount;
    showNotification(
      `開始編輯工作日誌（剩餘 ${remainingEdits} 次編輯機會）`,
      'info'
    );

    setEditingLog(log);
    setFormData({
      title: log.title,
      content: log.content,
      category: log.category,
      tags: log.tags,
      attachments: log.attachments || []
    });
    setShowForm(true);
    
    // 自動滾動到表單區域
    setTimeout(() => {
      const formElement = document.querySelector('.bg-slate-800\\/50');
      if (formElement) {
        formElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }
    }, 300);
  };

  const handleDelete = async (id) => {
    const confirmed = await showConfirmDialog({
      title: '確認刪除',
      message: '確定要刪除這個工作日誌嗎？此操作無法復原。',
      confirmText: '確認刪除',
      cancelText: '取消',
      type: 'danger'
    });
    
    if (!confirmed) return;

    try {
      await workLogAPI.deleteWorkLog(id);
      showNotification('工作日誌刪除成功！', 'success');
      await loadWorkLogs();
    } catch (error) {
      console.error('刪除失敗:', error);
      showNotification('刪除失敗，請重試', 'error');
    }
  };

  // 過濾工作日誌
  const filteredWorkLogs = workLogs.filter(log => {
    const matchesSearch = !searchTerm || 
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || log.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // 使用積分類型作為分類選項
  const categoryOptions = useMemo(() => {
    const standardTypes = [
      '一般積分項目',
      '專業積分項目',
      '管理積分項目',
      '臨時工作項目',
      '雜項事件'
    ];
    return standardTypes;
  }, []);

  // 設置預設分類
  useEffect(() => {
    if (!formData.category && !editingLog) {
      setFormData(prev => ({
        ...prev,
        category: '一般積分項目' // 預設選擇一般積分項目
      }));
    }
  }, [formData.category, editingLog]);

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 min-h-[400px]">
      {/* 頁面標題與新增按鈕 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">工作日誌</h2>
          <p className="text-sm text-slate-300 mt-1">
            📝 記錄每日工作內容和心得，支持檔案附件上傳
          </p>
        </div>
        
        {/* 新增按鈕 - 右對齊 */}
        <button
          onClick={() => {
            setShowForm(true);
            setEditingLog(null);
            setFormData({
              title: '', 
              content: '', 
              category: '', 
              tags: '', 
              attachments: []
            });
            
            // 自動滾動到表單區域 - 根據md指南實現
            setTimeout(() => {
              // 嘗試滾動到表單元素，如果找不到則滾動到頁面頂部
              const formElement = document.querySelector('.bg-slate-800\\/50');
              if (formElement) {
                formElement.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              } else {
                // 降級方案：滾動到頁面頂部
                window.scrollTo({
                  top: 0,
                  behavior: 'smooth'
                });
              }
            }, 300); // 300ms 延遲確保表單完全渲染
          }}
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          新增日誌
        </button>
      </div>

      {/* 搜索和篩選 - 移到上方 */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 sm:py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-base focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="搜索工作日誌..."
            />
          </div>
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-3 py-2.5 sm:py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-base focus:ring-2 focus:ring-green-500 focus:border-transparent overflow-hidden"
        >
          <option value="">所有分類</option>
          {categoryOptions.map(categoryName => (
            <option key={categoryName} value={categoryName}>
              {categoryName}
            </option>
          ))}
        </select>
      </div>

      {/* 表單 - 深色背景配綠色邊框 */}
      {showForm && (
        <div className="bg-slate-800/50 backdrop-blur-sm border-2 border-green-500/50 rounded-xl p-4 sm:p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingLog ? '編輯工作日誌' : '新增工作日誌'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 標題 */}
            <div>
              <label className="block text-sm font-medium text-green-200 mb-2">
                標題 *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="輸入工作日誌標題..."
                required
              />
            </div>

            {/* 內容 */}
            <div>
              <label className="block text-sm font-medium text-green-200 mb-2">
                工作內容
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="描述今日的工作內容..."
              />
            </div>

            {/* 分類 */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-green-200 mb-2">
                分類
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2.5 sm:py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white text-base focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="">請選擇分類</option>
                {categoryOptions.map(categoryName => (
                  <option key={categoryName} value={categoryName}>
                    {categoryName}
                  </option>
                ))}
              </select>
            </div>

            {/* 標籤 */}
            <div>
              <label className="block text-sm font-medium text-green-200 mb-2">
                標籤
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="用逗號分隔多個標籤..."
              />
            </div>

            {/* 檔案上傳區域 - 綠色主題 */}
            <div className="border-2 border-dashed border-green-500/50 rounded-lg p-4 bg-slate-700/50">
              <label className="block text-sm font-medium text-green-200 mb-2">
                📎 檔案附件 (選填)
              </label>
              
              <div className="text-center">
                {uploadingFiles ? (
                  <div className="flex flex-col items-center">
                    <Loader className="h-8 w-8 text-green-400 animate-spin mb-2" />
                    <span className="text-green-200 text-sm font-medium">處理檔案中...</span>
                  </div>
                ) : (
                  <>
                    <label htmlFor="file-upload" className="flex flex-col items-center justify-center cursor-pointer">
                      <Plus className="h-8 w-8 text-green-400 mb-2" />
                      <span className="text-green-200 text-sm font-medium">
                        點擊選擇檔案或拖拽到此處
                      </span>
                      <span className="text-slate-400 text-xs mt-1">
                        支援格式：JPG, PNG, PDF, DOCX, XLSX | 最大 10MB | 最多 5 個檔案
                      </span>
                    </label>
                    <input
                      type="file"
                      multiple
                      accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="file-upload"
                      disabled={uploadingFiles}
                    />
                  </>
                )}
              </div>

              {/* 已上傳檔案列表 */}
              {formData.attachments.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h4 className="text-sm font-medium text-green-200">
                    已選擇的檔案 ({formData.attachments.length}/5)
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {formData.attachments.map((fileItem, index) => {
                      const isImage = isImageFile(fileItem.name);

                      return (
                        <div key={index} className={`flex items-center justify-between p-2 rounded border ${
                          isImage
                            ? 'bg-blue-700/20 border-blue-500/30'
                            : 'bg-slate-700 border-green-500/30'
                        }`}>
                          <div className="flex items-center space-x-2 min-w-0 flex-1">
                            {isImage ? (
                              <Image className="h-4 w-4 text-blue-400 flex-shrink-0" />
                            ) : (
                              <FileText className="h-4 w-4 text-green-400 flex-shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className={`text-sm font-medium truncate ${
                                isImage ? 'text-blue-200' : 'text-white'
                              }`}>
                                {fileItem.name}
                              </p>
                              <p className="text-xs text-slate-400">
                                {formatFileSize(fileItem.size)}
                                {fileItem.isNew && (
                                  <span className="ml-2 text-green-400">• 新檔案</span>
                                )}
                                {isImage && (
                                  <span className="ml-2 text-blue-400">• 圖片檔案</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1 flex-shrink-0">
                            {isImage && (
                              <button
                                type="button"
                                onClick={() => previewFile(fileItem)}
                                disabled={previewLoading}
                                className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded border border-blue-500/30"
                                title="預覽圖片"
                              >
                                {previewLoading ? (
                                  <Loader className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => downloadFile(fileItem)}
                              disabled={downloadLoading[fileItem.id || fileItem.name]}
                              className="p-1 text-green-400 hover:text-green-300 hover:bg-green-600/20 rounded border border-green-500/30"
                              title="下載檔案"
                            >
                              {downloadLoading[fileItem.id || fileItem.name] ? (
                                <Loader className="h-3 w-3 animate-spin" />
                              ) : (
                                <Download className="h-3 w-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-400 hover:text-red-300 ml-2 flex-shrink-0 p-1 hover:bg-red-600/20 rounded"
                              title="移除檔案"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 按鈕 - 綠色主題帶loading */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>
                  {loading 
                    ? '處理中...' 
                    : (editingLog ? '更新記錄' : '儲存記錄')
                  }
                </span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 工作日誌列表 */}
      <div className="space-y-4">
        {filteredWorkLogs.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">
              尚無工作日誌
            </h3>
            <p className="text-slate-500">
              點擊上方「新增日誌」按鈕開始記錄您的工作
            </p>
          </div>
        ) : (
          filteredWorkLogs.map(log => (
            <div key={log.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-500/50 rounded-xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-3">
                <div className="flex-1 w-full sm:w-auto">
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-2">
                    {log.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-400">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {(() => {
                        try {
                          const date = new Date(log.logDate);
                          // 檢查日期是否有效
                          if (isNaN(date.getTime())) {
                            return '日期無效';
                          }
                          return date.toLocaleDateString('zh-TW', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          });
                        } catch (error) {
                          console.error('日期解析錯誤:', error, 'logDate:', log.logDate);
                          return '日期解析失敗';
                        }
                      })()}
                    </span>
                    {log.category && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30">
                        {log.category}
                      </span>
                    )}
                    {(() => {
                      const editCount = workLogAPI.getWorkLogEditCount(log.id);
                      const remainingEdits = 2 - editCount;
                      return (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          remainingEdits > 0
                            ? 'bg-green-600/20 text-green-300 border border-green-500/30'
                            : 'bg-red-600/20 text-red-300 border border-red-500/30'
                        }`}>
                          {remainingEdits > 0
                            ? `剩餘 ${remainingEdits} 次編輯`
                            : '已達編輯上限'}
                        </span>
                      );
                    })()}
                    {log.tags && (
                      <span className="flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        {log.tags}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  {(() => {
                    const editCount = workLogAPI.getWorkLogEditCount(log.id);
                    const remainingEdits = 2 - editCount;
                    return (
                      <button
                        onClick={() => handleEdit(log)}
                        className={`p-2 ${
                          remainingEdits > 0
                            ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-600/20'
                            : 'text-slate-500 cursor-not-allowed'
                        } rounded-lg transition-colors`}
                        disabled={remainingEdits <= 0}
                        title={
                          remainingEdits > 0
                            ? `編輯工作日誌（剩餘 ${remainingEdits} 次編輯機會）`
                            : '已達到最大編輯次數限制'
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    );
                  })()}
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {log.content && (
                <div className="text-slate-300 mb-4">
                  {log.content}
                </div>
              )}

              {/* 附件檔案顯示 */}
              {log.attachments && (() => {
                try {
                  const attachments = typeof log.attachments === 'string' 
                    ? JSON.parse(log.attachments) 
                    : log.attachments;
                  
                  if (Array.isArray(attachments) && attachments.length > 0) {
                    return (
                      <div className="mt-4 pt-4 border-t border-slate-600">
                        <div className="flex items-center space-x-2 mb-3">
                          <FileText className="h-4 w-4 text-green-400" />
                          <span className="text-sm font-medium text-green-200">
                            附件檔案 ({attachments.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 p-2 bg-slate-700/30 rounded-lg border border-slate-600/50">
                          {attachments.map((attachment, index) => {
                            const fileName = attachment.name || attachment.FileName || `檔案${index + 1}`;
                            const isImage = isImageFile(fileName);

                            return (
                              <div key={index} className="flex items-center space-x-1">
                                <button
                                  onClick={() => {
                                    // 下載功能
                                    downloadFile(attachment);
                                  }}
                                  className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors ${
                                    isImage
                                      ? 'bg-blue-600/30 text-blue-200 hover:bg-blue-600/50 border border-blue-500/30'
                                      : 'bg-slate-600/50 text-slate-300 hover:bg-slate-600 border border-slate-500/30'
                                  }`}
                                  title={`檔案大小: ${formatFileSize(attachment.size || attachment.FileSize || 0)}`}
                                >
                                  {isImage ? (
                                    <Image className="h-3 w-3" />
                                  ) : (
                                    <FileText className="h-3 w-3" />
                                  )}
                                  <span className="max-w-20 truncate">
                                    {fileName}
                                  </span>
                                  <Download className="h-2.5 w-2.5 opacity-70" />
                                </button>
                                {isImage && (
                                  <button
                                    onClick={() => previewFile(attachment)}
                                    disabled={previewLoading}
                                    className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded border border-blue-500/30"
                                    title="預覽圖片"
                                  >
                                    {previewLoading ? (
                                      <Loader className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Eye className="h-3 w-3" />
                                    )}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                } catch (e) {
                  console.warn('解析附件失敗:', e);
                }
                return null;
              })()}
            </div>
          ))
        )}
      </div>

      {/* 圖片預覽模態框 */}
      <ImagePreviewModal
        isOpen={previewModal.isOpen}
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

      {/* 通知組件 */}
      <NotificationToast 
        notification={notification}
        onClose={hideNotification}
      />

      {/* 確認對話框組件 */}
      <ConfirmDialog
        isOpen={dialogState.isOpen}
        onClose={handleCancel}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        type={dialogState.type}
      />
    </div>
  );
};

export default WorkLogEntry;
