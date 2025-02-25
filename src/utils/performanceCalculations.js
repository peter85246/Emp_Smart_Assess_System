import { scoringConfig } from '../config/scoringConfig';
import { mockEmployeeData } from '../models/employeeData';

// 整合 suggestionAccuracy.js 的功能
const suggestionTracker = {
  suggestions: [],
  
  addSuggestion(suggestion, wasHelpful) {
    this.suggestions.push({ suggestion, wasHelpful });
  },
  
  getAccuracyRate() {
    if (this.suggestions.length === 0) return 0;
    const helpfulSuggestions = this.suggestions.filter(s => s.wasHelpful).length;
    return (helpfulSuggestions / this.suggestions.length) * 100;
  }
};

// 計算加權分數
const calculateWeightedScore = (data, metrics) => {
  return metrics.reduce((total, metric) => {
    const value = metric.value(data);
    return total + (value * metric.weight);
  }, 0);
};

// 計算目標達成率得分
const calculateTargetScore = (workCompletion) => {
  const { scoring } = scoringConfig.targetAchievementMetrics.workCompletion;
  
  if (workCompletion >= scoring.excellent.threshold) return scoring.excellent.score;
  if (workCompletion >= scoring.good.threshold) return scoring.good.score;
  if (workCompletion >= scoring.fair.threshold) return scoring.fair.score;
  return scoring.poor.score;
};

// 計算KPI得分
const calculateKPIScore = (data) => {
  const { qualityControl, attendance, maintenance } = scoringConfig.kpiMetrics;
  
  let qualityScore = 0;
  let attendanceScore = 0;
  let maintenanceScore = 0;

  // 計算品質分數
  if (data.quality >= 98) qualityScore = qualityControl.scoring.noDefects.score;
  else if (data.quality >= 90) qualityScore = qualityControl.scoring.minorDefects.score;
  else qualityScore = qualityControl.scoring.majorDefects.score;

  // 計算出勤分數
  if (data.attendance >= 98) attendanceScore = attendance.scoring.perfect.score;
  else if (data.attendance >= 90) attendanceScore = attendance.scoring.good.score;
  else attendanceScore = attendance.scoring.poor.score;

  // 計算維護分數
  if (data.maintenance >= 95) maintenanceScore = maintenance.scoring.excellent.score;
  else if (data.maintenance >= 85) maintenanceScore = maintenance.scoring.good.score;
  else maintenanceScore = maintenance.scoring.poor.score;

  // 計算加權總分
  return (
    qualityScore * qualityControl.weight +
    attendanceScore * attendance.weight +
    maintenanceScore * maintenance.weight
  ) / (qualityControl.weight + attendance.weight + maintenance.weight);
};

// 計算效率指標得分
const calculateEfficiencyScore = (data) => {
  const { timeManagement, resourceUtilization } = scoringConfig.efficiencyMetrics;
  
  let timeScore = 0;
  let resourceScore = 0;

  // 計算工時分數
  if (data.timeManagement >= timeManagement.scoring.excellent.threshold) 
    timeScore = timeManagement.scoring.excellent.score;
  else if (data.timeManagement >= timeManagement.scoring.good.threshold)
    timeScore = timeManagement.scoring.good.score;
  else if (data.timeManagement >= timeManagement.scoring.fair.threshold)
    timeScore = timeManagement.scoring.fair.score;
  else
    timeScore = timeManagement.scoring.poor.score;

  // 計算資源利用分數
  if (data.resourceUtilization >= resourceUtilization.scoring.excellent.threshold)
    resourceScore = resourceUtilization.scoring.excellent.score;
  else if (data.resourceUtilization >= resourceUtilization.scoring.good.threshold)
    resourceScore = resourceUtilization.scoring.good.score;
  else if (data.resourceUtilization >= resourceUtilization.scoring.fair.threshold)
    resourceScore = resourceUtilization.scoring.fair.score;
  else
    resourceScore = resourceUtilization.scoring.poor.score;

  return (timeScore * timeManagement.weight + resourceScore * resourceUtilization.weight) /
         (timeManagement.weight + resourceUtilization.weight);
};

// 計算總分
const calculateTotalScore = (employeeData, role = 'operator') => {
  const weights = scoringConfig.roleWeightAdjustment[role];
  
  // 計算目標達成率得分
  const targetScore = (() => {
    const { workCompletion } = employeeData;
    const { scoring } = scoringConfig.targetAchievementMetrics.workCompletion;
    
    if (workCompletion >= scoring.excellent.threshold) return scoring.excellent.score;
    if (workCompletion >= scoring.good.threshold) return scoring.good.score;
    if (workCompletion >= scoring.fair.threshold) return scoring.fair.score;
    return scoring.poor.score;
  })();

  // 計算KPI得分
  const kpiScore = (() => {
    const { productQuality, attendance, maintenanceRecord } = employeeData;
    const { qualityControl, attendance: attendanceMetric, maintenance } = scoringConfig.kpiMetrics;
    
    let qualityScore = productQuality >= 98 ? qualityControl.scoring.noDefects.score :
                      productQuality >= 90 ? qualityControl.scoring.minorDefects.score :
                      qualityControl.scoring.majorDefects.score;
                      
    let attendanceScore = attendance >= 98 ? attendanceMetric.scoring.perfect.score :
                         attendance >= 90 ? attendanceMetric.scoring.good.score :
                         attendanceMetric.scoring.poor.score;
                         
    let maintenanceScore = maintenanceRecord >= 95 ? maintenance.scoring.excellent.score :
                          maintenanceRecord >= 85 ? maintenance.scoring.good.score :
                          maintenance.scoring.poor.score;

    return (qualityScore * qualityControl.weight +
            attendanceScore * attendanceMetric.weight +
            maintenanceScore * maintenance.weight) /
           (qualityControl.weight + attendanceMetric.weight + maintenance.weight);
  })();

  // 計算效率指標得分
  const efficiencyScore = (() => {
    const { workHours, machineStatus } = employeeData;
    const { timeManagement, resourceUtilization } = scoringConfig.efficiencyMetrics;
    
    const timeScore = workHours >= timeManagement.scoring.excellent.threshold ? timeManagement.scoring.excellent.score :
                     workHours >= timeManagement.scoring.good.threshold ? timeManagement.scoring.good.score :
                     workHours >= timeManagement.scoring.fair.threshold ? timeManagement.scoring.fair.score :
                     timeManagement.scoring.poor.score;
                     
    const resourceScore = machineStatus >= resourceUtilization.scoring.excellent.threshold ? resourceUtilization.scoring.excellent.score :
                         machineStatus >= resourceUtilization.scoring.good.threshold ? resourceUtilization.scoring.good.score :
                         machineStatus >= resourceUtilization.scoring.fair.threshold ? resourceUtilization.scoring.fair.score :
                         resourceUtilization.scoring.poor.score;

    return (timeScore * timeManagement.weight + resourceScore * resourceUtilization.weight) /
           (timeManagement.weight + resourceUtilization.weight);
  })();

  // 計算加權總分
  const totalScore = targetScore * weights.targetAchievement +
                     kpiScore * weights.kpi +
                     efficiencyScore * weights.efficiency;

  return totalScore;
};

// 計算標準差
const calculateStandardDeviation = (scores) => {
  const mean = scores.reduce((a, b) => a + b) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  return Math.sqrt(variance);
};

// 計算平均值
const calculateMean = (scores) => {
  return scores.reduce((a, b) => a + b) / scores.length;
};

// 計算公平性指標
const calculateFairnessIndex = (scores) => {
  if (scores.length < 2) return 100;
  
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  
  const coefficientOfVariation = (standardDeviation / mean) * 100;
  return Math.max(0, 100 - coefficientOfVariation);
};

// 驗證公平性
export const validateFairness = (scores) => {
  const fairnessIndex = calculateFairnessIndex(scores);
  return {
    isValid: fairnessIndex >= 85,
    index: fairnessIndex,
    suggestions: fairnessIndex < 85 ? generateFairnessImprovement(scores) : []
  };
};

// 生成公平性改進建議
const generateFairnessImprovement = (scores) => {
  const suggestions = [];
  const fairnessIndex = calculateFairnessIndex(scores);
  
  if (fairnessIndex < 85) {
    suggestions.push({
      type: 'warning',
      message: '評分差異過大，建議重新審視評分標準',
      action: '請檢查是否有特殊情況導致評分差異'
    });
  }
  
  return suggestions;
};

// 生成改進建議
const generateImprovement = (metrics) => {
  const suggestions = [];
  metrics.forEach(metric => {
    if (metric.value < metric.target) {
      suggestions.push({
        metric: metric.title,
        suggestion: `建議提升${metric.title}相關表現`
      });
    }
  });
  return suggestions;
};

class PerformanceEvaluator {
  constructor(role) {
    this.role = role;
    this.config = scoringConfig;
    this.weights = scoringConfig.roleWeightAdjustment[role];
    this.suggestions = [];
    this.measurements = [];
    this.suggestionTracker = suggestionTracker;
  }

  // 計算基礎分數
  calculateBaseScore(metrics) {
    return metrics.reduce((total, metric) => {
      const value = metric.value(metrics);
      return total + (value * metric.weight);
    }, 0);
  }

  // 新增：計算加班影響
  calculateOvertimeImpact(overtimeHours) {
    const { perHourPenalty, maxPenalty } = this.config.efficiency.timeManagement.overtimeImpact;
    const penalty = Math.min(overtimeHours * perHourPenalty, maxPenalty);
    return penalty;
  }

  // 新增：計算推廣期間加成
  calculatePromotionBonus(month, baseScore) {
    const multiplier = this.config.promotionBonus.multipliers[`${month}Month`] || 1;
    return baseScore * multiplier;
  }

  // 新增：計算特殊貢獻分數
  calculateSpecialContribution(contributions) {
    let totalBonus = 0;
    Object.entries(contributions).forEach(([type, count]) => {
      const item = this.config.specialContribution.items[type];
      if (item) {
        totalBonus += Math.min(count * item.baseScore, item.maxScore);
      }
    });
    return totalBonus;
  }

  // 計算總分
  calculateTotalScore(employeeData) {
    const baseScore = this.calculateBaseScore(employeeData);
    const overtimeImpact = this.calculateOvertimeImpact(employeeData.overtimeHours || 0);
    const promotionBonus = this.calculatePromotionBonus(employeeData.monthInRole, baseScore);
    const specialBonus = this.calculateSpecialContribution(employeeData.contributions || {});

    return promotionBonus + overtimeImpact + specialBonus;
  }

  // 計算公平性指標
  calculateFairnessIndex() {
    if (this.measurements.length < 2) return 100;

    const totals = this.measurements.map(m => m.total);
    const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
    const variance = totals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / totals.length;
    const standardDeviation = Math.sqrt(variance);
    
    // 變異係數 = (標準差/平均值) * 100
    const coefficientOfVariation = (standardDeviation / mean) * 100;
    
    // 公平性指標 = 100 - 變異係數
    return Math.max(0, 100 - coefficientOfVariation);
  }

  // 生成改進建議
  generateSuggestions(scores) {
    const suggestions = [];

    Object.entries(scores).forEach(([metric, score]) => {
      if (score < 80) {
        const suggestion = this.getSuggestionForMetric(metric, score);
        suggestions.push(suggestion);
        
        // 追蹤建議準確度
        this.trackSuggestion(suggestion);
      }
    });

    return suggestions;
  }

  // 整合建議追蹤功能
  trackSuggestion(suggestion, wasHelpful) {
    this.suggestionTracker.addSuggestion(suggestion, wasHelpful);
  }

  getSuggestionAccuracy() {
    return this.suggestionTracker.getAccuracyRate();
  }

  // 性能監控方法
  startPerformanceMonitoring() {
    this.startTime = performance.now();
  }

  endPerformanceMonitoring() {
    const duration = performance.now() - this.startTime;
    return duration < 3000; // 確保響應時間在3秒內
  }

  // 用於測試和驗證計算邏輯
  testCalculations(employeeId) {
    const testData = mockEmployeeData[employeeId];
    return this.calculateTotalScore(testData);
  }
}

// 統一在這裡導出所有功能
export {
  calculateWeightedScore,
  calculateFairnessIndex,
  generateImprovement,
  calculateTotalScore,
  suggestionTracker,
  PerformanceEvaluator
};