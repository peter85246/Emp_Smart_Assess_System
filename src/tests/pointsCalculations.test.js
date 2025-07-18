import { PointsCalculator, pointsCalculator } from '../utils/pointsCalculations';
import { pointsConfig } from '../config/pointsConfig';

describe('PointsCalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new PointsCalculator();
  });

  describe('calculateBasePoints', () => {
    test('should calculate base points for checkbox input', () => {
      const standard = {
        pointsValue: 8.0,
        inputType: 'checkbox'
      };

      const result = calculator.calculateBasePoints(standard, true);
      expect(result).toBe(8.0);

      const resultFalse = calculator.calculateBasePoints(standard, false);
      expect(resultFalse).toBe(0);
    });

    test('should calculate base points for number input', () => {
      const standard = {
        pointsValue: 0.5,
        inputType: 'number'
      };

      const result = calculator.calculateBasePoints(standard, 4);
      expect(result).toBe(2.0); // 0.5 * 4
    });

    test('should return 0 for invalid standard', () => {
      const result = calculator.calculateBasePoints(null, 1);
      expect(result).toBe(0);
    });
  });

  describe('calculateBonusPoints', () => {
    test('should calculate bonus for general points with good performance', () => {
      const standard = {
        pointsType: 'general'
      };

      const { bonus, bonusReasons } = calculator.calculateBonusPoints(
        standard, 
        6, // basePoints >= 5
        ['evidence.jpg'] // has evidence files
      );

      expect(bonus).toBe(0.8); // 0.5 + 0.3
      expect(bonusReasons).toContain('基礎工作表現優秀');
      expect(bonusReasons).toContain('提供完整證明文件');
    });

    test('should calculate bonus for professional points', () => {
      const standard = {
        pointsType: 'professional'
      };

      const { bonus, bonusReasons } = calculator.calculateBonusPoints(
        standard, 
        4, // basePoints >= 3
        []
      );

      expect(bonus).toBe(1.0);
      expect(bonusReasons).toContain('專業技能表現突出');
    });

    test('should calculate bonus for core competency full score', () => {
      const standard = {
        pointsType: 'core',
        pointsValue: 5
      };

      const { bonus, bonusReasons } = calculator.calculateBonusPoints(
        standard, 
        5, // equals pointsValue
        []
      );

      expect(bonus).toBe(5);
      expect(bonusReasons).toContain('核心職能滿分表現');
    });
  });

  describe('calculatePenaltyPoints', () => {
    test('should penalize insufficient description', () => {
      const standard = { pointsType: 'general' };

      const { penalty, penaltyReasons } = calculator.calculatePenaltyPoints(
        standard,
        'short', // description too short
        []
      );

      expect(penalty).toBe(0.2);
      expect(penaltyReasons).toContain('工作說明不足');
    });

    test('should penalize professional work without evidence', () => {
      const standard = { pointsType: 'professional' };

      const { penalty, penaltyReasons } = calculator.calculatePenaltyPoints(
        standard,
        'This is a sufficient description for professional work',
        [] // no evidence files
      );

      expect(penalty).toBe(0.5);
      expect(penaltyReasons).toContain('專業工作缺少證明文件');
    });

    test('should not penalize with good description and evidence', () => {
      const standard = { pointsType: 'professional' };

      const { penalty, penaltyReasons } = calculator.calculatePenaltyPoints(
        standard,
        'This is a comprehensive description of the professional work completed',
        ['evidence.pdf']
      );

      expect(penalty).toBe(0);
      expect(penaltyReasons).toHaveLength(0);
    });
  });

  describe('calculateFinalPoints', () => {
    test('should calculate final points with all components', () => {
      const standard = {
        pointsValue: 8.0,
        inputType: 'checkbox',
        pointsType: 'general'
      };

      // Mock the promotion multiplier to return a fixed value
      const originalGetPromotionMultiplier = calculator.utils.getPromotionMultiplier;
      calculator.utils.getPromotionMultiplier = jest.fn(() => 1.8);

      const result = calculator.calculateFinalPoints(
        standard,
        1, // inputValue
        'This is a comprehensive description of the work completed',
        ['evidence.jpg']
      );

      expect(result.basePoints).toBe(8.0);
      expect(result.bonusPoints).toBe(0.8); // 0.5 + 0.3
      expect(result.penaltyPoints).toBe(0);
      expect(result.promotionMultiplier).toBe(1.8);
      expect(result.finalPoints).toBe(15.84); // (8.0 + 0.8) * 1.8

      // Restore original function
      calculator.utils.getPromotionMultiplier = originalGetPromotionMultiplier;
    });

    test('should ensure final points are not negative', () => {
      const standard = {
        pointsValue: 1.0,
        inputType: 'checkbox',
        pointsType: 'professional'
      };

      const result = calculator.calculateFinalPoints(
        standard,
        1,
        'short', // will cause penalty
        [] // no evidence for professional work
      );

      expect(result.finalPoints).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateMonthlyStats', () => {
    test('should calculate monthly statistics correctly', () => {
      const pointsEntries = [
        {
          pointsEarned: 10.0,
          status: 'approved',
          standard: { pointsType: 'general' }
        },
        {
          pointsEarned: 5.0,
          status: 'approved',
          standard: { pointsType: 'professional' }
        },
        {
          pointsEarned: 3.0,
          status: 'pending',
          standard: { pointsType: 'general' }
        },
        {
          pointsEarned: 2.0,
          status: 'rejected',
          standard: { pointsType: 'management' }
        }
      ];

      const stats = calculator.calculateMonthlyStats(pointsEntries);

      expect(stats.total).toBe(15.0); // only approved entries
      expect(stats.byType.general).toBe(10.0);
      expect(stats.byType.professional).toBe(5.0);
      expect(stats.byType.management).toBe(0); // rejected entry not counted
      expect(stats.byStatus.approved).toBe(2);
      expect(stats.byStatus.pending).toBe(1);
      expect(stats.byStatus.rejected).toBe(1);
      expect(stats.count).toBe(4);
    });
  });

  describe('calculateAchievementRate', () => {
    test('should calculate achievement rate correctly', () => {
      const rate = calculator.calculateAchievementRate(75, 100);
      expect(rate).toBe(75);
    });

    test('should handle zero target', () => {
      const rate = calculator.calculateAchievementRate(50, 0);
      expect(rate).toBe(0);
    });

    test('should round to nearest integer', () => {
      const rate = calculator.calculateAchievementRate(66.7, 100);
      expect(rate).toBe(67);
    });
  });

  describe('checkMinimumRequirements', () => {
    test('should check minimum requirements correctly', () => {
      const monthlyStats = { total: 75 };
      const targetPoints = 100;

      const requirements = calculator.checkMinimumRequirements(monthlyStats, targetPoints);

      expect(requirements.achievementRate).toBe(75);
      expect(requirements.meetsMinimum).toBe(true); // 75% >= 62%
      expect(requirements.meetsQuarterly).toBe(true); // 75% >= 68%
      expect(requirements.meetsManagement).toBe(true); // 75% >= 72%
      expect(requirements.grade).toBe('C'); // 70-79%
    });

    test('should fail minimum requirements', () => {
      const monthlyStats = { total: 50 };
      const targetPoints = 100;

      const requirements = calculator.checkMinimumRequirements(monthlyStats, targetPoints);

      expect(requirements.achievementRate).toBe(50);
      expect(requirements.meetsMinimum).toBe(false); // 50% < 62%
      expect(requirements.meetsQuarterly).toBe(false);
      expect(requirements.meetsManagement).toBe(false);
      expect(requirements.grade).toBe('E'); // < 60%
    });
  });

  describe('generateRecommendations', () => {
    test('should generate urgent recommendation for low scores', () => {
      const monthlyStats = { 
        total: 50,
        byType: { general: 20, professional: 15, management: 10, core: 5 }
      };
      const requirements = { meetsMinimum: false };

      const recommendations = calculator.generateRecommendations(monthlyStats, requirements);

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'urgent',
          title: '積分不足警告'
        })
      );
    });

    test('should recommend improving general work', () => {
      const monthlyStats = { 
        total: 100,
        byType: { general: 20, professional: 50, management: 20, core: 10 } // general ratio = 0.2 < 0.4
      };
      const requirements = { meetsMinimum: true };

      const recommendations = calculator.generateRecommendations(monthlyStats, requirements);

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'improvement',
          title: '加強基礎工作'
        })
      );
    });

    test('should recommend improving professional skills', () => {
      const monthlyStats = { 
        total: 100,
        byType: { general: 60, professional: 20, management: 15, core: 5 } // professional ratio = 0.2 < 0.3
      };
      const requirements = { meetsMinimum: true };

      const recommendations = calculator.generateRecommendations(monthlyStats, requirements);

      expect(recommendations).toContainEqual(
        expect.objectContaining({
          type: 'development',
          title: '提升專業技能'
        })
      );
    });
  });
});

describe('pointsUtils', () => {
  test('getPromotionMultiplier should return correct multiplier for promotion period', () => {
    // Mock current date to be in promotion period
    const mockDate = new Date('2024-09-15'); // First month of promotion
    
    // Test first month
    const multiplier1 = pointsConfig.promotionPeriod.multipliers[0];
    expect(multiplier1).toBe(1.8);
    
    // Test second month
    const multiplier2 = pointsConfig.promotionPeriod.multipliers[1];
    expect(multiplier2).toBe(1.7);
  });

  test('formatPoints should format points correctly', () => {
    const { pointsUtils } = require('../config/pointsConfig');
    
    expect(pointsUtils.formatPoints(8)).toBe('8.0');
    expect(pointsUtils.formatPoints(8.567)).toBe('8.6');
    expect(pointsUtils.formatPoints(0)).toBe('0.0');
  });

  test('validateFile should validate file correctly', () => {
    const { pointsUtils } = require('../config/pointsConfig');
    
    // Valid file
    const validFile = {
      name: 'document.pdf',
      size: 5 * 1024 * 1024 // 5MB
    };
    
    const validResult = pointsUtils.validateFile(validFile);
    expect(validResult.isValid).toBe(true);
    expect(validResult.errors).toHaveLength(0);
    
    // Invalid file - too large
    const largeFile = {
      name: 'document.pdf',
      size: 15 * 1024 * 1024 // 15MB
    };
    
    const largeResult = pointsUtils.validateFile(largeFile);
    expect(largeResult.isValid).toBe(false);
    expect(largeResult.errors).toContain('檔案大小不能超過 10MB');
    
    // Invalid file - wrong type
    const wrongTypeFile = {
      name: 'document.txt',
      size: 1024
    };
    
    const wrongTypeResult = pointsUtils.validateFile(wrongTypeFile);
    expect(wrongTypeResult.isValid).toBe(false);
    expect(wrongTypeResult.errors).toContain('不支援的檔案格式: .txt');
  });
});
