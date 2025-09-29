using PointsManagementAPI.Models.WorkLogModels;

namespace PointsManagementAPI.Services
{
    public interface IWorkLogService
    {
        Task<IEnumerable<WorkLog>> GetWorkLogsByEmployeeAsync(int employeeId);
        Task<IEnumerable<WorkLog>> GetWorkLogsByDateRangeAsync(DateTime startDate, DateTime endDate);
        Task<WorkLog?> GetWorkLogByIdAsync(int id);
        Task<WorkLog> CreateWorkLogAsync(WorkLog workLog);
        Task<WorkLog> UpdateWorkLogAsync(WorkLog workLog);
        Task<bool> DeleteWorkLogAsync(int id);
        Task<bool> WorkLogExistsAsync(int id);

        // 額外的方法
        Task<List<WorkLog>> GetWorkLogsByEmployeeAsync(int employeeId, DateTime? startDate = null, DateTime? endDate = null);
        Task<List<WorkLog>> GetWorkLogsByDepartmentAsync(int departmentId, DateTime? startDate = null, DateTime? endDate = null);
        Task<List<WorkLog>> SearchWorkLogsAsync(string searchTerm, int? employeeId = null, string? category = null);
        Task<WorkLog> ReviewWorkLogAsync(int id, int reviewerId, string status, string? comments = null);

        // 出勤率計算方法
        Task<object> GetEmployeeAttendanceByNameAsync(string employeeName, int year, int month);

        // 新增缺少的方法
        Task<int> GetWorkLogDaysCountAsync(int employeeId, int year, int month);
        Task<object> GetWorkLogsForApprovalAsync(int page, int pageSize, string keyword, string status, DateTime? startDate, DateTime? endDate);

        // 管理員/老闆查看所有員工工作日誌
        Task<object> GetAllEmployeesWorkLogsAsync(int page, int pageSize, string keyword, int? employeeId, DateTime? startDate, DateTime? endDate, int? year, int? month, int? day);
    }
}