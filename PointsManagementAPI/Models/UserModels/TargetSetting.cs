using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PointsManagementAPI.Models.UserModels
{
    public class TargetSetting
    {
        public int Id { get; set; }
        
        public int EmployeeId { get; set; }
        
        public int Year { get; set; }
        
        public int Month { get; set; }
        
        [Column(TypeName = "decimal(6,2)")]
        public decimal TargetPoints { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal MinimumPassingPercentage { get; set; } = 62m;
        
        [StringLength(1000)]
        public string? Notes { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties
        public virtual Employee Employee { get; set; } = null!;
    }
}
