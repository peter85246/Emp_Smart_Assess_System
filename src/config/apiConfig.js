// API配置文件
export const API_CONFIG = {
  // 環境配置
  ENVIRONMENTS: {
    DEVELOPMENT: {
      BASE_URL: 'http://localhost:3000/api/v1',
      SYSTEM_TYPE: 'LOCAL_DEV',
      DATA_FORMAT: ['JSON', 'XML']
    },
    // 模擬外部ERP系統
    ERP_SYSTEM: {
      // 使用模擬的外部ERP系統IP
      BASE_URL: 'http://192.168.1.100:8080/erp-system/api',
      AUTH_TOKEN: 'erp-system-token-xxx',
      SYSTEM_TYPE: 'SAP_ERP',
      DATA_FORMAT: ['JSON', 'XML', 'CSV']
    },
    // 模擬其他外部系統
    EXTERNAL_HR: {
      BASE_URL: 'http://hr-system.company.com/api',
      AUTH_TOKEN: 'hr-system-token',
      SYSTEM_TYPE: 'HR_SYSTEM',
      DATA_FORMAT: ['JSON', 'XML'] // 支援的數據格式
    }
  },

  // 當前環境（可通過環境變量切換）
  CURRENT_ENV: process.env.REACT_APP_ENV || 'ERP_SYSTEM',

  // API端點配置
  ENDPOINTS: {
    // ERP系統特定端點
    ERP: {
      EMPLOYEE_PERFORMANCE: '/erp/employee-data',
      ATTENDANCE: '/erp/attendance',
      PRODUCTIVITY: '/erp/productivity'
    },
    // 一般端點
    PERFORMANCE: '/performance-evaluation/employees',
    HISTORICAL: '/historical-data/employees'
  },
  
  // API版本
  VERSION: 'v1',
  
  // 支持的數據格式
  FORMATS: {
    JSON: 'application/json',
    XML: 'application/xml',
    CSV: 'text/csv'
  }
}; 