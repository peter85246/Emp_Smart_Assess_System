using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Data;
using PointsManagementAPI.Models.WorkLogModels;
using PointsManagementAPI.Models.UserModels;
using System;

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
            // 確保LogDate有正確的值 - 如果沒有設置，使用當前日期
            if (workLog.LogDate == default(DateTime))
            {
                workLog.LogDate = DateTime.UtcNow;
            }
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

        /// <summary>
        /// 計算員工指定月份的出勤率數據（按員工姓名）
        /// 基於工作日誌填寫記錄計算：出勤率 = 已填寫日誌天數 / 當月工作天數
        /// </summary>
        /// <param name="employeeName">員工姓名</param>
        /// <param name="year">年份</param>
        /// <param name="month">月份</param>
        /// <returns>出勤率數據</returns>
        public async Task<object> GetEmployeeAttendanceByNameAsync(string employeeName, int year, int month)
        {
            // 先根據員工姓名查找員工ID
            var employee = await _context.Employees.FirstOrDefaultAsync(e => e.Name == employeeName);
            if (employee == null)
            {
                throw new ArgumentException($"找不到員工: {employeeName}");
            }

            // 計算當月的開始和結束日期（使用 UTC 時間）
            var startDate = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = startDate.AddMonths(1).AddDays(-1).AddHours(23).AddMinutes(59).AddSeconds(59);

            // 計算當月工作天數（排除週末）
            var workDays = GetWorkDaysInMonth(year, month);

            // 獲取員工當月的工作日誌記錄
            var workLogs = await GetWorkLogsByEmployeeAsync(employee.Id, startDate, endDate);

            // 計算已填寫的天數（按日期去重，一天可能有多條記錄）
            var filledDays = workLogs
                .Where(log => log.Status == "submitted" || log.Status == "approved" || log.Status == "reviewed")
                .Select(log => log.LogDate.Date)
                .Distinct()
                .Count();

            // 計算出勤率
            var attendanceRate = workDays > 0 ? Math.Round((double)filledDays / workDays * 100, 1) : 0;

            return new
            {
                EmployeeName = employeeName,
                EmployeeId = employee.Id,
                Year = year,
                Month = month,
                WorkDays = workDays,
                FilledDays = filledDays,
                AttendanceRate = attendanceRate,
                DisplayText = $"{filledDays}/{workDays}天",
                Percentage = $"{attendanceRate}%"
            };
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
