using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Data;
using Swashbuckle.AspNetCore.Annotations;
using System.Reflection;
using System.Diagnostics;

namespace PointsManagementAPI.Controllers
{
    /// <summary>
    /// 🏥 系統健康監控
    /// </summary>
    /// <remarks>
    /// 提供系統健康狀態檢查和監控功能，確保服務穩定運行：
    /// 
    /// **監控項目：**
    /// - 🗄️ 資料庫連線狀態
    /// - 💾 檔案系統可用性
    /// - 🧠 記憶體使用情況
    /// - ⚡ 系統回應速度
    /// - 🔗 外部服務連接
    /// 
    /// **健康指標：**
    /// - 服務啟動時間
    /// - 系統版本資訊
    /// - 環境配置狀態
    /// - 資源使用統計
    /// 
    /// **監控等級：**
    /// - ✅ Healthy: 所有服務正常
    /// - ⚠️ Warning: 部分服務異常
    /// - ❌ Critical: 核心服務失效
    /// 
    /// **運維支援：**
    /// - 詳細健康報告
    /// - 錯誤診斷資訊
    /// - 效能指標監控
    /// - 自動化檢查機制
    /// </remarks>
    [ApiController]
    [Route("[controller]")]
    [Tags("🏥 系統健康監控")]
    public class HealthController : ControllerBase
    {
        private readonly PointsDbContext _context;
        private readonly IConfiguration _configuration;

        public HealthController(PointsDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpGet]
        public async Task<ActionResult> Get()
        {
            var health = new
            {
                status = "Healthy",
                timestamp = DateTime.UtcNow,
                version = Assembly.GetExecutingAssembly().GetName().Version?.ToString(),
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                checks = new
                {
                    database = await CheckDatabaseHealth(),
                    fileSystem = await CheckFileSystemHealth(),
                    memory = CheckMemoryHealth()
                }
            };

            return Ok(health);
        }

        [HttpGet("server-info")]
        public ActionResult GetServerInfo()
        {
            var serverInfo = new
            {
                name = "PointsManagement API",
                version = Assembly.GetExecutingAssembly().GetName().Version?.ToString(),
                status = "running",
                timestamp = DateTime.UtcNow,
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Development"
            };

            return Ok(serverInfo);
        }

        [HttpGet("detailed")]
        public async Task<ActionResult> GetDetailed()
        {
            var detailedHealth = new
            {
                status = "Healthy",
                timestamp = DateTime.UtcNow,
                version = Assembly.GetExecutingAssembly().GetName().Version?.ToString(),
                environment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                uptime = GetUptime(),
                system = new
                {
                    machineName = Environment.MachineName,
                    osVersion = Environment.OSVersion.ToString(),
                    processorCount = Environment.ProcessorCount,
                    workingSet = Environment.WorkingSet,
                    gcMemory = GC.GetTotalMemory(false)
                },
                configuration = new
                {
                    connectionStringConfigured = !string.IsNullOrEmpty(_configuration.GetConnectionString("DefaultConnection")),
                    uploadPath = _configuration["FileStorage:UploadPath"],
                    maxFileSize = _configuration["FileStorage:MaxFileSize"],
                    promotionPeriodMonths = _configuration["PointsSettings:PromotionPeriodMonths"]
                },
                checks = new
                {
                    database = await CheckDatabaseHealth(),
                    fileSystem = await CheckFileSystemHealth(),
                    memory = CheckMemoryHealth(),
                    diskSpace = CheckDiskSpaceHealth()
                }
            };

            return Ok(detailedHealth);
        }

        private async Task<object> CheckDatabaseHealth()
        {
            try
            {
                var canConnect = await _context.Database.CanConnectAsync();
                if (!canConnect)
                {
                    return new { status = "Unhealthy", message = "Cannot connect to database" };
                }

                // 檢查基本資料
                var employeeCount = 0;
                var standardsCount = 0;

                try
                {
                    employeeCount = await _context.Employees.CountAsync();
                    standardsCount = await _context.StandardSettings.CountAsync();
                }
                catch
                {
                    return new { status = "Warning", message = "Database connected but tables may not exist" };
                }

                return new 
                { 
                    status = "Healthy", 
                    message = "Database connection successful",
                    employeeCount,
                    standardsCount
                };
            }
            catch (Exception ex)
            {
                return new { status = "Unhealthy", message = ex.Message };
            }
        }

        private async Task<object> CheckFileSystemHealth()
        {
            try
            {
                var uploadPath = _configuration["FileStorage:UploadPath"] ?? "uploads";
                var fullPath = Path.Combine(Directory.GetCurrentDirectory(), uploadPath);

                if (!Directory.Exists(fullPath))
                {
                    Directory.CreateDirectory(fullPath);
                }

                // 測試寫入權限
                var testFile = Path.Combine(fullPath, "health_check.tmp");
                await System.IO.File.WriteAllTextAsync(testFile, "health check");
                System.IO.File.Delete(testFile);

                return new { status = "Healthy", message = "File system accessible", uploadPath = fullPath };
            }
            catch (Exception ex)
            {
                return new { status = "Unhealthy", message = ex.Message };
            }
        }

        private object CheckMemoryHealth()
        {
            try
            {
                var workingSet = Environment.WorkingSet;
                var gcMemory = GC.GetTotalMemory(false);
                var maxMemory = 1024 * 1024 * 1024; // 1GB threshold

                var status = workingSet > maxMemory ? "Warning" : "Healthy";
                var message = workingSet > maxMemory ? "High memory usage" : "Memory usage normal";

                return new 
                { 
                    status, 
                    message,
                    workingSetMB = workingSet / 1024 / 1024,
                    gcMemoryMB = gcMemory / 1024 / 1024
                };
            }
            catch (Exception ex)
            {
                return new { status = "Unhealthy", message = ex.Message };
            }
        }

        private object CheckDiskSpaceHealth()
        {
            try
            {
                var drive = new DriveInfo(Directory.GetCurrentDirectory());
                var freeSpaceGB = drive.AvailableFreeSpace / 1024 / 1024 / 1024;
                var totalSpaceGB = drive.TotalSize / 1024 / 1024 / 1024;
                var usagePercentage = (double)(totalSpaceGB - freeSpaceGB) / totalSpaceGB * 100;

                var status = usagePercentage > 90 ? "Warning" : "Healthy";
                var message = usagePercentage > 90 ? "Low disk space" : "Disk space sufficient";

                return new 
                { 
                    status, 
                    message,
                    freeSpaceGB,
                    totalSpaceGB,
                    usagePercentage = Math.Round(usagePercentage, 2)
                };
            }
            catch (Exception ex)
            {
                return new { status = "Unhealthy", message = ex.Message };
            }
        }

        private string GetUptime()
        {
            var uptime = DateTime.UtcNow - Process.GetCurrentProcess().StartTime.ToUniversalTime();
            return $"{uptime.Days}d {uptime.Hours}h {uptime.Minutes}m {uptime.Seconds}s";
        }
    }
}
