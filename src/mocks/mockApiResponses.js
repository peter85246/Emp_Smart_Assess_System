/**
 * ============================================
 * 模擬API回應數據 (MOCK DATA)
 * ============================================
 * 
 * 注意：這個檔案包含測試用的模擬數據
 * 
 * 📋 開發階段修改分數：
 *    - 需要修改此檔案中的 mockJSONResponse 和 mockXMLResponse
 *    - 同時也要同步修改 src/models/employeeData.js 保持一致
 * 
 * 🔌 串接真正API時：
 *    - 此檔案可以保留作為備用/測試數據
 *    - 主要需要修改 src/services/api.js 中的數據來源
 *    - 從 mock 數據改為真正的 API 調用
 * 
 * ============================================
 */

// 模擬XML格式的員工數據
export const mockXMLResponse = `
<?xml version="1.0" encoding="UTF-8"?>
<employeeData>
  <employee id="EMP001">
    <standardHours>176</standardHours>
    <actualHours>132</actualHours>
    <workHours>75</workHours>
    <workCompletion>95</workCompletion>
    <productQuality>90</productQuality>
    <attendance>98</attendance>
    <machineStatus>95</machineStatus>
    <maintenanceRecord>85</maintenanceRecord>
    <targetAchievement>95</targetAchievement>
    <kpi>88</kpi>
    <efficiency>86</efficiency>
    <teamwork>95</teamwork>
    <resourceUtilization>85</resourceUtilization>
    <preventiveMaintenance>true</preventiveMaintenance>
    <historicalData>
      <record>
        <month>1月</month>
        <completion>89</completion>
        <quality>86</quality>
        <efficiency>82</efficiency>
      </record>
      <record>
        <month>2月</month>
        <completion>90</completion>
        <quality>87</quality>
        <efficiency>83</efficiency>
      </record>
      <record>
        <month>3月</month>
        <completion>91</completion>
        <quality>88</quality>
        <efficiency>84</efficiency>
      </record>
    </historicalData>
  </employee>
</employeeData>
`;

// 模擬JSON格式的員工數據
export const mockJSONResponse = {
  employeeData: {
    // 張小明：6A + 2B + 1C (優秀員工)
    EMP001: {
      standardHours: 176,
      actualHours: 132,       // (132/176)*100 = 75分 (C級)
      workHours: 75,
      workCompletion: 95,      // 95+5=100 (A級)
      productQuality: 90,      // 90+3=93 (A級)
      attendance: 98,          // 98+2=100 (A級)
      machineStatus: 95,       // 95+3=98 (A級)
      maintenanceRecord: 85,   // 85+2+2=89 (B級)
      targetAchievement: 95,   // 95+3=98 (A級)
      kpi: 88,                // 88+0+2=90 (A級)
      efficiency: 86,         // 86+0+0=86 (B級)
      teamwork: 95,           // 支援kpi加分
      resourceUtilization: 85, // <90，不支援efficiency加分
      preventiveMaintenance: true,
      historicalData: [
        { month: "1月", completion: 89, quality: 86, efficiency: 82 },
        { month: "2月", completion: 90, quality: 87, efficiency: 83 },
        { month: "3月", completion: 91, quality: 88, efficiency: 84 }
      ]
    },
    // 李小華：3A + 4B + 2C (B級傾向員工)
    EMP002: {
      standardHours: 176,
      actualHours: 132,       // (132/176)*100 = 75分 (C級)
      workHours: 75,
      workCompletion: 95,      // 95+5=100 (A級)
      productQuality: 90,      // 90+3=93 (A級)
      attendance: 98,          // 98+2=100 (A級)
      machineStatus: 86,       // 86+0+0=86 (B級)
      maintenanceRecord: 73,   // 73+2+0=75 (C級)
      targetAchievement: 83,   // 83+0+0=83 (B級)
      kpi: 83,                // 83+0+2=85 (B級)
      efficiency: 82,         // 82+0+2=84 (B級)
      teamwork: 94,           // 支援kpi加分
      resourceUtilization: 92, // 支援efficiency加分
      preventiveMaintenance: true,
      historicalData: [
        { month: "1月", completion: 86, quality: 83, efficiency: 76 },
        { month: "2月", completion: 87, quality: 84, efficiency: 77 },
        { month: "3月", completion: 88, quality: 85, efficiency: 78 }
      ]
    },
    // 王大明：2A + 2B + 4C + 1D (C級傾向員工)
    EMP003: {
      standardHours: 176,
      actualHours: 114,       // (114/176)*100 = 65分 (D級)
      workHours: 65,
      workCompletion: 95,      // 95+5=100 (A級)
      productQuality: 90,      // 90+3=93 (A級)
      attendance: 85,          // 85+0=85 (B級)
      machineStatus: 87,       // 87+0+0=87 (B級)
      maintenanceRecord: 73,   // 73+2+0=75 (C級)
      targetAchievement: 75,   // 75+0+0=75 (C級)
      kpi: 77,                // 77+0+0=77 (C級)
      efficiency: 76,         // 76+0+0=76 (C級)
      teamwork: 85,           // <90，不支援kpi加分
      resourceUtilization: 85, // <90，不支援efficiency加分
      preventiveMaintenance: true,
      historicalData: [
        { month: "1月", completion: 84, quality: 81, efficiency: 70 },
        { month: "2月", completion: 85, quality: 82, efficiency: 71 },
        { month: "3月", completion: 86, quality: 83, efficiency: 72 }
      ]
    },
    // 陳小芳：1A + 2B + 2C + 3D + 1E (D級傾向員工)
    EMP004: {
      standardHours: 176,
      actualHours: 97,        // (97/176)*100 = 55分 (E級)
      workHours: 55,
      workCompletion: 95,      // 95+5=100 (A級)
      productQuality: 82,      // 82+0=82 (B級)
      attendance: 83,          // 83+0=83 (B級)
      machineStatus: 73,       // 73+0+0=73 (C級)
      maintenanceRecord: 59,   // 59+2+0=61 (D級)
      targetAchievement: 72,   // 72+0+0=72 (C級)
      kpi: 62,                // 62+0+0=62 (D級)
      efficiency: 64,         // 64+0+0=64 (D級)
      teamwork: 85,           // <90，不支援kpi加分
      resourceUtilization: 85, // <90，不支援efficiency加分
      preventiveMaintenance: true,
      historicalData: [
        { month: "1月", completion: 83, quality: 65, efficiency: 59 },
        { month: "2月", completion: 84, quality: 66, efficiency: 60 },
        { month: "3月", completion: 85, quality: 67, efficiency: 61 }
      ]
    },
    // 林小強：0A + 1B + 2C + 3D + 3E (E級傾向員工)
    EMP005: {
      standardHours: 176,
      actualHours: 88,        // (88/176)*100 = 50分 (E級)
      workHours: 50,
      workCompletion: 80,      // 80+0=80 (B級)
      productQuality: 72,      // 72+0=72 (C級)
      attendance: 75,          // 75+0=75 (C級)
      machineStatus: 63,       // 63+0+0=63 (D級)
      maintenanceRecord: 51,   // 51+2+0=53 (E級)
      targetAchievement: 60,   // 60+0+0=60 (D級)
      kpi: 62,                // 62+0+0=62 (D級)
      efficiency: 54,         // 54+0+0=54 (E級)
      teamwork: 85,           // <90，不支援kpi加分
      resourceUtilization: 85, // <90，不支援efficiency加分
      preventiveMaintenance: true,
      historicalData: [
        { month: "1月", completion: 66, quality: 55, efficiency: 51 },
        { month: "2月", completion: 67, quality: 56, efficiency: 52 },
        { month: "3月", completion: 68, quality: 57, efficiency: 53 }
      ]
    }
  }
}; 