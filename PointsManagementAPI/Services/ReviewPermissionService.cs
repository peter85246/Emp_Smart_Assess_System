using Microsoft.EntityFrameworkCore;
using PointsManagementAPI.Data;
using PointsManagementAPI.Models.UserModels;

namespace PointsManagementAPI.Services
{
    /// <summary>
    /// 審核權限檢查服務實現
    /// 實現五級角色層級審核邏輯（董事長特權）：
    /// - 董事長(boss)：可審核所有人（employee/manager/admin/president），包括可以審核自己
    /// - 總經理(president)：可審核員工、主管、管理員（employee/manager/admin），但不能審核總經理級別及以上，不能自審
    /// - 管理員(admin)：可審核同部門的員工和主管（employee/manager），不能自審
    /// - 主管(manager)：只能審核同部門員工（employee），不能自審
    /// - 員工(employee)：無審核權限
    /// 
    /// 重要原則：只有董事長可以審核自己提交的積分，其他角色都不能自審
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

                // 獲取積分記錄和提交者信息
                var entry = await _context.PointsEntries
                    .Include(pe => pe.Employee)
                    .FirstOrDefaultAsync(pe => pe.Id == entryId);

                if (entry == null)
                {
                    _logger.LogWarning("找不到積分記錄: {EntryId}", entryId);
                    return false;
                }

                // 使用新的層級審核邏輯
                var canReview = CanReviewByHierarchy(reviewer, entry.Employee);
                _logger.LogInformation("層級權限檢查: 審核者={ReviewerId}({ReviewerRole}), 提交者={EmployeeId}({EmployeeRole}), 結果={CanReview}", 
                    reviewerId, reviewer.Role, entry.Employee.Id, entry.Employee.Role, canReview);
                
                return canReview;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "檢查審核權限時發生錯誤: ReviewerId={ReviewerId}, EntryId={EntryId}", reviewerId, entryId);
                return false;
            }
        }

        /// <summary>
        /// 層級審核邏輯檢查
        /// </summary>
        private bool CanReviewByHierarchy(Employee reviewer, Employee entryOwner)
        {
            // 自審檢查：只有董事長可以審核自己提交的積分
            if (reviewer.Id == entryOwner.Id)
            {
                if (reviewer.Role == "boss")
                {
                    _logger.LogInformation("董事長自審: ID={UserId}, 角色={Role}", reviewer.Id, reviewer.Role);
                    return true; // 董事長可以自審
                }
                else
                {
                    _logger.LogWarning("禁止自審: 審核者和提交者為同一人，ID={UserId}, 角色={Role}", reviewer.Id, reviewer.Role);
                    return false; // 其他角色不能自審
                }
            }
            
            // 董事長可以審核所有人
            if (reviewer.Role == "boss") 
                return true;
            
            // 總經理可以審核除董事長和總經理外的所有人（總經理只能由董事長審核）
            if (reviewer.Role == "president")
                return entryOwner.Role != "boss" && entryOwner.Role != "president";
            
            // 管理員可以審核同部門的員工和主管
            if (reviewer.Role == "admin")
                return (entryOwner.Role == "employee" || entryOwner.Role == "manager") &&
                       entryOwner.DepartmentId == reviewer.DepartmentId;
            
            // 主管可以審核同部門的員工 (保持原邏輯)
            if (reviewer.Role == "manager")
                return entryOwner.Role == "employee" &&
                       entryOwner.DepartmentId == reviewer.DepartmentId;
            
            return false;
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

                // 董事長和總經理可以審核所有部門
                if (reviewer.Role == "boss" || reviewer.Role == "president")
                {
                    return null; // null 表示所有部門
                }
                
                // 管理員和主管審核自己部門
                if (reviewer.Role == "admin" || reviewer.Role == "manager")
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