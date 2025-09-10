import { getApiUrl } from '../config/apiConfig';

// 簡化的認證API服務
export const authAPI = {
  // 登入
  async login(credentials) {
    try {
      const response = await fetch(getApiUrl('/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error(`登入失敗: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('登入API錯誤:', error);
      throw error;
    }
  },

  // 註冊
  async register(userData) {
    try {
      const response = await fetch(getApiUrl('/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      if (!response.ok) {
        throw new Error(`註冊失敗: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('註冊API錯誤:', error);
      throw error;
    }
  },

  // 登出
  async logout() {
    try {
      const response = await fetch(getApiUrl('/auth/logout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn('登出API失敗，但繼續進行本地登出');
      }

      return { success: true };
    } catch (error) {
      console.error('登出API錯誤:', error);
      // 即使API失敗也返回成功，因為本地登出總是可以進行
      return { success: true };
    }
  },

  // 獲取部門列表
  async getDepartments() {
    try {
      const response = await fetch(getApiUrl('/auth/departments'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`獲取部門失敗: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      // 靜默處理網路連接錯誤，由上層組件處理用戶體驗
      // 只有真正的API錯誤（非連接問題）才記錄
      if (error.message !== 'Failed to fetch' && !error.name?.includes('TypeError')) {
        console.error('獲取部門API錯誤:', error);
      }
      // 保持原有的錯誤拋出行為，讓上層處理
      throw error;
    }
  },

  // 檢查職位可用性
  async checkPositionAvailability(position) {
    try {
      const response = await fetch(getApiUrl(`/auth/check-position/${encodeURIComponent(position)}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`檢查職位可用性失敗: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      // 連接錯誤時靜默處理，假設職位可用
      if (error.message === 'Failed to fetch') {
        console.warn('🔄 無法連接後端，跳過職位檢查');
        return { 
          data: { 
            isAvailable: true, 
            isExclusivePosition: false, 
            message: '無法驗證職位，請確保資料正確' 
          } 
        };
      }
      console.error('檢查職位可用性錯誤:', error);
      throw error;
    }
  },

  // 獲取用戶資料
  async getUserProfile() {
    try {
      const response = await fetch(getApiUrl('/auth/profile'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`獲取用戶資料失敗: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('獲取用戶資料API錯誤:', error);
      throw error;
    }
  }
};
export default authAPI; 
