using System.ComponentModel.DataAnnotations;

namespace PointsManagementAPI.Models.PointsModels
{
    public class CalculationRule
    {
        public int Id { get; set; }
        
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500)]
        public string? Description { get; set; }
        
        [Required]
        [StringLength(50)]
        public string RuleType { get; set; } = string.Empty; // bonus, penalty, multiplier
        
        [StringLength(1000)]
        public string? Conditions { get; set; } // JSON format conditions
        
        public decimal Value { get; set; }
        
        public bool IsActive { get; set; } = true;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}
