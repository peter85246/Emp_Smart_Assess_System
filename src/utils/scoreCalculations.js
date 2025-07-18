/**
 * 得分計算表整合工具
 * 實現百分比直接映射為分數的邏輯
 */

/**
 * 將百分比直接轉換為對應分數
 * @param {number} percentage - 百分比數值 (0-100)
 * @returns {object} 包含分數、等級、區間的對象
 */
export const convertPercentageToScore = (percentage) => {
  // 確保百分比在有效範圍內
  const validPercentage = Math.max(0, Math.min(100, percentage || 0));
  
  return {
    score: Math.round(validPercentage), // 直接映射：百分比 = 分數
    grade: getGradeFromScore(validPercentage),
    range: getScoreRange(validPercentage),
    gradeColor: getGradeColor(validPercentage),
    gradeDescription: getGradeDescription(validPercentage)
  };
};

/**
 * 根據分數獲取等級
 * @param {number} score - 分數 (0-100)
 * @returns {string} 等級 (A/B/C/D/E)
 */
export const getGradeFromScore = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'E';
};

/**
 * 根據分數獲取分數區間描述
 * @param {number} score - 分數 (0-100)
 * @returns {string} 分數區間
 */
export const getScoreRange = (score) => {
  if (score >= 90) return '90-100分';
  if (score >= 80) return '80-89分';
  if (score >= 70) return '70-79分';
  if (score >= 60) return '60-69分';
  return '60分以下';
};

/**
 * 根據分數獲取等級對應的顏色
 * @param {number} score - 分數 (0-100)
 * @returns {string} CSS顏色類名
 */
export const getGradeColor = (score) => {
  if (score >= 90) return 'text-green-400';    // A級 - 綠色
  if (score >= 80) return 'text-blue-400';     // B級 - 藍色
  if (score >= 70) return 'text-yellow-400';   // C級 - 黃色
  if (score >= 60) return 'text-orange-400';   // D級 - 橘色
  return 'text-red-400';                       // E級 - 紅色
};

/**
 * 根據分數獲取等級描述
 * @param {number} score - 分數 (0-100)
 * @returns {string} 等級描述
 */
export const getGradeDescription = (score) => {
  if (score >= 90) return '優秀表現';
  if (score >= 80) return '良好表現';
  if (score >= 70) return '待改進表現';
  if (score >= 60) return '需加強表現';
  return '急需改進';
};

/**
 * 獲取等級對應的背景顏色
 * @param {string} grade - 等級 (A/B/C/D/E)
 * @returns {string} CSS背景顏色類名
 */
export const getGradeBadgeColor = (grade) => {
  const colorMap = {
    'A': 'bg-green-100 text-green-800 border-green-200',
    'B': 'bg-blue-100 text-blue-800 border-blue-200',
    'C': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'D': 'bg-orange-100 text-orange-800 border-orange-200',
    'E': 'bg-red-100 text-red-800 border-red-200'
  };
  return colorMap[grade] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * 計算升級所需的分數/百分比
 * @param {number} currentScore - 當前分數
 * @returns {object} 升級資訊
 */
export const getUpgradeInfo = (currentScore) => {
  const currentGrade = getGradeFromScore(currentScore);
  let nextGradeTarget = 0;
  let nextGrade = '';
  
  if (currentScore < 60) {
    nextGradeTarget = 60;
    nextGrade = 'D';
  } else if (currentScore < 70) {
    nextGradeTarget = 70;
    nextGrade = 'C';
  } else if (currentScore < 80) {
    nextGradeTarget = 80;
    nextGrade = 'B';
  } else if (currentScore < 90) {
    nextGradeTarget = 90;
    nextGrade = 'A';
  } else {
    return {
      isMaxGrade: true,
      message: '已達最高等級 A級'
    };
  }
  
  return {
    isMaxGrade: false,
    currentGrade,
    nextGrade,
    nextGradeTarget,
    scoreNeeded: nextGradeTarget - currentScore,
    percentageNeeded: nextGradeTarget - currentScore,
    upgradeMessage: `再提升 ${nextGradeTarget - currentScore} 分即可達到 ${nextGrade} 級`
  };
};

/**
 * 根據得分計算表獲取獎懲說明
 * @param {number} percentage - 百分比
 * @param {string} metricType - 指標類型
 * @returns {object} 獎懲資訊
 */
export const getBonusPenaltyInfo = (percentage, metricType) => {
  const baseScore = Math.round(percentage);
  let bonusPoints = 0;
  let bonusReasons = [];
  
  // 根據不同指標類型設定獎勵機制
  switch (metricType) {
    case 'workCompletion':
      if (percentage >= 95) {
        bonusPoints += 2;
        bonusReasons.push('超越目標獎勵 +2分');
      }
      break;
    case 'quality':
      if (percentage >= 98) {
        bonusPoints += 3;
        bonusReasons.push('零缺陷獎勵 +3分');
      } else if (percentage >= 95) {
        bonusPoints += 1;
        bonusReasons.push('高品質獎勵 +1分');
      }
      break;
    case 'attendance':
      if (percentage >= 98) {
        bonusPoints += 2;
        bonusReasons.push('全勤獎勵 +2分');
      }
      break;
    default:
      if (percentage >= 95) {
        bonusPoints += 1;
        bonusReasons.push('優秀表現獎勵 +1分');
      }
  }
  
  return {
    baseScore,
    bonusPoints,
    finalScore: Math.min(100, baseScore + bonusPoints),
    bonusReasons
  };
};

/**
 * 獲取完整的績效分析報告
 * @param {number} percentage - 百分比
 * @param {string} metricType - 指標類型
 * @param {string} metricTitle - 指標名稱
 * @returns {object} 完整分析報告
 */
export const getPerformanceAnalysis = (percentage, metricType, metricTitle) => {
  const scoreData = convertPercentageToScore(percentage);
  const upgradeInfo = getUpgradeInfo(percentage);
  const bonusInfo = getBonusPenaltyInfo(percentage, metricType);
  
  return {
    basic: {
      percentage,
      score: scoreData.score,
      grade: scoreData.grade,
      range: scoreData.range,
      description: scoreData.gradeDescription
    },
    bonus: bonusInfo,
    upgrade: upgradeInfo,
    recommendations: getImprovementRecommendations(percentage, metricType, metricTitle)
  };
};

/**
 * 獲取改進建議
 * @param {number} percentage - 百分比
 * @param {string} metricType - 指標類型
 * @param {string} metricTitle - 指標名稱
 * @returns {array} 改進建議列表
 */
export const getImprovementRecommendations = (percentage, metricType, metricTitle) => {
  const recommendations = [];
  
  if (percentage >= 95) {
    recommendations.push(`${metricTitle}表現優異，建議持續保持並協助其他同仁提升`);
    recommendations.push('可考慮分享成功經驗，成為團隊標竿');
  } else if (percentage >= 90) {
    recommendations.push(`${metricTitle}表現良好，距離優秀還有一步之遙`);
    recommendations.push('建議針對細節進一步優化，力求完美');
  } else if (percentage >= 80) {
    recommendations.push(`${metricTitle}達到基本標準，但仍有提升空間`);
    recommendations.push('建議設定階段性目標，逐步提升至90%以上');
  } else if (percentage >= 70) {
    recommendations.push(`${metricTitle}需要重點改進`);
    recommendations.push('建議參加相關培訓課程，加強專業技能');
  } else {
    recommendations.push(`${metricTitle}急需改進`);
    recommendations.push('建議立即制定改進計劃，並尋求主管或同事協助');
  }
  
  return recommendations;
}; 

/**
 * 獲取完整的分數明細分解
 * 將原本在 PerformanceDashboard.js 中的 getScoreBreakdown 邏輯移到這裡
 * @param {object} metric - 指標對象
 * @param {object} data - 員工數據
 * @returns {object} 分數明細
 */
export const getScoreBreakdown = (metric, data) => {
  const calculateFinalScore = (baseScore, adjustments) => {
    // 確保baseScore是有效數值
    const validBaseScore = isNaN(baseScore) || baseScore === null || baseScore === undefined ? 0 : baseScore;

    const totalAdjustments = adjustments.reduce(
      (sum, adj) => sum + (adj.score || 0),
      0,
    );

    const finalScore = validBaseScore + totalAdjustments;
    return Math.min(100, Math.max(0, finalScore));
  };

  switch (metric.id) {
    case "workCompletion":
      const workCompletionAdjustments = [
        {
          reason: "目標達成獎勵",
          score: data.workCompletion >= 95 ? 5 : 0,
          description: "超過95%目標完成率的額外獎勵",
        },
      ];
      return {
        baseScore: data?.workCompletion || 0,
        adjustments: workCompletionAdjustments,
        finalScore: calculateFinalScore(
          data?.workCompletion || 0,
          workCompletionAdjustments,
        ),
      };

    case "quality":
      const qualityAdjustments = [
        {
          reason: "品質穩定度",
          score: (data?.productQuality || 0) >= 90 ? 3 : 0,
          description: "連續保持90%以上的品質水準",
        },
        {
          reason: "零缺陷生產",
          score: (data?.productQuality || 0) >= 95 ? 2 : 0,
          description: "達成零缺陷生產目標",
        },
      ];
      return {
        baseScore: data?.productQuality || 0,
        adjustments: qualityAdjustments,
        finalScore: calculateFinalScore(
          data?.productQuality || 0,
          qualityAdjustments,
        ),
      };

    case "workHours":
      const standardHours = data?.standardHours || 176;
      const actualHours = data?.actualHours || 0;
      const baseScore = Math.round((actualHours / standardHours) * 100);

      const workHoursAdjustments = [
        {
          reason: "效率提升",
          score: data?.efficiency >= 90 ? 3 : 0,
          description: "工作效率超過90%",
        },
        {
          reason: "時間管理",
          score: data?.attendance >= 95 ? 2 : 0,
          description: "優秀的時間管理表現",
        },
      ];

      return {
        baseScore: baseScore,
        calculation: {
          formula: "(實際工時 / 標準工時) × 100",
          details: [
            {
              label: "標準工時",
              value: `${standardHours}小時`,
            },
            {
              label: "實際工時",
              value: `${actualHours}小時`,
            },
            {
              label: "計算過程",
              value: `(${actualHours} / ${standardHours}) × 100 = ${baseScore}分`,
            },
          ],
        },
        adjustments: workHoursAdjustments,
        finalScore: calculateFinalScore(baseScore, workHoursAdjustments),
      };

    case "attendance":
      const attendanceAdjustments = [
        {
          reason: "全勤獎勵",
          score: (data?.attendance || 0) >= 98 ? 2 : 0,
          description: "月度全勤表現",
        },
      ];
      return {
        baseScore: data?.attendance || 0,
        adjustments: attendanceAdjustments,
        finalScore: calculateFinalScore(data?.attendance || 0, attendanceAdjustments),
      };

    case "machineStatus":
      const machineStatusAdjustments = [
        {
          reason: "設備優化",
          score: (data?.machineStatus || 0) >= 95 ? 3 : 0,
          description: "設備運行效率優化",
        },
        {
          reason: "預防維護",
          score: (data?.maintenanceRecord || 0) >= 90 ? 2 : 0,
          description: "執行預防性維護工作",
        },
      ];
      return {
        baseScore: data?.machineStatus || 0,
        adjustments: machineStatusAdjustments,
        finalScore: calculateFinalScore(
          data?.machineStatus || 0,
          machineStatusAdjustments,
        ),
      };

    case "maintenance":
      const maintenanceAdjustments = [
        {
          reason: "預防性維護",
          score: data?.preventiveMaintenance ? 2 : 0,
          description: "執行預防性維護計劃",
        },
        {
          reason: "設備效能提升",
          score: (data?.machineStatus || 0) >= 90 ? 2 : 0,
          description: "提升設備運行效能",
        },
      ];
      return {
        baseScore: data?.maintenanceRecord || 0,
        adjustments: maintenanceAdjustments,
        finalScore: calculateFinalScore(
          data?.maintenanceRecord || 0,
          maintenanceAdjustments,
        ),
      };

    case "targetAchievement":
      const targetAchievementAdjustments = [
        {
          reason: "超額完成",
          score: (data?.targetAchievement || 0) >= 95 ? 3 : 0,
          description: "超過預期目標的表現",
        },
        {
          reason: "持續改善",
          score: (data?.efficiency || 0) >= 90 ? 2 : 0,
          description: "持續改善流程效率",
        },
      ];
      return {
        baseScore: data?.targetAchievement || 0,
        adjustments: targetAchievementAdjustments,
        finalScore: calculateFinalScore(
          data?.targetAchievement || 0,
          targetAchievementAdjustments,
        ),
      };

    case "kpi":
      const kpiAdjustments = [
        {
          reason: "績效卓越",
          score: (data?.kpi || 0) >= 95 ? 3 : 0,
          description: "卓越的關鍵績效表現",
        },
        {
          reason: "團隊貢獻",
          score: (data?.teamwork || 0) >= 90 ? 2 : 0,
          description: "對團隊績效的正面貢獻",
        },
      ];
      return {
        baseScore: data?.kpi || 0,
        adjustments: kpiAdjustments,
        finalScore: calculateFinalScore(data?.kpi || 0, kpiAdjustments),
      };

    case "efficiency":
      const efficiencyAdjustments = [
        {
          reason: "流程優化",
          score: (data?.efficiency || 0) >= 95 ? 3 : 0,
          description: "工作流程優化表現",
        },
        {
          reason: "創新改善",
          score: (data?.innovation || 0) >= 85 ? 2 : 0,
          description: "創新改善提案貢獻",
        },
      ];
      return {
        baseScore: data?.efficiency || 0,
        adjustments: efficiencyAdjustments,
        finalScore: calculateFinalScore(data?.efficiency || 0, efficiencyAdjustments),
      };

    default:
      return {
        baseScore: 0,
        adjustments: [],
        finalScore: 0,
      };
  }
}; 