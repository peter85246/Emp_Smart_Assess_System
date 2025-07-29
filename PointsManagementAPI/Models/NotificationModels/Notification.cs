using System.ComponentModel.DataAnnotations;

namespace PointsManagementAPI.Models.NotificationModels
{
    /// <summary>
    /// 通知實體模型
    /// </summary>
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        /// <summary>
        /// 接收通知的用戶ID
        /// </summary>
        public int UserId { get; set; }

        /// <summary>
        /// 通知標題
        /// </summary>
        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        /// <summary>
        /// 通知內容
        /// </summary>
        [Required]
        [StringLength(1000)]
        public string Content { get; set; } = string.Empty;

        /// <summary>
        /// 通知類型（points_submitted, points_approved, points_rejected, system_notice）
        /// </summary>
        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// 相關實體ID（如積分記錄ID）
        /// </summary>
        public int? RelatedEntityId { get; set; }

        /// <summary>
        /// 相關實體類型（PointsEntry, WorkLog等）
        /// </summary>
        [StringLength(50)]
        public string? RelatedEntityType { get; set; }

        /// <summary>
        /// 是否已讀
        /// </summary>
        public bool IsRead { get; set; } = false;

        /// <summary>
        /// 通知創建時間
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// 通知讀取時間
        /// </summary>
        public DateTime? ReadAt { get; set; }

        /// <summary>
        /// 通知優先級（low, normal, high, urgent）
        /// </summary>
        [StringLength(20)]
        public string Priority { get; set; } = "normal";
    }
} 