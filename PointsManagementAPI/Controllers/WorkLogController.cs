using Microsoft.AspNetCore.Mvc;
using PointsManagementAPI.Models.WorkLogModels;
using PointsManagementAPI.Services;
using Swashbuckle.AspNetCore.Annotations;

namespace PointsManagementAPI.Controllers
{
    /// <summary>
    /// 📝 工作日誌記錄
    /// </summary>
    /// <remarks>
    /// 管理員工工作日誌的完整生命週期，支援詳細的工作記錄追蹤：
    /// 
    /// **核心功能：**
    /// - ✍️ 工作日誌創建與編輯
    /// - 🔍 多條件日誌查詢
    /// - 📊 工作統計分析
    /// - 👥 團隊日誌管理
    /// - 📁 附件檔案關聯
    /// 
    /// **記錄內容：**
    /// - 工作項目描述
    /// - 時間記錄（開始/結束）
    /// - 工作類別分類
    /// - 成果產出說明
    /// - 問題與解決方案
    /// 
    /// **管理機制：**
    /// - 分類標籤管理
    /// - 審核流程控制
    /// - 權限存取控制
    /// - 數據匯出功能
    /// 
    /// **整合功能：**
    /// - 與積分系統連動
    /// - 績效評估數據源
    /// - 專案進度追蹤
    /// </remarks>
    [ApiController]
    [Route("api/[controller]")]
    [Tags("📝 工作日誌記錄")]
    public class WorkLogController : ControllerBase
    {
        private readonly IWorkLogService _workLogService;

        /// <summary>
        /// 工作日誌控制器建構函數
        /// </summary>
        /// <param name="workLogService">工作日誌業務邏輯服務</param>
        public WorkLogController(IWorkLogService workLogService)
        {
            _workLogService = workLogService;
        }

        /// <summary>
        /// 【GET】 /api/worklog/employee/{employeeId} - 獲取指定員工的工作日誌
        /// 功能：查詢員工的工作日誌記錄，支援日期範圍篩選
        /// 前端使用：WorkLogEntry組件載入員工的工作日誌列表
        /// </summary>
        /// <param name="employeeId">員工ID</param>
        /// <param name="startDate">開始日期（可選）</param>
        /// <param name="endDate">結束日期（可選）</param>
        /// <returns>工作日誌列表</returns>
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<List<WorkLog>>> GetEmployeeWorkLogs(
            int employeeId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var workLogs = await _workLogService.GetWorkLogsByEmployeeAsync(employeeId, startDate, endDate);
            return Ok(workLogs);
        }

        /// <summary>
        /// 【GET】 /api/worklog/attendance/{employeeName} - 獲取員工出勤率數據
        /// 功能：計算員工指定月份的工作日誌填寫出勤率
        /// 前端使用：PerformanceDashboard組件計算差勤紀錄指標
        /// </summary>
        /// <param name="employeeName">員工姓名</param>
        /// <param name="year">年份</param>
        /// <param name="month">月份</param>
        /// <returns>出勤率數據</returns>
        [HttpGet("attendance/{employeeName}")]
        public async Task<ActionResult<object>> GetEmployeeAttendance(
            string employeeName,
            [FromQuery] int year,
            [FromQuery] int month)
        {
            try
            {
                var attendanceData = await _workLogService.GetEmployeeAttendanceByNameAsync(employeeName, year, month);
                return Ok(attendanceData);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("department/{departmentId}")]
        public async Task<ActionResult<List<WorkLog>>> GetDepartmentWorkLogs(
            int departmentId,
            [FromQuery] DateTime? startDate,
            [FromQuery] DateTime? endDate)
        {
            var workLogs = await _workLogService.GetWorkLogsByDepartmentAsync(departmentId, startDate, endDate);
            return Ok(workLogs);
        }

        [HttpGet("search")]
        public async Task<ActionResult<List<WorkLog>>> SearchWorkLogs(
            [FromQuery] string searchTerm,
            [FromQuery] int? employeeId,
            [FromQuery] string? category)
        {
            var workLogs = await _workLogService.SearchWorkLogsAsync(searchTerm, employeeId, category);
            return Ok(workLogs);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<WorkLog>> GetWorkLog(int id)
        {
            var workLog = await _workLogService.GetWorkLogByIdAsync(id);
            if (workLog == null)
                return NotFound();

            return Ok(workLog);
        }

        [HttpPost]
        public async Task<ActionResult<object>> CreateWorkLog([FromBody] WorkLog workLog)
        {
            try
            {
                // 基本驗證
                if (workLog == null)
                    return BadRequest(new { message = "工作日誌數據不能為空" });

                if (workLog.EmployeeId <= 0)
                    return BadRequest(new { message = "員工ID無效" });

                if (string.IsNullOrEmpty(workLog.Title))
                    return BadRequest(new { message = "標題不能為空" });

                // 處理日期
                if (workLog.LogDate == default)
                    workLog.LogDate = DateTime.UtcNow;

                // 處理分類
                if (!workLog.CategoryId.HasValue || workLog.CategoryId <= 0)
                    workLog.CategoryId = 6; // 預設使用"其他事項"分類

                try
                {
                    var createdWorkLog = await _workLogService.CreateWorkLogAsync(workLog);
                    
                    // 返回不包含循環引用的簡化對象
                    var result = new
                    {
                        id = createdWorkLog.Id,
                        employeeId = createdWorkLog.EmployeeId,
                        title = createdWorkLog.Title,
                        content = createdWorkLog.Content,
                        categoryId = createdWorkLog.CategoryId,
                        logDate = createdWorkLog.LogDate,
                        status = createdWorkLog.Status,
                        pointsClaimed = createdWorkLog.PointsClaimed,
                        tags = createdWorkLog.Tags,
                        attachments = createdWorkLog.Attachments,
                        createdAt = createdWorkLog.CreatedAt,
                        updatedAt = createdWorkLog.UpdatedAt,
                        categoryName = createdWorkLog.Category?.Name
                    };

                    return CreatedAtAction(nameof(GetWorkLog), new { id = result.id }, result);
                }
                catch (Exception ex)
                {
                    // 記錄詳細錯誤信息
                    Console.WriteLine($"創建工作日誌時發生錯誤: {ex.Message}");
                    Console.WriteLine($"堆疊追蹤: {ex.StackTrace}");
                    if (ex.InnerException != null)
                    {
                        Console.WriteLine($"內部錯誤: {ex.InnerException.Message}");
                        Console.WriteLine($"內部堆疊追蹤: {ex.InnerException.StackTrace}");
                    }

                    return BadRequest(new { 
                        message = "創建工作日誌失敗",
                        error = ex.Message,
                        innerError = ex.InnerException?.Message,
                        details = ex.StackTrace
                    });
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"處理請求時發生錯誤: {ex.Message}");
                return BadRequest(new { message = "處理請求時發生錯誤", error = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<object>> UpdateWorkLog(int id, [FromBody] WorkLog workLog)
        {
            try
            {
                if (id != workLog.Id)
                    return BadRequest(new { message = "ID不匹配" });

                var updatedWorkLog = await _workLogService.UpdateWorkLogAsync(workLog);
                
                // 返回不包含循環引用的簡化對象
                var result = new
                {
                    id = updatedWorkLog.Id,
                    employeeId = updatedWorkLog.EmployeeId,
                    title = updatedWorkLog.Title,
                    content = updatedWorkLog.Content,
                    categoryId = updatedWorkLog.CategoryId,
                    logDate = updatedWorkLog.LogDate,
                    status = updatedWorkLog.Status,
                    pointsClaimed = updatedWorkLog.PointsClaimed,
                    tags = updatedWorkLog.Tags,
                    attachments = updatedWorkLog.Attachments,
                    createdAt = updatedWorkLog.CreatedAt,
                    updatedAt = updatedWorkLog.UpdatedAt,
                    categoryName = updatedWorkLog.Category?.Name
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"更新工作日誌時發生錯誤: {ex.Message}");
                Console.WriteLine($"堆疊追蹤: {ex.StackTrace}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"內部錯誤: {ex.InnerException.Message}");
                    Console.WriteLine($"內部堆疊追蹤: {ex.InnerException.StackTrace}");
                }

                return BadRequest(new { 
                    message = "更新工作日誌失敗",
                    error = ex.Message,
                    innerError = ex.InnerException?.Message,
                    details = ex.StackTrace
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteWorkLog(int id)
        {
            var result = await _workLogService.DeleteWorkLogAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }

[HttpPost("{id}/review")]
public async Task<ActionResult<WorkLog>> ReviewWorkLog(int id, [FromBody] ReviewRequest request)
{
    try
    {
        if (id <= 0)
            return BadRequest(new { message = "無效的工作日誌ID" });

        if (string.IsNullOrEmpty(request.Status))
            return BadRequest(new { message = "審核狀態不能為空" });

        if (request.ReviewerId <= 0)
            return BadRequest(new { message = "審核者ID無效" });

        Console.WriteLine($"審核工作日誌 ID: {id}, 狀態: {request.Status}, 審核者: {request.ReviewerId}");

        var workLog = await _workLogService.GetWorkLogByIdAsync(id);
        if (workLog == null)
            return NotFound(new { message = "找不到工作日誌" });

        // 檢查是否可以審核
        if (workLog.Status != "submitted" && workLog.Status != "edit_pending")
            return BadRequest(new { message = "此工作日誌當前狀態不可審核" });

        var reviewedWorkLog = await _workLogService.ReviewWorkLogAsync(
            id, request.ReviewerId, request.Status, request.Comments);

        var result = new
        {
            id = reviewedWorkLog.Id,
            status = reviewedWorkLog.Status,
            message = reviewedWorkLog.Status == "approved" ? 
                "工作日誌審核通過" : "工作日誌已拒絕",
            reviewComments = reviewedWorkLog.ReviewComments
        };

        return Ok(result);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"審核工作日誌錯誤: {ex.Message}");
        return BadRequest(new { message = "審核失敗", error = ex.Message });
    }
}

        /// <summary>
        /// 【GET】 /api/worklog/daily-count - 獲取員工當月填寫日誌天數
        /// 功能：計算員工指定月份的工作日誌填寫天數（去重）
        /// 前端使用：PerformanceDashboard組件計算出勤率
        /// </summary>
        /// <param name="employeeId">員工ID</param>
        /// <param name="year">年份</param>
        /// <param name="month">月份</param>
        /// <returns>填寫天數和工作天數</returns>
        [HttpGet("daily-count")]
        public async Task<ActionResult> GetWorkLogDaysCount(
            [FromQuery] int employeeId,
            [FromQuery] int year,
            [FromQuery] int month)
        {
            try
            {
                var filledDays = await _workLogService.GetWorkLogDaysCountAsync(employeeId, year, month);
                var workDays = GetWorkDaysInMonth(year, month);

                return Ok(new { filledDays, workDays });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// 【GET】 /api/worklog/approval-list - 獲取待審核工作日誌列表
        /// 功能：分頁查詢待審核的工作日誌，支援關鍵字和狀態篩選
        /// 前端使用：管理員審核介面
        /// </summary>
        /// <param name="page">頁碼</param>
        /// <param name="pageSize">每頁數量</param>
        /// <param name="keyword">關鍵字</param>
        /// <param name="status">狀態</param>
        /// <param name="startDate">開始日期</param>
        /// <param name="endDate">結束日期</param>
        /// <returns>分頁的工作日誌列表</returns>
        [HttpGet("approval-list")]
        public async Task<ActionResult> GetApprovalList(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string keyword = "",
            [FromQuery] string status = "",
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var workLogs = await _workLogService.GetWorkLogsForApprovalAsync(
                    page, pageSize, keyword, status, startDate, endDate);

                return Ok(workLogs);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// 【POST】 /api/worklog/{id}/approval - 審核工作日誌
        /// 功能：管理員審核工作日誌，設置狀態和評論
        /// 前端使用：管理員審核介面
        /// </summary>
        /// <param name="id">工作日誌ID</param>
        /// <param name="request">審核請求</param>
        /// <returns>審核結果</returns>
        [HttpPost("{id}/approval")]
        public async Task<ActionResult> ApproveWorkLog(int id, [FromBody] ReviewRequest request)
        {
            try
            {
                var workLog = await _workLogService.GetWorkLogByIdAsync(id);
                if (workLog == null)
                    return NotFound();

                workLog.Status = request.Status;
                workLog.ReviewComments = request.Comments;
                workLog.ReviewedAt = DateTime.UtcNow;
                // 這裡需要設置 ReviewedBy，可以從 JWT token 或 session 中獲取

                await _workLogService.UpdateWorkLogAsync(workLog);

                return Ok(new { message = "審核完成" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        /// <summary>
        /// 計算指定月份的工作天數（排除週末）
        /// </summary>
        /// <param name="year">年份</param>
        /// <param name="month">月份</param>
        /// <returns>工作天數</returns>
        private int GetWorkDaysInMonth(int year, int month)
        {
            var daysInMonth = DateTime.DaysInMonth(year, month);
            var workDays = 0;

            for (int day = 1; day <= daysInMonth; day++)
            {
                var date = new DateTime(year, month, day);
                var dayOfWeek = date.DayOfWeek;

                // 排除週六(Saturday)和週日(Sunday)
                if (dayOfWeek != DayOfWeek.Saturday && dayOfWeek != DayOfWeek.Sunday)
                {
                    workDays++;
                }
            }

            return workDays;
        }
    }

    public class ReviewRequest
    {
        public int ReviewerId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Comments { get; set; }
    }

}