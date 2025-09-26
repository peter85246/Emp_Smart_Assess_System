using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Data;
using PointsManagementAPI.Models.WorkLogModels;
using PointsManagementAPI.Models.UserModels;
using PointsManagementAPI.Models.PointsModels;
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
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                // 設置創建時間
                workLog.CreatedAt = DateTime.UtcNow;
                if (workLog.LogDate == default(DateTime))
                {
                    workLog.LogDate = DateTime.UtcNow;
                }

                // 修正日期比較邏輯 - 避免使用 date_trunc
                var logDate = workLog.LogDate.Date;
                var startOfDay = new DateTime(logDate.Year, logDate.Month, logDate.Day, 0, 0, 0, DateTimeKind.Utc);
                var endOfDay = startOfDay.AddDays(1);

                // 檢查當日是否已有通過的工作日誌
                var existingApprovedLog = await _context.WorkLogs
                    .Where(w => w.EmployeeId == workLog.EmployeeId)
                    .Where(w => w.LogDate >= startOfDay && w.LogDate < endOfDay)
                    .Where(w => w.Status == "auto_approved" || w.Status == "approved")
                    .AnyAsync();

                // 檢查當日是否已有積分記錄
                var existingPointsEntry = await _context.PointsEntries
                    .Where(p => p.EmployeeId == workLog.EmployeeId)
                    .Where(p => p.EntryDate >= startOfDay && p.EntryDate < endOfDay)
                    .Where(p => p.Description.Contains("工作日誌"))
                    .AnyAsync();

                var existingTodayLog = existingApprovedLog || existingPointsEntry;

                Console.WriteLine($"員工 {workLog.EmployeeId} 在 {logDate:yyyy-MM-dd} 是否已有日誌: {existingTodayLog}");

                // 根據是否首次填寫設置狀態
                if (!existingTodayLog)
                {
                    workLog.PointsClaimed = 0.1m;
                    workLog.Status = "auto_approved";
                    Console.WriteLine($"首次填寫日誌，自動加0.1分");
                }
                else
                {
                    workLog.PointsClaimed = 0;
                    workLog.Status = "submitted";
                    Console.WriteLine($"當日已有日誌，不加分");
                }

                // 保存工作日誌
                _context.WorkLogs.Add(workLog);
                await _context.SaveChangesAsync();

                // 如果是首次填寫，創建積分記錄
                if (!existingTodayLog)
                {
                    var pointsEntry = new PointsEntry
                    {
                        EmployeeId = workLog.EmployeeId,
                        StandardId = 41, // 工作日誌積分項目ID
                        EntryDate = workLog.LogDate,
                        BasePoints = 0.1m,
                        PointsEarned = 0.1m,
                        Status = "approved",
                        ApprovedBy = workLog.EmployeeId,
                        ApprovedAt = DateTime.UtcNow,
                        ReviewComments = "工作日誌首次填寫自動加分",
                        CreatedAt = DateTime.UtcNow,
                        Description = "工作日誌紀錄",
                        BonusPoints = 0m,
                        PenaltyPoints = 0m,
                        PromotionMultiplier = 1.0m
                    };

                    _context.PointsEntries.Add(pointsEntry);
                    await _context.SaveChangesAsync();
                }

                await transaction.CommitAsync();
                return workLog;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"創建工作日誌失敗: {ex.Message}");
                throw;
            }
        }

        public async Task<WorkLog> UpdateWorkLogAsync(WorkLog workLog)
        {
            using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var existingLog = await _context.WorkLogs
                    .Include(w => w.Category)
                    .FirstOrDefaultAsync(w => w.Id == workLog.Id);
            
                if (existingLog == null)
                    throw new ArgumentException("工作日誌不存在");

                // 保存原始狀態用於判斷
                var originalStatus = existingLog.Status;
                var originalPoints = existingLog.PointsClaimed;

                // 更新基本信息
                existingLog.Title = workLog.Title;
                existingLog.Content = workLog.Content;
                existingLog.CategoryId = workLog.CategoryId;
                existingLog.Tags = workLog.Tags;
                existingLog.Attachments = workLog.Attachments;
                existingLog.UpdatedAt = DateTime.UtcNow;

                /* 審核功能設計（目前停用）
                // 此區塊實現了工作日誌編輯的審核流程
                // 當編輯已通過的日誌時，狀態會改為待審核
                if (originalStatus == "auto_approved" || originalStatus == "approved")
                {
                    existingLog.Status = "edit_pending";
                    existingLog.ReviewedBy = null;
                    existingLog.ReviewedAt = null;
                    existingLog.ReviewComments = null;
            
                    Console.WriteLine($"工作日誌 {existingLog.Id} 狀態從 {originalStatus} 改為 edit_pending");
                }
                else
                {
                    // 保持原有狀態
                    existingLog.Status = originalStatus;
                }
                */
                
                // 直接保持原有狀態，不需要審核
                existingLog.Status = originalStatus;
                Console.WriteLine($"保持原有狀態: {originalStatus}");

                // 保持原有積分不變
                existingLog.PointsClaimed = originalPoints;
                Console.WriteLine($"保持原有積分: {originalPoints}");

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();
        
                return existingLog;
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                Console.WriteLine($"更新工作日誌錯誤: {ex.Message}");
                throw;
            }
        }

        // 新增方法：獲取員工當月填寫日誌的天數（去重）
        public async Task<int> GetWorkLogDaysCountAsync(int employeeId, int year, int month)
        {
            var startDate = new DateTime(year, month, 1);
            var endDate = startDate.AddMonths(1).AddDays(-1);

            var distinctDays = await _context.WorkLogs
                .Where(w => w.EmployeeId == employeeId)
                .Where(w => w.LogDate.Date >= startDate.Date && w.LogDate.Date <= endDate.Date)
                .Where(w => w.Status == "auto_approved" || w.Status == "approved" || w.Status == "submitted")
                .Select(w => w.LogDate.Date)
                .Distinct()
                .CountAsync();

            return distinctDays;
        }

        // 新增方法：檢查工作日誌是否可以編輯
        public async Task<bool> CanEditWorkLogAsync(int workLogId, int currentUserId)
        {
            var workLog = await _context.WorkLogs.FindAsync(workLogId);
            if (workLog == null) return false;

            // 只有作者本人可以編輯，且狀態不是待審核編輯
            return workLog.EmployeeId == currentUserId && workLog.Status != "edit_pending";
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
                .Where(log => log.Status == "submitted" || 
                            log.Status == "approved" || 
                            log.Status == "reviewed" || 
                            log.Status == "auto_approved")
                .Where(log => log.LogDate.Year == year && log.LogDate.Month == month)  // 確保只計算指定年月的記錄
                .Select(log => log.LogDate.Date)
                .Distinct()
                .Count();

            // 添加日誌記錄
            Console.WriteLine($"Employee {employeeName} attendance calculation:");
            Console.WriteLine($"Year: {year}, Month: {month}");
            Console.WriteLine($"Total work logs: {workLogs.Count()}");
            Console.WriteLine($"Filled days: {filledDays}");
            Console.WriteLine($"Work days: {workDays}");

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
        /// <summary>
        /// 獲取待審核工作日誌列表（分頁）
        /// </summary>
        public async Task<object> GetWorkLogsForApprovalAsync(int page, int pageSize, string keyword, string status, DateTime? startDate, DateTime? endDate)
        {
            var query = _context.WorkLogs
                .Include(w => w.Employee)
                .Include(w => w.Category)
                .AsQueryable();

            // 篩選條件
            if (!string.IsNullOrEmpty(keyword))
            {
                query = query.Where(w => w.Title.Contains(keyword) ||
                                        w.Content!.Contains(keyword) ||
                                        w.Employee.Name.Contains(keyword));
            }

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(w => w.Status == status);
            }
            else
            {
                // 預設只顯示待審核的項目
                query = query.Where(w => w.Status == "submitted" || w.Status == "edit_pending");
            }

            if (startDate.HasValue)
            {
                query = query.Where(w => w.LogDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(w => w.LogDate <= endDate.Value);
            }

            // 計算總數
            var total = await query.CountAsync();

            // 分頁查詢
            var items = await query
                .OrderByDescending(w => w.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(w => new
                {
                    w.Id,
                    w.Title,
                    w.Content,
                    w.LogDate,
                    w.Status,
                    w.CreatedAt,
                    w.ReviewComments,
                    EmployeeName = w.Employee.Name,
                    EmployeeId = w.EmployeeId,
                    CategoryName = w.Category != null ? w.Category.Name : null
                })
                .ToListAsync();

            return new
            {
                Items = items,
                Total = total,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling((double)total / pageSize)
            };
        }
    }
}
