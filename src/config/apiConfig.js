/**
 * API配置檔案 - 集中管理所有API端點和配置
 * 功能：統一管理API基礎URL、端點路徑、請求配置
 * 使用：所有API服務模組的基礎配置來源
 * 
 * 配置項目：
 * - BASE_URL: 後端API的基礎URL
 * - ENDPOINTS: 所有API端點的路徑定義
 * - 超時設定、重試邏輯等配置
 */
// 報工系統API配置
export const REPORT_API = {
  BASE_URL: 'http://127.0.0.1:7117/api',
  ENDPOINTS: {
    // KPI概覽API
    kpiOverviewYear: '/AREditior/KPIOverviewByYear',  // 年度KPI概覽 - 參數: year (number)
    kpiOverviewMonth: '/AREditior/KPIOverviewByMonthDays',
    // 獲取員工列表
    employees: '/AREditior/GetAllUserinfoByFilter'
  },
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

export const API_CONFIG = {
  // 基礎URL配置 - 後端API服務地址 (後端運行Port修改處)
  BASE_URL: 'https://localhost:7001/api',
  
  // API端點配置 - 按功能模組分類組織
  ENDPOINTS: {
    // 認證相關端點 - 用戶登入、註冊、權限管理
    auth: {
      login: '/auth/login',          // 用戶登入
      logout: '/auth/logout',        // 用戶登出
      register: '/auth/register',    // 用戶註冊
      refresh: '/auth/refresh',      // Token刷新
      profile: '/auth/profile',      // 用戶檔案
      departments: '/auth/departments' // 部門列表
    },
    // 積分管理端點 - 積分提交、查詢、審核
    points: {
      submit: '/points/submit',      // 單項積分提交
      employee: '/points/employee',  // 員工積分查詢
      pending: '/points/pending',    // 待審核項目查詢
      approve: '/points/approve',    // 積分審核通過
      reject: '/points/reject',      // 積分審核拒絕
      summary: '/points/summary',
      batch: '/points/batch'
    },
    worklog: {
      create: '/worklog',
      update: '/worklog',
      delete: '/worklog',
      employee: '/worklog/employee',
      list: '/worklog'
    },
    standards: {
      list: '/standards',
      create: '/standards',
      update: '/standards',
      delete: '/standards'
    },
    fileUpload: {
      upload: '/fileupload/upload',
      download: '/fileupload/download'
    },
    health: '/Health'
  },

  // 請求配置
  REQUEST_CONFIG: {
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  },

  // 分頁配置
  PAGINATION: {
    defaultPageSize: 10,
    maxPageSize: 100
  }
};

// 獲取完整的API端點URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// 獲取特定分類的端點
export const getEndpoint = (category, action) => {
  return API_CONFIG.ENDPOINTS[category]?.[action] || '';
};

// 檢查API可用性的簡單函數
export const checkApiHealth = async () => {
  try {
    const response = await fetch(getApiUrl(API_CONFIG.ENDPOINTS.health));
    return response.ok;
  } catch (error) {
    console.error('API健康檢查失敗:', error);
    return false;
  }
};

export default API_CONFIG; 