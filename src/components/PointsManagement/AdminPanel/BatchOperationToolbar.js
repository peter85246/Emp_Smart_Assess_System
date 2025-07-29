import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Filter, Users, Calendar, Tag, DollarSign } from 'lucide-react';

// 項目名稱到分類的映射（基於InteractivePointsForm.js的pointsItems結構）
const getItemCategory = (itemName) => {
  const itemCategoryMap = {
    // 一般積分項目
    '刀具五金準備': 'general',
    '定時巡機檢驗': 'general',
    '生產損耗率': 'general',
    '工具回收歸位': 'general',
    '清理機台': 'general',
    '機台運作正常': 'general',
    '製程巡檢單': 'general',
    '提出改善方案': 'general',
    '完成改善方案': 'general',
    '工作日誌': 'general',
    '學習型組織': 'general',
    '基本區域打掃': 'general',
    '安全檢查': 'general',
    '設備保養': 'general',
    
    // 品質工程積分項目
    'ISO外部稽核': 'quality',
    '抽檢驗收': 'quality',
    '進料檢驗': 'quality',
    '包裝出貨': 'quality',
    '外觀產品全檢': 'quality',
    '庫存盤點': 'quality',
    '客戶投訴處理': 'quality',
    '品質改善提案': 'quality',
    
    // 專業積分項目
    '凸輪改機': 'professional',
    'CNC改機': 'professional',
    'CNC編碼': 'professional',
    '零件2D製圖': 'professional',
    '零件3D製圖': 'professional',
    '首件檢驗': 'professional',
    '治具設計': 'professional',
    '工藝改善': 'professional',
    '技術文件編寫': 'professional',
    
    // 管理積分項目
    '下屬工作日誌': 'management',
    '下屬積分達標': 'management',
    '稽核SOP': 'management',
    '教育訓練': 'management',
    '幹部會議': 'management',
    '績效面談': 'management',
    '團隊建設': 'management',
    '跨部門協調': 'management',
    
    // 核心職能積分項目
    '誠信正直': 'core',
    '創新效率': 'core',
    '卓越品質': 'core',
    '專業服務': 'core',
    '團隊合作': 'core',
    '學習成長': 'core',
    '客戶滿意度': 'core'
  };
  
  return itemCategoryMap[itemName] || 'general'; // 默認歸類為一般積分項目
};

const BatchOperationToolbar = ({ 
  submissions, 
  selectedItems, 
  onSelectionChange, 
  onBatchApprove, 
  onBatchReject,
  onFiltersChange,
  currentUser 
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    employee: '',
    dateRange: '',
    standard: '',
    pointsRange: ''
  });

  // 當篩選器變更時，通知父組件
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    if (onFiltersChange) {
      onFiltersChange(newFilters);
    }
  };

  // 計算統計數據
  const stats = useMemo(() => {
    // 扁平化所有提交項目
    const allSubmissions = submissions.flatMap(group => 
      group.submissions.map(submission => ({
        ...submission,
        employeeName: group.employeeName,
        category: getItemCategory(submission.standardName)
      }))
    );

    // 應用篩選條件
    let filteredSubmissions = allSubmissions;

    // 員工篩選
    if (filters.employee) {
      filteredSubmissions = filteredSubmissions.filter(item => 
        item.employeeName === filters.employee
      );
    }

    // 項目類型篩選
    if (filters.standard) {
      filteredSubmissions = filteredSubmissions.filter(item => 
        item.category === filters.standard
      );
    }

    // 時間篩選
    if (filters.dateRange) {
      const now = new Date();
      filteredSubmissions = filteredSubmissions.filter(item => {
        const submittedDate = new Date(item.submittedAt);
        switch (filters.dateRange) {
          case 'today':
            return submittedDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return submittedDate >= weekAgo;
          case 'month':
            return submittedDate.getMonth() === now.getMonth() && 
                   submittedDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // 積分範圍篩選
    if (filters.pointsRange) {
      filteredSubmissions = filteredSubmissions.filter(item => {
        const points = item.pointsCalculated || 0;
        switch (filters.pointsRange) {
          case 'low':
            return points >= 1 && points <= 5;
          case 'medium':
            return points > 5 && points <= 10;
          case 'high':
            return points > 10;
          default:
            return true;
        }
      });
    }

    const totalItems = allSubmissions.length;
    const filteredCount = filteredSubmissions.length;
    const selectedCount = selectedItems.length;
    const selectedPoints = allSubmissions
      .filter(item => selectedItems.includes(item.id))
      .reduce((acc, item) => acc + (item.pointsCalculated || 0), 0);

    return {
      totalItems,
      filteredCount,
      selectedCount,
      selectedPoints: selectedPoints.toFixed(1),
      hasFilters: filters.employee || filters.dateRange || filters.standard || filters.pointsRange
    };
  }, [submissions, selectedItems, filters]);

  // 全選/取消全選
  const handleSelectAll = () => {
    // 扁平化所有提交項目並應用篩選
    const allSubmissions = submissions.flatMap(group => 
      group.submissions.map(submission => ({
        ...submission,
        employeeName: group.employeeName,
        category: getItemCategory(submission.standardName)
      }))
    );

    // 應用篩選條件
    let filteredSubmissions = allSubmissions;

    // 員工篩選
    if (filters.employee) {
      filteredSubmissions = filteredSubmissions.filter(item => 
        item.employeeName === filters.employee
      );
    }

    // 項目類型篩選
    if (filters.standard) {
      filteredSubmissions = filteredSubmissions.filter(item => 
        item.category === filters.standard
      );
    }

    // 時間篩選
    if (filters.dateRange) {
      const now = new Date();
      filteredSubmissions = filteredSubmissions.filter(item => {
        const submittedDate = new Date(item.submittedAt);
        switch (filters.dateRange) {
          case 'today':
            return submittedDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return submittedDate >= weekAgo;
          case 'month':
            return submittedDate.getMonth() === now.getMonth() && 
                   submittedDate.getFullYear() === now.getFullYear();
          default:
            return true;
        }
      });
    }

    // 積分範圍篩選
    if (filters.pointsRange) {
      filteredSubmissions = filteredSubmissions.filter(item => {
        const points = item.pointsCalculated || 0;
        switch (filters.pointsRange) {
          case 'low':
            return points >= 1 && points <= 5;
          case 'medium':
            return points > 5 && points <= 10;
          case 'high':
            return points > 10;
          default:
            return true;
        }
      });
    }

    const filteredIds = filteredSubmissions.map(item => item.id);
    
    if (selectedItems.length === filteredIds.length && filteredIds.every(id => selectedItems.includes(id))) {
      onSelectionChange([]);
    } else {
      onSelectionChange(filteredIds);
    }
  };

  // 批量操作處理
  const handleBatchOperation = async (action) => {
    if (selectedItems.length === 0) {
      alert('請先選擇要操作的項目');
      return;
    }

    const confirmMessage = action === 'approve' 
      ? `確認要批量通過 ${selectedItems.length} 個項目嗎？`
      : `確認要批量拒絕 ${selectedItems.length} 個項目嗎？`;

    if (window.confirm(confirmMessage)) {
      if (action === 'approve') {
        await onBatchApprove(selectedItems);
      } else {
        await onBatchReject(selectedItems);
      }
    }
  };

  return (
    <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg border border-slate-600/50 p-4 mb-4 space-y-4">
      {/* 工具列標題 */}
      <div className="flex items-center justify-between">
        <h4 className="text-slate-200 font-medium flex items-center">
          <Filter className="h-4 w-4 text-blue-400 mr-2" />
          批量操作工具
        </h4>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="text-sm text-blue-300 hover:text-blue-200 flex items-center"
        >
          <Filter className="h-4 w-4 mr-1" />
          {showFilters ? '隱藏篩選' : '顯示篩選'}
        </button>
      </div>

      {/* 選擇和統計區域 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleSelectAll}
            className="flex items-center px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg border border-blue-400/30 text-blue-300 text-sm transition-colors"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {selectedItems.length === stats.filteredCount ? '取消全選' : '全選'}
          </button>
          
          <div className="text-sm text-slate-300">
            已選擇 <span className="text-blue-300 font-medium">{stats.selectedCount}</span> / {stats.filteredCount} 項
            {stats.hasFilters && stats.filteredCount !== stats.totalItems && (
              <span className="ml-2 text-amber-400">
                （已篩選，共 {stats.totalItems} 項）
              </span>
            )}
            {stats.selectedCount > 0 && (
              <span className="ml-2">
                | 總積分: <span className="text-green-400 font-medium">{stats.selectedPoints}</span>
              </span>
            )}
          </div>
        </div>

        {/* 批量操作按鈕 */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleBatchOperation('approve')}
            disabled={selectedItems.length === 0}
            className="flex items-center px-4 py-2 bg-green-600/20 hover:bg-green-600/30 disabled:bg-slate-600/20 disabled:text-slate-500 rounded-lg border border-green-400/30 text-green-300 text-sm transition-colors"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            批量通過
          </button>
          
          <button
            onClick={() => handleBatchOperation('reject')}
            disabled={selectedItems.length === 0}
            className="flex items-center px-4 py-2 bg-red-600/20 hover:bg-red-600/30 disabled:bg-slate-600/20 disabled:text-slate-500 rounded-lg border border-red-400/30 text-red-300 text-sm transition-colors"
          >
            <XCircle className="h-4 w-4 mr-2" />
            批量拒絕
          </button>
        </div>
      </div>

      {/* 篩選器區域 */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-slate-600/50">
          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex items-center">
              <Users className="h-3 w-3 mr-1" />
              員工篩選
            </label>
            <select
              value={filters.employee}
              onChange={(e) => handleFilterChange({...filters, employee: e.target.value})}
              className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded text-sm text-slate-200 focus:border-blue-400/50 focus:outline-none"
            >
              <option value="">所有員工</option>
              {submissions.map(group => (
                <option key={group.id} value={group.employeeName}>
                  {group.employeeName}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex items-center">
              <Calendar className="h-3 w-3 mr-1" />
              時間篩選
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange({...filters, dateRange: e.target.value})}
              className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded text-sm text-slate-200 focus:border-blue-400/50 focus:outline-none"
            >
              <option value="">所有時間</option>
              <option value="today">今天</option>
              <option value="week">本週</option>
              <option value="month">本月</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex items-center">
              <Tag className="h-3 w-3 mr-1" />
              項目類型
            </label>
            <select
              value={filters.standard}
              onChange={(e) => handleFilterChange({...filters, standard: e.target.value})}
              className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded text-sm text-slate-200 focus:border-blue-400/50 focus:outline-none"
            >
              <option value="">所有類型</option>
              <option value="general">一般積分項目</option>
              <option value="quality">品質工程積分項目</option>
              <option value="professional">專業積分項目</option>
              <option value="management">管理積分項目</option>
              <option value="core">核心職能積分項目</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 flex items-center">
              <DollarSign className="h-3 w-3 mr-1" />
              積分範圍
            </label>
            <select
              value={filters.pointsRange}
              onChange={(e) => handleFilterChange({...filters, pointsRange: e.target.value})}
              className="w-full px-3 py-2 bg-slate-600/50 border border-slate-500/50 rounded text-sm text-slate-200 focus:border-blue-400/50 focus:outline-none"
            >
              <option value="">所有積分</option>
              <option value="low">1-5分</option>
              <option value="medium">6-10分</option>
              <option value="high">10分以上</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchOperationToolbar; 