using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PointsManagementAPI.Models.PointsModels
{
    public class StandardSetting
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string CategoryName { get; set; } = string.Empty;

        [Column(TypeName = "decimal(6,2)")]
        public decimal PointsValue { get; set; }

        [Required]
        [StringLength(50)]
        public string PointsType { get; set; } = "general"; // general, professional, management, temporary, misc

        [StringLength(50)]
        public string? SubCategory { get; set; }

        [StringLength(50)]
        public string? DepartmentFilter { get; set; }

        [StringLength(20)]
        public string InputType { get; set; } = "number"; // number, checkbox, file, text

        [StringLength(20)]
        public string? Unit { get; set; }

        [Column(TypeName = "decimal(3,2)")]
        public decimal StepValue { get; set; } = 1.0m;

        public string? Description { get; set; }

        public int SortOrder { get; set; } = 0;

        public string? CalculationFormula { get; set; }

        public int? PositionId { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // 保留舊的關聯屬性以維持向後相容性
        public int? ParentId { get; set; }

        [ForeignKey("ParentId")]
        public virtual StandardSetting? Parent { get; set; }

        public virtual ICollection<StandardSetting> Children { get; set; } = new List<StandardSetting>();

        public int? DepartmentId { get; set; }

        public virtual ICollection<PointsEntry> PointsEntries { get; set; } = new List<PointsEntry>();
    }
}
