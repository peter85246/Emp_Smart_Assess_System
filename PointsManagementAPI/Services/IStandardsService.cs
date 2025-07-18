using PointsManagementAPI.Models.PointsModels;

namespace PointsManagementAPI.Services
{
    public interface IStandardsService
    {
        Task<IEnumerable<StandardSetting>> GetAllStandardsAsync();
        Task<IEnumerable<StandardSetting>> GetStandardsByTypeAsync(string pointsType);
        Task<IEnumerable<StandardSetting>> GetStandardsByDepartmentAsync(int departmentId);
        Task<StandardSetting?> GetStandardByIdAsync(int id);
        Task<StandardSetting> CreateStandardAsync(StandardSetting standard);
        Task<StandardSetting> UpdateStandardAsync(StandardSetting standard);
        Task<bool> DeleteStandardAsync(int id);
        Task<bool> StandardExistsAsync(int id);
        Task<IEnumerable<StandardSetting>> GetStandardsTreeAsync();
    }
}
