using System.ComponentModel.DataAnnotations;

namespace PointsManagementAPI.Models.WorkLogModels
{
    public class LogCategory
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [StringLength(20)]
        public string Color { get; set; } = "#6B7280";
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public virtual ICollection<WorkLog> WorkLogs { get; set; } = new List<WorkLog>();
    }
}
