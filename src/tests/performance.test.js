import { mockEmployeeData } from "../models/employeeData";
import { convertPercentageToScore, getGradeFromScore, getUpgradeInfo } from "../utils/scoreCalculations";

describe("Performance Calculations", () => {
  test("should calculate correct score conversion", () => {
    // 基本分數轉換測試
    const score = convertPercentageToScore(85);
    expect(score).toBeDefined();
    expect(score.score).toBe(85);
    expect(score.grade).toBe("B");
  });

  test("should handle different score ranges", () => {
    // 測試不同分數範圍的等級判定
    const highScore = convertPercentageToScore(95);
    const mediumScore = convertPercentageToScore(75);
    const lowScore = convertPercentageToScore(55);
    
    expect(highScore.grade).toBe("A");
    expect(mediumScore.grade).toBe("C");
    expect(lowScore.grade).toBe("E");
  });

  test("should calculate grades correctly", () => {
    // 測試等級計算函數
    expect(getGradeFromScore(95)).toBe("A");
    expect(getGradeFromScore(85)).toBe("B");
    expect(getGradeFromScore(75)).toBe("C");
    expect(getGradeFromScore(65)).toBe("D");
    expect(getGradeFromScore(55)).toBe("E");
  });

  test("should handle employee data structure", () => {
    // 測試員工數據結構
    const employeeData = mockEmployeeData.EMP001;
    
    expect(employeeData).toBeDefined();
    expect(employeeData.workCompletion).toBeDefined();
    expect(employeeData.productQuality).toBeDefined();
    expect(employeeData.attendance).toBeDefined();
    expect(employeeData.yearlyData).toBeDefined();
    expect(employeeData.yearlyData[2024]).toBeDefined();
  });

  test("should validate data consistency", () => {
    // 測試數據一致性
    const employees = Object.keys(mockEmployeeData);
    
    employees.forEach(empId => {
      const employee = mockEmployeeData[empId];
      expect(employee).toBeDefined();
      expect(employee.workCompletion).toBeDefined();
      expect(employee.productQuality).toBeDefined();
      expect(employee.attendance).toBeDefined();
    });
  });

  test("should calculate upgrade information", () => {
    // 測試升級資訊計算
    const upgradeInfo = getUpgradeInfo(75);
    expect(upgradeInfo).toBeDefined();
    expect(upgradeInfo.currentGrade).toBe("C");
    expect(upgradeInfo.nextGrade).toBe("B");
    expect(upgradeInfo.scoreNeeded).toBe(5);
  });
});

describe("Score Boundary Tests", () => {
  test("should handle boundary values", () => {
    // 測試邊界值
    const maxScore = convertPercentageToScore(100);
    const minScore = convertPercentageToScore(0);
    
    expect(maxScore.grade).toBe("A");
    expect(minScore.grade).toBe("E");
    expect(maxScore.score).toBe(100);
    expect(minScore.score).toBe(0);
  });

  test("should handle invalid inputs gracefully", () => {
    // 測試無效輸入處理
    const invalidScore = convertPercentageToScore(-1);
    const overScore = convertPercentageToScore(101);
    
    // 應該有適當的錯誤處理或邊界限制
    expect(invalidScore).toBeDefined();
    expect(invalidScore.score).toBe(0); // 應該被限制在0
    expect(overScore).toBeDefined();
    expect(overScore.score).toBe(100); // 應該被限制在100
  });
});

describe("Mock Data Validation", () => {
  test("should have correct mock data structure", () => {
    // 驗證Mock數據結構
    const employees = Object.keys(mockEmployeeData);
    
    expect(employees.length).toBeGreaterThan(0);
    
    employees.forEach(empId => {
      const employee = mockEmployeeData[empId];
      
      // 檢查基本屬性
      expect(employee).toBeDefined();
      expect(employee.workCompletion).toBeDefined();
      expect(employee.productQuality).toBeDefined();
      expect(employee.attendance).toBeDefined();
      
      // 檢查數值範圍
      expect(employee.workCompletion).toBeGreaterThanOrEqual(0);
      expect(employee.workCompletion).toBeLessThanOrEqual(100);
      expect(employee.productQuality).toBeGreaterThanOrEqual(0);
      expect(employee.productQuality).toBeLessThanOrEqual(100);
      
      // 檢查歷史數據
      expect(employee.yearlyData).toBeDefined();
      expect(employee.yearlyData[2024]).toBeDefined();
      expect(Array.isArray(employee.yearlyData[2024])).toBe(true);
    });
  });

  test("should have consistent yearly data", () => {
    // 測試年度數據一致性
    const employees = Object.keys(mockEmployeeData);
    
    employees.forEach(empId => {
      const employee = mockEmployeeData[empId];
      const yearlyData = employee.yearlyData[2024];
      
      expect(yearlyData).toBeDefined();
      expect(yearlyData.length).toBe(12); // 12個月的數據
      
      yearlyData.forEach((monthData, index) => {
        expect(monthData.month).toBeDefined();
        expect(monthData.completion).toBeDefined();
        expect(monthData.quality).toBeDefined();
        expect(monthData.efficiency).toBeDefined();
        
        // 檢查數值範圍
        expect(monthData.completion).toBeGreaterThanOrEqual(0);
        expect(monthData.completion).toBeLessThanOrEqual(100);
      });
    });
  });
});

describe("Grade Calculation Tests", () => {
  test("should calculate correct grade boundaries", () => {
    // 測試各等級邊界值
    expect(getGradeFromScore(90)).toBe("A");
    expect(getGradeFromScore(89)).toBe("B");
    expect(getGradeFromScore(80)).toBe("B");
    expect(getGradeFromScore(79)).toBe("C");
    expect(getGradeFromScore(70)).toBe("C");
    expect(getGradeFromScore(69)).toBe("D");
    expect(getGradeFromScore(60)).toBe("D");
    expect(getGradeFromScore(59)).toBe("E");
  });

  test("should handle upgrade scenarios", () => {
    // 測試升級情況
    const upgradeFromE = getUpgradeInfo(50);
    expect(upgradeFromE.nextGrade).toBe("D");
    expect(upgradeFromE.scoreNeeded).toBe(10);
    
    const upgradeFromA = getUpgradeInfo(95);
    expect(upgradeFromA.isMaxGrade).toBe(true);
  });
});
