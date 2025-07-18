using System.ComponentModel.DataAnnotations;

namespace PointsManagementAPI.Models.PointsModels
{
    public class PointsCategory
    {
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Type { get; set; } = string.Empty; // general, professional, management, core

        [StringLength(500)]
        public string? Description { get; set; }

        [StringLength(20)]
        public string Color { get; set; } = "#3B82F6";

        public decimal Multiplier { get; set; } = 1.0m;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<StandardSetting> StandardSettings { get; set; } = new List<StandardSetting>();
    }
}
