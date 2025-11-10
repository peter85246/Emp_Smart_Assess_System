import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { pointsUtils, departmentUtils, pointsConfig } from '../../../config/pointsConfig';
import { pointsAPI } from '../../../services/pointsAPI';
import NotificationToast from '../shared/NotificationToast';

/**
 * 互動式積分表單組件 - 員工積分提交的核心組件
 * 功能：
 * - 支援多項目同時提交（最多選擇多個積分項目）
 * - 檔案上傳與項目精確關聯
 * - 即時積分計算和預覽
 * - 批量提交到後端 /api/points/batch/submit
 * - 標籤式UI切換，優化用戶體驗
 * 
 * 使用位置：EmployeePanel > 積分提交頁面
 * API對接：pointsAPI.submitBatchPoints()
 * 檔案處理：支援每個項目關聯多個檔案證明
 */
const InteractivePointsForm = ({ currentUser, onSubmissionSuccess }) => {
  const [formData, setFormData] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);
  const [pointsStandards, setPointsStandards] = useState([]);
  const [loadingStandards, setLoadingStandards] = useState(true);
  
  // 當前選中的積分類別
  const [activeCategory, setActiveCategory] = useState('general');

  // 獲取用戶可見的積分項目結構（基於184項架構和部門權限）
  const visiblePointsStructure = departmentUtils.getVisiblePointsStructure(currentUser.departmentId || 1);
  const totalVisibleItems = departmentUtils.getTotalVisibleItems(currentUser.departmentId || 1);

  // 載入積分標準項目
  useEffect(() => {
    loadPointsStandards();
  }, [currentUser.departmentId]);

  const loadPointsStandards = async () => {
    setLoadingStandards(true);
    try {
      const userDeptId = currentUser.departmentId || 1;
      console.log('載入積分標準項目 - 部門ID:', userDeptId);
      
      // 從API獲取積分標準項目（直接使用部門過濾）
      const response = await pointsAPI.getStandards(userDeptId);
      console.log('獲取積分標準回應:', response);
      
      // API已經過濾了部門，但我們還需要根據DepartmentFilter欄位再次過濾
      const standards = response.data || response || [];
      // 先按部門過濾
      const departmentFiltered = standards.filter(standard => {
        const departmentFilter = standard.departmentFilter || standard.DepartmentFilter || '1,2,3,4';
        const allowedDepts = departmentFilter.split(',').map(id => parseInt(id.trim()));
        return allowedDepts.includes(userDeptId);
      });

      // 再按配置的可見項目過濾
      const visibleStructure = departmentUtils.getVisiblePointsStructure(userDeptId);
      const filteredStandards = departmentFiltered.filter(standard => {
        const pointsType = standard.pointsType || standard.PointsType;
        const subCategory = standard.subCategory || standard.SubCategory;
        
        // 檢查該類型是否在可見列表中
        if (!visibleStructure[pointsType]) {
          return false;
        }
        
        // 如果有子分類，檢查子分類是否可見
        if (subCategory && visibleStructure[pointsType].subcategories) {
          return visibleStructure[pointsType].subcategories[subCategory];
        }
        
        // 沒有子分類的項目（如management, temporary等）
        return true;
      });
      
      console.log(`部門 ${userDeptId} 可用的積分項目: ${filteredStandards.length}項`);
      console.log('項目詳細:', filteredStandards.map(s => ({ 
        id: s.id || s.Id, 
        name: s.categoryName || s.CategoryName, 
        type: s.pointsType || s.PointsType, 
        subCategory: s.subCategory || s.SubCategory,
        deptFilter: s.departmentFilter || s.DepartmentFilter 
      })));
      
      setPointsStandards(filteredStandards);
    } catch (error) {
      console.error('載入積分標準失敗:', error);
      showNotification('載入積分項目失敗，請檢查網路連線', 'error');
      
      // 如果API失敗，設置空陣列避免UI錯誤
      setPointsStandards([]);
    }
    setLoadingStandards(false);
  };

  // 根據積分標準項目和子分類來組織數據（184項完整架構）
  const organizePointsByCategory = () => {
    const organized = {};
    
    console.log('組織積分數據，共', pointsStandards.length, '項');
    
    pointsStandards.forEach(standard => {
      // 使用正確的字段名（小寫）
      const pointsType = standard.pointsType || standard.PointsType;
      const subCategory = standard.subCategory || standard.SubCategory;
      
      if (!organized[pointsType]) {
        organized[pointsType] = {};
      }
      
      const categoryKey = subCategory || 'main';
      if (!organized[pointsType][categoryKey]) {
        organized[pointsType][categoryKey] = [];
      }
      
      const itemType = standard.inputType || standard.InputType || 'number';
      const basePoints = standard.pointsValue || standard.PointsValue;
      const stepValue = standard.stepValue || standard.StepValue || 1;
      
      // 為 select 類型生成選項
      let options = null;
      if (itemType === 'select') {
        options = [
          { value: basePoints * 0.5, label: '基本完成' },
          { value: basePoints, label: '標準完成' },
          { value: basePoints * 1.5, label: '優秀完成' }
        ];
      }

      organized[pointsType][categoryKey].push({
        id: standard.id || standard.Id,
        name: standard.categoryName || standard.CategoryName,
        points: basePoints,
        type: itemType,
        description: standard.description || standard.Description || '',
        unit: standard.unit || standard.Unit || '',
        stepValue: stepValue,
        options: options // 添加選項屬性
      });
    });
    
    console.log('組織後的積分數據:', organized);
    return organized;
  };

  const organizedPoints = organizePointsByCategory();

  // 通知函數
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 計算總積分
  useEffect(() => {
    let total = 0;
    Object.values(formData).forEach(item => {
      if (item.checked || item.value > 0 || item.selectedValue > 0) {
        total += item.calculatedPoints || 0;
      }
    });
    setTotalPoints(total);
  }, [formData]);

  // 處理表單項目變更
  const handleItemChange = (itemId, field, value) => {
    const item = findItemById(itemId);
    setFormData(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
        categoryName: item?.name || '', // 添加積分項目類別名稱
        calculatedPoints: calculateItemPoints(itemId, { ...prev[itemId], [field]: value })
      }
    }));
  };

  // 計算單項積分
  const calculateItemPoints = (itemId, itemData) => {
    const item = findItemById(itemId);
    if (!item) return 0;

    let basePoints = 0;
    
    if (item.type === 'checkbox') {
      basePoints = itemData.checked ? item.points : 0;
    } else if (item.type === 'number') {
      basePoints = (itemData.value || 0) * item.points;
    } else if (item.type === 'select') {
      basePoints = itemData.selectedValue || 0;
    }

    // 應用推廣期倍數
    const multiplier = pointsUtils.getPromotionMultiplier(new Date());
    return basePoints * multiplier;
  };

  // 根據ID查找項目（支援新的184項架構）
  const findItemById = (itemId) => {
    for (const categoryData of Object.values(organizedPoints)) {
      for (const subcategoryItems of Object.values(categoryData)) {
        if (Array.isArray(subcategoryItems)) {
          const item = subcategoryItems.find(item => item.id === itemId);
      if (item) return item;
        }
      }
    }
    return null;
  };

  // 處理檔案上傳
  const handleFileUpload = async (itemId, files) => {
    const fileArray = Array.from(files);
    setUploadedFiles(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), ...fileArray]
    }));
    showNotification(`已上傳 ${fileArray.length} 個檔案`, 'success');
  };

  // 移除檔案
  const removeFile = (itemId, fileIndex) => {
    setUploadedFiles(prev => ({
      ...prev,
      [itemId]: prev[itemId].filter((_, index) => index !== fileIndex)
    }));
  };

  // 提交表單
  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 確保用戶ID是數字格式
      let employeeId;
      if (typeof currentUser.id === 'string' && currentUser.id.startsWith('EMP')) {
        // 如果是 EMP001 格式，提取數字部分
        employeeId = parseInt(currentUser.id.replace('EMP', '').replace(/^0+/, '')) || 1;
      } else {
        employeeId = parseInt(currentUser.id) || 1;
      }

      const submissionData = {
        employeeId: employeeId,
        submissionDate: new Date().toISOString(),
        items: formData,
        files: uploadedFiles,
        totalPoints: totalPoints,
        status: 'pending'
      };

      console.log('提交積分表單:', submissionData);
      console.log('表單數據詳情:', JSON.stringify(formData, null, 2));

      // 調用批量提交API
      const result = await pointsAPI.submitBatchPoints(submissionData);

      console.log('提交結果:', result);
      showNotification(`積分表單提交成功！創建了 ${result.entriesCreated} 個積分記錄，總積分: ${result.totalPoints}`, 'success');

      // 重置表單
      setFormData({});
      setUploadedFiles({});

      // 通知父組件更新統計數據
      if (onSubmissionSuccess) {
        console.log('調用統計數據更新回調');
        await onSubmissionSuccess();
      }

      // 觸發全局事件，通知其他組件更新
      window.dispatchEvent(new CustomEvent('pointsSubmitted', {
        detail: {
          employeeId: employeeId,
          entriesCreated: result.entriesCreated,
          totalPoints: result.totalPoints
        }
      }));

    } catch (error) {
      console.error('提交失敗:', error);
      showNotification('提交失敗，請重試: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  // 獲取當前類別已填寫的項目數和積分（支援184項新架構）
  const getCategoryStats = (categoryKey) => {
    const categoryData = organizedPoints[categoryKey] || {};
    let filledItems = 0;
    let totalItems = 0;
    let categoryPoints = 0;

    Object.values(categoryData).forEach(subcategoryItems => {
      if (Array.isArray(subcategoryItems)) {
        totalItems += subcategoryItems.length;
        subcategoryItems.forEach(item => {
      const itemData = formData[item.id];
      if (itemData && (itemData.checked || itemData.value > 0 || itemData.selectedValue > 0)) {
        filledItems++;
        categoryPoints += itemData.calculatedPoints || 0;
      }
    });
      }
    });

    return { filledItems, totalItems, categoryPoints };
  };


  // 渲染表單項目
  const renderFormItem = (item) => {
    const itemData = formData[item.id] || {};
    const files = uploadedFiles[item.id] || [];

    return (
      <div key={item.id} className="bg-slate-600/30 backdrop-blur-sm border border-slate-500/50 rounded-lg p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2">
          <div className="flex-1 w-full sm:w-auto">
            <h4 className="font-medium text-white text-sm sm:text-base">{item.name}</h4>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">{item.description}</p>
          </div>
          <div className="text-left sm:text-right w-full sm:w-auto sm:ml-4">
            <div className="text-xs sm:text-sm text-blue-300 font-medium">
              {itemData.calculatedPoints ? `${itemData.calculatedPoints.toFixed(1)} 積分` : `${item.points} 積分`}
            </div>
          </div>
        </div>

        {/* 輸入控制項 */}
        <div className="space-y-3">
          {item.type === 'checkbox' && (
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={itemData.checked || false}
                onChange={(e) => handleItemChange(item.id, 'checked', e.target.checked)}
                className="w-4 h-4 text-blue-400 bg-slate-600 border-slate-500 rounded focus:ring-blue-400 focus:ring-offset-slate-700"
              />
              <span className="text-sm text-slate-200">已完成此項工作</span>
            </label>
          )}

          {item.type === 'number' && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-slate-200">數量:</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={itemData.value || ''}
                onChange={(e) => handleItemChange(item.id, 'value', parseFloat(e.target.value) || 0)}
                className="w-20 px-2 py-1 bg-slate-700 border border-slate-500 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <span className="text-sm text-slate-400">{item.unit}</span>
            </div>
          )}

          {item.type === 'select' && (
            <div className="space-y-2">
              <label className="text-sm text-slate-200">選擇類型:</label>
              <select
                value={itemData.selectedValue || ''}
                onChange={(e) => handleItemChange(item.id, 'selectedValue', parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-500 text-white rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="">請選擇...</option>
                {item.options && item.options.map((option, index) => (
                  <option key={index} value={option.value} className="bg-slate-700 text-white">
                    {option.label} ({option.value} 積分)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 工作說明 */}
          <div>
            <label className="block text-sm text-slate-200 mb-1">工作說明:</label>
            <textarea
              value={itemData.description || ''}
              onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
              placeholder="請描述具體的工作內容和完成情況..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-500 text-white placeholder-slate-400 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* 檔案上傳 */}
          <div>
            <label className="block text-xs sm:text-sm text-slate-200 mb-1">證明文件:</label>
            <div className="flex items-center w-full overflow-hidden">
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                onChange={(e) => handleFileUpload(item.id, e.target.files)}
                className="w-full text-xs sm:text-sm text-slate-200 file:mr-2 file:py-1.5 sm:file:py-1 file:px-2 file:rounded file:border-0 file:text-xs sm:file:text-sm file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500 truncate"
              />
            </div>

            {/* 已上傳檔案列表 */}
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-slate-600/50 p-2 rounded border border-slate-500/50 gap-2">
                    <span className="text-slate-200 truncate flex-1 min-w-0">{file.name}</span>
                    <button
                      onClick={() => removeFile(item.id, index)}
                      className="text-red-400 hover:text-red-300 flex-shrink-0 p-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // 主要渲染函數
  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-transparent min-h-[400px]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          📋 積分得分辦法填寫表單
        </h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-300">{totalPoints.toFixed(1)}</div>
          <div className="text-sm text-slate-400">總積分</div>
        </div>
      </div>

      {/* Boss專用提示 */}
      {currentUser?.role === 'boss' && (
        <div className="bg-gradient-to-r from-purple-600/20 to-yellow-500/20 border-2 border-purple-400/50 rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">👑</span>
            <div>
              <h3 className="font-semibold text-purple-300 text-lg">董事長特權通知</h3>
              <p className="text-purple-200 text-sm">您的積分提交將享有自動審核通過特權</p>
            </div>
          </div>
          <div className="bg-purple-500/20 rounded-lg p-3 mt-3">
            <div className="flex items-center space-x-2 text-purple-100 text-sm">
              <span className="text-green-400">✨</span>
              <span>提交後積分立即生效，無需等待其他人審核</span>
            </div>
            <div className="flex items-center space-x-2 text-purple-100 text-sm mt-1">
              <span className="text-yellow-400">⚡</span>
              <span>系統將自動標記為「董事長層級自動審核通過」</span>
            </div>
          </div>
        </div>
      )}

      {/* 使用說明 */}
      <div className="bg-slate-700/50 backdrop-blur-sm border border-blue-400/50 rounded-lg p-4">
        <h3 className="font-semibold text-blue-300 mb-2">📝 填寫說明</h3>
        <ul className="text-sm text-blue-200 space-y-1">
          <li>• 選擇下方的積分類別標籤來切換不同的積分項目</li>
          <li>• 勾選或填寫您已完成的工作項目</li>
          <li>• 填寫具體的數量或選擇對應的類型</li>
          <li>• 詳細描述工作內容和完成情況</li>
          <li>• 上傳相關的證明文件（照片、報告等）</li>
          <li>• 系統會自動計算積分</li>
        </ul>
      </div>

      {/* 積分類別選擇（卡片式UI） */}
      {loadingStandards ? (
        <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-8 border border-slate-600/50 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-300">載入積分項目中...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 積分類別選擇卡片 */}
          <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-6 border border-slate-600/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center">
                <span className="text-xl mr-2">📂</span>
                積分類別選擇
              </h3>
              <div className="text-sm text-slate-400">
                部門：{pointsConfig.departments.find(d => d.id === (currentUser.departmentId || 1))?.name}
              </div>
            </div>
            
            {/* 卡片式選擇區域 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {Object.entries(visiblePointsStructure).map(([categoryKey, categoryConfig]) => {
                const stats = getCategoryStats(categoryKey);
                const isActive = activeCategory === categoryKey;
                
                // 為每個分類定義獨特的顏色和圖標（保持原有樣式風格）
                const categoryStyles = {
                  general: {
                    icon: '🔧',
                    bgColor: 'bg-slate-600/30',
                    borderColor: 'border-green-500/50',
                    textColor: 'text-slate-200',
                    hoverBg: 'hover:bg-slate-600/50',
                    activeBg: 'bg-green-500/20',
                    activeBorder: 'border-green-400'
                  },
                  professional: {
                    icon: '⚡',
                    bgColor: 'bg-slate-600/30',
                    borderColor: 'border-purple-500/50',
                    textColor: 'text-slate-200',
                    hoverBg: 'hover:bg-slate-600/50',
                    activeBg: 'bg-purple-500/20',
                    activeBorder: 'border-purple-400'
                  },
                  management: {
                    icon: '👥',
                    bgColor: 'bg-slate-600/30',
                    borderColor: 'border-orange-500/50',
                    textColor: 'text-slate-200',
                    hoverBg: 'hover:bg-slate-600/50',
                    activeBg: 'bg-orange-500/20',
                    activeBorder: 'border-orange-400'
                  },
                  temporary: {
                    icon: '⏰',
                    bgColor: 'bg-slate-600/30',
                    borderColor: 'border-cyan-500/50',
                    textColor: 'text-slate-200',
                    hoverBg: 'hover:bg-slate-600/50',
                    activeBg: 'bg-cyan-500/20',
                    activeBorder: 'border-cyan-400'
                  },
                  core: {
                    icon: '⭐',
                    bgColor: 'bg-slate-600/30',
                    borderColor: 'border-red-500/50',
                    textColor: 'text-slate-200',
                    hoverBg: 'hover:bg-slate-600/50',
                    activeBg: 'bg-red-500/20',
                    activeBorder: 'border-red-400'
                  },
                  misc: {
                    icon: '📋',
                    bgColor: 'bg-slate-600/30',
                    borderColor: 'border-orange-500/50',
                    textColor: 'text-slate-200',
                    hoverBg: 'hover:bg-slate-600/50',
                    activeBg: 'bg-orange-500/20',
                    activeBorder: 'border-orange-400'
                  }
                };
                
                const style = categoryStyles[categoryKey] || categoryStyles.general;
                
                return (
                  <button
                    key={categoryKey}
                    onClick={() => setActiveCategory(categoryKey)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                      isActive
                        ? `${style.activeBorder} ${style.activeBg} shadow-lg transform scale-105`
                        : `${style.borderColor} ${style.bgColor} ${style.hoverBg} hover:shadow-md`
                    }`}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        isActive ? 'bg-blue-500' : 'bg-slate-500'
                      }`}>
                        {style.icon}
                      </div>
                      <div>
                        <h4 className={`font-semibold text-sm ${style.textColor}`}>
                          {categoryConfig.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {categoryConfig.description}
                        </p>
                      </div>
                      <div className="text-xs text-slate-300">
                        {stats.filledItems}/{stats.totalItems} 項目
                      </div>
                      {isActive && (
                        <div className="text-xs text-blue-300 font-medium">✓ 已選擇</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 選中類別的積分項目列表 */}
          {activeCategory && (
            <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-6 border border-slate-600/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="text-xl mr-2">{visiblePointsStructure[activeCategory]?.icon || '📋'}</span>
                  {visiblePointsStructure[activeCategory]?.name} 積分項目
                </h3>
                <div className="text-sm text-slate-400">
                  共 {getCategoryStats(activeCategory).totalItems} 項
                </div>
              </div>
              
              <div className="space-y-4">
                {(() => {
                  const categoryData = organizedPoints[activeCategory] || {};
                  const categoryConfig = visiblePointsStructure[activeCategory];
                  
                  if (categoryConfig.subcategories) {
                    return Object.entries(categoryConfig.subcategories).map(([subKey, subConfig]) => {
                      const subItems = categoryData[subKey] || [];
                      return (
                        <div key={subKey} className="mb-6">
                          <div className="flex items-center space-x-2 mb-4">
                            <span className="text-lg">{subConfig.icon}</span>
                            <h5 className="font-medium text-white text-lg">{subConfig.name}</h5>
                            <span className="text-sm text-slate-400">({subItems.length} 項)</span>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            {subItems.map(renderFormItem)}
                          </div>
                        </div>
                      );
                    });
                  } else {
                    return (
                      <div className="grid grid-cols-1 gap-3 sm:gap-4">
                        {(categoryData.main || []).map(renderFormItem)}
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}

          {Object.keys(visiblePointsStructure).length === 0 && (
            <div className="text-center text-slate-400 py-8">
              <p>您的部門暫無可用的積分項目</p>
              <p className="text-sm mt-2">請聯繫管理員確認權限設定</p>
            </div>
          )}
        </div>
      )}

      {/* 總計和提交區域 */}
      <div className="bg-gradient-to-r from-slate-700/50 to-slate-600/50 backdrop-blur-sm border-2 border-blue-400/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-white">📊 積分總計</h3>
            <div className="text-sm text-slate-400 mt-1">
              已填寫 {Object.values(formData).filter(item => item.checked || item.value > 0 || item.selectedValue > 0).length} 個積分項目
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-300">{totalPoints.toFixed(1)}</div>
            <div className="text-sm text-slate-400">總積分</div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setFormData({});
              setUploadedFiles({});
              showNotification('表單已重置', 'info');
            }}
            className="px-4 py-2 border border-slate-500 rounded-md text-slate-200 hover:bg-slate-600/50 transition-colors"
          >
            重置表單
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || totalPoints === 0}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-all"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>提交中...</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>🚀 提交積分表單</span>
              </>
            )}
          </button>
        </div>

        {totalPoints === 0 && (
          <div className="mt-3 text-sm text-yellow-300">
            ⚠️ 請至少填寫一個積分項目才能提交
          </div>
        )}
      </div>

      {/* 通知組件 */}
      <NotificationToast
        notification={notification}
        onClose={() => setNotification(null)}
      />
    </div>
  );
};

export default InteractivePointsForm;
