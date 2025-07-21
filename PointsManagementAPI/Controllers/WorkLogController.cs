using Microsoft.AspNetCore.Mvc;
using PointsManagementAPI.Models.WorkLogModels;
using PointsManagementAPI.Services;

namespace PointsManagementAPI.Controllers
{
    /// <summary>
    /// 工作日誌控制器 - 處理員工工作日誌的CRUD操作
    /// 主要功能：工作日誌創建、查詢、更新、刪除、審核
    /// API路由前綴：/api/worklog
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
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
