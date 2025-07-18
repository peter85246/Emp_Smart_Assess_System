namespace PointsManagementAPI.Models.PointsModels
{
    public class PointsCalculationResult
    {
        public decimal BasePoints { get; set; }
        public decimal BonusPoints { get; set; }
        public decimal PenaltyPoints { get; set; }
        public decimal PromotionMultiplier { get; set; }
        public decimal FinalPoints { get; set; }
        public string CalculationDetails { get; set; } = string.Empty;
        public List<string> BonusReasons { get; set; } = new List<string>();
        public List<string> PenaltyReasons { get; set; } = new List<string>();
    }


}
