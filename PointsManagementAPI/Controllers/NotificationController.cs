using Microsoft.AspNetCore.Mvc;
using PointsManagementAPI.Services;
using PointsManagementAPI.Models.NotificationModels;
using Swashbuckle.AspNetCore.Annotations;

namespace PointsManagementAPI.Controllers
{
    /// <summary>
    /// 🔔 通知訊息管理
    /// </summary>
    /// <remarks>
    /// 處理系統內各種通知訊息的發送、接收和管理：
    /// 
    /// **通知類型：**
    /// - 📬 積分審核通知（通過/駁回）
    /// - 🎯 任務指派通知
    /// - ⏰ 截止日期提醒
    /// - 🏆 成就達成通知
    /// - 📊 統計報表通知
    /// 
    /// **發送方式：**
    /// - 系統內即時通知
    /// - 電子郵件通知
    /// - 手機推播通知
    /// - 瀏覽器桌面通知
    /// 
    /// **管理功能：**
    /// - 通知歷史查詢
    /// - 已讀狀態管理
    /// - 通知偏好設定
    /// - 批量操作處理
    /// 
    /// **智能特色：**
    /// - 通知去重機制
    /// - 優先級排序
    /// - 自動失效清理
    /// - 個人化推薦
    /// </remarks>
    [ApiController]
    [Route("api/[controller]")]
    [Tags("🔔 通知訊息管理")]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly ILogger<NotificationController> _logger;

        public NotificationController(INotificationService notificationService, ILogger<NotificationController> logger)
        {
            _notificationService = notificationService;
            _logger = logger;
        }

        /// <summary>
        /// 獲取用戶通知列表
        /// </summary>
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<List<Notification>>> GetUserNotifications(int userId, [FromQuery] bool unreadOnly = false, [FromQuery] int limit = 50)
        {
            try
            {
                var notifications = await _notificationService.GetUserNotificationsAsync(userId, unreadOnly, limit);
                return Ok(notifications);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取用戶通知失敗: UserId={UserId}", userId);
                return StatusCode(500, new { message = "獲取通知失敗" });
            }
        }

        /// <summary>
        /// 獲取用戶未讀通知數量
        /// </summary>
        [HttpGet("user/{userId}/unread-count")]
        public async Task<ActionResult<int>> GetUnreadCount(int userId)
        {
            try
            {
                var count = await _notificationService.GetUnreadCountAsync(userId);
                return Ok(new { count = count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取未讀通知數量失敗: UserId={UserId}", userId);
                return StatusCode(500, new { message = "獲取未讀通知數量失敗" });
            }
        }

        /// <summary>
        /// 標記通知為已讀
        /// </summary>
        [HttpPost("{notificationId}/mark-read")]
        public async Task<ActionResult> MarkAsRead(int notificationId, [FromBody] MarkReadRequest request)
        {
            try
            {
                var success = await _notificationService.MarkAsReadAsync(notificationId, request.UserId);
                if (success)
                {
                    return Ok(new { message = "通知已標記為已讀" });
                }
                else
                {
                    return NotFound(new { message = "通知不存在或無權限" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "標記通知已讀失敗: NotificationId={NotificationId}", notificationId);
                return StatusCode(500, new { message = "標記通知已讀失敗" });
            }
        }

        /// <summary>
        /// 標記用戶所有通知為已讀
        /// </summary>
        [HttpPost("user/{userId}/mark-all-read")]
        public async Task<ActionResult> MarkAllAsRead(int userId)
        {
            try
            {
                var count = await _notificationService.MarkAllAsReadAsync(userId);
                return Ok(new { message = $"已標記 {count} 個通知為已讀" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "標記所有通知已讀失敗: UserId={UserId}", userId);
                return StatusCode(500, new { message = "標記所有通知已讀失敗" });
            }
        }

        /// <summary>
        /// 創建新通知（內部API，通常由其他服務調用）
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<Notification>> CreateNotification([FromBody] CreateNotificationRequest request)
        {
            try
            {
                var notification = await _notificationService.CreateNotificationAsync(
                    request.UserId,
                    request.Title,
                    request.Content,
                    request.Type,
                    request.RelatedEntityId,
                    request.RelatedEntityType,
                    request.Priority
                );

                return CreatedAtAction(nameof(GetUserNotifications), new { userId = notification.UserId }, notification);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "創建通知失敗: UserId={UserId}", request.UserId);
                return StatusCode(500, new { message = "創建通知失敗" });
            }
        }
    }

    /// <summary>
    /// 標記已讀請求模型
    /// </summary>
    public class MarkReadRequest
    {
        public int UserId { get; set; }
    }

    /// <summary>
    /// 創建通知請求模型
    /// </summary>
    public class CreateNotificationRequest
    {
        public int UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public int? RelatedEntityId { get; set; }
        public string? RelatedEntityType { get; set; }
        public string Priority { get; set; } = "normal";
    }
} 