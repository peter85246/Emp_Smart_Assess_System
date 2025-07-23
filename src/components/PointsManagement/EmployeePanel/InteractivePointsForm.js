import React, { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { pointsUtils } from '../../../config/pointsConfig';
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
  
  // 新增：當前選中的積分類別
  const [activeCategory, setActiveCategory] = useState('general');

  // 積分類別配置
  const categoryConfig = {
    general: {
      id: 'general',
      name: '一般積分項目',
      color: 'green',
      bgColor: 'bg-green-400',
      borderColor: 'border-green-400',
      textColor: 'text-green-300',
      icon: '🔧'
    },
    quality: {
      id: 'quality',
      name: '品質工程積分項目',
      color: 'blue',
      bgColor: 'bg-blue-400',
      borderColor: 'border-blue-400',
      textColor: 'text-blue-300',
      icon: '🎯'
    },
    professional: {
      id: 'professional',
      name: '專業積分項目',
      color: 'purple',
      bgColor: 'bg-purple-400',
      borderColor: 'border-purple-400',
      textColor: 'text-purple-300',
      icon: '⚡'
    },
    management: {
      id: 'management',
      name: '管理積分項目',
      color: 'orange',
      bgColor: 'bg-orange-400',
      borderColor: 'border-orange-400',
      textColor: 'text-orange-300',
      icon: '👨‍💼'
    },
    core: {
      id: 'core',
      name: '核心職能積分項目',
      color: 'red',
      bgColor: 'bg-red-400',
      borderColor: 'border-red-400',
      textColor: 'text-red-300',
      icon: '⭐'
    }
  };

  // 完整的積分項目列表（基於PDF文件 - 完全對應33個項目）
  const pointsItems = {
    general: [
      { id: 'g1', name: '刀具五金準備', points: 8, type: 'checkbox', description: '技術士以上，每月8積分', unit: '月' },
      { id: 'g2', name: '定時巡機檢驗', points: 8, type: 'checkbox', description: '每兩小時/次，每月8積分', unit: '月' },
      { id: 'g3', name: '生產損耗率', points: 5, type: 'checkbox', description: '月損耗率2%以下，5積分/月', unit: '月' },
      { id: 'g4', name: '工具回收歸位', points: 0.3, type: 'number', description: '0.3積分/台', unit: '台' },
      { id: 'g5', name: '清理機台', points: 1, type: 'number', description: '25型以上1積分/台，20型以下0.5積分/台', unit: '台' },
      { id: 'g6', name: '機台運作正常', points: 0.3, type: 'number', description: '0.3積分/台/日', unit: '台/日' },
      { id: 'g7', name: '製程巡檢單', points: 0.3, type: 'number', description: '0.3積分/台/日', unit: '台/日' },
      { id: 'g8', name: '提出改善方案', points: 0.4, type: 'number', description: '0.4積分/案', unit: '案' },
      { id: 'g9', name: '完成改善方案', points: 0.8, type: 'number', description: '0.8積分/案', unit: '案' },
      { id: 'g10', name: '工作日誌', points: 0.1, type: 'number', description: '0.1積分/天', unit: '天' },
      { id: 'g11', name: '學習型組織', points: 1, type: 'number', description: '1積分/2小時', unit: '2小時' },
      { id: 'g12', name: '基本區域打掃', points: 2, type: 'checkbox', description: '每週2積分/月，每日7積分/月', unit: '月' },
      { id: 'g13', name: '安全檢查', points: 1, type: 'number', description: '1積分/次', unit: '次' },
      { id: 'g14', name: '設備保養', points: 2, type: 'number', description: '2積分/台', unit: '台' }
    ],
    quality: [
      { id: 'q1', name: 'ISO外部稽核', points: 4, type: 'checkbox', description: '每年一次，4積分', unit: '年' },
      { id: 'q2', name: '抽檢驗收', points: 0.2, type: 'number', description: '32PCS抽檢，0.2積分/單', unit: '單' },
      { id: 'q3', name: '進料檢驗', points: 0.4, type: 'number', description: '委外生產驗收，0.4積分/單', unit: '單' },
      { id: 'q4', name: '包裝出貨', points: 0.3, type: 'number', description: '0.3積分/單', unit: '單' },
      { id: 'q5', name: '外觀產品全檢', points: 0.5, type: 'number', description: '0.5積分/200PCS', unit: '200PCS' },
      { id: 'q6', name: '庫存盤點', points: 8, type: 'checkbox', description: '每半年，8積分/次', unit: '次' },
      { id: 'q7', name: '客戶投訴處理', points: 2, type: 'number', description: '2積分/件', unit: '件' },
      { id: 'q8', name: '品質改善提案', points: 3, type: 'number', description: '3積分/案', unit: '案' }
    ],
    professional: [
      { id: 'p1', name: '凸輪改機', points: 3, type: 'select', description: '微調1.5，有改過3，沒改過6積分', options: [
        { value: 1.5, label: '微調' },
        { value: 3, label: '有改過' },
        { value: 6, label: '沒改過' }
      ]},
      { id: 'p2', name: 'CNC改機', points: 2.5, type: 'select', description: '微調1，有改過2.5，首次4積分', options: [
        { value: 1, label: '微調' },
        { value: 2.5, label: '有改過' },
        { value: 4, label: '首次' }
      ]},
      { id: 'p3', name: 'CNC編碼', points: 1, type: 'select', description: '微調0.5，有改過1，首次4積分', options: [
        { value: 0.5, label: '微調' },
        { value: 1, label: '有改過' },
        { value: 4, label: '首次' }
      ]},
      { id: 'p4', name: '零件2D製圖', points: 0.2, type: 'select', description: '客圖檔轉自圖0.2，新設計圖6積分', options: [
        { value: 0.2, label: '客圖檔轉自圖' },
        { value: 6, label: '新設計圖' }
      ]},
      { id: 'p5', name: '零件3D製圖', points: 0.4, type: 'select', description: '客圖檔轉自圖0.4，新設計圖8積分', options: [
        { value: 0.4, label: '客圖檔轉自圖' },
        { value: 8, label: '新設計圖' }
      ]},
      { id: 'p6', name: '首件檢驗', points: 3, type: 'number', description: '3積分/單（3日以上）', unit: '單' },
      { id: 'p7', name: '治具設計', points: 5, type: 'select', description: '新設計5積分，改良3積分，維修1積分', options: [
        { value: 5, label: '新設計' },
        { value: 3, label: '改良' },
        { value: 1, label: '維修' }
      ]},
      { id: 'p8', name: '工藝改善', points: 4, type: 'number', description: '4積分/案', unit: '案' },
      { id: 'p9', name: '技術文件編寫', points: 2, type: 'number', description: '2積分/份', unit: '份' }
    ],
    management: [
      { id: 'm1', name: '下屬工作日誌', points: 0.5, type: 'number', description: '0.5積分/人/週', unit: '人/週' },
      { id: 'm2', name: '下屬積分達標', points: 3, type: 'number', description: '超過82%得3積分/人', unit: '人' },
      { id: 'm3', name: '稽核SOP', points: 2, type: 'number', description: '2積分/件', unit: '件' },
      { id: 'm4', name: '教育訓練', points: 3, type: 'number', description: '3積分/2小時', unit: '2小時' },
      { id: 'm5', name: '幹部會議', points: 1, type: 'checkbox', description: '1積分/次', unit: '次' },
      { id: 'm6', name: '績效面談', points: 2, type: 'number', description: '2積分/人/月', unit: '人/月' },
      { id: 'm7', name: '團隊建設', points: 5, type: 'number', description: '5積分/次', unit: '次' },
      { id: 'm8', name: '跨部門協調', points: 3, type: 'number', description: '3積分/案', unit: '案' }
    ],
    core: [
      { id: 'c1', name: '誠信正直', points: 5, type: 'checkbox', description: '工作異常改善單1積分/份，承諾如期完成1積分/件' },
      { id: 'c2', name: '創新效率', points: 5, type: 'select', description: '超過標準積分110%=5積分，100%=3積分，90%=1積分', options: [
        { value: 5, label: '110%以上' },
        { value: 3, label: '100%' },
        { value: 1, label: '90%' }
      ]},
      { id: 'c3', name: '卓越品質', points: 5, type: 'select', description: '不良率低於1%=5積分，1.5%=3積分，2%=1積分', options: [
        { value: 5, label: '低於1%' },
        { value: 3, label: '1.5%' },
        { value: 1, label: '2%' }
      ]},
      { id: 'c4', name: '專業服務', points: 3, type: 'select', description: '有效提案3件=3積分，2件=2積分，1件=1積分', options: [
        { value: 3, label: '3件' },
        { value: 2, label: '2件' },
        { value: 1, label: '1件' }
      ]},
      { id: 'c5', name: '團隊合作', points: 4, type: 'select', description: '優秀4積分，良好3積分，一般2積分', options: [
        { value: 4, label: '優秀' },
        { value: 3, label: '良好' },
        { value: 2, label: '一般' }
      ]},
      { id: 'c6', name: '學習成長', points: 3, type: 'number', description: '3積分/證照或課程', unit: '項' },
      { id: 'c7', name: '客戶滿意度', points: 5, type: 'select', description: '95%以上5積分，90%以上3積分，85%以上1積分', options: [
        { value: 5, label: '95%以上' },
        { value: 3, label: '90%以上' },
        { value: 1, label: '85%以上' }
      ]}
    ]
  };

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

  // 根據ID查找項目
  const findItemById = (itemId) => {
    for (const category of Object.values(pointsItems)) {
      const item = category.find(item => item.id === itemId);
      if (item) return item;
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

  // 獲取當前類別已填寫的項目數和積分
  const getCategoryStats = (categoryKey) => {
    const items = pointsItems[categoryKey] || [];
    let filledItems = 0;
    let categoryPoints = 0;

    items.forEach(item => {
      const itemData = formData[item.id];
      if (itemData && (itemData.checked || itemData.value > 0 || itemData.selectedValue > 0)) {
        filledItems++;
        categoryPoints += itemData.calculatedPoints || 0;
      }
    });

    return { filledItems, totalItems: items.length, categoryPoints };
  };

  // 渲染表單項目
  const renderFormItem = (item) => {
    const itemData = formData[item.id] || {};
    const files = uploadedFiles[item.id] || [];

    return (
      <div key={item.id} className="bg-slate-600/30 backdrop-blur-sm border border-slate-500/50 rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h4 className="font-medium text-white">{item.name}</h4>
            <p className="text-sm text-slate-300 mt-1">{item.description}</p>
          </div>
          <div className="text-right ml-4">
            <div className="text-sm text-blue-300 font-medium">
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
                {item.options.map((option, index) => (
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
            <label className="block text-sm text-slate-200 mb-1">證明文件:</label>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.pdf,.docx,.xlsx"
                onChange={(e) => handleFileUpload(item.id, e.target.files)}
                className="text-sm text-slate-200 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-slate-600 file:text-slate-200 hover:file:bg-slate-500"
              />
            </div>

            {/* 已上傳檔案列表 */}
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between text-xs bg-slate-600/50 p-2 rounded border border-slate-500/50">
                    <span className="text-slate-200">{file.name}</span>
                    <button
                      onClick={() => removeFile(item.id, index)}
                      className="text-red-400 hover:text-red-300"
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
    <div className="p-6 space-y-6 bg-transparent">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">
          📋 積分得分辦法填寫表單
        </h2>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-300">{totalPoints.toFixed(1)}</div>
          <div className="text-sm text-slate-400">總積分</div>
        </div>
      </div>

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

      {/* 積分類別標籤切換 */}
      <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 border border-slate-600/50">
        <h3 className="text-lg font-semibold text-white mb-4">📂 積分類別選擇</h3>
        
        {/* 標籤按鈕列表 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
          {Object.entries(categoryConfig).map(([key, config]) => {
            const stats = getCategoryStats(key);
            const isActive = activeCategory === key;
            
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  isActive
                    ? `${config.borderColor} bg-${config.color}-600/20`
                    : 'border-slate-500/50 bg-slate-600/30 hover:bg-slate-600/50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-lg">{config.icon}</span>
                  <div className={`w-3 h-3 ${config.bgColor} rounded-full`}></div>
                </div>
                <div className={`font-medium ${isActive ? config.textColor : 'text-white'} text-sm mb-1`}>
                  {config.name}
                </div>
                <div className="text-xs text-slate-400">
                  {stats.filledItems}/{stats.totalItems} 項目
                </div>
                {stats.categoryPoints > 0 && (
                  <div className={`text-xs font-medium ${config.textColor}`}>
                    {stats.categoryPoints.toFixed(1)} 積分
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* 當前選中類別的項目展示 */}
        <div className="bg-slate-600/20 backdrop-blur-sm rounded-lg p-4 border border-slate-500/30">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">{categoryConfig[activeCategory].icon}</span>
            <div>
              <h4 className={`text-lg font-semibold ${categoryConfig[activeCategory].textColor}`}>
                {categoryConfig[activeCategory].name}
              </h4>
              <p className="text-sm text-slate-400">
                {pointsItems[activeCategory]?.length || 0} 個可選積分項目
              </p>
            </div>
          </div>

          {/* 當前類別的積分項目 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pointsItems[activeCategory]?.map(renderFormItem) || (
              <div className="col-span-2 text-center text-slate-400 py-8">
                此類別暫無可選積分項目
              </div>
            )}
          </div>
        </div>
      </div>

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
