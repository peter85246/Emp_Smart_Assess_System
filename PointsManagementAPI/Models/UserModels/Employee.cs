using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using PointsManagementAPI.Models.PointsModels;
using PointsManagementAPI.Models.WorkLogModels;

namespace PointsManagementAPI.Models.UserModels
{
    public class Employee
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string EmployeeNumber { get; set; } = string.Empty;

        [StringLength(100)]
        public string? Email { get; set; }

        public int DepartmentId { get; set; }

        [StringLength(50)]
        public string Position { get; set; } = string.Empty;

        [StringLength(20)]
        public string Role { get; set; } = "employee"; // employee, manager, admin

        public bool IsActive { get; set; } = true;

        public DateTime HireDate { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // 認證相關欄位
        [Required]
        [StringLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        public DateTime? LastLoginAt { get; set; }

        public bool IsFirstLogin { get; set; } = true;

        // Navigation properties
        [ForeignKey("DepartmentId")]
        public virtual Department? Department { get; set; }

        public virtual ICollection<PointsEntry> PointsEntries { get; set; } = new List<PointsEntry>();
        public virtual ICollection<WorkLog> WorkLogs { get; set; } = new List<WorkLog>();
        public virtual ICollection<TargetSetting> TargetSettings { get; set; } = new List<TargetSetting>();
    }
}
