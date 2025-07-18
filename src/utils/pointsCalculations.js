import { pointsConfig, pointsUtils } from '../config/pointsConfig';

// 積分計算工具類
export class PointsCalculator {
  constructor() {
    this.config = pointsConfig;
    this.utils = pointsUtils;
  }

  // 計算基礎積分
  calculateBasePoints(standard, inputValue = 1) {
    if (!standard || !standard.pointsValue) return 0;
    
    // 根據輸入類型計算基礎分數
    switch (standard.inputType) {
      case 'number':
        return standard.pointsValue * (inputValue || 1);
      case 'checkbox':
        return inputValue ? standard.pointsValue : 0;
      default:
        return standard.pointsValue;
    }
  }

  // 計算獎勵積分
  calculateBonusPoints(standard, basePoints, evidenceFiles = []) {
    let bonus = 0;
    const bonusReasons = [];

    // 根據積分類型和條件計算獎勵
    if (standard.pointsType === 'general') {
      // 一般積分獎勵邏輯
      if (basePoints >= 5) {
        bonus += 0.5;
        bonusReasons.push('基礎工作表現優秀');
      }
      
      if (evidenceFiles.length > 0) {
        bonus += 0.3;
        bonusReasons.push('提供完整證明文件');
      }
    } else if (standard.pointsType === 'professional') {
      // 專業積分獎勵邏輯
      if (basePoints >= 3) {
        bonus += 1.0;
        bonusReasons.push('專業技能表現突出');
      }
    } else if (standard.pointsType === 'core') {
      // 核心職能額外獎勵
      if (basePoints === standard.pointsValue) {
        bonus += 5; // 滿分額外獎勵
        bonusReasons.push('核心職能滿分表現');
      }
    }

    return { bonus, bonusReasons };
  }

  // 計算懲罰積分
  calculatePenaltyPoints(standard, description = '', evidenceFiles = []) {
    let penalty = 0;
    const penaltyReasons = [];

    // 基本懲罰邏輯
    if (!description || description.trim().length < 10) {
      penalty += 0.2;
      penaltyReasons.push('工作說明不足');
    }

    // 根據積分類型的特殊懲罰
    if (standard.pointsType === 'professional' && evidenceFiles.length === 0) {
      penalty += 0.5;
      penaltyReasons.push('專業工作缺少證明文件');
    }

    return { penalty, penaltyReasons };
  }

  // 計算最終積分
  calculateFinalPoints(standard, inputValue = 1, description = '', evidenceFiles = []) {
    const basePoints = this.calculateBasePoints(standard, inputValue);
    const { bonus, bonusReasons } = this.calculateBonusPoints(standard, basePoints, evidenceFiles);
    const { penalty, penaltyReasons } = this.calculatePenaltyPoints(standard, description, evidenceFiles);
    
    const entryDate = new Date();
    const promotionMultiplier = this.utils.getPromotionMultiplier(entryDate);
    
    const finalPoints = (basePoints + bonus - penalty) * promotionMultiplier;

    return {
      basePoints,
      bonusPoints: bonus,
      penaltyPoints: penalty,
      promotionMultiplier,
      finalPoints: Math.max(0, finalPoints), // 確保不會是負數
      bonusReasons,
      penaltyReasons,
      calculationDetails: this.generateCalculationDetails(basePoints, bonus, penalty, promotionMultiplier, finalPoints)
    };
  }

  // 生成計算詳情說明
  generateCalculationDetails(basePoints, bonus, penalty, multiplier, finalPoints) {
    return `基礎分數: ${basePoints.toFixed(1)} + 獎勵分數: ${bonus.toFixed(1)} - 懲罰分數: ${penalty.toFixed(1)} × 推廣倍數: ${multiplier.toFixed(1)} = 最終分數: ${finalPoints.toFixed(1)}`;
  }

  // 計算月度積分統計
  calculateMonthlyStats(pointsEntries) {
    const stats = {
      total: 0,
      byType: {
        general: 0,
        professional: 0,
        management: 0,
        core: 0
      },
      byStatus: {
        pending: 0,
        approved: 0,
        rejected: 0
      },
      count: pointsEntries.length
    };

    pointsEntries.forEach(entry => {
      if (entry.status === 'approved') {
        stats.total += entry.pointsEarned || 0;
        stats.byType[entry.standard?.pointsType || 'general'] += entry.pointsEarned || 0;
      }
      stats.byStatus[entry.status] += 1;
    });

    return stats;
  }

  // 計算達成率
  calculateAchievementRate(actualPoints, targetPoints) {
    if (!targetPoints || targetPoints === 0) return 0;
    return Math.round((actualPoints / targetPoints) * 100);
  }

  // 檢查是否達到最低要求
  checkMinimumRequirements(monthlyStats, targetPoints) {
    const achievementRate = this.calculateAchievementRate(monthlyStats.total, targetPoints);
    
    return {
      meetsMinimum: achievementRate >= this.config.passingCriteria.minimum,
      meetsQuarterly: achievementRate >= this.config.passingCriteria.quarterly,
      meetsManagement: achievementRate >= this.config.passingCriteria.management,
      achievementRate,
      grade: this.utils.getGradeName(achievementRate),
      gradeColor: this.utils.getGradeColor(achievementRate)
    };
  }

  // 預測下個月所需積分
  predictNextMonthRequirement(currentMonthStats, targetPoints) {
    const currentRate = this.calculateAchievementRate(currentMonthStats.total, targetPoints);
    
    if (currentRate >= this.config.passingCriteria.minimum) {
      return {
        status: 'on_track',
        message: '目前進度良好',
        recommendedPoints: 0
      };
    }

    const neededPoints = (targetPoints * this.config.passingCriteria.minimum / 100) - currentMonthStats.total;
    
    return {
      status: 'needs_improvement',
      message: `需要額外獲得 ${neededPoints.toFixed(1)} 積分才能達到最低要求`,
      recommendedPoints: neededPoints
    };
  }

  // 生成積分報告
  generatePointsReport(employeeData, pointsEntries, targetPoints) {
    const monthlyStats = this.calculateMonthlyStats(pointsEntries);
    const requirements = this.checkMinimumRequirements(monthlyStats, targetPoints);
    const prediction = this.predictNextMonthRequirement(monthlyStats, targetPoints);

    return {
      employee: employeeData,
      period: new Date().toISOString().slice(0, 7), // YYYY-MM
      stats: monthlyStats,
      requirements,
      prediction,
      recommendations: this.generateRecommendations(monthlyStats, requirements)
    };
  }

  // 生成改善建議
  generateRecommendations(monthlyStats, requirements) {
    const recommendations = [];

    if (!requirements.meetsMinimum) {
      recommendations.push({
        type: 'urgent',
        title: '積分不足警告',
        description: '當月積分未達最低要求，建議加強基礎工作項目的執行'
      });
    }

    // 根據各類型積分比例給出建議
    const totalApproved = monthlyStats.total;
    if (totalApproved > 0) {
      const generalRatio = monthlyStats.byType.general / totalApproved;
      const professionalRatio = monthlyStats.byType.professional / totalApproved;

      if (generalRatio < 0.4) {
        recommendations.push({
          type: 'improvement',
          title: '加強基礎工作',
          description: '一般積分比例偏低，建議多參與日常基礎工作項目'
        });
      }

      if (professionalRatio < 0.3) {
        recommendations.push({
          type: 'development',
          title: '提升專業技能',
          description: '專業積分比例偏低，建議參與更多技術相關工作'
        });
      }
    }

    if (monthlyStats.byStatus.pending > 5) {
      recommendations.push({
        type: 'process',
        title: '待審核項目過多',
        description: '有較多項目待審核，建議與主管確認審核進度'
      });
    }

    return recommendations;
  }
}

// 創建全局實例
export const pointsCalculator = new PointsCalculator();

// 導出常用函數
export const {
  calculateBasePoints,
  calculateFinalPoints,
  calculateMonthlyStats,
  calculateAchievementRate,
  checkMinimumRequirements,
  generatePointsReport
} = pointsCalculator;
