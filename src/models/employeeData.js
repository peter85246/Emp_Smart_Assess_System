/**
 * 員工數據模型
 * 用途：
 * 1. 開發環境模擬數據
 * 2. 數據結構參考
 * 3. 單元測試用例
 * 4. API 後備數據
 *
 * 使用位置：
 * - PerformanceDashboard 組件
 * - performanceAPI 服務
 * - PerformanceEvaluator 工具類
 * - 單元測試
 */
export const mockEmployeeData = {
  EMP001: {
    // 基本績效指標
    workCompletion: 92,
    productQuality: 95,
    attendance: 98,
    machineStatus: 94,
    maintenanceRecord: 92,

    // 新增：加班記錄
    overtimeHours: 5,

    // 新增：入職月份（用於計算推廣加成）
    monthInRole: "firstMonth",

    // 新增：特殊貢獻記錄
    contributions: {
      processImprovement: 2, // 完成2次製程改善
      qualityEnhancement: 1, // 完成1次品質提升
      costReduction: 1, // 完成1次成本降低
    },

    // 歷史數據
    historicalData: [
      { month: "1月", completion: 88, quality: 92, efficiency: 90 },
      { month: "2月", completion: 90, quality: 93, efficiency: 91 },
      { month: "3月", completion: 92, quality: 95, efficiency: 93 },
      { month: "4月", completion: 91, quality: 94, efficiency: 92 },
      { month: "5月", completion: 93, quality: 96, efficiency: 94 },
      { month: "6月", completion: 94, quality: 97, efficiency: 95 },
      { month: "7月", completion: 95, quality: 98, efficiency: 96 },
      { month: "8月", completion: 93, quality: 96, efficiency: 94 },
      { month: "9月", completion: 94, quality: 97, efficiency: 95 },
      { month: "10月", completion: 96, quality: 98, efficiency: 97 },
      { month: "11月", completion: 95, quality: 97, efficiency: 96 },
      { month: "12月", completion: 97, quality: 99, efficiency: 98 },
    ],
  },

  EMP002: {
    // 基本績效指標
    workCompletion: 92,
    productQuality: 95,
    attendance: 98,
    machineStatus: 94,
    maintenanceRecord: 92,

    // 新增：加班記錄
    overtimeHours: 5,

    // 新增：入職月份（用於計算推廣加成）
    monthInRole: "firstMonth",

    // 新增：特殊貢獻記錄
    contributions: {
      processImprovement: 2, // 完成2次製程改善
      qualityEnhancement: 1, // 完成1次品質提升
      costReduction: 1, // 完成1次成本降低
    },

    // 歷史數據
    historicalData: [
      { month: "1月", completion: 82, quality: 85, efficiency: 83 },
      { month: "2月", completion: 84, quality: 86, efficiency: 84 },
      { month: "3月", completion: 85, quality: 88, efficiency: 85 },
      { month: "4月", completion: 83, quality: 87, efficiency: 84 },
      { month: "5月", completion: 86, quality: 89, efficiency: 86 },
      { month: "6月", completion: 87, quality: 90, efficiency: 87 },
      { month: "7月", completion: 88, quality: 91, efficiency: 88 },
      { month: "8月", completion: 86, quality: 89, efficiency: 87 },
      { month: "9月", completion: 87, quality: 90, efficiency: 88 },
      { month: "10月", completion: 89, quality: 92, efficiency: 90 },
      { month: "11月", completion: 88, quality: 91, efficiency: 89 },
      { month: "12月", completion: 90, quality: 93, efficiency: 91 },
    ],
  },

  EMP003: {
    // 基本績效指標
    workCompletion: 92,
    productQuality: 95,
    attendance: 98,
    machineStatus: 94,
    maintenanceRecord: 92,

    // 新增：加班記錄
    overtimeHours: 5,

    // 新增：入職月份（用於計算推廣加成）
    monthInRole: "firstMonth",

    // 新增：特殊貢獻記錄
    contributions: {
      processImprovement: 2, // 完成2次製程改善
      qualityEnhancement: 1, // 完成1次品質提升
      costReduction: 1, // 完成1次成本降低
    },

    // 歷史數據
    historicalData: [
      { month: "1月", completion: 75, quality: 80, efficiency: 76 },
      { month: "2月", completion: 76, quality: 81, efficiency: 77 },
      { month: "3月", completion: 78, quality: 82, efficiency: 78 },
      { month: "4月", completion: 77, quality: 81, efficiency: 77 },
      { month: "5月", completion: 79, quality: 83, efficiency: 79 },
      { month: "6月", completion: 80, quality: 84, efficiency: 80 },
      { month: "7月", completion: 81, quality: 85, efficiency: 81 },
      { month: "8月", completion: 79, quality: 83, efficiency: 80 },
      { month: "9月", completion: 80, quality: 84, efficiency: 81 },
      { month: "10月", completion: 82, quality: 86, efficiency: 83 },
      { month: "11月", completion: 81, quality: 85, efficiency: 82 },
      { month: "12月", completion: 83, quality: 87, efficiency: 84 },
    ],
  },
};
