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
        public async Task<ActionResult<WorkLog>> CreateWorkLog([FromBody] WorkLog workLog)
        {
            try
            {
                var createdWorkLog = await _workLogService.CreateWorkLogAsync(workLog);
                return CreatedAtAction(nameof(GetWorkLog), new { id = createdWorkLog.Id }, createdWorkLog);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<WorkLog>> UpdateWorkLog(int id, [FromBody] WorkLog workLog)
        {
            if (id != workLog.Id)
                return BadRequest();

            try
            {
                var updatedWorkLog = await _workLogService.UpdateWorkLogAsync(workLog);
                return Ok(updatedWorkLog);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
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
                var reviewedWorkLog = await _workLogService.ReviewWorkLogAsync(
                    id, request.ReviewerId, request.Status, request.Comments);
                return Ok(reviewedWorkLog);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }

    public class ReviewRequest
    {
        public int ReviewerId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Comments { get; set; }
    }
}
