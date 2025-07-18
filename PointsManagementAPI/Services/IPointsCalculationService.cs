using PointsManagementAPI.Models.PointsModels;

namespace PointsManagementAPI.Services
{
    public interface IPointsCalculationService
    {
        Task<PointsCalculationResult> CalculatePointsAsync(PointsEntry entry);
        Task<decimal> GetPromotionMultiplierAsync(DateTime entryDate);
        Task<List<string>> GetBonusReasonsAsync(PointsEntry entry, decimal basePoints);
        Task<List<string>> GetPenaltyReasonsAsync(PointsEntry entry, decimal basePoints);
        Task<decimal> CalculateMonthlyTotalAsync(int employeeId, DateTime month);
        Task<Dictionary<string, decimal>> CalculateCategoryTotalsAsync(int employeeId, DateTime month);
        Task<bool> CheckMinimumRequirementsAsync(int employeeId, DateTime month);
    }


}
