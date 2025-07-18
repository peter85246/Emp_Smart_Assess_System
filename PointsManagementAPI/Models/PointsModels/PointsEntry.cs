using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using PointsManagementAPI.Models.UserModels;

namespace PointsManagementAPI.Models.PointsModels
{
    public class PointsEntry
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [ForeignKey("EmployeeId")]
        public virtual Employee? Employee { get; set; }

        [Required]
        public int StandardId { get; set; }

        [ForeignKey("StandardId")]
        public virtual StandardSetting Standard { get; set; } = null!;

        [Required]
        public DateTime EntryDate { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal PointsEarned { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal BasePoints { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal BonusPoints { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal PenaltyPoints { get; set; }

        [Column(TypeName = "decimal(3,2)")]
        public decimal PromotionMultiplier { get; set; } = 1.0m;

        public string? Description { get; set; }

        public string? EvidenceFiles { get; set; } // JSON string

        [StringLength(20)]
        public string Status { get; set; } = "pending"; // pending, approved, rejected

        [Column("ReviewedBy")]
        public int? ApprovedBy { get; set; }

        [Column("ReviewedAt")]
        public DateTime? ApprovedAt { get; set; }

        public string? ReviewComments { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Helper property to work with evidence files as list
        [NotMapped]
        public List<string> EvidenceFilesList
        {
            get => string.IsNullOrEmpty(EvidenceFiles) 
                ? new List<string>() 
                : JsonSerializer.Deserialize<List<string>>(EvidenceFiles) ?? new List<string>();
            set => EvidenceFiles = JsonSerializer.Serialize(value);
        }
    }
}
