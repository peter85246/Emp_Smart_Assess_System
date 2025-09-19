// 評分標準配置
export const scoringConfig = {
  // 1. 目標達成率評估 (40%)
  targetAchievement: {
    workCompletion: {
      description: "工作達成率",
      scoring: {
        excellent: { threshold: 95, score: 100 }, // 超越目標
        good: { threshold: 90, score: 90 }, // 達成目標
        fair: { threshold: 85, score: 80 }, // 接近目標
        poor: { threshold: 80, score: 70 }, // 未達目標
      },
      weight: 0.4,
    },
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
        poor: { threshold: 85, score: 70 },
      },
    },
    attendance: {
      description: "出勤率",
      weight: 0.1,
      scoring: {
        excellent: { threshold: 98, score: 100 },
        good: { threshold: 95, score: 90 },
        fair: { threshold: 90, score: 80 },
        poor: { threshold: 85, score: 70 },
      },
    },
    maintenance: {
      description: "設備維護率",
      weight: 0.1,
      scoring: {
        excellent: { threshold: 95, score: 100 },
        good: { threshold: 90, score: 90 },
        fair: { threshold: 85, score: 80 },
        poor: { threshold: 80, score: 70 },
      },
    },
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
        poor: { threshold: 80, score: 70 },
      },
      overtimeBonus: 0.5, // 每小時加班的額外分數
      maxOvertimeBonus: 10, // 最高加班額外分數
      overtimeImpact: {
        perHourPenalty: 0.5, // 每小時加班的疲勞度扣分
        maxPenalty: 10, // 最高疲勞度扣分
      },
    },
    resourceUtilization: {
      description: "資源使用效率",
      weight: 0.1,
      scoring: {
        excellent: { threshold: 95, score: 100 },
        good: { threshold: 90, score: 90 },
        fair: { threshold: 85, score: 80 },
        poor: { threshold: 80, score: 70 },
      },
    },
  },

  // 角色權重調整
  roleWeightAdjustment: {
    // 操作員
    operator: {
      targetAchievement: 0.35,
      kpi: 0.35,
      efficiency: 0.3,
    },
    // 技術員
    technician: {
      targetAchievement: 0.3,
      kpi: 0.4,
      efficiency: 0.3,
    },
    // 主管
    supervisor: {
      targetAchievement: 0.3,
      kpi: 0.35,
      efficiency: 0.35,
    },
  },
};

/**
 * ============================================
 * 詳細計算公式配置
 * ============================================
 * 根據生產數據與資料來源欄位的對應關係
 * 提供完整的百分比計算方式說明
 */
export const calculationFormulas = {
  // 工作完成量計算
  workCompletion: {
    title: "工作完成量",
    dataSource: "工單系統的狀態統計（已完成、進行中）",
    needsCalculation: true,
    formula: "完成率 = 已完成工單數 / (進行中+已完成工單數) × 100%",
    description: "衡量工作完成情況"
  },

  // 工作時間計算
  workHoursEfficiency: {
    title: "工作時間",
    dataSource: "工單系統的開始與結束時間記錄",
    needsCalculation: true,
    formula: "總工時 = 所有工單的工作時間總和",
    description: "計算實際工作時間"
  },

  // 機台狀態計算
  machineOperationRate: {
    title: "機台狀態",
    dataSource: "機台運轉記錄系統",
    needsCalculation: true,
    formula: "計算項目：\n- 今日使用的機台數量\n- 機台實際運轉時間\n- 目前運轉狀態",
    description: "追蹤機台使用情況"
  },

  // 機台維護計算
  maintenanceAnomalyRate: {
    title: "機台維護",
    dataSource: "維護作業紀錄系統",
    needsCalculation: true,
    formula: "統計當日維護作業次數",
    description: "記錄維護工作執行情況"
  },

  // 目標達成率計算
  targetAchievement: {
    title: "目標達成率(OTD)",
    dataSource: "訂單完成與交期記錄",
    needsCalculation: true,
    formula: "準時達交率 = 準時完成數量 / 總訂單數量 × 100%",
    description: "評估訂單準時完成情況"
  },

  // 效率指標計算
  efficiency: {
    title: "效率指標",
    dataSource: "生產數量與工時統計",
    needsCalculation: true,
    formula: "單位效率 = 總生產數量 / 總工時",
    description: "評估生產效率"
  },

  // KPI 計算
  kpiOverall: {
    title: "關鍵績效指標(KPI)",
    dataSource: "綜合三項指標評估",
    needsCalculation: true,
    formula: "KPI = (工作完成率 + 準時達交率 + 效率達成率) / 3",
    description: "綜合績效評估"
  },

  // 差勤紀錄計算
  attendance: {
    title: "差勤紀錄",
    dataSource: "每日工作日誌填寫記錄",
    needsCalculation: true,
    formula: "出勤率 = 已填寫日誌天數 / 當月工作天數",
    description: "追蹤工作日誌填寫情況"
  },

  // 產品質量計算
  productQuality: {
    title: "產品質量",
    dataSource: "生產製程品質記錄",
    needsCalculation: true,
    formula: "良率 = 品檢合格數量 / 總生產數量 × 100%",
    description: "評估產品品質水準"
  }
};

/**
 * ============================================
 * 獎懲機制與等級標準配置
 * ============================================
 */
export const gradingStandards = {
  // 五級評等標準
  gradeRanges: {
    A: { min: 90, max: 100, label: "優秀表現", color: "green", description: "超越預期，可作為標竿" },
    B: { min: 80, max: 89, label: "良好表現", color: "blue", description: "符合預期，表現穩定" },
    C: { min: 70, max: 79, label: "待改進表現", color: "yellow", description: "基本合格，需要改善" },
    D: { min: 60, max: 69, label: "需加強表現", color: "orange", description: "未達標準，需要協助" },
    E: { min: 0, max: 59, label: "急需改進", color: "red", description: "嚴重落後，需立即介入" }
  },

  // 獎懲機制配置
  bonusPenaltyRules: {
    workCompletion: {
      bonuses: [
        { threshold: 100, points: 5, reason: "完美達成" },
        { threshold: 95, points: 2, reason: "超越目標" }
      ],
      penalties: [
        { threshold: 60, points: -5, reason: "嚴重落後" }
      ]
    },
    quality: {
      bonuses: [
        { threshold: 98, points: 3, reason: "零缺陷品質" },
        { threshold: 95, points: 1, reason: "高品質標準" }
      ],
      penalties: [
        { threshold: 70, points: -3, reason: "品質不穩定" }
      ]
    },
    attendance: {
      bonuses: [
        { threshold: 100, points: 3, reason: "全勤表現" },
        { threshold: 98, points: 1, reason: "近乎全勤" }
      ],
      penalties: [
        { threshold: 80, points: -2, reason: "出勤不穩定" }
      ]
    },
    machineStatus: {
      bonuses: [
        { threshold: 95, points: 3, reason: "設備效率優化" },
        { threshold: 90, points: 1, reason: "穩定運行" }
      ],
      penalties: [
        { threshold: 70, points: -3, reason: "稼動率過低" }
      ]
    },
    maintenance: {
      bonuses: [
        { threshold: 95, points: 2, reason: "預防維護優秀" },
        { threshold: 90, points: 1, reason: "維護及時" }
      ],
      penalties: [
        { threshold: 70, points: -3, reason: "維護不當" }
      ]
    }
  }
};

/**
 * ============================================
 * 數據來源與系統整合配置
 * ============================================
 */
export const dataSourceMapping = {
  // API端點對應表
  apiEndpoints: {
    workCompletion: "/api/production/completion",
    quality: "/api/quality/metrics", 
    workHours: "/api/time/efficiency",
    attendance: "/api/hr/attendance",
    machineStatus: "/api/equipment/status",
    maintenance: "/api/equipment/maintenance",
    targetAchievement: "/api/targets/achievement",
    kpi: "/api/analytics/kpi"
  },

  // 資料庫表格對應
  databaseTables: {
    workCompletion: ["purchase_order_items", "works_orders_processing"],
    quality: ["works_orders_processing", "quality_control"],
    workHours: ["works_orders_processing", "time_tracking"],
    attendance: ["works_orders_processing", "employee_attendance"],
    machineStatus: ["UrTable", "equipment_status"],
    maintenance: ["UrTable", "maintenance_logs"],
    targetAchievement: ["purchase_order_items", "production_targets"],
    kpi: ["綜合數據"]
  },

  // 欄位對應表
  fieldMappings: {
    workCompletion: {
      completed: "produced_quantity",
      target: "purchase_order_items.quantity",
      employee: "works_orders_processing.employee_id"
    },
    quality: {
      completedOrders: "COUNT(works_orders_processing.status='完成')",
      totalOrders: "COUNT(works_orders_processing.id)",
      employee: "works_orders_processing.employee_id"
    },
    machineStatus: {
      runningTime: "SUM(UrTable.Interval WHERE Status='Running')",
      totalTime: "SUM(UrTable.Interval)",
      equipment: "UrTable.equipment_id"
    },
    maintenance: {
      alarmTime: "SUM(UrTable.Interval WHERE Status='Alarm')",
      totalTime: "SUM(UrTable.Interval)",
      equipment: "UrTable.equipment_id"
    }
  }
};

/**
 * ============================================
 * 效能最佳化與快取配置
 * ============================================
 */
export const performanceConfig = {
  // 快取設定
  cacheSettings: {
    employeeDataTTL: 300, // 5分鐘
    historicalDataTTL: 3600, // 1小時
    aggregatedDataTTL: 1800 // 30分鐘
  },

  // 批次處理設定
  batchProcessing: {
    maxBatchSize: 100,
    processingInterval: 60000, // 1分鐘
    retryAttempts: 3
  },

  // 即時更新設定
  realTimeUpdate: {
    enabled: true,
    updateInterval: 30000, // 30秒
    criticalMetrics: ["machineStatus", "quality"]
  }
};

/**
 * 獲取指定指標的詳細計算公式
 * @param {string} metricId - 指標ID
 * @returns {object} 包含完整計算公式資訊的物件
 */
export const getDetailedCalculationFormula = (metricId) => {
  const formulaMap = {
    'workCompletion': calculationFormulas.workCompletion,
    'quality': calculationFormulas.productQuality, 
    'workHours': calculationFormulas.workHoursEfficiency,
    'attendance': calculationFormulas.attendance,
    'machineStatus': calculationFormulas.machineOperationRate,
    'maintenance': calculationFormulas.maintenanceAnomalyRate,
    'targetAchievement': calculationFormulas.targetAchievement,
    'kpi': calculationFormulas.kpiOverall,
    'efficiency': {
      title: "效率指標",
      dataSource: "works_orders_processing, time_tracking",
      formula: "實際效率 / 標準效率 × 100",
      description: "比較實際工作效率與標準效率的比值",
      example: "如實際效率1.2，標準效率1.0，則效率指標 = 1.2/1.0 × 100 = 120%"
    }
  };
  
  return formulaMap[metricId] || {
    title: "未定義指標",
    formula: "計算公式未定義",
    description: "請聯繫系統管理員補充計算公式"
  };
};

/**
 * 獲取指標的獎懲規則
 * @param {string} metricId - 指標ID
 * @param {number} score - 分數
 * @returns {object} 獎懲資訊
 */
export const getBonusPenaltyRules = (metricId, score) => {
  const rules = gradingStandards.bonusPenaltyRules[metricId];
  if (!rules) return { bonus: 0, penalty: 0, reasons: [] };

  let totalAdjustment = 0;
  const reasons = [];

  // 檢查獎勵條件
  if (rules.bonuses) {
    for (const bonus of rules.bonuses) {
      if (score >= bonus.threshold) {
        totalAdjustment += bonus.points;
        reasons.push(`${bonus.reason} +${bonus.points}分`);
        break; // 只適用最高獎勵
      }
    }
  }

  // 檢查懲罰條件
  if (rules.penalties) {
    for (const penalty of rules.penalties) {
      if (score <= penalty.threshold) {
        totalAdjustment += penalty.points;
        reasons.push(`${penalty.reason} ${penalty.points}分`);
        break; // 只適用最嚴重懲罰
      }
    }
  }

  return {
    adjustment: totalAdjustment,
    finalScore: Math.max(0, Math.min(100, score + totalAdjustment)),
    reasons: reasons
  };
};
