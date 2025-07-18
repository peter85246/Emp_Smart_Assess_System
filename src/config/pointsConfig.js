// 積分管理系統配置
export const pointsConfig = {
  // API 端點
  apiEndpoints: {
    base: 'http://localhost:5001/api',
    points: '/points',
    standards: '/standards',
    workLog: '/worklog',
    fileUpload: '/fileupload'
  },

  // 積分類型
  pointsTypes: {
    general: {
      name: '一般積分項目',
      color: '#10B981',
      description: '基本工作項目'
    },
    quality: {
      name: '品質工程積分項目',
      color: '#3B82F6',
      description: '品質工程相關項目'
    },
    professional: {
      name: '專業積分項目',
      color: '#8B5CF6',
      description: '技術專業項目'
    },
    management: {
      name: '管理積分項目',
      color: '#F59E0B',
      description: '管理職能項目'
    },
    core: {
      name: '核心職能積分項目',
      color: '#EF4444',
      description: '全體適用核心職能'
    }
  },

  // 推廣期設定
  promotionPeriod: {
    startDate: '2024-09-01',
    months: 8,
    multipliers: [1.8, 1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1]
  },

  // 評分標準
  passingCriteria: {
    minimum: 62, // 最低通過百分比
    quarterly: 68, // 季度通過百分比
    management: 72 // 管理職通過百分比
  },

  // 檔案上傳設定
  fileUpload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['.jpg', '.jpeg', '.png', '.pdf', '.docx', '.xlsx'],
    maxFiles: 5
  },

  // 工作日誌分類
  workLogCategories: [
    { id: 1, name: '生產作業', color: '#10B981' },
    { id: 2, name: '品質檢驗', color: '#3B82F6' },
    { id: 3, name: '設備維護', color: '#F59E0B' },
    { id: 4, name: '改善提案', color: '#8B5CF6' },
    { id: 5, name: '教育訓練', color: '#EF4444' },
    { id: 6, name: '其他事項', color: '#6B7280' }
  ],

  // 部門設定
  departments: [
    { id: 1, name: '製造部' },
    { id: 2, name: '品質工程部' },
    { id: 3, name: '管理部' },
    { id: 4, name: '業務部' }
  ],

  // 狀態設定
  entryStatus: {
    pending: { name: '待審核', color: '#F59E0B' },
    approved: { name: '已核准', color: '#10B981' },
    rejected: { name: '已拒絕', color: '#EF4444' }
  },

  // 用戶角色
  userRoles: {
    employee: '員工',
    manager: '主管',
    admin: '管理員'
  }
};

// 積分計算工具函數
export const pointsUtils = {
  // 計算推廣期倍數
  getPromotionMultiplier: (date) => {
    const startDate = new Date(pointsConfig.promotionPeriod.startDate);
    const targetDate = new Date(date);
    
    if (targetDate < startDate) return 1.0;
    
    const monthsDiff = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (targetDate.getMonth() - startDate.getMonth());
    
    if (monthsDiff >= 0 && monthsDiff < pointsConfig.promotionPeriod.multipliers.length) {
      return pointsConfig.promotionPeriod.multipliers[monthsDiff];
    }
    
    return 1.0;
  },

  // 格式化積分顯示
  formatPoints: (points) => {
    return Number(points).toFixed(1);
  },

  // 計算達成率
  calculateAchievementRate: (actual, target) => {
    if (target === 0) return 0;
    return Math.round((actual / target) * 100);
  },

  // 獲取等級顏色
  getGradeColor: (percentage) => {
    if (percentage >= 90) return '#10B981'; // A級 - 綠色
    if (percentage >= 80) return '#3B82F6'; // B級 - 藍色
    if (percentage >= 70) return '#F59E0B'; // C級 - 黃色
    if (percentage >= 60) return '#F97316'; // D級 - 橘色
    return '#EF4444'; // E級 - 紅色
  },

  // 獲取等級名稱
  getGradeName: (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'E';
  },

  // 驗證檔案
  validateFile: (file) => {
    const errors = [];
    
    // 檢查檔案大小
    if (file.size > pointsConfig.fileUpload.maxSize) {
      errors.push(`檔案大小不能超過 ${pointsConfig.fileUpload.maxSize / 1024 / 1024}MB`);
    }
    
    // 檢查檔案類型
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    if (!pointsConfig.fileUpload.allowedTypes.includes(extension)) {
      errors.push(`不支援的檔案格式: ${extension}`);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
};
