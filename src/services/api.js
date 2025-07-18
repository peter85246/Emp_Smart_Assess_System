import { API_CONFIG, getApiUrl } from '../config/apiConfig';

// 簡化的API服務 - 主要用於PerformanceDashboard
class APIService {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
  }

  // 基本請求方法
  async request(endpoint, options = {}) {
    const url = getApiUrl(endpoint);
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API請求失敗 [${endpoint}]:`, error);
      throw error;
    }
  }

  // GET請求
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // POST請求
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // PUT請求
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // DELETE請求
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// 創建API實例
const apiService = new APIService();

// 模擬績效數據API (用於PerformanceDashboard)
export const performanceAPI = {
  // 獲取員工數據 (模擬數據)
  async getEmployeeData(employeeId, format = 'json') {
    console.log(`獲取員工數據: ${employeeId}, 格式: ${format}`);
    
    // 模擬員工績效數據
    const mockData = {
      employeeData: {
        [employeeId]: {
          workCompletion: 85,
          productQuality: 92,
          teamCollaboration: 78,
          innovationAbility: 88,
          attendanceRate: 95,
          safetyRecord: 100,
          name: employeeId === 'EMP001' ? '張三' : employeeId === 'EMP002' ? '李四' : '王五',
          department: '製造部',
          position: '技術員',
          joinDate: '2023-01-15'
        }
      }
    };

    // 模擬API延遲
    await new Promise(resolve => setTimeout(resolve, 500));

    if (format === 'xml') {
      // 模擬XML格式響應
      return {
        employeeData: {
          employee: mockData.employeeData[employeeId]
        }
      };
    }

    return mockData;
  },

  // 獲取績效統計 (模擬數據)
  async getPerformanceStats() {
    console.log('獲取績效統計數據');
    
    const mockStats = {
      totalEmployees: 156,
      averagePerformance: 87.5,
      topPerformers: 23,
      improvementNeeded: 12
    };

    await new Promise(resolve => setTimeout(resolve, 300));
    return mockStats;
  }
};

// 默認導出 - 保持向後兼容
const api = {
  defaults: {
    baseURL: API_CONFIG.BASE_URL
  },
  
  get: apiService.get.bind(apiService),
  post: apiService.post.bind(apiService),
  put: apiService.put.bind(apiService),
  delete: apiService.delete.bind(apiService),
  
  // 為了向後兼容，保留這些方法
  async getEmployeeData(employeeId, format) {
    return performanceAPI.getEmployeeData(employeeId, format);
  }
};

export default api;
