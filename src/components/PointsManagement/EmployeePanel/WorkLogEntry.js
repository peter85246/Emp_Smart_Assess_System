import React, { useState, useEffect } from 'react';
import { Plus, Search, Calendar, Tag, FileText, Edit, Trash2, X, Download, Eye, Image, Loader, Save } from 'lucide-react';
import { workLogAPI, fileUploadAPI } from '../../../services/pointsAPI';
import { pointsConfig } from '../../../config/pointsConfig';
import useNotification from '../hooks/useNotification';
import useConfirmDialog from '../hooks/useConfirmDialog';
import NotificationToast from '../shared/NotificationToast';
import ConfirmDialog from '../shared/ConfirmDialog';
import ImagePreviewModal from '../shared/ImagePreviewModal';

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

  const { notification, showNotification, hideNotification } = useNotification();
  const { dialogState, showConfirmDialog, handleCancel } = useConfirmDialog();

  const employeeId = JSON.parse(localStorage.getItem('user'))?.id;

  useEffect(() => {
    if (employeeId) {
      loadWorkLogs();
    }
  }, [employeeId]);

  const loadWorkLogs = async () => {
    try {
      console.log('開始載入工作日誌，員工ID:', employeeId);
      const response = await workLogAPI.getEmployeeWorkLogs(employeeId);
      console.log('載入工作日誌回應:', response);
      console.log('響應類型:', typeof response);
      console.log('是否為數組:', Array.isArray(response));

      // 處理不同的響應格式
      let workLogsData = [];
      if (Array.isArray(response)) {
        // 直接是數組
        workLogsData = response;
        console.log('使用直接數組格式');
      } else if (response && Array.isArray(response.data)) {
        // 包裝在data字段中
        workLogsData = response.data;
        console.log('使用data字段格式');
      } else if (response && response.data && Array.isArray(response.data.data)) {
        // 雙重包裝
        workLogsData = response.data.data;
        console.log('使用雙重包裝格式');
      } else {
        console.log('未知的響應格式:', response);
        console.log('響應的所有鍵:', response ? Object.keys(response) : 'null');
        workLogsData = [];
      }

      console.log('解析後的工作日誌數據:', workLogsData);
      console.log('工作日誌數量:', workLogsData.length);
      
      if (workLogsData.length > 0) {
        const transformedWorkLogs = workLogsData.map(log => ({
          id: log.id,
          title: log.title || '工作日誌',
          content: log.content || '',
          category: getCategoryName(log.category || log.categoryId),
          tags: log.tags || '',
          logDate: log.logDate ? new Date(log.logDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          createdAt: log.createdAt || new Date().toISOString(),
          attachments: parseAttachments(log.attachments)
        }));
        
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
    const minimumLoadingTime = 2000; // 2秒最小加載時間

    try {
      const uploadedFiles = [];
      
      for (const file of files) {
        // 驗證檔案大小
        if (file.size > 10 * 1024 * 1024) {
          showNotification(`檔案 ${file.name} 超過 10MB 限制`, 'error');
          continue;
        }

        // 驗證檔案格式
        const allowedTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.xlsx'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedTypes.includes(fileExtension)) {
          showNotification(`檔案 ${file.name} 格式不支援`, 'error');
          continue;
        }

        // 檢查檔案數量限制
        if (formData.attachments.length + uploadedFiles.length >= 5) {
          showNotification('最多只能上傳 5 個檔案', 'error');
          break;
        }

        // 添加檔案到列表 - 修復ID生成邏輯
        uploadedFiles.push({
          id: Date.now() + Math.floor(Math.random() * 1000), // 確保是整數
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file),
          uploadDate: new Date().toISOString(),
          isNew: true,
          file: file
        });
      }

      setFormData(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedFiles]
      }));
      
      if (uploadedFiles.length > 0) {
        showNotification(`成功選擇 ${uploadedFiles.length} 個檔案`, 'success');
      }
    } catch (error) {
      console.error('檔案上傳失敗:', error);
      showNotification('檔案上傳失敗，請重試', 'error');
    } finally {
      // 確保最小加載時間
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
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
    const extension = '.' + fileName.split('.').pop().toLowerCase();
    return imageExtensions.includes(extension);
  };

  // 獲取檔案預覽URL - 修復URL生成邏輯
  const getFilePreviewUrl = (file) => {
    console.log('生成檔案預覽URL:', file);

    if (file.id && !file.isNew) {
      // 現有檔案：通過API端點，確保ID是整數
      const intFileId = parseInt(file.id);
      if (!isNaN(intFileId)) {
        const url = `${pointsConfig.apiEndpoints.base}/fileupload/download/${intFileId}`;
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
    const fileName = file.name || file.FileName || '未知檔案';
    const fileKey = file.id || fileName;
    setDownloadLoading(prev => ({ ...prev, [fileKey]: true }));

    const startTime = Date.now();
    const minimumLoadingTime = 2000;

    try {
      console.log('開始下載檔案:', {
        fileName: fileName,
        fileInfo: file
      });

      if (file.id && !file.isNew) {
        // 現有檔案：使用API下載，確保ID是整數
        const intFileId = parseInt(file.id);
        if (isNaN(intFileId)) {
          throw new Error(`無效的檔案ID: ${file.id}`);
        }

        console.log('通過API下載檔案，ID:', intFileId);
        const response = await fileUploadAPI.downloadFile(intFileId);
        console.log('下載響應:', response);

        // 創建下載連結
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (file.file && file.isNew) {
        // 新檔案：直接下載Blob
        console.log('下載新檔案Blob');
        const link = document.createElement('a');
        link.href = URL.createObjectURL(file.file);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
        } else {
          throw new Error('無法獲取檔案下載URL');
        }
      }

      showNotification(`正在下載 ${fileName}`, 'success');
    } catch (error) {
      console.error('下載檔案失敗:', error);
      showNotification('下載失敗，請重試', 'error');
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
    if (!formData.title.trim()) {
      showNotification('請填寫標題', 'error');
      return;
    }

    const startTime = Date.now();
    const minimumLoadingTime = 2000; // 2秒最小加載時間
    setLoading(true);

    // 追蹤操作結果狀態
    let isSuccess = false;
    let resultMessage = '';

    try {
      // 修復分類ID計算（根據md指南）
      const selectedCategoryEntry = Object.entries(pointsConfig.pointsTypes).find(
        ([key, config]) => config.name === formData.category
      );
      const categoryType = selectedCategoryEntry ? selectedCategoryEntry[0] : 'general';
      const categoryId = categoryType ? Object.keys(pointsConfig.pointsTypes).indexOf(categoryType) + 1 : 1;

      console.log('分類處理調試:', {
        選擇的分類名稱: formData.category,
        分類類型: categoryType,
        計算的CategoryId: categoryId
      });

      // 處理檔案上傳 - 先上傳新檔案，然後合併現有檔案
      let finalAttachments = [];

      // 處理現有檔案（編輯模式）
      const existingFiles = formData.attachments.filter(file => !file.isNew && file.id);
      if (existingFiles.length > 0) {
        finalAttachments.push(...existingFiles.map(file => ({
          id: parseInt(file.id), // 確保ID是整數
          name: file.name || file.FileName,
          size: file.size || file.FileSize,
          type: file.type || file.ContentType
        })));
      }

      // 上傳新檔案
      const newFiles = formData.attachments.filter(file => file.isNew && file.file);
      if (newFiles.length > 0) {
        console.log('開始上傳新檔案:', newFiles.length, '個');
        for (const fileItem of newFiles) {
          try {
            const response = await fileUploadAPI.uploadFile(
              fileItem.file,
              'WorkLog',
              editingLog?.id || 0,
              employeeId
            );
            console.log('檔案上傳成功:', response);
            finalAttachments.push({
              id: response.id,
              name: response.fileName,
              size: response.fileSize,
              type: fileItem.type
            });
          } catch (uploadError) {
            console.error('檔案上傳失敗:', uploadError);
            showNotification(`檔案 ${fileItem.name} 上傳失敗`, 'error');
            return; // 上傳失敗時停止
          }
        }
      }

      // 確保數據格式正確，匹配數據庫表結構
      const workLogData = {
        EmployeeId: parseInt(employeeId), // 確保是整數
        Title: formData.title?.toString() || '', // 確保是字符串
        Content: formData.content?.toString() || '', // 確保是字符串
        CategoryId: parseInt(categoryId), // 確保是整數
        Tags: formData.tags?.toString() || '', // 確保是字符串
        LogDate: new Date().toISOString(),
        Status: 'submitted',
        PointsClaimed: 0,
        Attachments: finalAttachments.length > 0 ? JSON.stringify(finalAttachments) : null,
        UpdatedAt: new Date().toISOString() // 添加更新時間
      };

      // 如果是編輯模式，不要發送某些只讀字段
      if (editingLog) {
        // 保持原有的創建時間和ID
        delete workLogData.LogDate; // 編輯時不更新LogDate
      }

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
      console.log('最終附件列表:', finalAttachments);

      if (editingLog) {
        // 嘗試不同的數據格式，看看後端期望什麼
        // 方案1: Pascal Case (數據庫格式)
        const updateDataPascal = {
          ...workLogData,
          Id: editingLog.id
        };

        // 方案2: camelCase (常見API格式)
        const updateDataCamel = {
          id: editingLog.id,
          employeeId: parseInt(employeeId),
          title: formData.title?.toString() || '',
          content: formData.content?.toString() || '',
          categoryId: parseInt(categoryId),
          tags: formData.tags?.toString() || '',
          status: 'submitted',
          pointsClaimed: 0,
          attachments: finalAttachments.length > 0 ? JSON.stringify(finalAttachments) : null
        };

        // 方案3: 最小化數據 (只發送變更的字段)
        const updateDataMinimal = {
          title: formData.title?.toString() || '',
          content: formData.content?.toString() || '',
          tags: formData.tags?.toString() || '',
          attachments: finalAttachments.length > 0 ? JSON.stringify(finalAttachments) : null
        };

        console.log('更新數據（Pascal Case）:', updateDataPascal);
        console.log('更新數據（camelCase）:', updateDataCamel);
        console.log('更新數據（最小化）:', updateDataMinimal);

        try {
          // 先嘗試最小化數據
          console.log('嘗試最小化數據格式...');
          await workLogAPI.updateWorkLog(editingLog.id, updateDataMinimal);
          isSuccess = true;
          resultMessage = '工作記錄更新成功！';
        } catch (error) {
          console.log('最小化格式失敗，嘗試 Pascal Case:', error.message);
          try {
            // 如果失敗，嘗試 Pascal Case
            await workLogAPI.updateWorkLog(editingLog.id, updateDataPascal);
            isSuccess = true;
            resultMessage = '工作記錄更新成功！';
          } catch (error2) {
            console.log('Pascal Case 失敗，嘗試 camelCase:', error2.message);
            try {
              // 最後嘗試 camelCase
              await workLogAPI.updateWorkLog(editingLog.id, updateDataCamel);
              isSuccess = true;
              resultMessage = '工作記錄更新成功！';
            } catch (error3) {
              console.error('所有格式都失敗:', error3);
              throw error3;
            }
          }
        }
      } else {
        await workLogAPI.createWorkLog(workLogData);
        isSuccess = true;
        resultMessage = '工作記錄儲存成功！';
      }

      // 重新載入工作日誌數據
      await loadWorkLogs();

    } catch (error) {
      console.error('提交工作日誌失敗:', error);
      isSuccess = false;
      resultMessage = '工作記錄儲存失敗，請重試';
    } finally {
      // 計算已經過的時間
      const elapsedTime = Date.now() - startTime;
      
      if (elapsedTime < minimumLoadingTime) {
        // 延遲UI更新到2秒loading完成後
        setTimeout(() => {
          setLoading(false);
          
          if (isSuccess) {
            // 成功：重置表單並關閉
            setFormData({ title: '', content: '', category: '', tags: '', attachments: [] });
            setShowForm(false);
            setEditingLog(null);
            showNotification(resultMessage, 'success');
          } else {
            // 失敗：只顯示錯誤訊息，保持表單開啟
            showNotification(resultMessage, 'error');
          }
        }, minimumLoadingTime - elapsedTime);
      } else {
        // 如果已經超過2秒，立即執行UI更新
        setLoading(false);
        
        if (isSuccess) {
          // 成功：重置表單並關閉
          setFormData({ title: '', content: '', category: '', tags: '', attachments: [] });
          setShowForm(false);
          setEditingLog(null);
          showNotification(resultMessage, 'success');
        } else {
          // 失敗：只顯示錯誤訊息，保持表單開啟
          showNotification(resultMessage, 'error');
        }
      }
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

  const handleEdit = (log) => {
    setEditingLog(log);
    setFormData({
      title: log.title,
      content: log.content,
      category: log.category,
      tags: log.tags,
      attachments: log.attachments || []
    });
    setShowForm(true);
    
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

  // 獲取所有分類選項
  const categoryOptions = Object.values(pointsConfig.pointsTypes).map(type => type.name);

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* 頁面標題與新增按鈕 */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-white">工作日誌</h2>
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
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="搜索工作日誌..."
            />
          </div>
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
        <div className="bg-slate-800/50 backdrop-blur-sm border-2 border-green-500/50 rounded-xl p-6 shadow-lg">
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
              <label className="block text-sm font-medium text-green-200 mb-2">
                分類
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-green-500/30 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
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
            <div key={log.id} className="bg-slate-800/50 backdrop-blur-sm border border-slate-500/50 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {log.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(log.logDate).toLocaleDateString()}
                    </span>
                    {log.category && (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-600/20 text-blue-300 border border-blue-500/30">
                        {log.category}
                      </span>
                    )}
                    {log.tags && (
                      <span className="flex items-center">
                        <Tag className="h-4 w-4 mr-1" />
                        {log.tags}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(log)}
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
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
