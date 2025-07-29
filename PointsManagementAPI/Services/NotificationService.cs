using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Data;
using PointsManagementAPI.Models.NotificationModels;

namespace PointsManagementAPI.Services
{
    /// <summary>
    /// 通知服務實現
    /// </summary>
    public class NotificationService : INotificationService
    {
        private readonly PointsDbContext _context;
        private readonly ILogger<NotificationService> _logger;

        public NotificationService(PointsDbContext context, ILogger<NotificationService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 創建新通知
        /// </summary>
        public async Task<Notification> CreateNotificationAsync(
            int userId, 
            string title, 
            string content, 
            string type, 
            int? relatedEntityId = null,
            string? relatedEntityType = null,
            string priority = "normal")
        {
            try
            {
                var notification = new Notification
                {
                    UserId = userId,
                    Title = title,
                    Content = content,
                    Type = type,
                    RelatedEntityId = relatedEntityId,
                    RelatedEntityType = relatedEntityType,
                    Priority = priority,
                    CreatedAt = DateTime.UtcNow,
                    IsRead = false
                };

                _context.Notifications.Add(notification);
                await _context.SaveChangesAsync();

                _logger.LogInformation("創建通知成功: UserId={UserId}, Type={Type}, Title={Title}", 
                    userId, type, title);

                return notification;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "創建通知失敗: UserId={UserId}, Type={Type}", userId, type);
                throw;
            }
        }

        /// <summary>
        /// 獲取用戶的通知列表
        /// </summary>
        public async Task<List<Notification>> GetUserNotificationsAsync(int userId, bool unreadOnly = false, int limit = 50)
        {
            try
            {
                var query = _context.Notifications
                    .Where(n => n.UserId == userId);

                if (unreadOnly)
                {
                    query = query.Where(n => !n.IsRead);
                }

                var notifications = await query
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(limit)
                    .ToListAsync();

                return notifications;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取用戶通知失敗: UserId={UserId}", userId);
                return new List<Notification>();
            }
        }

        /// <summary>
        /// 標記通知為已讀
        /// </summary>
        public async Task<bool> MarkAsReadAsync(int notificationId, int userId)
        {
            try
            {
                var notification = await _context.Notifications
                    .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

                if (notification == null)
                {
                    _logger.LogWarning("通知不存在或無權限: NotificationId={NotificationId}, UserId={UserId}", 
                        notificationId, userId);
                    return false;
                }

                if (!notification.IsRead)
                {
                    notification.IsRead = true;
                    notification.ReadAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "標記通知已讀失敗: NotificationId={NotificationId}, UserId={UserId}", 
                    notificationId, userId);
                return false;
            }
        }

        /// <summary>
        /// 標記用戶所有通知為已讀
        /// </summary>
        public async Task<int> MarkAllAsReadAsync(int userId)
        {
            try
            {
                var unreadNotifications = await _context.Notifications
                    .Where(n => n.UserId == userId && !n.IsRead)
                    .ToListAsync();

                foreach (var notification in unreadNotifications)
                {
                    notification.IsRead = true;
                    notification.ReadAt = DateTime.UtcNow;
                }

                await _context.SaveChangesAsync();
                
                _logger.LogInformation("標記所有通知已讀: UserId={UserId}, Count={Count}", 
                    userId, unreadNotifications.Count);

                return unreadNotifications.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "標記所有通知已讀失敗: UserId={UserId}", userId);
                return 0;
            }
        }

        /// <summary>
        /// 獲取用戶未讀通知數量
        /// </summary>
        public async Task<int> GetUnreadCountAsync(int userId)
        {
            try
            {
                return await _context.Notifications
                    .CountAsync(n => n.UserId == userId && !n.IsRead);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取未讀通知數量失敗: UserId={UserId}", userId);
                return 0;
            }
        }

        /// <summary>
        /// 刪除舊通知（清理功能）
        /// </summary>
        public async Task<int> DeleteOldNotificationsAsync(int olderThanDays = 30)
        {
            try
            {
                var cutoffDate = DateTime.UtcNow.AddDays(-olderThanDays);
                var oldNotifications = await _context.Notifications
                    .Where(n => n.CreatedAt < cutoffDate)
                    .ToListAsync();

                if (oldNotifications.Any())
                {
                    _context.Notifications.RemoveRange(oldNotifications);
                    await _context.SaveChangesAsync();

                    _logger.LogInformation("刪除舊通知: Count={Count}, OlderThanDays={Days}", 
                        oldNotifications.Count, olderThanDays);
                }

                return oldNotifications.Count;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "刪除舊通知失敗: OlderThanDays={Days}", olderThanDays);
                return 0;
            }
        }
    }
} 