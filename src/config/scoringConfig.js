// 評分標準配置
export const scoringConfig = {
  // 1. 目標達成率評估 (40%)
  targetAchievement: {
    workCompletion: {
      description: "工作達成率",
      scoring: {
        excellent: { threshold: 95, score: 100 }, // 超越目標
        good: { threshold: 90, score: 90 },      // 達成目標
        fair: { threshold: 85, score: 80 },      // 接近目標
        poor: { threshold: 80, score: 70 }       // 未達目標
      },
      weight: 0.4
    }
  },

  // 2. KPI指標評估 (35%)
  kpiMetrics: {
    quality: {
      description: "品質達成率",
      weight: 0.15,
      scoring: {
        excellent: { threshold: 98, score: 100 },
        good: { threshold: 95, score: 90 },
        fair: { threshold: 90, score: 80 },
        poor: { threshold: 85, score: 70 }
      }
    },
    attendance: {
      description: "出勤率",
      weight: 0.1,
      scoring: {
        excellent: { threshold: 98, score: 100 },
        good: { threshold: 95, score: 90 },
        fair: { threshold: 90, score: 80 },
        poor: { threshold: 85, score: 70 }
      }
    },
    maintenance: {
      description: "設備維護率",
      weight: 0.1,
      scoring: {
        excellent: { threshold: 95, score: 100 },
        good: { threshold: 90, score: 90 },
        fair: { threshold: 85, score: 80 },
        poor: { threshold: 80, score: 70 }
      }
    }
  },

  // 3. 效率指標評估 (25%)
  efficiency: {
    timeManagement: {
      description: "時間效率",
      weight: 0.15,
      scoring: {
        excellent: { threshold: 95, score: 100 },
        good: { threshold: 90, score: 90 },
        fair: { threshold: 85, score: 80 },
        poor: { threshold: 80, score: 70 }
      },
      overtimeBonus: 0.5, // 每小時加班的額外分數
      maxOvertimeBonus: 10, // 最高加班額外分數
      overtimeImpact: {
        perHourPenalty: 0.5, // 每小時加班的疲勞度扣分
        maxPenalty: 10 // 最高疲勞度扣分
      }
    },
    resourceUtilization: {
      description: "資源使用效率",
      weight: 0.1,
      scoring: {
        excellent: { threshold: 95, score: 100 },
        good: { threshold: 90, score: 90 },
        fair: { threshold: 85, score: 80 },
        poor: { threshold: 80, score: 70 }
      }
    }
  },

  // 角色權重調整
  roleWeightAdjustment: {
    // 操作員
    operator: {
      targetAchievement: 0.35,
      kpi: 0.35,
      efficiency: 0.30
    },
    // 技術員
    technician: {
      targetAchievement: 0.30,
      kpi: 0.40,
      efficiency: 0.30
    },
    // 主管
    supervisor: {
      targetAchievement: 0.30,
      kpi: 0.35,
      efficiency: 0.35
    }
  }
}; 