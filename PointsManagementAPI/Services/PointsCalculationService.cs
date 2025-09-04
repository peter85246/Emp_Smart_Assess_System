using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using PointsManagementAPI.Data;
using PointsManagementAPI.Models.PointsModels;

namespace PointsManagementAPI.Services
{
    public class PointsCalculationService : IPointsCalculationService
    {
        private readonly PointsDbContext _context;
        private readonly IConfiguration _configuration;

        public PointsCalculationService(PointsDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<PointsCalculationResult> CalculatePointsAsync(PointsEntry entry)
        {
            var standard = await _context.StandardSettings.FindAsync(entry.StandardId);
            if (standard == null)
                throw new ArgumentException("Invalid standard ID");

            var basePoints = CalculateBasePoints(entry, standard);
            var bonusPoints = await CalculateBonusPointsAsync(entry, basePoints);
            var penaltyPoints = await CalculatePenaltyPointsAsync(entry, basePoints);
            var promotionMultiplier = await GetPromotionMultiplierAsync(entry.EntryDate);

            var finalPoints = (basePoints + bonusPoints - penaltyPoints) * promotionMultiplier;

            var result = new PointsCalculationResult
            {
                BasePoints = basePoints,
                BonusPoints = bonusPoints,
                PenaltyPoints = penaltyPoints,
                PromotionMultiplier = promotionMultiplier,
                FinalPoints = finalPoints,
                BonusReasons = await GetBonusReasonsAsync(entry, basePoints),
                PenaltyReasons = await GetPenaltyReasonsAsync(entry, basePoints),
                CalculationDetails = GenerateCalculationDetails(basePoints, bonusPoints, penaltyPoints, promotionMultiplier, finalPoints)
            };

            return result;
        }

        public async Task<decimal> GetPromotionMultiplierAsync(DateTime entryDate)
        {
            var promotionStartDate = new DateTime(2024, 9, 1); // 推廣期開始日期
            var multipliers = _configuration.GetSection("PointsSettings:PromotionMultipliers").Get<decimal[]>() ?? new decimal[] { 1.0m };

            if (entryDate < promotionStartDate)
                return 1.0m;

            var monthsDiff = ((entryDate.Year - promotionStartDate.Year) * 12) + entryDate.Month - promotionStartDate.Month;
            
            if (monthsDiff >= 0 && monthsDiff < multipliers.Length)
                return multipliers[monthsDiff];

            return 1.0m;
        }

        public async Task<List<string>> GetBonusReasonsAsync(PointsEntry entry, decimal basePoints)
        {
            var reasons = new List<string>();
            
            // 根據積分辦法實現獎勵邏輯
            var standard = await _context.StandardSettings.FindAsync(entry.StandardId);
            if (standard == null) return reasons;

            // 示例獎勵邏輯
            if (standard.PointsType == "general")
            {
                if (basePoints >= 5) reasons.Add("基礎工作表現優秀");
                if (entry.EvidenceFilesList.Count > 0) reasons.Add("提供完整證明文件");
            }
            else if (standard.PointsType == "professional")
            {
                if (basePoints >= 3) reasons.Add("專業技能表現突出");
            }

            return reasons;
        }

        public async Task<List<string>> GetPenaltyReasonsAsync(PointsEntry entry, decimal basePoints)
        {
            var reasons = new List<string>();
            
            // 根據積分辦法實現懲罰邏輯
            if (string.IsNullOrEmpty(entry.Description))
                reasons.Add("缺少工作說明");

            return reasons;
        }

        public async Task<decimal> CalculateMonthlyTotalAsync(int employeeId, DateTime month)
        {
            var startDate = new DateTime(month.Year, month.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(month.Year, month.Month, DateTime.DaysInMonth(month.Year, month.Month), 23, 59, 59, DateTimeKind.Utc);

            var entries = await _context.PointsEntries
                .Where(p => p.EmployeeId == employeeId &&
                           p.EntryDate >= startDate &&
                           p.EntryDate <= endDate &&
                           p.Status == "approved")
                .ToListAsync();

            var total = entries.Sum(p => p.PointsEarned);

            return total;
        }

        public async Task<Dictionary<string, decimal>> CalculateCategoryTotalsAsync(int employeeId, DateTime month)
        {
            var startDate = new DateTime(month.Year, month.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var endDate = new DateTime(month.Year, month.Month, DateTime.DaysInMonth(month.Year, month.Month), 23, 59, 59, DateTimeKind.Utc);

            var entries = await _context.PointsEntries
                .Include(p => p.Standard)
                .Where(p => p.EmployeeId == employeeId &&
                           p.EntryDate >= startDate &&
                           p.EntryDate <= endDate &&
                           p.Status == "approved")
                .ToListAsync();

            var totals = entries
                .GroupBy(p => p.Standard.PointsType)
                .ToDictionary(g => g.Key, g => g.Sum(p => p.PointsEarned));

            return totals;
        }

        public async Task<bool> CheckMinimumRequirementsAsync(int employeeId, DateTime month)
        {
            var monthlyTotal = await CalculateMonthlyTotalAsync(employeeId, month);
            var categoryTotals = await CalculateCategoryTotalsAsync(employeeId, month);

            var minPercentage = _configuration.GetValue<decimal>("PointsSettings:MinimumPassingPercentage", 62m);
            
            // 這裡需要根據員工的目標積分來計算
            // 暫時使用固定值，實際應該從TargetSettings表獲取
            var targetPoints = 100m; // 應該從資料庫獲取實際目標
            
            return (monthlyTotal / targetPoints * 100) >= minPercentage;
        }

        private decimal CalculateBasePoints(PointsEntry entry, StandardSetting standard)
        {
            // PointsValue 現在是 non-nullable decimal，直接返回值
            if (standard.PointsValue > 0)
                return standard.PointsValue;

            // 如果有計算公式，在這裡實現
            if (!string.IsNullOrEmpty(standard.CalculationFormula))
            {
                // 實現公式計算邏輯
                // 這裡可以使用表達式解析器或簡單的條件判斷
            }

            return 0m;
        }

        private async Task<decimal> CalculateBonusPointsAsync(PointsEntry entry, decimal basePoints)
        {
            decimal bonus = 0m;
            
            // 實現獎勵計算邏輯
            var bonusReasons = await GetBonusReasonsAsync(entry, basePoints);
            foreach (var reason in bonusReasons)
            {
                bonus += 0.5m; // 示例獎勵值
            }

            return bonus;
        }

        private async Task<decimal> CalculatePenaltyPointsAsync(PointsEntry entry, decimal basePoints)
        {
            decimal penalty = 0m;
            
            // 實現懲罰計算邏輯
            var penaltyReasons = await GetPenaltyReasonsAsync(entry, basePoints);
            foreach (var reason in penaltyReasons)
            {
                penalty += 0.2m; // 示例懲罰值
            }

            return penalty;
        }

        private string GenerateCalculationDetails(decimal basePoints, decimal bonusPoints, decimal penaltyPoints, decimal multiplier, decimal finalPoints)
        {
            return $"基礎分數: {basePoints} + 獎勵分數: {bonusPoints} - 懲罰分數: {penaltyPoints} × 推廣倍數: {multiplier} = 最終分數: {finalPoints}";
        }
    }
}
