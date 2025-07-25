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
    }
}
