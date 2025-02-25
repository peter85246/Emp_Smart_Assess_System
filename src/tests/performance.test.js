import { mockEmployeeData } from '../models/employeeData';

describe('Performance Calculations', () => {
  test('should calculate correct total score', () => {
    const evaluator = new PerformanceEvaluator('operator');
    const result = evaluator.calculateTotalScore(mockEmployeeData.EMP001);
    expect(result).toBeGreaterThan(0);
  });
}); 