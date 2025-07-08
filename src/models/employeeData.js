/**
 * 員工數據模型
 * 重新平衡後的員工數據，確保各員工符合指定的等級分配
 * 基於實際測試結果精確調整所有加分邏輯
 */

/**
 * 等級分配目標：
 * 張小明 (A級為主)：6A + 2B + 1C  
 * 李小華 (B級為主)：3A + 4B + 2C
 * 王大明 (C級為主)：2A + 2B + 4C + 1D
 * 陳小芳 (D級為主)：1A + 2B + 2C + 3D + 1E
 * 林小強 (E級為主)：0A + 1B + 2C + 3D + 3E
 */

export const mockEmployeeData = {
  // 張小明：6A + 2B + 1C (優秀員工)
  EMP001: {
    // A級指標：6項（最終分數90-100分）
    workCompletion: 95,      // 95+5=100 (A級) ✓
    productQuality: 90,      // 90+3=93 (A級) - 直接設為90觸發加分
    attendance: 98,          // 98+2=100 (A級) - 直接設為98觸發加分
    machineStatus: 95,       // 95+3=98 (A級) - 直接設為95觸發加分，不依賴其他
    targetAchievement: 95,   // 95+3=98 (A級) - 直接設為95觸發加分，不依賴其他
    kpi: 88,                // 88+0+2=90 (A級) - 依賴teamwork>=90加分
    
    // B級指標：2項（最終分數80-89分）
    maintenanceRecord: 85,   // 85+2+2=89 (B級) - preventiveMaintenance+2，machineStatus>=90+2
    efficiency: 86,         // 86+0+0=86 (B級) - resourceUtilization<90，不加分
    
    // C級指標：1項（最終分數70-79分）
    // workHours特殊計算：需要75分，標準工時176，實際工時需要132小時
    
    // 其他輔助數據（確保加分條件滿足）
    overtimeHours: 3,
    standardHours: 176,
    actualHours: 132,       // (132/176)*100 = 75分 (C級)
    teamwork: 95,           // 支援kpi加分 >=90
    resourceUtilization: 85, // <90，所以efficiency不加分
    preventiveMaintenance: true, // 支援maintenance加分
    
    monthInRole: "experienced",
    contributions: {
      processImprovement: 3,
      qualityEnhancement: 2,
      costReduction: 2,
    },

    // 歷史數據（2024年）
    historicalData: [
      { month: "1月", completion: 89, quality: 86, efficiency: 82 },
      { month: "2月", completion: 90, quality: 87, efficiency: 83 },
      { month: "3月", completion: 91, quality: 88, efficiency: 84 },
      { month: "4月", completion: 90, quality: 87, efficiency: 83 },
      { month: "5月", completion: 92, quality: 89, efficiency: 85 },
      { month: "6月", completion: 93, quality: 90, efficiency: 86 },
      { month: "7月", completion: 92, quality: 89, efficiency: 85 },
      { month: "8月", completion: 91, quality: 88, efficiency: 84 },
      { month: "9月", completion: 92, quality: 89, efficiency: 85 },
      { month: "10月", completion: 93, quality: 90, efficiency: 86 },
      { month: "11月", completion: 91, quality: 88, efficiency: 84 },
      { month: "12月", completion: 90, quality: 87, efficiency: 83 },
    ],
    
    // 多年歷史數據（完整支援所有9個指標）
    yearlyData: {
      2025: [
        { month: "1月", completion: 92, quality: 89, efficiency: 85, workHours: 74, attendance: 97, machineStatus: 93, maintenance: 83, targetAchievement: 92, kpi: 86 },
        { month: "2月", completion: 93, quality: 90, efficiency: 86, workHours: 75, attendance: 98, machineStatus: 94, maintenance: 84, targetAchievement: 93, kpi: 87 },
        { month: "3月", completion: 92, quality: 89, efficiency: 85, workHours: 74, attendance: 97, machineStatus: 93, maintenance: 83, targetAchievement: 92, kpi: 86 },
        { month: "4月", completion: 93, quality: 90, efficiency: 86, workHours: 75, attendance: 98, machineStatus: 94, maintenance: 84, targetAchievement: 93, kpi: 87 },
        { month: "5月", completion: 94, quality: 91, efficiency: 87, workHours: 76, attendance: 99, machineStatus: 95, maintenance: 85, targetAchievement: 94, kpi: 88 },
        { month: "6月", completion: 93, quality: 90, efficiency: 86, workHours: 75, attendance: 98, machineStatus: 94, maintenance: 84, targetAchievement: 93, kpi: 87 },
        { month: "7月", completion: 95, quality: 88, efficiency: 86, workHours: 75, attendance: 98, machineStatus: 95, maintenance: 85, targetAchievement: 95, kpi: 88 },
      ],
      2024: [
        { month: "1月", completion: 89, quality: 86, efficiency: 82 },
        { month: "2月", completion: 90, quality: 87, efficiency: 83 },
        { month: "3月", completion: 91, quality: 88, efficiency: 84 },
        { month: "4月", completion: 90, quality: 87, efficiency: 83 },
        { month: "5月", completion: 92, quality: 89, efficiency: 85 },
        { month: "6月", completion: 93, quality: 90, efficiency: 86 },
        { month: "7月", completion: 92, quality: 89, efficiency: 85 },
        { month: "8月", completion: 91, quality: 88, efficiency: 84 },
        { month: "9月", completion: 92, quality: 89, efficiency: 85 },
        { month: "10月", completion: 93, quality: 90, efficiency: 86 },
        { month: "11月", completion: 91, quality: 88, efficiency: 84 },
        { month: "12月", completion: 90, quality: 87, efficiency: 83 },
      ],
      2023: [
        { month: "1月", completion: 84, quality: 81, efficiency: 77 },
        { month: "2月", completion: 85, quality: 82, efficiency: 78 },
        { month: "3月", completion: 86, quality: 83, efficiency: 79 },
        { month: "4月", completion: 85, quality: 82, efficiency: 78 },
        { month: "5月", completion: 87, quality: 84, efficiency: 80 },
        { month: "6月", completion: 88, quality: 85, efficiency: 81 },
        { month: "7月", completion: 87, quality: 84, efficiency: 80 },
        { month: "8月", completion: 86, quality: 83, efficiency: 79 },
        { month: "9月", completion: 87, quality: 84, efficiency: 80 },
        { month: "10月", completion: 88, quality: 85, efficiency: 81 },
        { month: "11月", completion: 86, quality: 83, efficiency: 79 },
        { month: "12月", completion: 89, quality: 86, efficiency: 82 },
      ],
      2022: [
        { month: "1月", completion: 79, quality: 76, efficiency: 72 },
        { month: "2月", completion: 80, quality: 77, efficiency: 73 },
        { month: "3月", completion: 81, quality: 78, efficiency: 74 },
        { month: "4月", completion: 80, quality: 77, efficiency: 73 },
        { month: "5月", completion: 82, quality: 79, efficiency: 75 },
        { month: "6月", completion: 83, quality: 80, efficiency: 76 },
        { month: "7月", completion: 82, quality: 79, efficiency: 75 },
        { month: "8月", completion: 81, quality: 78, efficiency: 74 },
        { month: "9月", completion: 82, quality: 79, efficiency: 75 },
        { month: "10月", completion: 83, quality: 80, efficiency: 76 },
        { month: "11月", completion: 81, quality: 78, efficiency: 74 },
        { month: "12月", completion: 84, quality: 81, efficiency: 77 },
      ]
    }
  },

  // 李小華：3A + 4B + 2C (良好員工)
  EMP002: {
    // A級指標：3項（最終分數90-100分）
    workCompletion: 95,      // 95+5=100 (A級)
    productQuality: 90,      // 90+3=93 (A級) - 因為>=90加3分
    attendance: 98,          // 98+2=100 (A級) - 因為>=98加2分
    
    // B級指標：4項（最終分數80-89分）
    machineStatus: 86,       // 86+0+0=86 (B級) - maintenanceRecord<90，不加分
    targetAchievement: 83,   // 83+0+0=83 (B級) - efficiency<90，不加分
    kpi: 83,                // 83+0+2=85 (B級) - teamwork>=90加2分
    efficiency: 82,         // 82+0+2=84 (B級) - resourceUtilization>=90加2分
    
    // C級指標：2項（最終分數70-79分）
    maintenanceRecord: 73,   // 73+2+0=75 (C級) - preventiveMaintenance+2，machineStatus<90不加分
    // workHours特殊計算：需要75分，標準工時176，實際工時需要132小時

    overtimeHours: 5,
    standardHours: 176,
    actualHours: 132,       // (132/176)*100 = 75分 (C級)
    teamwork: 94,           // 支援kpi加分 >=90
    resourceUtilization: 92, // 支援efficiency加分 >=90
    preventiveMaintenance: true, // 支援maintenance加分
    
    monthInRole: "intermediate",
    contributions: {
      processImprovement: 1,
      qualityEnhancement: 1,
      costReduction: 0,
    },

    historicalData: [
      { month: "1月", completion: 86, quality: 83, efficiency: 76 },
      { month: "2月", completion: 87, quality: 84, efficiency: 77 },
      { month: "3月", completion: 88, quality: 85, efficiency: 78 },
      { month: "4月", completion: 87, quality: 84, efficiency: 77 },
      { month: "5月", completion: 89, quality: 86, efficiency: 79 },
      { month: "6月", completion: 90, quality: 87, efficiency: 80 },
      { month: "7月", completion: 89, quality: 86, efficiency: 79 },
      { month: "8月", completion: 88, quality: 85, efficiency: 78 },
      { month: "9月", completion: 89, quality: 86, efficiency: 79 },
      { month: "10月", completion: 90, quality: 87, efficiency: 80 },
      { month: "11月", completion: 88, quality: 85, efficiency: 78 },
      { month: "12月", completion: 95, quality: 88, efficiency: 82 },
    ],

    yearlyData: {
      2025: [
        { month: "1月", completion: 89, quality: 86, efficiency: 79, workHours: 74, attendance: 96, machineStatus: 84, maintenance: 71, targetAchievement: 81, kpi: 81 },
        { month: "2月", completion: 90, quality: 87, efficiency: 80, workHours: 75, attendance: 97, machineStatus: 85, maintenance: 72, targetAchievement: 82, kpi: 82 },
        { month: "3月", completion: 89, quality: 86, efficiency: 79, workHours: 74, attendance: 96, machineStatus: 84, maintenance: 71, targetAchievement: 81, kpi: 81 },
        { month: "4月", completion: 90, quality: 87, efficiency: 80, workHours: 75, attendance: 97, machineStatus: 85, maintenance: 72, targetAchievement: 82, kpi: 82 },
        { month: "5月", completion: 91, quality: 88, efficiency: 81, workHours: 76, attendance: 98, machineStatus: 86, maintenance: 73, targetAchievement: 83, kpi: 83 },
        { month: "6月", completion: 90, quality: 87, efficiency: 80, workHours: 75, attendance: 97, machineStatus: 85, maintenance: 72, targetAchievement: 82, kpi: 82 },
        { month: "7月", completion: 95, quality: 88, efficiency: 82, workHours: 75, attendance: 98, machineStatus: 86, maintenance: 73, targetAchievement: 83, kpi: 83 },
      ],
      2024: [
        { month: "1月", completion: 86, quality: 83, efficiency: 76 },
        { month: "2月", completion: 87, quality: 84, efficiency: 77 },
        { month: "3月", completion: 88, quality: 85, efficiency: 78 },
        { month: "4月", completion: 87, quality: 84, efficiency: 77 },
        { month: "5月", completion: 89, quality: 86, efficiency: 79 },
        { month: "6月", completion: 90, quality: 87, efficiency: 80 },
        { month: "7月", completion: 89, quality: 86, efficiency: 79 },
        { month: "8月", completion: 88, quality: 85, efficiency: 78 },
        { month: "9月", completion: 89, quality: 86, efficiency: 79 },
        { month: "10月", completion: 90, quality: 87, efficiency: 80 },
        { month: "11月", completion: 88, quality: 85, efficiency: 78 },
        { month: "12月", completion: 95, quality: 88, efficiency: 82 },
      ],
      2023: [
        { month: "1月", completion: 81, quality: 78, efficiency: 71 },
        { month: "2月", completion: 82, quality: 79, efficiency: 72 },
        { month: "3月", completion: 83, quality: 80, efficiency: 73 },
        { month: "4月", completion: 82, quality: 79, efficiency: 72 },
        { month: "5月", completion: 84, quality: 81, efficiency: 74 },
        { month: "6月", completion: 85, quality: 82, efficiency: 75 },
        { month: "7月", completion: 84, quality: 81, efficiency: 74 },
        { month: "8月", completion: 83, quality: 80, efficiency: 73 },
        { month: "9月", completion: 84, quality: 81, efficiency: 74 },
        { month: "10月", completion: 85, quality: 82, efficiency: 75 },
        { month: "11月", completion: 83, quality: 80, efficiency: 73 },
        { month: "12月", completion: 86, quality: 83, efficiency: 76 },
      ],
      2022: [
        { month: "1月", completion: 76, quality: 73, efficiency: 66 },
        { month: "2月", completion: 77, quality: 74, efficiency: 67 },
        { month: "3月", completion: 78, quality: 75, efficiency: 68 },
        { month: "4月", completion: 77, quality: 74, efficiency: 67 },
        { month: "5月", completion: 79, quality: 76, efficiency: 69 },
        { month: "6月", completion: 80, quality: 77, efficiency: 70 },
        { month: "7月", completion: 79, quality: 76, efficiency: 69 },
        { month: "8月", completion: 78, quality: 75, efficiency: 68 },
        { month: "9月", completion: 79, quality: 76, efficiency: 69 },
        { month: "10月", completion: 80, quality: 77, efficiency: 70 },
        { month: "11月", completion: 78, quality: 75, efficiency: 68 },
        { month: "12月", completion: 81, quality: 78, efficiency: 71 },
      ]
    }
  },

  // 王大明：2A + 2B + 4C + 1D (中等員工)
  EMP003: {
    // A級指標：2項（最終分數90-100分）
    workCompletion: 95,      // 95+5=100 (A級) - 直接觸發>=95加分
    productQuality: 90,      // 90+3=93 (A級) - 直接觸發>=90加分
    
    // B級指標：2項（最終分數80-89分）
    attendance: 85,          // 85+0=85 (B級) - 85<98不加分
    machineStatus: 87,       // 87+0+0=87 (B級) - 87<95不加分，maintenanceRecord<90不加分
    
    // C級指標：4項（最終分數70-79分）
    targetAchievement: 75,   // 75+0+0=75 (C級) - 75<95不加分，efficiency<90不加分
    kpi: 77,                // 77+0+0=77 (C級) - 77<95不加分，teamwork<90不加分
    efficiency: 76,         // 76+0+0=76 (C級) - 76<95不加分，resourceUtilization<90不加分
    maintenanceRecord: 73,   // 73+2+0=75 (C級) - preventiveMaintenance+2，machineStatus<90不加分
    
    // D級指標：1項（最終分數60-69分）
    // workHours特殊計算：需要65分，標準工時176，實際工時需要114小時

    overtimeHours: 8,
    standardHours: 176,
    actualHours: 114,       // (114/176)*100 = 65分 (D級)
    teamwork: 85,           // <90，不支援kpi加分
    resourceUtilization: 85, // <90，不支援efficiency加分
    preventiveMaintenance: true, // 支援maintenance加分
    monthInRole: "intermediate",
    contributions: {
      processImprovement: 0,
      qualityEnhancement: 1,
      costReduction: 0,
    },

    historicalData: [
      { month: "1月", completion: 84, quality: 81, efficiency: 70 },
      { month: "2月", completion: 85, quality: 82, efficiency: 71 },
      { month: "3月", completion: 86, quality: 83, efficiency: 72 },
      { month: "4月", completion: 85, quality: 82, efficiency: 71 },
      { month: "5月", completion: 87, quality: 84, efficiency: 73 },
      { month: "6月", completion: 88, quality: 85, efficiency: 74 },
      { month: "7月", completion: 87, quality: 84, efficiency: 73 },
      { month: "8月", completion: 86, quality: 83, efficiency: 72 },
      { month: "9月", completion: 87, quality: 84, efficiency: 73 },
      { month: "10月", completion: 88, quality: 85, efficiency: 74 },
      { month: "11月", completion: 86, quality: 83, efficiency: 72 },
      { month: "12月", completion: 86, quality: 85, efficiency: 72 },
    ],

    yearlyData: {
      2025: [
        { month: "1月", completion: 87, quality: 84, efficiency: 73, workHours: 74, attendance: 95, machineStatus: 82, maintenance: 68, targetAchievement: 77, kpi: 75 },
        { month: "2月", completion: 88, quality: 85, efficiency: 74, workHours: 75, attendance: 96, machineStatus: 83, maintenance: 69, targetAchievement: 78, kpi: 76 },
        { month: "3月", completion: 87, quality: 84, efficiency: 73, workHours: 74, attendance: 95, machineStatus: 82, maintenance: 68, targetAchievement: 77, kpi: 75 },
        { month: "4月", completion: 88, quality: 85, efficiency: 74, workHours: 75, attendance: 96, machineStatus: 83, maintenance: 69, targetAchievement: 78, kpi: 76 },
        { month: "5月", completion: 89, quality: 86, efficiency: 75, workHours: 76, attendance: 97, machineStatus: 84, maintenance: 70, targetAchievement: 79, kpi: 77 },
        { month: "6月", completion: 88, quality: 85, efficiency: 74, workHours: 75, attendance: 96, machineStatus: 83, maintenance: 69, targetAchievement: 78, kpi: 76 },
        { month: "7月", completion: 86, quality: 85, efficiency: 72, workHours: 75, attendance: 95, machineStatus: 82, maintenance: 68, targetAchievement: 77, kpi: 75 },
      ],
      2024: [
        { month: "1月", completion: 84, quality: 81, efficiency: 70 },
        { month: "2月", completion: 85, quality: 82, efficiency: 71 },
        { month: "3月", completion: 86, quality: 83, efficiency: 72 },
        { month: "4月", completion: 85, quality: 82, efficiency: 71 },
        { month: "5月", completion: 87, quality: 84, efficiency: 73 },
        { month: "6月", completion: 88, quality: 85, efficiency: 74 },
        { month: "7月", completion: 87, quality: 84, efficiency: 73 },
        { month: "8月", completion: 86, quality: 83, efficiency: 72 },
        { month: "9月", completion: 87, quality: 84, efficiency: 73 },
        { month: "10月", completion: 88, quality: 85, efficiency: 74 },
        { month: "11月", completion: 86, quality: 83, efficiency: 72 },
        { month: "12月", completion: 86, quality: 85, efficiency: 72 },
      ],
      2023: [
        { month: "1月", completion: 79, quality: 76, efficiency: 65 },
        { month: "2月", completion: 80, quality: 77, efficiency: 66 },
        { month: "3月", completion: 81, quality: 78, efficiency: 67 },
        { month: "4月", completion: 80, quality: 77, efficiency: 66 },
        { month: "5月", completion: 82, quality: 79, efficiency: 68 },
        { month: "6月", completion: 83, quality: 80, efficiency: 69 },
        { month: "7月", completion: 82, quality: 79, efficiency: 68 },
        { month: "8月", completion: 81, quality: 78, efficiency: 67 },
        { month: "9月", completion: 82, quality: 79, efficiency: 68 },
        { month: "10月", completion: 83, quality: 80, efficiency: 69 },
        { month: "11月", completion: 81, quality: 78, efficiency: 67 },
        { month: "12月", completion: 84, quality: 81, efficiency: 70 },
      ],
      2022: [
        { month: "1月", completion: 74, quality: 71, efficiency: 60 },
        { month: "2月", completion: 75, quality: 72, efficiency: 61 },
        { month: "3月", completion: 76, quality: 73, efficiency: 62 },
        { month: "4月", completion: 75, quality: 72, efficiency: 61 },
        { month: "5月", completion: 77, quality: 74, efficiency: 63 },
        { month: "6月", completion: 78, quality: 75, efficiency: 64 },
        { month: "7月", completion: 77, quality: 74, efficiency: 63 },
        { month: "8月", completion: 76, quality: 73, efficiency: 62 },
        { month: "9月", completion: 77, quality: 74, efficiency: 63 },
        { month: "10月", completion: 78, quality: 75, efficiency: 64 },
        { month: "11月", completion: 76, quality: 73, efficiency: 62 },
        { month: "12月", completion: 79, quality: 76, efficiency: 65 },
      ]
    }
  },

  // 陳小芳：1A + 2B + 2C + 3D + 1E (待改進員工)
  EMP004: {
    // A級指標：1項（最終分數90-100分）
    workCompletion: 95,      // 95+5=100 (A級) - 直接觸發>=95加分
    
    // B級指標：2項（最終分數80-89分）
    productQuality: 82,      // 82+0=82 (B級) - 82<90不加分
    attendance: 83,          // 83+0=83 (B級) - 83<98不加分
    
    // C級指標：2項（最終分數70-79分）
    machineStatus: 73,       // 73+0+0=73 (C級) - 73<95不加分，maintenanceRecord<90不加分
    targetAchievement: 72,   // 72+0+0=72 (C級) - 72<95不加分，efficiency<90不加分
    
    // D級指標：3項（最終分數60-69分）
    kpi: 62,                // 62+0+0=62 (D級) - 62<95不加分，teamwork<90不加分
    maintenanceRecord: 59,   // 59+2+0=61 (D級) - preventiveMaintenance+2，machineStatus<90不加分
    efficiency: 64,         // 64+0+0=64 (D級) - 64<95不加分，resourceUtilization<90不加分
    
    // E級指標：1項（最終分數<60分）
    // workHours特殊計算：需要55分，標準工時176，實際工時需要97小時

    overtimeHours: 12,
    standardHours: 176,
    actualHours: 97,        // (97/176)*100 = 55分 (E級)
    teamwork: 85,           // <90，不支援kpi加分
    resourceUtilization: 85, // <90，不支援efficiency加分
    preventiveMaintenance: true, // 支援maintenance加分
    monthInRole: "beginner",
    contributions: {
      processImprovement: 0,
      qualityEnhancement: 0,
      costReduction: 0,
    },

    historicalData: [
      { month: "1月", completion: 83, quality: 65, efficiency: 59 },
      { month: "2月", completion: 84, quality: 66, efficiency: 60 },
      { month: "3月", completion: 85, quality: 67, efficiency: 61 },
      { month: "4月", completion: 84, quality: 66, efficiency: 60 },
      { month: "5月", completion: 86, quality: 68, efficiency: 62 },
      { month: "6月", completion: 87, quality: 69, efficiency: 63 },
      { month: "7月", completion: 86, quality: 68, efficiency: 62 },
      { month: "8月", completion: 85, quality: 67, efficiency: 61 },
      { month: "9月", completion: 86, quality: 68, efficiency: 62 },
      { month: "10月", completion: 87, quality: 69, efficiency: 63 },
      { month: "11月", completion: 85, quality: 67, efficiency: 61 },
      { month: "12月", completion: 85, quality: 67, efficiency: 61 },
    ],

    yearlyData: {
      2025: [
        { month: "1月", completion: 86, quality: 68, efficiency: 62, workHours: 54, attendance: 81, machineStatus: 71, maintenance: 57, targetAchievement: 70, kpi: 60 },
        { month: "2月", completion: 87, quality: 69, efficiency: 63, workHours: 55, attendance: 82, machineStatus: 72, maintenance: 58, targetAchievement: 71, kpi: 61 },
        { month: "3月", completion: 86, quality: 68, efficiency: 62, workHours: 54, attendance: 81, machineStatus: 71, maintenance: 57, targetAchievement: 70, kpi: 60 },
        { month: "4月", completion: 87, quality: 69, efficiency: 63, workHours: 55, attendance: 82, machineStatus: 72, maintenance: 58, targetAchievement: 71, kpi: 61 },
        { month: "5月", completion: 88, quality: 70, efficiency: 64, workHours: 56, attendance: 83, machineStatus: 73, maintenance: 59, targetAchievement: 72, kpi: 62 },
        { month: "6月", completion: 87, quality: 69, efficiency: 63, workHours: 55, attendance: 82, machineStatus: 72, maintenance: 58, targetAchievement: 71, kpi: 61 },
        { month: "7月", completion: 95, quality: 82, efficiency: 64, workHours: 55, attendance: 83, machineStatus: 73, maintenance: 59, targetAchievement: 72, kpi: 62 },
      ],
      2024: [
        { month: "1月", completion: 83, quality: 65, efficiency: 59 },
        { month: "2月", completion: 84, quality: 66, efficiency: 60 },
        { month: "3月", completion: 85, quality: 67, efficiency: 61 },
        { month: "4月", completion: 84, quality: 66, efficiency: 60 },
        { month: "5月", completion: 86, quality: 68, efficiency: 62 },
        { month: "6月", completion: 87, quality: 69, efficiency: 63 },
        { month: "7月", completion: 86, quality: 68, efficiency: 62 },
        { month: "8月", completion: 85, quality: 67, efficiency: 61 },
        { month: "9月", completion: 86, quality: 68, efficiency: 62 },
        { month: "10月", completion: 87, quality: 69, efficiency: 63 },
        { month: "11月", completion: 85, quality: 67, efficiency: 61 },
        { month: "12月", completion: 85, quality: 67, efficiency: 61 },
      ],
      2023: [
        { month: "1月", completion: 78, quality: 60, efficiency: 54 },
        { month: "2月", completion: 79, quality: 61, efficiency: 55 },
        { month: "3月", completion: 80, quality: 62, efficiency: 56 },
        { month: "4月", completion: 79, quality: 61, efficiency: 55 },
        { month: "5月", completion: 81, quality: 63, efficiency: 57 },
        { month: "6月", completion: 82, quality: 64, efficiency: 58 },
        { month: "7月", completion: 81, quality: 63, efficiency: 57 },
        { month: "8月", completion: 80, quality: 62, efficiency: 56 },
        { month: "9月", completion: 81, quality: 63, efficiency: 57 },
        { month: "10月", completion: 82, quality: 64, efficiency: 58 },
        { month: "11月", completion: 80, quality: 62, efficiency: 56 },
        { month: "12月", completion: 83, quality: 65, efficiency: 59 },
      ],
      2022: [
        { month: "1月", completion: 73, quality: 55, efficiency: 49 },
        { month: "2月", completion: 74, quality: 56, efficiency: 50 },
        { month: "3月", completion: 75, quality: 57, efficiency: 51 },
        { month: "4月", completion: 74, quality: 56, efficiency: 50 },
        { month: "5月", completion: 76, quality: 58, efficiency: 52 },
        { month: "6月", completion: 77, quality: 59, efficiency: 53 },
        { month: "7月", completion: 76, quality: 58, efficiency: 52 },
        { month: "8月", completion: 75, quality: 57, efficiency: 51 },
        { month: "9月", completion: 76, quality: 58, efficiency: 52 },
        { month: "10月", completion: 77, quality: 59, efficiency: 53 },
        { month: "11月", completion: 75, quality: 57, efficiency: 51 },
        { month: "12月", completion: 78, quality: 60, efficiency: 54 },
      ]
    }
  },

  // 林小強：0A + 1B + 2C + 3D + 3E (需加強員工)
  EMP005: {
    // B級指標：1項（最終分數80-89分）
    workCompletion: 80,      // 80+0=80 (B級) - 80<95不加分
    
    // C級指標：2項（最終分數70-79分）
    productQuality: 72,      // 72+0=72 (C級) - 72<90不加分
    attendance: 75,          // 75+0=75 (C級) - 75<98不加分
    
    // D級指標：3項（最終分數60-69分）
    machineStatus: 63,       // 63+0+0=63 (D級) - 63<95不加分，maintenanceRecord<90不加分
    targetAchievement: 60,   // 60+0+0=60 (D級) - 60<95不加分，efficiency<90不加分
    kpi: 62,                // 62+0+0=62 (D級) - 62<95不加分，teamwork<90不加分
    
    // E級指標：3項（最終分數<60分）
    maintenanceRecord: 51,   // 51+2+0=53 (E級) - preventiveMaintenance+2，machineStatus<90不加分
    efficiency: 54,         // 54+0+0=54 (E級) - 54<95不加分，resourceUtilization<90不加分
    // workHours特殊計算：需要50分，標準工時176，實際工時需要88小時

    overtimeHours: 15,
    standardHours: 176,
    actualHours: 88,        // (88/176)*100 = 50分 (E級)
    teamwork: 85,           // <90，不支援kpi加分
    resourceUtilization: 85, // <90，不支援efficiency加分
    preventiveMaintenance: true, // 支援maintenance加分
    monthInRole: "beginner",
    contributions: {
      processImprovement: 0,
      qualityEnhancement: 0,
      costReduction: 0,
    },

    historicalData: [
      { month: "1月", completion: 66, quality: 55, efficiency: 51 },
      { month: "2月", completion: 67, quality: 56, efficiency: 52 },
      { month: "3月", completion: 68, quality: 57, efficiency: 53 },
      { month: "4月", completion: 67, quality: 56, efficiency: 52 },
      { month: "5月", completion: 69, quality: 58, efficiency: 54 },
      { month: "6月", completion: 70, quality: 59, efficiency: 55 },
      { month: "7月", completion: 69, quality: 58, efficiency: 54 },
      { month: "8月", completion: 68, quality: 57, efficiency: 53 },
      { month: "9月", completion: 69, quality: 58, efficiency: 54 },
      { month: "10月", completion: 70, quality: 59, efficiency: 55 },
      { month: "11月", completion: 68, quality: 57, efficiency: 53 },
      { month: "12月", completion: 68, quality: 57, efficiency: 53 },
    ],

    yearlyData: {
      2025: [
        { month: "1月", completion: 69, quality: 58, efficiency: 54, workHours: 49, attendance: 73, machineStatus: 61, maintenance: 49, targetAchievement: 58, kpi: 60 },
        { month: "2月", completion: 70, quality: 59, efficiency: 55, workHours: 50, attendance: 74, machineStatus: 62, maintenance: 50, targetAchievement: 59, kpi: 61 },
        { month: "3月", completion: 69, quality: 58, efficiency: 54, workHours: 49, attendance: 73, machineStatus: 61, maintenance: 49, targetAchievement: 58, kpi: 60 },
        { month: "4月", completion: 70, quality: 59, efficiency: 55, workHours: 50, attendance: 74, machineStatus: 62, maintenance: 50, targetAchievement: 59, kpi: 61 },
        { month: "5月", completion: 71, quality: 60, efficiency: 56, workHours: 51, attendance: 75, machineStatus: 63, maintenance: 51, targetAchievement: 60, kpi: 62 },
        { month: "6月", completion: 70, quality: 59, efficiency: 55, workHours: 50, attendance: 74, machineStatus: 62, maintenance: 50, targetAchievement: 59, kpi: 61 },
        { month: "7月", completion: 80, quality: 72, efficiency: 54, workHours: 50, attendance: 75, machineStatus: 63, maintenance: 51, targetAchievement: 60, kpi: 62 },
      ],
      2024: [
        { month: "1月", completion: 66, quality: 55, efficiency: 51 },
        { month: "2月", completion: 67, quality: 56, efficiency: 52 },
        { month: "3月", completion: 68, quality: 57, efficiency: 53 },
        { month: "4月", completion: 67, quality: 56, efficiency: 52 },
        { month: "5月", completion: 69, quality: 58, efficiency: 54 },
        { month: "6月", completion: 70, quality: 59, efficiency: 55 },
        { month: "7月", completion: 69, quality: 58, efficiency: 54 },
        { month: "8月", completion: 68, quality: 57, efficiency: 53 },
        { month: "9月", completion: 69, quality: 58, efficiency: 54 },
        { month: "10月", completion: 70, quality: 59, efficiency: 55 },
        { month: "11月", completion: 68, quality: 57, efficiency: 53 },
        { month: "12月", completion: 68, quality: 57, efficiency: 53 },
      ],
      2023: [
        { month: "1月", completion: 61, quality: 50, efficiency: 46 },
        { month: "2月", completion: 62, quality: 51, efficiency: 47 },
        { month: "3月", completion: 63, quality: 52, efficiency: 48 },
        { month: "4月", completion: 62, quality: 51, efficiency: 47 },
        { month: "5月", completion: 64, quality: 53, efficiency: 49 },
        { month: "6月", completion: 65, quality: 54, efficiency: 50 },
        { month: "7月", completion: 64, quality: 53, efficiency: 49 },
        { month: "8月", completion: 63, quality: 52, efficiency: 48 },
        { month: "9月", completion: 64, quality: 53, efficiency: 49 },
        { month: "10月", completion: 65, quality: 54, efficiency: 50 },
        { month: "11月", completion: 63, quality: 52, efficiency: 48 },
        { month: "12月", completion: 66, quality: 55, efficiency: 51 },
      ],
      2022: [
        { month: "1月", completion: 56, quality: 45, efficiency: 41 },
        { month: "2月", completion: 57, quality: 46, efficiency: 42 },
        { month: "3月", completion: 58, quality: 47, efficiency: 43 },
        { month: "4月", completion: 57, quality: 46, efficiency: 42 },
        { month: "5月", completion: 59, quality: 48, efficiency: 44 },
        { month: "6月", completion: 60, quality: 49, efficiency: 45 },
        { month: "7月", completion: 59, quality: 48, efficiency: 44 },
        { month: "8月", completion: 58, quality: 47, efficiency: 43 },
        { month: "9月", completion: 59, quality: 48, efficiency: 44 },
        { month: "10月", completion: 60, quality: 49, efficiency: 45 },
        { month: "11月", completion: 58, quality: 47, efficiency: 43 },
        { month: "12月", completion: 61, quality: 50, efficiency: 46 },
      ]
    }
  },
};
