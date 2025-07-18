using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Data;
using PointsManagementAPI.Models.WorkLogModels;
using PointsManagementAPI.Models.UserModels;

namespace PointsManagementAPI.Services
{
    public class WorkLogService : IWorkLogService
    {
        private readonly PointsDbContext _context;

        public WorkLogService(PointsDbContext context)
        {
            _context = context;
        }



        public async Task<IEnumerable<WorkLog>> GetWorkLogsByDateRangeAsync(DateTime startDate, DateTime endDate)
        {
            return await _context.WorkLogs
                .Include(w => w.Category)
                .Include(w => w.Employee)
                .Where(w => w.LogDate >= startDate && w.LogDate <= endDate)
                .OrderByDescending(w => w.LogDate)
                .ToListAsync();
        }

        public async Task<WorkLog?> GetWorkLogByIdAsync(int id)
        {
            return await _context.WorkLogs
                .Include(w => w.Category)
                .Include(w => w.Employee)
                .FirstOrDefaultAsync(w => w.Id == id);
        }

        public async Task<WorkLog> CreateWorkLogAsync(WorkLog workLog)
        {
            workLog.CreatedAt = DateTime.UtcNow;
            _context.WorkLogs.Add(workLog);
            await _context.SaveChangesAsync();
            return workLog;
        }

        public async Task<WorkLog> UpdateWorkLogAsync(WorkLog workLog)
        {
            _context.Entry(workLog).State = EntityState.Modified;
            await _context.SaveChangesAsync();
            return workLog;
        }

        public async Task<bool> DeleteWorkLogAsync(int id)
        {
            var workLog = await _context.WorkLogs.FindAsync(id);
            if (workLog == null)
                return false;

            _context.WorkLogs.Remove(workLog);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> WorkLogExistsAsync(int id)
        {
            return await _context.WorkLogs.AnyAsync(w => w.Id == id);
        }

        // 實現IWorkLogService接口方法
        public async Task<IEnumerable<WorkLog>> GetWorkLogsByEmployeeAsync(int employeeId)
        {
            return await _context.WorkLogs
                .Include(w => w.Category)
                .Where(w => w.EmployeeId == employeeId)
                .OrderByDescending(w => w.LogDate)
                .ToListAsync();
        }

        // 添加從StandardsService.cs移過來的方法
        public async Task<List<WorkLog>> GetWorkLogsByEmployeeAsync(int employeeId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = _context.WorkLogs.Where(w => w.EmployeeId == employeeId);

            if (startDate.HasValue)
                query = query.Where(w => w.LogDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(w => w.LogDate <= endDate.Value);

            return await query.OrderByDescending(w => w.LogDate).ToListAsync();
        }

        public async Task<List<WorkLog>> GetWorkLogsByDepartmentAsync(int departmentId, DateTime? startDate = null, DateTime? endDate = null)
        {
            var query = from w in _context.WorkLogs
                       join e in _context.Employees on w.EmployeeId equals e.Id
                       where e.DepartmentId == departmentId
                       select w;

            if (startDate.HasValue)
                query = query.Where(w => w.LogDate >= startDate.Value);

            if (endDate.HasValue)
                query = query.Where(w => w.LogDate <= endDate.Value);

            return await query.OrderByDescending(w => w.LogDate).ToListAsync();
        }

        public async Task<List<WorkLog>> SearchWorkLogsAsync(string searchTerm, int? employeeId = null, string? category = null)
        {
            var query = _context.WorkLogs.AsQueryable();

            if (!string.IsNullOrEmpty(searchTerm))
            {
                query = query.Where(w => w.Title.Contains(searchTerm) ||
                                        w.Content!.Contains(searchTerm) ||
                                        w.Tags!.Contains(searchTerm));
            }

            if (employeeId.HasValue)
                query = query.Where(w => w.EmployeeId == employeeId.Value);

            if (!string.IsNullOrEmpty(category))
                query = query.Where(w => w.CategoryId.HasValue && w.Category.Name == category);

            return await query.OrderByDescending(w => w.LogDate).ToListAsync();
        }

        public async Task<WorkLog> ReviewWorkLogAsync(int id, int reviewerId, string status, string? comments = null)
        {
            var workLog = await _context.WorkLogs.FindAsync(id);
            if (workLog == null) throw new ArgumentException("Work log not found");

            workLog.Status = status;
            workLog.ReviewedBy = reviewerId;
            workLog.ReviewedAt = DateTime.UtcNow;
            workLog.ReviewComments = comments;

            await _context.SaveChangesAsync();
            return workLog;
        }
    }
}
