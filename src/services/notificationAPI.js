import { getApiUrl } from '../config/apiConfig';

export const notificationAPI = {
  // 獲取用戶通知列表
  async getUserNotifications(userId, unreadOnly = false, limit = 50) {
    try {
      const params = new URLSearchParams();
      if (unreadOnly) params.append('unreadOnly', 'true');
      if (limit !== 50) params.append('limit', limit.toString());
      
      const url = getApiUrl(`/notification/user/${userId}${params.toString() ? '?' + params.toString() : ''}`);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`獲取通知失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('獲取用戶通知錯誤:', error);
      throw error;
    }
  },

  // 獲取用戶未讀通知數量
  async getUnreadCount(userId) {
    try {
      const response = await fetch(getApiUrl(`/notification/user/${userId}/unread-count`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`獲取未讀通知數量失敗: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.count;
    } catch (error) {
      console.error('獲取未讀通知數量錯誤:', error);
      throw error;
    }
  },

  // 標記通知為已讀
  async markAsRead(notificationId, userId) {
    try {
      const response = await fetch(getApiUrl(`/notification/${notificationId}/mark-read`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId
        })
      });

      if (!response.ok) {
        throw new Error(`標記通知已讀失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('標記通知已讀錯誤:', error);
      throw error;
    }
  },

  // 標記所有通知為已讀
  async markAllAsRead(userId) {
    try {
      const response = await fetch(getApiUrl(`/notification/user/${userId}/mark-all-read`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`標記所有通知已讀失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('標記所有通知已讀錯誤:', error);
      throw error;
    }
  },

  // 創建新通知（內部使用）
  async createNotification(notificationData) {
    try {
      const response = await fetch(getApiUrl('/notification'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationData)
      });

      if (!response.ok) {
        throw new Error(`創建通知失敗: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('創建通知錯誤:', error);
      throw error;
    }
  }
}; 