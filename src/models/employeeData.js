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
    monthInRole: 'firstMonth',
    
    // 新增：特殊貢獻記錄
    contributions: {
      processImprovement: 2,  // 完成2次製程改善
      qualityEnhancement: 1,  // 完成1次品質提升
      costReduction: 1        // 完成1次成本降低
    },

    // 歷史數據
    historicalData: [
      { month: '1月', completion: 88, quality: 92, efficiency: 90 },
      { month: '2月', completion: 90, quality: 93, efficiency: 91 },
      { month: '3月', completion: 92, quality: 95, efficiency: 93 }
    ]
  }
}; 