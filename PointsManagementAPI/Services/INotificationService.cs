using PointsManagementAPI.Models.NotificationModels;

namespace PointsManagementAPI.Services
{
    /// <summary>
    /// 通知服務接口
    /// 提供通知的創建、查詢、標記已讀等功能
    /// </summary>
    public interface INotificationService
    {
        /// <summary>
        /// 創建新通知
        /// </summary>
        /// <param name="userId">接收用戶ID</param>
        /// <param name="title">通知標題</param>
        /// <param name="content">通知內容</param>
        /// <param name="type">通知類型</param>
        /// <param name="relatedEntityId">相關實體ID（可選）</param>
        /// <param name="relatedEntityType">相關實體類型（可選）</param>
        /// <param name="priority">優先級（可選，默認normal）</param>
        /// <returns>創建的通知</returns>
        Task<Notification> CreateNotificationAsync(
            int userId, 
            string title, 
            string content, 
            string type, 
            int? relatedEntityId = null,
            string? relatedEntityType = null,
            string priority = "normal"
        );

        /// <summary>
        /// 獲取用戶的通知列表
        /// </summary>
        /// <param name="userId">用戶ID</param>
        /// <param name="unreadOnly">是否只獲取未讀通知</param>
        /// <param name="limit">限制數量</param>
        /// <returns>通知列表</returns>
        Task<List<Notification>> GetUserNotificationsAsync(int userId, bool unreadOnly = false, int limit = 50);

        /// <summary>
        /// 標記通知為已讀
        /// </summary>
        /// <param name="notificationId">通知ID</param>
        /// <param name="userId">用戶ID（安全檢查）</param>
        /// <returns>是否成功</returns>
        Task<bool> MarkAsReadAsync(int notificationId, int userId);

        /// <summary>
        /// 標記用戶所有通知為已讀
        /// </summary>
        /// <param name="userId">用戶ID</param>
        /// <returns>標記為已讀的通知數量</returns>
        Task<int> MarkAllAsReadAsync(int userId);

        /// <summary>
        /// 獲取用戶未讀通知數量
        /// </summary>
        /// <param name="userId">用戶ID</param>
        /// <returns>未讀通知數量</returns>
        Task<int> GetUnreadCountAsync(int userId);

        /// <summary>
        /// 刪除舊通知（清理功能）
        /// </summary>
        /// <param name="olderThanDays">刪除多少天前的通知</param>
        /// <returns>刪除的通知數量</returns>
        Task<int> DeleteOldNotificationsAsync(int olderThanDays = 30);
    }
} 