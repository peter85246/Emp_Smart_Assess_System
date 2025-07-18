// 簡化的API配置文件
export const API_CONFIG = {
  // 基礎URL配置
  BASE_URL: 'http://localhost:5001/api',
  
  // 端點配置
  ENDPOINTS: {
    auth: {
      login: '/auth/login',
      logout: '/auth/logout',
      register: '/auth/register',
      refresh: '/auth/refresh',
      profile: '/auth/profile'
    },
    points: {
      submit: '/points/submit',
      employee: '/points/employee',
      pending: '/points/pending',
      approve: '/points/approve',
      reject: '/points/reject',
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