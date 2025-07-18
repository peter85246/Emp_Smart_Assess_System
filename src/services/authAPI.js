import { API_CONFIG, getApiUrl } from '../config/apiConfig';

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
      console.error('獲取部門API錯誤:', error);
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