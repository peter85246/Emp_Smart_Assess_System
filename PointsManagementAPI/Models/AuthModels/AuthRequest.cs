using System.ComponentModel.DataAnnotations;

namespace PointsManagementAPI.Models.AuthModels
{
    public class LoginRequest
    {
        [Required]
        public string EmployeeNumber { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
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

        [Required]
        [StringLength(20)]
        public string Role { get; set; } = "employee";

        [Required]
        [StringLength(100, MinimumLength = 6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [Compare("Password")]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public UserInfo User { get; set; } = new UserInfo();
    }

    public class UserInfo
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string EmployeeNumber { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Position { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public bool IsFirstLogin { get; set; }
    }

    public class ApprovalRequest
    {
        public int ApproverId { get; set; }
        public string? Comments { get; set; }
    }

    public class RejectRequest
    {
        public int RejectedBy { get; set; }
        public string Reason { get; set; } = string.Empty;
    }

    public class ResetPasswordRequest
    {
        public string EmployeeNumber { get; set; } = string.Empty;
        public string? NewPassword { get; set; } // 可選，默認為123456
    }
} 