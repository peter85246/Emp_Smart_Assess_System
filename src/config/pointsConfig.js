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

  // 積分類型（全新184項分類架構）
  pointsTypes: {
    general: {
      name: '一般積分項目',
      color: '#10B981',
      description: '基本工作項目（80項）',
      subcategories: {
        manufacturing: {
          name: '製造部門',
          count: 22,
          departmentFilter: [1],
          color: '#059669',
          icon: '🏭'
        },
        quality_department: {
          name: '品質工程部門',
          count: 15,
          departmentFilter: [2],
          color: '#0D9488',
          icon: '🔬'
        },
        common: {
          name: '共同內容',
          count: 39,
          departmentFilter: [1,2,3,4],
          color: '#10B981',
          icon: '🤝'
        },
        core_competency: {
          name: '核心職能項目',
          count: 4,
          departmentFilter: [1,2,3,4],
          color: '#EF4444',
          icon: '⭐'
        }
      }
    },
    professional: {
      name: '專業積分項目',
      color: '#8B5CF6',
      description: '技術專業項目（79項）',
      subcategories: {
        technical_skills: {
          name: '專業技能項目',
          count: 31,
          departmentFilter: [1,2,3,4],
          color: '#8B5CF6',
          icon: '🔧'
        },
        professional_competency: {
          name: '專業職能項目',
          count: 48,
          departmentFilter: [3,4],
          color: '#7C3AED',
          icon: '💼'
        }
      }
    },
    management: {
      name: '管理積分項目',
      color: '#F59E0B',
      description: '管理職能項目（20項）',
      count: 20,
      departmentFilter: [3,4],
      icon: '👥'
    },
    temporary: {
      name: '臨時工作項目',
      color: '#06B6D4',
      description: '臨時性工作項目（3項）',
      count: 3,
      departmentFilter: [1,2,3,4],
      icon: '⏰'
    },
    misc: {
      name: '雜項事件',
      color: '#6B7280',
      description: '其他事件（2項）',
      count: 2,
      departmentFilter: [1,2,3,4],
      icon: '📝'
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

  // 部門設定（支援權限控制）
  departments: [
    { 
      id: 1, 
      name: '製造部',
      description: '負責產品製造生產',
      visibleItems: {
        general: ['manufacturing', 'common', 'core_competency'],
        professional: ['technical_skills'],
        temporary: true,
        misc: true
      }
    },
    { 
      id: 2, 
      name: '品質工程部',
      description: '負責品質管控和工程技術',
      visibleItems: {
        general: ['quality_department', 'common', 'core_competency'],
        professional: ['technical_skills'],
        temporary: true,
        misc: true
      }
    },
    { 
      id: 3, 
      name: '管理部',
      description: '負責公司管理事務',
      visibleItems: {
        general: ['common', 'core_competency'],
        professional: ['technical_skills', 'professional_competency'],
        management: true,
        temporary: true
      }
    },
    { 
      id: 4, 
      name: '業務部',
      description: '負責客戶關係和業務拓展',
      visibleItems: {
        general: ['common', 'core_competency'],
        professional: ['technical_skills', 'professional_competency'],
        management: true,
        temporary: true
      }
    }
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
    admin: '管理員',
    president: '總經理',
    boss: '董事長'
  },

  // 職位與角色對應表
  positionRoleMapping: {
    // 員工層級 - 基層作業人員
    '技術士': 'employee',
    '技術員': 'employee', 
    '品檢員': 'employee',
    '作業員': 'employee',
    
    // 主管層級 - 基層管理人員
    '組長': 'manager',
    '領班': 'manager',
    '副理': 'manager',
    '副課長': 'manager',
    '廠長': 'manager',
    '課長': 'manager',
    
    // 管理員層級 - 中高層管理
    '經理': 'admin',
    '協理': 'admin',
    '副總經理': 'admin',
    '執行長': 'admin',
    
    // 總經理層級 - 公司經營層
    '總經理': 'president',
    
    // 董事長層級 - 最高決策層
    '董事長': 'boss',
    '負責人': 'boss'
  },

  // 職位選項（按層級排序）
  positionOptions: [
    // 基層作業人員
    '技術士',
    '技術員', 
    '品檢員',
    '作業員',
    // 基層管理人員
    '組長',
    '領班',
    '副理',
    '副課長',
    '廠長',
    '課長',
    // 中高層管理
    '經理',
    '協理',
    '副總經理',
    '執行長',
    // 最高管理層
    '總經理',
    '董事長',
    '負責人'
  ]
};

// 部門權限工具函數
export const departmentUtils = {
  // 檢查用戶是否可以看到某個積分類別
  canViewCategory: (userDepartmentId, categoryType, subcategory = null) => {
    const department = pointsConfig.departments.find(d => d.id === userDepartmentId);
    if (!department) return false;

    const visibleItems = department.visibleItems;
    
    if (subcategory) {
      // 檢查子分類權限
      return visibleItems[categoryType] && 
             (Array.isArray(visibleItems[categoryType]) 
               ? visibleItems[categoryType].includes(subcategory)
               : visibleItems[categoryType] === true);
    } else {
      // 檢查主分類權限
      return visibleItems[categoryType] === true || 
             (Array.isArray(visibleItems[categoryType]) && visibleItems[categoryType].length > 0);
    }
  },

  // 獲取用戶可見的積分項目結構
  getVisiblePointsStructure: (userDepartmentId) => {
    const department = pointsConfig.departments.find(d => d.id === userDepartmentId);
    if (!department) return {};

    const visibleStructure = {};
    
    Object.entries(pointsConfig.pointsTypes).forEach(([categoryKey, categoryConfig]) => {
      if (department.visibleItems[categoryKey]) {
        visibleStructure[categoryKey] = { ...categoryConfig };
        
        // 處理子分類
        if (categoryConfig.subcategories) {
          visibleStructure[categoryKey].subcategories = {};
          
          if (Array.isArray(department.visibleItems[categoryKey])) {
            department.visibleItems[categoryKey].forEach(subKey => {
              if (categoryConfig.subcategories[subKey]) {
                visibleStructure[categoryKey].subcategories[subKey] = categoryConfig.subcategories[subKey];
              }
            });
          } else if (department.visibleItems[categoryKey] === true) {
            visibleStructure[categoryKey].subcategories = categoryConfig.subcategories;
          }
        }
      }
    });

    return visibleStructure;
  },

  // 計算用戶可見的總積分項目數
  getTotalVisibleItems: (userDepartmentId) => {
    const structure = departmentUtils.getVisiblePointsStructure(userDepartmentId);
    let total = 0;

    Object.values(structure).forEach(category => {
      if (category.subcategories) {
        Object.values(category.subcategories).forEach(subcategory => {
          total += subcategory.count || 0;
        });
      } else {
        total += category.count || 0;
      }
    });

    return total;
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
