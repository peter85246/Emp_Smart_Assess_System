import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, Award, Target, AlertCircle, CheckCircle, XCircle, Search, Filter, Eye, EyeOff, Download, Image, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { pointsConfig, pointsUtils } from '../../../config/pointsConfig';
import { pointsAPI } from '../../../services/pointsAPI';
import ImagePreviewModal from '../shared/ImagePreviewModal';

const PersonalScoreView = ({ currentUser, refreshTrigger }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [pointsData, setPointsData] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({});
  const [trendData, setTrendData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 添加篩選狀態
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 審核說明展開狀態
  const [expandedComments, setExpandedComments] = useState({});
  
  // 檔案預覽和下載相關狀態
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    imageSrc: '',
    fileName: '',
    file: null,
    type: 'image'
  });
  const [downloadLoading, setDownloadLoading] = useState({});
  const [previewLoading, setPreviewLoading] = useState(false);

  // 分頁相關狀態
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // 每頁顯示10個項目

  useEffect(() => {
    loadPersonalData();
  }, [currentUser.id, selectedMonth, refreshTrigger]);

  // 當篩選條件改變時，重置到第一頁
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm, selectedMonth]);

  const loadPersonalData = async () => {
    setLoading(true);
    try {
      console.log('載入個人積分數據 - 用戶ID:', currentUser.id);

      // 確保用戶ID是數字格式
      let employeeId;
      if (typeof currentUser.id === 'string' && currentUser.id.startsWith('EMP')) {
        // 如果是 EMP001 格式，提取數字部分
        employeeId = parseInt(currentUser.id.replace('EMP', '').replace(/^0+/, '')) || 1;
      } else {
        employeeId = parseInt(currentUser.id) || 1;
      }
      console.log('轉換後的員工ID:', employeeId);

      // 使用真實API獲取積分記錄
      const pointsResponse = await pointsAPI.getEmployeePoints(employeeId);
      console.log('獲取積分記錄成功:', pointsResponse);

      // 檢查響應格式並獲取數據
      const pointsData = pointsResponse.data || pointsResponse;
      console.log('處理後的積分數據:', pointsData);

      // 轉換API數據格式以符合組件需求
      const transformedPointsData = Array.isArray(pointsData) ? pointsData.map(entry => ({
        id: entry.id,
        standardName: entry.standard?.categoryName || entry.standardName || '未知項目',
        pointsType: entry.standard?.pointsType || 'general',
        pointsEarned: entry.pointsEarned || entry.pointsCalculated || 0,
        basePoints: entry.basePoints || 0,
        bonusPoints: entry.bonusPoints || 0,
        status: entry.status || 'pending',
        entryDate: new Date(entry.entryDate || entry.submittedAt || entry.createdAt).toISOString().split('T')[0],
        description: entry.description || '',
        // 審核說明相關信息
        reviewComments: entry.reviewComments || entry.comments || null,
        reviewedBy: entry.reviewedBy || entry.approverId || null,
        reviewedAt: entry.reviewedAt || entry.approvedAt || entry.rejectedAt || null,
        // 保留原始時間戳用於排序
        originalTimestamp: entry.entryDate || entry.submittedAt || entry.createdAt
      })).sort((a, b) => {
        // 按照創建/提交時間排序：早的在前，晚的在後
        const timeA = new Date(a.originalTimestamp).getTime();
        const timeB = new Date(b.originalTimestamp).getTime();
        return timeA - timeB;
      }) : [];

      // 獲取積分摘要
      try {
        const summaryResponse = await pointsAPI.getEmployeePointsSummary(employeeId, selectedMonth);
        console.log('獲取積分摘要成功:', summaryResponse.data);
        
        // 使用API返回的摘要數據
        const apiSummary = summaryResponse.data;
        const stats = {
          total: apiSummary.monthlyTotal,
          targetPoints: 100,
          achievementRate: Math.round((apiSummary.monthlyTotal / 100) * 100),
          byType: apiSummary.categoryTotals,
          grade: pointsUtils?.getGradeName 
            ? pointsUtils.getGradeName(Math.round((apiSummary.monthlyTotal / 100) * 100))
            : (apiSummary.monthlyTotal >= 80 ? 'A' : apiSummary.monthlyTotal >= 60 ? 'B' : 'C'),
          gradeColor: pointsUtils?.getGradeColor 
            ? pointsUtils.getGradeColor(Math.round((apiSummary.monthlyTotal / 100) * 100))
            : (apiSummary.monthlyTotal >= 80 ? '#10B981' : apiSummary.monthlyTotal >= 60 ? '#F59E0B' : '#EF4444'),
          entriesCount: transformedPointsData.filter(item => 
            item.entryDate.startsWith(selectedMonth)).length,
          selectedMonth: selectedMonth
        };
        
        setMonthlyStats(stats);
        console.log('設置API返回的月度統計:', stats);
      } catch (summaryError) {
        console.log('積分摘要API錯誤，使用計算值:', summaryError);
        // 如果API失敗，使用本地計算
        const stats = calculateMonthlyStats(transformedPointsData, selectedMonth);
        setMonthlyStats(stats);
      }

      // 生成趨勢數據（基於實際數據）
      const trendData = generateTrendData(transformedPointsData);
      console.log('設置趨勢數據:', trendData);

      setPointsData(transformedPointsData);
      setTrendData(trendData);
      
      console.log('個人數據載入完成:', {
        pointsCount: transformedPointsData.length,
        trendDataPoints: trendData.length,
        monthlyStats: monthlyStats
      });
      
    } catch (error) {
      console.error('載入個人數據失敗:', error);
      
      // 如果API失敗，顯示空數據而不是模擬數據
      setPointsData([]);
      setTrendData([]);
      setMonthlyStats({
        total: 0,
        byType: {},
        targetPoints: 100,
        achievementRate: 0,
        grade: 'F',
        gradeColor: '#ef4444',
        entriesCount: 0,
        selectedMonth: selectedMonth
      });
    } finally {
      setLoading(false);
    }
  };

  // 生成趨勢數據的輔助函數
  const generateTrendData = (pointsData) => {
    console.log('生成趨勢數據 - 輸入數據:', pointsData);
    
    const monthlyTotals = {};
    const currentDate = new Date();
    
    // 初始化最近6個月的數據
    for (let i = 5; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7);
      monthlyTotals[monthKey] = 0;
    }

    console.log('初始化月份數據:', monthlyTotals);

    // 累計每月積分 - 改進邏輯包括所有狀態的積分
    pointsData.forEach(entry => {
      const monthKey = entry.entryDate.slice(0, 7);
      
      // 只統計已核准的積分或者所有積分（根據需求）
      if (entry.status === 'approved') {
        if (monthlyTotals.hasOwnProperty(monthKey)) {
          monthlyTotals[monthKey] += entry.pointsEarned || 0;
        } else {
          // 如果是其他月份的數據，也要包含
          monthlyTotals[monthKey] = (monthlyTotals[monthKey] || 0) + (entry.pointsEarned || 0);
        }
      }
    });

    console.log('計算後的月份數據:', monthlyTotals);

    // 轉換為圖表所需格式，並按月份排序
    const trendData = Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, points]) => ({
        month: month.slice(5), // 只顯示 MM 格式
        fullMonth: month,
        points: parseFloat(points.toFixed(1)),
        target: 100
      }));

    console.log('生成的趨勢數據:', trendData);

    // 如果沒有實際數據，生成示例數據供演示
    if (trendData.every(item => item.points === 0)) {
      console.log('沒有實際積分數據，生成示例數據');
      return trendData.map((item, index) => ({
        ...item,
        points: Math.random() * 80 + 20, // 20-100之間的隨機值
        hasRealData: false
      }));
    }

    return trendData.map(item => ({ ...item, hasRealData: true }));
  };

  // 月份數據篩選函數
  const filterDataByMonth = (data, selectedMonth) => {
    if (!selectedMonth) return data;

    return data.filter(item => {
      const itemMonth = item.entryDate.slice(0, 7); // YYYY-MM格式
      return itemMonth === selectedMonth;
    });
  };

  // 根據積分項目名稱映射到正確的類型
  const getPointsTypeByName = (standardName) => {
    // 積分項目名稱到類型的映射表
    const nameToTypeMapping = {
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

      // 品質工程積分項目（歸類為一般積分項目的子分類）
      'ISO外部稽核': 'general',
      '抽檢驗收': 'general',
      '進料檢驗': 'general',
      '包裝出貨': 'general',
      '外觀產品全檢': 'general',
      '庫存盤點': 'general',
      '客戶投訴處理': 'general',
      '品質改善提案': 'general',
      '震動盤篩檢': 'general',
      '品質需求全檢': 'general',
      '客戶退貨': 'general',
      '達成品質政策': 'general',
      '出貨留樣': 'general',
      '指導作業流程': 'general',
      '出貨事項': 'general',

      // 專業積分項目
      '凸輪改機': 'professional',
      'CNC改機': 'professional',
      'CNC編碼': 'professional',
      '零件2D製圖': 'professional',
      '零件3D製圖': 'professional',
      '治具設計': 'professional',
      '夾具設計': 'professional',
      '模具設計': 'professional',
      '程式設計': 'professional',
      '技術指導': 'professional',
      '技術文件': 'professional',

      // 管理積分項目
      '下屬工作日誌': 'management',
      '下屬積分達標': 'management',
      '稽核SOP': 'management',
      '教育訓練': 'management',
      '幹部會議': 'management',
      '績效面談': 'management',
      '團隊建設': 'management',
      '跨部門協調': 'management',

      // 核心職能積分項目（歸類為一般積分項目的子分類）
      '誠信正直': 'general',
      '創新效率': 'general',
      '卓越品質': 'general',
      '專業服務': 'general'
    };

    return nameToTypeMapping[standardName] || 'general';
  };

  // 積分類型映射函數 - 統一處理新舊類型格式和項目名稱映射
  const mapPointsType = (pointsType, standardName) => {
    // 首先嘗試根據項目名稱獲取正確的類型
    if (standardName) {
      const typeByName = getPointsTypeByName(standardName);
      if (typeByName !== 'general' || !pointsType) {
        return typeByName;
      }
    }

    if (!pointsType) return 'general';

    // 如果已經是新格式，直接返回
    if (pointsConfig.pointsTypes[pointsType]) {
      return pointsType;
    }

    // 舊格式到新格式的映射
    const typeMapping = {
      'production': 'professional',
      'basic': 'general',
      'tech': 'professional',
      'mgmt': 'management',
      'quality': 'general',  // 品質工程項目歸類為一般積分
      'core': 'general'      // 核心職能項目歸類為一般積分
    };

    return typeMapping[pointsType] || pointsType;
  };

  const calculateMonthlyStats = (allData, selectedMonth) => {
    console.log('計算月度統計 - 選擇月份:', selectedMonth);
    console.log('計算月度統計 - 輸入數據總數:', allData.length);
    
    // 根據選擇的月份篩選數據
    const monthData = allData.filter(item => {
      const itemMonth = new Date(item.entryDate).toISOString().slice(0, 7);
      const match = itemMonth === selectedMonth;
      if (match) {
        console.log('找到匹配的數據:', item);
      }
      return match;
    });
    
    console.log('月份篩選後數據數量:', monthData.length);
    
    // 只計算已核准的積分
    const approvedData = monthData.filter(item => 
      item.status === 'approved' || item.status === 'auto_approved'
    );
    console.log('已核准的數據數量:', approvedData.length);
    
    // 計算總積分（包括基礎積分和獎勵積分）
    const total = approvedData.reduce((sum, item) => {
      const basePoints = item.pointsEarned || 0;
      const bonusPoints = item.bonusPoints || 0;
      return sum + basePoints + bonusPoints;
    }, 0);

    // 按類型統計積分
    const byType = approvedData.reduce((acc, item) => {
      const mappedType = mapPointsType(item.pointsType, item.standardName);
      const itemTotal = (item.pointsEarned || 0) + (item.bonusPoints || 0);
      acc[mappedType] = (acc[mappedType] || 0) + itemTotal;
      return acc;
    }, {});

    const targetPoints = 100; // 應該從 API 獲取
    const achievementRate = pointsUtils?.calculateAchievementRate 
      ? pointsUtils.calculateAchievementRate(total, targetPoints)
      : Math.round((total / targetPoints) * 100);
      
    const grade = pointsUtils?.getGradeName 
      ? pointsUtils.getGradeName(achievementRate)
      : (achievementRate >= 80 ? 'A' : achievementRate >= 60 ? 'B' : 'C');
      
    const gradeColor = pointsUtils?.getGradeColor 
      ? pointsUtils.getGradeColor(achievementRate)
      : (achievementRate >= 80 ? '#10B981' : achievementRate >= 60 ? '#F59E0B' : '#EF4444');

    const stats = {
      total: parseFloat(total.toFixed(1)),
      byType,
      targetPoints,
      achievementRate: Math.min(achievementRate, 100),
      grade,
      gradeColor,
      entriesCount: monthData.length,  // 使用月份篩選後的數據
      approvedCount: approvedData.length,
      selectedMonth: selectedMonth     // 記錄選擇的月份
    };

    console.log('計算的月度統計 (選擇月份: ' + selectedMonth + '):', stats);
    console.log('積分類型分布詳細:', byType);
    console.log('可用的積分類型配置:', Object.keys(pointsConfig.pointsTypes));
    return stats;
  };

  // 準備圖表數據 - 修復類型映射問題
  const pieData = Object.entries(monthlyStats.byType || {}).map(([type, value]) => {
    // 映射到正確的類型
    const mappedType = mapPointsType(type, '');
    let typeName = type;
    let typeColor = '#8884d8';

    // 使用映射後的類型獲取配置
    if (pointsConfig.pointsTypes[mappedType]) {
      typeName = pointsConfig.pointsTypes[mappedType].name;
      typeColor = pointsConfig.pointsTypes[mappedType].color;
    } else {
      console.warn(`未知的積分類型: ${type} -> ${mappedType}`);
      // 使用預設的中文名稱
      const defaultNames = {
        'general': '一般積分項目',
        'professional': '專業積分項目', 
        'management': '管理積分項目',
        'temporary': '臨時工作項目',
        'misc': '雜項事件',
        'quality': '品質工程積分項目'
      };
      typeName = defaultNames[mappedType] || type;
    }

    return {
      name: typeName,
      value: value,
      color: typeColor,
      originalType: type,
      mappedType: mappedType
    };
  });

  const barData = Object.entries(monthlyStats.byType || {}).map(([type, value]) => {
    // 映射到正確的類型
    const mappedType = mapPointsType(type, '');
    let typeName = type;
    let typeColor = '#8884d8';

    // 使用映射後的類型獲取配置
    if (pointsConfig.pointsTypes[mappedType]) {
      typeName = pointsConfig.pointsTypes[mappedType].name;
      typeColor = pointsConfig.pointsTypes[mappedType].color;
    } else {
      console.warn(`未知的積分類型: ${type} -> ${mappedType}`);
      // 使用預設的中文名稱
      const defaultNames = {
        'general': '一般積分項目',
        'professional': '專業積分項目', 
        'management': '管理積分項目',
        'temporary': '臨時工作項目',
        'misc': '雜項事件',
        'quality': '品質工程積分項目'
      };
      typeName = defaultNames[mappedType] || type;
    }

    return {
      type: typeName,
      points: value,
      color: typeColor,
      originalType: type,
      mappedType: mappedType
    };
  });



  // 篩選積分數據 - 支援月份、類型映射和搜索
  const filteredPointsData = pointsData.filter(item => {
    // 月份篩選 - 只顯示選擇月份的數據
    const matchesMonth = item.entryDate.slice(0, 7) === selectedMonth;
    
    const matchesSearch = !searchTerm || 
      item.standardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 增強的分類篩選邏輯 - 支援新舊格式映射和項目名稱映射
    const matchesCategory = !selectedCategory ||
      item.pointsType === selectedCategory ||                           // 直接匹配
      mapPointsType(item.pointsType, item.standardName) === selectedCategory;  // 映射後匹配

    return matchesMonth && matchesSearch && matchesCategory;
  });

  // 分頁邏輯
  const totalItems = filteredPointsData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = filteredPointsData.slice(startIndex, endIndex);

  // 分頁控制函數
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 生成頁碼範圍
  const getPageNumbers = () => {
    const delta = 2; // 當前頁前後顯示的頁數
    const range = [];
    const rangeWithDots = [];

    // 計算顯示範圍
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // 添加首頁和...
    if (start > 1) {
      rangeWithDots.push(1);
      if (start > 2) {
        rangeWithDots.push('...');
      }
    }

    // 添加主要範圍
    rangeWithDots.push(...range);

    // 添加末頁和...
    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push('...');
      }
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // 切換審核說明展開狀態
  const toggleCommentExpansion = (itemId) => {
    setExpandedComments(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // 渲染申請說明
  const renderApplicationDescription = (item) => {
    if (!item.description) {
      return (
        <div className="text-slate-500 text-xs italic">
          無申請說明
        </div>
      );
    }

    const isExpanded = expandedComments[`desc_${item.id}`];
    const isLongDescription = item.description.length > 50;
    
    return (
      <div className="space-y-1">
        <div className="text-slate-300 text-xs">
          {isLongDescription && !isExpanded 
            ? `${item.description.substring(0, 50)}...`
            : item.description
          }
        </div>
        
        {isLongDescription && (
          <button
            onClick={() => toggleCommentExpansion(`desc_${item.id}`)}
            className="text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1"
          >
            {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{isExpanded ? '收起' : '展開'}</span>
          </button>
        )}
      </div>
    );
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
      // 現有檔案：通過API端點
      const intFileId = parseInt(file.id);
      if (!isNaN(intFileId)) {
        const url = `/api/fileupload/download/${intFileId}`;
        console.log('生成API下載URL:', url);
        return url;
      }
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

  // 下載證明檔案
  const downloadEvidenceFile = async (file) => {
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

        console.log(`檔案下載成功: ${fileName}`);
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

          console.log(`檔案下載成功: ${fileName}`);
        } else {
          throw new Error('無法獲取檔案下載URL');
        }
      }
    } catch (error) {
      console.error('下載檔案失敗:', error);
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

  // 渲染證明檔案
  const renderEvidenceFiles = (item) => {
    console.log('員工查看檔案資料:', item);
    
    // 優先使用新的 evidenceFileDetails 字段
    if (item.evidenceFileDetails && Array.isArray(item.evidenceFileDetails) && item.evidenceFileDetails.length > 0) {
      console.log('使用 evidenceFileDetails:', item.evidenceFileDetails);
      return (
        <div className="space-y-1">
          <div className="text-slate-300 text-xs font-medium">
            {item.evidenceFileDetails.length} 個檔案
          </div>
          <div className="space-y-1">
            {item.evidenceFileDetails.slice(0, 3).map((file, index) => {
              const fileName = file.fileName || `檔案${index + 1}`;
              const isImage = isImageFile(fileName);
              const fileKey = file.id || fileName;
              const isDownloading = downloadLoading[fileKey];
              
              return (
                <div key={index} className="flex items-center justify-between text-xs bg-slate-600/30 p-2 rounded border border-slate-500/30">
                  <div className="flex items-center space-x-2 flex-1">
                    {isImage ? (
                      <Image className="h-3 w-3 text-blue-400" />
                    ) : (
                      <FileText className="h-3 w-3 text-slate-400" />
                    )}
                    <span className="text-slate-300 truncate flex-1" title={fileName}>
                      {fileName}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {isImage && (
                      <button
                        onClick={() => previewFile(file)}
                        disabled={previewLoading}
                        className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-600/20 rounded"
                        title="預覽圖片"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={() => downloadEvidenceFile(file)}
                      disabled={isDownloading}
                      className="text-green-400 hover:text-green-300 p-1 hover:bg-green-600/20 rounded"
                      title="下載檔案"
                    >
                      {isDownloading ? (
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400"></div>
                      ) : (
                        <Download className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
            {item.evidenceFileDetails.length > 3 && (
              <div className="text-slate-400 text-xs">
                還有 {item.evidenceFileDetails.length - 3} 個檔案...
              </div>
            )}
          </div>
        </div>
      );
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
          return (
            <div className="space-y-1">
              <div className="text-slate-300 text-xs font-medium">
                {files.length} 個檔案
              </div>
              <div className="space-y-1">
                {files.slice(0, 3).map((file, index) => {
                  // 檢查檔案是否為數字（檔案ID）
                  if (typeof file === 'number') {
                    // 檔案是ID，需要模擬檔案物件
                    const mockFile = {
                      id: file,
                      fileName: `檔案${index + 1}`,
                      fileSize: null,
                      contentType: null
                    };
                    
                    const fileName = mockFile.fileName;
                    const fileKey = mockFile.id;
                    const isDownloading = downloadLoading[fileKey];

                    return (
                      <div key={index} className="flex items-center justify-between text-xs bg-slate-600/30 p-2 rounded border border-slate-500/30">
                        <div className="flex items-center space-x-2 flex-1">
                          <FileText className="h-3 w-3 text-slate-400" />
                          <span className="text-slate-300 truncate flex-1" title={fileName}>
                            {fileName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => downloadEvidenceFile(mockFile)}
                            disabled={isDownloading}
                            className="text-green-400 hover:text-green-300 p-1 hover:bg-green-600/20 rounded"
                            title="下載檔案"
                          >
                            {isDownloading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400"></div>
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  } else if (typeof file === 'object' && file !== null) {
                    // 正常的檔案物件
                    const fileName = file.name || file.fileName || `檔案${index + 1}`;
                    const isImage = isImageFile(fileName);
                    const fileKey = file.id || fileName;
                    const isDownloading = downloadLoading[fileKey];

                    return (
                      <div key={index} className="flex items-center justify-between text-xs bg-slate-600/30 p-2 rounded border border-slate-500/30">
                        <div className="flex items-center space-x-2 flex-1">
                          {isImage ? (
                            <Image className="h-3 w-3 text-blue-400" />
                          ) : (
                            <FileText className="h-3 w-3 text-slate-400" />
                          )}
                          <span className="text-slate-300 truncate flex-1" title={fileName}>
                            {fileName}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {isImage && (
                            <button
                              onClick={() => previewFile(file)}
                              disabled={previewLoading}
                              className="text-blue-400 hover:text-blue-300 p-1 hover:bg-blue-600/20 rounded"
                              title="預覽圖片"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={() => downloadEvidenceFile(file)}
                            disabled={isDownloading}
                            className="text-green-400 hover:text-green-300 p-1 hover:bg-green-600/20 rounded"
                            title="下載檔案"
                          >
                            {isDownloading ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-400"></div>
                            ) : (
                              <Download className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    console.warn('未知的檔案格式:', file);
                    return (
                      <div key={index} className="text-slate-400 text-xs">
                        未知檔案格式: {JSON.stringify(file)}
                      </div>
                    );
                  }
                })}
                {files.length > 3 && (
                  <div className="text-slate-400 text-xs">
                    還有 {files.length - 3} 個檔案...
                  </div>
                )}
              </div>
            </div>
          );
        }
      } catch (error) {
        console.error('解析檔案資料失敗:', error, 'evidenceFiles:', item.evidenceFiles);
        return (
          <div className="text-slate-500 text-xs italic">
            檔案資料錯誤: {error.message}
          </div>
        );
      }
    }
    
    console.log('無檔案資料');
    return (
      <div className="text-slate-500 text-xs italic">
        無證明檔案
      </div>
    );
  };

  // 渲染審核說明
  const renderReviewComment = (item) => {
    if (!item.reviewComments) {
      return (
        <div className="text-slate-500 text-xs italic">
          無審核說明
        </div>
      );
    }

    const isExpanded = expandedComments[item.id];
    const isLongComment = item.reviewComments.length > 50;
    
    return (
      <div className="space-y-1">
        <div className="text-slate-300 text-xs">
          {isLongComment && !isExpanded 
            ? `${item.reviewComments.substring(0, 50)}...`
            : item.reviewComments
          }
        </div>
        
        {item.reviewedBy && (
          <div className="text-slate-500 text-xs">
            審核者: {item.reviewedBy}
            {item.reviewedAt && (
              <span className="ml-1">
                • {new Date(item.reviewedAt).toLocaleDateString('zh-TW')}
              </span>
            )}
          </div>
        )}
        
        {isLongComment && (
          <button
            onClick={() => toggleCommentExpansion(item.id)}
            className="text-blue-400 hover:text-blue-300 text-xs flex items-center space-x-1"
          >
            {isExpanded ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
            <span>{isExpanded ? '收起' : '展開'}</span>
          </button>
        )}
      </div>
    );
  };

  // 渲染分頁控制組件
  const renderPaginationControls = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="px-6 py-4 border-t border-slate-600/50 bg-slate-700/20">
        {/* 記錄範圍信息 */}
        <div className="text-center text-sm text-slate-400 mb-4">
          顯示第 {startIndex + 1} - {Math.min(endIndex, totalItems)} 項，共 {totalItems} 項記錄
        </div>
        
        {/* 分頁控制按鈕 - 居中顯示 */}
        <div className="flex items-center justify-center space-x-2">
          {/* 上一頁按鈕 */}
          <button
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className={`flex items-center px-3 py-2 text-sm rounded-md border transition-colors ${
              currentPage === 1
                ? 'bg-slate-600/50 text-slate-500 border-slate-600/50 cursor-not-allowed'
                : 'bg-slate-700 text-slate-300 border-slate-500 hover:bg-slate-600 hover:text-white'
            }`}
            title="上一頁"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            上一頁
          </button>

          {/* 頁碼按鈕 */}
          <div className="flex items-center space-x-1">
            {getPageNumbers().map((pageNum, index) => (
              <React.Fragment key={index}>
                {pageNum === '...' ? (
                  <span className="px-3 py-2 text-slate-500">...</span>
                ) : (
                  <button
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-700 text-slate-300 border-slate-500 hover:bg-slate-600 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* 下一頁按鈕 */}
          <button
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className={`flex items-center px-3 py-2 text-sm rounded-md border transition-colors ${
              currentPage === totalPages
                ? 'bg-slate-600/50 text-slate-500 border-slate-600/50 cursor-not-allowed'
                : 'bg-slate-700 text-slate-300 border-slate-500 hover:bg-slate-600 hover:text-white'
            }`}
            title="下一頁"
          >
            下一頁
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>
      </div>
    );
  };

  // 調試信息 - 月份和分類篩選 (增強版)
  console.log('=== 個人積分查看篩選調試 ===');
  console.log('篩選前積分數據總數:', pointsData.length);
  console.log('選擇的月份:', selectedMonth);
  console.log('選擇的分類ID:', selectedCategory);
  console.log('選擇的分類名稱:', selectedCategory ? pointsConfig.pointsTypes[selectedCategory]?.name : '所有分類');
  console.log('搜尋關鍵字:', searchTerm);
  console.log('篩選後積分數據總數:', filteredPointsData.length);
  console.log('當前頁碼:', currentPage);
  console.log('總頁數:', totalPages);
  console.log('當前頁顯示項目數:', currentPageData.length);
  
  // 顯示月份篩選詳情
  if (pointsData.length > 0) {
    const monthDistribution = pointsData.reduce((acc, item) => {
      const month = item.entryDate.slice(0, 7);
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {});
    console.log('積分數據月份分布:', monthDistribution);
    
    const selectedMonthCount = monthDistribution[selectedMonth] || 0;
    console.log(`選擇月份 "${selectedMonth}" 的數據數量:`, selectedMonthCount);
  }
  
  // 顯示數據中的分類分布和映射結果
  if (pointsData.length > 0) {
    const categoryDistribution = pointsData.reduce((acc, item) => {
      const originalType = item.pointsType || 'unknown';
      const mappedType = mapPointsType(originalType);
      const key = originalType === mappedType ? originalType : `${originalType} → ${mappedType}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    console.log('積分數據分類分布 (含映射):', categoryDistribution);
    
    // 顯示可用的分類選項
    console.log('可用分類選項:', Object.entries(pointsConfig.pointsTypes).map(([key, config]) => 
      `${key}: ${config.name}`
    ));
    
    // 如果有選擇分類，顯示篩選匹配詳情
    if (selectedCategory) {
      console.log('=== 篩選匹配詳情 ===');
      console.log(`尋找匹配 "${selectedCategory}" 的項目:`);
      
      const matchedItems = pointsData.filter(item => {
        const directMatch = item.pointsType === selectedCategory;
        const mappedMatch = mapPointsType(item.pointsType, item.standardName) === selectedCategory;
        return directMatch || mappedMatch;
      });

      matchedItems.forEach((item, index) => {
        const directMatch = item.pointsType === selectedCategory;
        const mappedMatch = mapPointsType(item.pointsType, item.standardName) === selectedCategory;
        const matchType = directMatch ? '直接匹配' : '映射匹配';
        console.log(`${index + 1}. ${item.standardName} | 原始類型: ${item.pointsType} | 映射類型: ${mapPointsType(item.pointsType, item.standardName)} | ${matchType}`);
      });
    }
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-4 lg:p-6 flex items-center justify-center min-h-[400px] bg-transparent">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6 bg-transparent">
      {/* 標題和月份選擇 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold text-white">個人積分統計</h2>
        <div className="flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-slate-400" />
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              const newMonth = e.target.value;
              console.log('月份變更:', { oldMonth: selectedMonth, newMonth });
              setSelectedMonth(newMonth);
              // 觸發數據重新載入
              loadPersonalData();
            }}
            className="bg-slate-700 border border-slate-500 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      </div>

      {/* 選定月份統計 */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-800/50 backdrop-blur-sm rounded-lg p-4 mb-4 border border-slate-700/50 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4 text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-white">月度績效概覽</h3>
              <p className="text-xs text-slate-400">{selectedMonth.split('-')[0]}年{selectedMonth.split('-')[1]}月</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-700/30 px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
            <span className="text-xs text-slate-300">即時</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="bg-slate-700/30 rounded-lg p-2">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">當前積分</span>
              <div className="flex items-baseline">
                <span className="text-lg font-bold text-blue-400">
                  {monthlyStats.total?.toFixed(1) || '0.0'}
                </span>
                <span className="text-xs text-slate-400 ml-1">分</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-2">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">達成率</span>
              <div className="flex items-baseline">
                <span className={`text-lg font-bold ${
                  (monthlyStats.achievementRate || 0) >= 80 ? 'text-green-400' :
                  (monthlyStats.achievementRate || 0) >= 60 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {monthlyStats.achievementRate || 0}
                </span>
                <span className="text-xs text-slate-400 ml-1">%</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-700/30 rounded-lg p-2">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 mb-1">目標</span>
              <div className="flex items-baseline">
                <span className="text-lg font-semibold text-white">{monthlyStats.targetPoints || 100}</span>
                <span className="text-xs text-slate-400 ml-1">分</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-2 w-full bg-slate-600/50 rounded-full h-1.5">
          <div
            className={`rounded-full h-1.5 transition-all duration-500 ease-out ${
              (monthlyStats.achievementRate || 0) >= 80 ? 'bg-green-400' :
              (monthlyStats.achievementRate || 0) >= 60 ? 'bg-yellow-400' :
              'bg-red-400'
            }`}
            style={{ width: `${Math.min(monthlyStats.achievementRate || 0, 100)}%` }}
          />
        </div>
      </div>

      {/* 統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-700/30 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-slate-600/50">
          <div className="flex items-center">
            <Award className="h-8 w-8 text-blue-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-300">總積分</p>
              <p className="text-2xl font-bold text-white">
                {pointsUtils.formatPoints(monthlyStats.total || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-700/30 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-slate-600/50">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-300">達成率</p>
              <p className="text-2xl font-bold text-white">
                {monthlyStats.achievementRate || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-700/30 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-slate-600/50">
          <div className="flex items-center">
            <div 
              className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: monthlyStats.gradeColor }}
            >
              {monthlyStats.grade}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-300">等級</p>
              <p className="text-2xl font-bold text-white">{monthlyStats.grade}級</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-700/30 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-slate-600/50">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-300">提交項目</p>
              <p className="text-2xl font-bold text-white">{monthlyStats.entriesCount || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 圖表區域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 積分類型分布 - 圓餅圖 */}
        <div className="bg-slate-700/30 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4">積分類型分布</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, percent }) => {
                  const shortName = name.length > 6 ? name.substring(0, 6) + '...' : name;
                  return `${shortName} ${(percent * 100).toFixed(0)}%`;
                }}
                outerRadius={60}
                innerRadius={20}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, name]}
                contentStyle={{ 
                  backgroundColor: '#475569', 
                  border: '1px solid #64748B', 
                  borderRadius: '6px',
                  color: '#F1F5F9'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* 積分類型對比 - 柱狀圖 */}
        <div className="bg-slate-700/30 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-4">各類型積分</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#64748B" />
              <XAxis dataKey="type" tick={{fill: '#CBD5E1'}} />
              <YAxis tick={{fill: '#CBD5E1'}} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#475569', 
                  border: '1px solid #64748B', 
                  borderRadius: '6px',
                  color: '#F1F5F9'
                }} 
              />
              <Bar dataKey="points" fill="#60A5FA" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 趨勢圖 */}
      <div className="bg-slate-700/30 backdrop-blur-sm p-6 rounded-lg shadow-sm border border-slate-600/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">積分趨勢</h3>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-blue-400"></div>
              <span className="text-slate-300">實際積分</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-0.5 bg-red-400 border-dashed" style={{borderTop: '1px dashed #F87171'}}></div>
              <span className="text-slate-300">目標積分</span>
            </div>
          </div>
        </div>
        
        {trendData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="text-center text-slate-400">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 text-slate-500" />
              <p>暫無積分趨勢數據</p>
              <p className="text-xs mt-1">開始累積積分記錄以查看趨勢</p>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#64748B" />
              <XAxis 
                dataKey="month" 
                tick={{fill: '#CBD5E1'}} 
                axisLine={{stroke: '#64748B'}}
                tickLine={{stroke: '#64748B'}}
              />
              <YAxis 
                tick={{fill: '#CBD5E1'}} 
                axisLine={{stroke: '#64748B'}}
                tickLine={{stroke: '#64748B'}}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#475569', 
                  border: '1px solid #64748B', 
                  borderRadius: '6px',
                  color: '#F1F5F9'
                }}
                formatter={(value, name) => [
                  `${value} 積分`,
                  name === 'points' ? '實際積分' : '目標積分'
                ]}
                labelFormatter={(label) => `${label} 月`}
              />
              <Line 
                type="monotone" 
                dataKey="points" 
                stroke="#60A5FA" 
                strokeWidth={3}
                dot={{ fill: '#60A5FA', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#60A5FA', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#F87171" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        
        {/* 趨勢分析說明 */}
        {trendData.length > 0 && (
          <div className="mt-4 p-3 bg-slate-600/30 rounded-lg">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>
                📊 最近6個月趨勢: 
                {trendData.some(item => item.hasRealData === false) ? 
                  ' 包含示例數據' : 
                  ` 基於 ${pointsData.length} 筆積分記錄`
                }
              </span>
              <span>
                目標: {trendData[0]?.target || 100} 積分/月
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 積分明細列表 */}
      <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg shadow-sm border border-slate-600/50">
        <div className="p-6 border-b border-slate-600/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h3 className="text-lg font-semibold text-white">積分明細</h3>
            
            {/* 篩選和搜索區域 */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* 搜索框 */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索項目名稱..."
                  value={searchTerm}
                  onChange={(e) => {
                    console.log('=== 搜索輸入變化 ===');
                    console.log('搜索值:', e.target.value);
                    setSearchTerm(e.target.value);
                  }}
                  className="pl-10 pr-4 py-2 bg-slate-600 border border-slate-500 text-white placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm w-full sm:w-48"
                />
              </div>

              {/* 分類篩選 */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    console.log('=== 分類篩選變化 ===');
                    console.log('選擇的分類:', e.target.value);
                    console.log('可用分類:', Object.keys(pointsConfig.pointsTypes));
                    setSelectedCategory(e.target.value);
                  }}
                  className="pl-10 pr-8 py-2 bg-slate-600 border border-slate-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm w-full sm:w-40 appearance-none"
                >
                  <option value="" className="bg-slate-600 text-white">所有分類</option>
                  {Object.entries(pointsConfig.pointsTypes).map(([type, config]) => (
                    <option key={type} value={type} className="bg-slate-600 text-white">
                      {config.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 篩選狀態顯示 */}
          {(selectedCategory || searchTerm || selectedMonth) && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedMonth && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-600/20 text-purple-300 border border-purple-500/30">
                  月份: {selectedMonth}
                </span>
              )}
              {selectedCategory && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30">
                  分類: {pointsConfig.pointsTypes[selectedCategory]?.name}
                  <button
                    onClick={() => setSelectedCategory('')}
                    className="ml-1 text-blue-300 hover:text-blue-100"
                  >
                    ×
                  </button>
                </span>
              )}
              {searchTerm && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-600/20 text-green-300 border border-green-500/30">
                  搜索: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-1 text-green-300 hover:text-green-100"
                  >
                    ×
                  </button>
                </span>
              )}
              <span className="inline-flex items-center text-xs text-slate-400">
                顯示 {filteredPointsData.length} / {pointsData.length} 項記錄
              </span>
            </div>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-600/50">
            <thead className="bg-slate-600/30">
              <tr>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300 uppercase tracking-wider w-16">
                  項目
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-slate-300 uppercase tracking-wider w-40">
                  項目名稱
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300 uppercase tracking-wider w-32">
                  類型
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300 uppercase tracking-wider w-24">
                  獲得積分
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300 uppercase tracking-wider w-20">
                  狀態
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-slate-300 uppercase tracking-wider w-48">
                  申請說明
                </th>
                <th className="px-6 py-3 text-center text-sm font-medium text-slate-300 uppercase tracking-wider w-48">
                  審核說明
                </th>
                <th className="px-4 py-3 text-center text-sm font-medium text-slate-300 uppercase tracking-wider w-28">
                  日期
                </th>
              </tr>
            </thead>
            <tbody className="bg-slate-700/20 divide-y divide-slate-600/50">
              {filteredPointsData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center">
                    <div className="text-slate-400">
                      {pointsData.length === 0 ? (
                        <>
                          <Award className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                          <p className="text-lg">尚無積分記錄</p>
                          <p className="text-sm mt-1">開始提交積分申請以查看記錄</p>
                        </>
                      ) : (
                        <>
                          <Search className="h-12 w-12 mx-auto mb-4 text-slate-500" />
                          <p className="text-lg">沒有符合篩選條件的記錄</p>
                          <p className="text-sm mt-1">
                            {selectedMonth ? `月份: ${selectedMonth}` : ''}
                            {selectedMonth && (selectedCategory || searchTerm) ? ' • ' : ''}
                            {selectedCategory ? `分類: ${pointsConfig.pointsTypes[selectedCategory]?.name}` : ''}
                            {selectedCategory && searchTerm ? ' • ' : ''}
                            {searchTerm ? `搜索: "${searchTerm}"` : ''}
                          </p>
                          <button
                            onClick={() => {
                              setSelectedCategory('');
                              setSearchTerm('');
                            }}
                            className="mt-3 text-blue-400 hover:text-blue-300 text-sm underline"
                          >
                            清除搜索和分類篩選
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentPageData.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-600/30">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300 text-center font-medium">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white text-center">
                      {item.standardName}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                        {(() => {
                         // 使用統一的類型映射邏輯，包含項目名稱映射
                         const mappedType = mapPointsType(item.pointsType, item.standardName);
                         let typeName = mappedType;
                         let typeColor = '#6B7280'; // 默認灰色

                         // 獲取類型配置
                         if (pointsConfig.pointsTypes[mappedType]) {
                           typeName = pointsConfig.pointsTypes[mappedType].name;
                           typeColor = pointsConfig.pointsTypes[mappedType].color;
                         } else {
                           console.warn(`未知的積分類型: ${item.pointsType}，映射後: ${mappedType}，項目: ${item.standardName}`);
                           typeName = item.pointsType || '未分類';
                         }

                        return (
                          <span
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                            style={{ backgroundColor: typeColor }}
                          >
                            {typeName}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-white text-center">
                      {pointsUtils.formatPoints(item.pointsEarned)}
                      {item.bonusPoints > 0 && (
                        <span className="text-green-400 ml-1">
                          (+{pointsUtils.formatPoints(item.bonusPoints)})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        {item.status === 'approved' ? (
                          <CheckCircle className="h-4 w-4 text-green-400 mr-1" />
                        ) : item.status === 'rejected' ? (
                          <XCircle className="h-4 w-4 text-red-400 mr-1" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-400 mr-1" />
                        )}
                        <span className={`text-sm ${
                          item.status === 'approved' ? 'text-green-400' :
                          item.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {pointsConfig.entryStatus[item.status]?.name || '未知狀態'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="max-w-xs">
                        {renderApplicationDescription(item)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="max-w-xs">
                        {renderReviewComment(item)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-300 text-center">
                      {new Date(item.entryDate).toLocaleDateString('zh-TW')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* 分頁控制組件 */}
        {renderPaginationControls()}
      </div>

      {/* 圖片預覽模態框 */}
      <ImagePreviewModal
        isOpen={previewModal.isOpen && previewModal.type === 'image'}
        onClose={() => setPreviewModal({ isOpen: false, imageSrc: '', fileName: '', file: null, type: 'image' })}
        imageSrc={previewModal.imageSrc}
        fileName={previewModal.fileName}
        onDownload={() => {
          if (previewModal.file) {
            downloadEvidenceFile(previewModal.file);
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
                      downloadEvidenceFile(previewModal.file);
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

export default PersonalScoreView;
