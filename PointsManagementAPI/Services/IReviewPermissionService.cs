namespace PointsManagementAPI.Services
{
    /// <summary>
    /// 審核權限檢查服務接口
    /// 用於控制誰可以審核哪些積分記錄
    /// </summary>
    public interface IReviewPermissionService
    {
        /// <summary>
        /// 檢查審核者是否有權限審核指定的積分記錄
        /// </summary>
        /// <param name="reviewerId">審核者ID</param>
        /// <param name="entryId">積分記錄ID</param>
        /// <returns>是否有權限</returns>
        Task<bool> CanReviewEntryAsync(int reviewerId, int entryId);

        /// <summary>
        /// 根據審核者權限獲取可審核的部門ID列表
        /// </summary>
        /// <param name="reviewerId">審核者ID</param>
        /// <returns>可審核的部門ID列表，null表示可審核所有部門</returns>
        Task<List<int>?> GetReviewableDepartmentsAsync(int reviewerId);

        /// <summary>
        /// 檢查審核者是否有權限審核指定部門的積分記錄
        /// </summary>
        /// <param name="reviewerId">審核者ID</param>
        /// <param name="departmentId">部門ID</param>
        /// <returns>是否有權限</returns>
        Task<bool> CanReviewDepartmentAsync(int reviewerId, int departmentId);
    }
} 