using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Data;

namespace PointsManagementAPI.Services
{
    /// <summary>
    /// 審核權限檢查服務實現
    /// 實現部門權限控制邏輯：
    /// - 老闆(boss)：可審核所有部門
    /// - 管理員(admin)：可審核所有部門  
    /// - 主管(manager)：只能審核同部門員工
    /// - 員工(employee)：無審核權限
    /// </summary>
    public class ReviewPermissionService : IReviewPermissionService
    {
        private readonly PointsDbContext _context;
        private readonly ILogger<ReviewPermissionService> _logger;

        public ReviewPermissionService(PointsDbContext context, ILogger<ReviewPermissionService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <summary>
        /// 檢查審核者是否有權限審核指定的積分記錄
        /// </summary>
        public async Task<bool> CanReviewEntryAsync(int reviewerId, int entryId)
        {
            try
            {
                _logger.LogInformation("檢查審核權限: 審核者ID={ReviewerId}, 積分記錄ID={EntryId}", reviewerId, entryId);

                // 獲取審核者信息
                var reviewer = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == reviewerId && e.IsActive);

                if (reviewer == null)
                {
                    _logger.LogWarning("找不到審核者: {ReviewerId}", reviewerId);
                    return false;
                }

                // 檢查審核者角色權限
                if (reviewer.Role == "employee")
                {
                    _logger.LogWarning("員工無審核權限: {ReviewerId}", reviewerId);
                    return false;
                }

                // 老闆和管理員可以審核所有記錄
                if (reviewer.Role == "boss" || reviewer.Role == "admin")
                {
                    _logger.LogInformation("老闆/管理員有全部審核權限: {ReviewerId}, Role={Role}", reviewerId, reviewer.Role);
                    return true;
                }

                // 主管只能審核同部門員工的記錄
                if (reviewer.Role == "manager")
                {
                    var entry = await _context.PointsEntries
                        .Include(pe => pe.Employee)
                        .FirstOrDefaultAsync(pe => pe.Id == entryId);

                    if (entry == null)
                    {
                        _logger.LogWarning("找不到積分記錄: {EntryId}", entryId);
                        return false;
                    }

                    var canReview = entry.Employee.DepartmentId == reviewer.DepartmentId;
                    _logger.LogInformation("主管部門權限檢查: 審核者部門={ReviewerDept}, 員工部門={EmployeeDept}, 結果={CanReview}", 
                        reviewer.DepartmentId, entry.Employee.DepartmentId, canReview);
                    
                    return canReview;
                }

                _logger.LogWarning("未知角色: {ReviewerId}, Role={Role}", reviewerId, reviewer.Role);
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "檢查審核權限時發生錯誤: ReviewerId={ReviewerId}, EntryId={EntryId}", reviewerId, entryId);
                return false;
            }
        }

        /// <summary>
        /// 根據審核者權限獲取可審核的部門ID列表
        /// </summary>
        public async Task<List<int>?> GetReviewableDepartmentsAsync(int reviewerId)
        {
            try
            {
                var reviewer = await _context.Employees
                    .FirstOrDefaultAsync(e => e.Id == reviewerId && e.IsActive);

                if (reviewer == null || reviewer.Role == "employee")
                {
                    return new List<int>(); // 無權限
                }

                // 老闆和管理員可以審核所有部門
                if (reviewer.Role == "boss" || reviewer.Role == "admin")
                {
                    return null; // null 表示所有部門
                }

                // 主管只能審核自己的部門
                if (reviewer.Role == "manager")
                {
                    return new List<int> { reviewer.DepartmentId };
                }

                return new List<int>(); // 預設無權限
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "獲取可審核部門列表時發生錯誤: ReviewerId={ReviewerId}", reviewerId);
                return new List<int>();
            }
        }

        /// <summary>
        /// 檢查審核者是否有權限審核指定部門的積分記錄
        /// </summary>
        public async Task<bool> CanReviewDepartmentAsync(int reviewerId, int departmentId)
        {
            try
            {
                var reviewableDepartments = await GetReviewableDepartmentsAsync(reviewerId);
                
                // null 表示可以審核所有部門
                if (reviewableDepartments == null)
                {
                    return true;
                }

                // 檢查是否在可審核部門列表中
                return reviewableDepartments.Contains(departmentId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "檢查部門審核權限時發生錯誤: ReviewerId={ReviewerId}, DepartmentId={DepartmentId}", reviewerId, departmentId);
                return false;
            }
        }
    }
} 