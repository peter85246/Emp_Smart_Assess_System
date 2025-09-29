using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using PointsManagementAPI.Models.UserModels;

namespace PointsManagementAPI.Models.WorkLogModels
{
    public class WorkLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int EmployeeId { get; set; }

        [ForeignKey("EmployeeId")]
        public virtual Employee? Employee { get; set; }

        [Required]
        public DateTime LogDate { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; } = string.Empty;

        public string? Content { get; set; }

        public int? CategoryId { get; set; }

        [ForeignKey("CategoryId")]
        public virtual LogCategory? Category { get; set; }

        [StringLength(500)]
        public string? Tags { get; set; }

        public string? Attachments { get; set; } // JSON string

        [Column(TypeName = "decimal(5,2)")]
        public decimal PointsClaimed { get; set; }

        [StringLength(20)]
        public string Status { get; set; } = "submitted"; // submitted, reviewed, approved, rejected

        public int? ReviewedBy { get; set; }

        public DateTime? ReviewedAt { get; set; }

        public string? ReviewComments { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // �ק� UpdatedAt ���w�q�A��l�Ȭ� null
        public DateTime? UpdatedAt { get; set; } = null;

        // Helper property to work with attachments as list
        [NotMapped]
        public List<WorkLogAttachment> AttachmentsList
        {
            get
            {
                if (string.IsNullOrEmpty(Attachments))
                    return new List<WorkLogAttachment>();

                try
                {
                    var options = new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true,
                        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                    };
                    return JsonSerializer.Deserialize<List<WorkLogAttachment>>(Attachments, options) ?? new List<WorkLogAttachment>();
                }
                catch (JsonException ex)
                {
                    Console.WriteLine($"解析附件失敗: {ex.Message}");
                    Console.WriteLine($"原始附件數據: {Attachments}");
                    return new List<WorkLogAttachment>();
                }
            }
            set
            {
                var options = new JsonSerializerOptions
                {
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                    WriteIndented = false
                };
                Attachments = JsonSerializer.Serialize(value, options);
            }
        }

        // Helper property to work with tags as list
        [NotMapped]
        public List<string> TagsList
        {
            get => string.IsNullOrEmpty(Tags) 
                ? new List<string>() 
                : Tags.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(t => t.Trim()).ToList();
            set => Tags = string.Join(", ", value);
        }
    }

    public class WorkLogAttachment
    {
        public string id { get; set; } = string.Empty;
        public string name { get; set; } = string.Empty;
        public long size { get; set; }
        public string type { get; set; } = string.Empty;
        public string url { get; set; } = string.Empty;
        public DateTime uploadDate { get; set; }
        public bool isNew { get; set; }
        public object? file { get; set; }
    }


}
