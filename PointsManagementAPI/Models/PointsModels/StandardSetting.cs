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

        public int? ParentId { get; set; }

        [ForeignKey("ParentId")]
        public virtual StandardSetting? Parent { get; set; }

        public virtual ICollection<StandardSetting> Children { get; set; } = new List<StandardSetting>();

        public int? DepartmentId { get; set; }

        public int? PositionId { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal? PointsValue { get; set; }

        public string? CalculationFormula { get; set; }

        [StringLength(20)]
        public string InputType { get; set; } = "number"; // number, checkbox, file, text

        [StringLength(20)]
        public string PointsType { get; set; } = "general"; // general, professional, management, core

        public string? Description { get; set; }

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<PointsEntry> PointsEntries { get; set; } = new List<PointsEntry>();
    }
}
