using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PointsManagementAPI.Models
{
    public class FileAttachment
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        [StringLength(255)]
        public string FileName { get; set; } = string.Empty;
        
        [Required]
        [StringLength(255)]
        public string FilePath { get; set; } = string.Empty;
        
        [StringLength(100)]
        public string? ContentType { get; set; }
        
        public long FileSize { get; set; }
        
        [StringLength(50)]
        public string EntityType { get; set; } = string.Empty; // PointsEntry, WorkLog, etc.
        
        public int EntityId { get; set; }
        
        public int UploadedBy { get; set; }
        
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
        
        public bool IsActive { get; set; } = true;
    }
}
