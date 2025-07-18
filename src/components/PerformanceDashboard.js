import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  Activity,
  Target,
  Award,
  Zap,
  Clock,
  Calendar,
  Settings,
  Wrench,
  BarChart,
  Grid,
  Table,
  TrendingUp,
  TrendingDown,
  User,
  Key,
  LogOut,
  Info,
  Calculator,
  ArrowLeft,
} from "lucide-react";
import PointsManagementDashboard from './PointsManagement/PointsManagementDashboard';
import {
  TrendingUp as ReactFeatherTrendingUp,
  TrendingDown as ReactFeatherTrendingDown,
  X,
} from "react-feather";
import {
  calculateWeightedScore,
  calculateFairnessIndex,
  generateImprovement,
  calculateTotalScore,
} from "../utils/performanceCalculations";
import {
  convertPercentageToScore,
  getPerformanceAnalysis,
  getGradeBadgeColor,
  getUpgradeInfo,
  getGradeFromScore,
  getScoreBreakdown  // 新增：從工具模組導入
} from "../utils/scoreCalculations";
import { useNavigate } from "react-router-dom";
import { PerformanceEvaluator } from "../utils/performanceCalculations";
import { performanceAPI } from "../services/api";
import { mockEmployeeData } from "../models/employeeData";

/**
 * 共用組件：進度條
 * 用於顯示各種指標的完成度
 */
const ProgressBar = ({ value, color }) => {
  // 創建一個顏色映射對象
  const colorMap = {
    "text-blue-500": "bg-blue-500",
    "text-green-500": "bg-green-500",
    "text-orange-400": "bg-orange-400",
    "text-pink-400": "bg-pink-400",
    "text-cyan-400": "bg-cyan-400",
    "text-purple-400": "bg-purple-400",
    "text-red-400": "bg-red-400",
    "text-yellow-400": "bg-yellow-400",
    "text-lime-400": "bg-lime-400",
  };

  // 使用映射獲取背景顏色類
  const bgColorClass = colorMap[color] || "bg-gray-400";

  return (
    <div className="w-full h-2 bg-slate-600/50 rounded-full overflow-hidden">
      <div
        className={`h-full relative ${bgColorClass} animate-glow before:absolute before:inset-0 before:bg-progress-gradient before:animate-progressFlow`}
        style={{
          width: `${Math.min(Math.max(value, 0), 100)}%`,
          transition: "width 0.5s ease-in-out",
        }}
      />
    </div>
  );
};

/**
 * 核心組件：績效指標卡片
 * 顯示單個績效指標的詳細信息，包括：
 * - 基本指標展示
 * - 詳細模態框
 * - 歷史趨勢圖表
 * - 改進建議
 */
const PerformanceCard = ({ metric, data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLevelGuide, setShowLevelGuide] = useState(false);
  const baseValue = metric.value(data);
  const breakdown = getScoreBreakdown(metric, data);

  // 使用最終得分而非基礎得分，確保數值有效性
  let value = breakdown.finalScore;

  // 檢查並修復NaN值
  if (isNaN(value) || value === null || value === undefined) {
    console.warn(`Invalid value for metric ${metric.id}:`, value, 'data:', data);
    value = 0;
  }

  // 確保數值在合理範圍內
  value = Math.max(0, Math.min(100, value));

  // 得分計算表整合
  const scoreData = convertPercentageToScore(value);
  const performanceAnalysis = getPerformanceAnalysis(value, metric.id, metric.title);

  /**
   * 數據處理方法：獲取最近三個月數據
   * 🎯 完整修正歷史趨勢一致性問題：
   * - 支援所有9個指標的歷史數據映射
   * - 當前月份（7月）使用最終得分（包含加分機制）
   * - 前兩個月使用基礎分數（原始數據）
   * - 確保每個指標的7月歷史數據與當前顯示的得分一致
   * - 修正dataKey映射邏輯，避免所有指標錯誤使用同一字段
   */
  const getRecentMonthsData = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // getMonth()返回0-11，需要+1
    
    // 獲取對應員工的年度數據
    const employeeId = data?.employeeId || 'EMP001'; // 從data中獲取員工ID，預設為EMP001
    const employeeAllData = mockEmployeeData[employeeId];
    
    if (!employeeAllData || !employeeAllData.yearlyData || !employeeAllData.yearlyData[currentYear]) {
      // 如果沒有年度數據，使用預設的三個月數據（調整為與當前最終得分一致）
      const currentFieldValue = metric.id === 'workCompletion' ? 'completion' :
                               metric.id === 'quality' ? 'quality' :
                               metric.id === 'workHours' ? 'workHours' :
                               metric.id === 'attendance' ? 'attendance' :
                               metric.id === 'machineStatus' ? 'machineStatus' :
                               metric.id === 'maintenance' ? 'maintenance' :
                               metric.id === 'targetAchievement' ? 'targetAchievement' :
                               metric.id === 'kpi' ? 'kpi' : 'efficiency';
      
      return [
        { month: "5月", completion: 70, quality: 75, efficiency: 72, workHours: 75, attendance: 95, machineStatus: 90, maintenance: 80, targetAchievement: 85, kpi: 80 },
        { month: "6月", completion: 72, quality: 77, efficiency: 75, workHours: 75, attendance: 96, machineStatus: 92, maintenance: 82, targetAchievement: 87, kpi: 82 },
        { month: "7月", [currentFieldValue]: value, completion: 75, quality: 80, efficiency: 77, workHours: 75, attendance: 98, machineStatus: 95, maintenance: 85, targetAchievement: 90, kpi: 85 } // 使用當前最終得分
      ];
    }
    
    const yearData = employeeAllData.yearlyData[currentYear];
    
    // 獲取最近三個月的數據，包括當前月份
    const recentThreeMonths = [];
    for (let i = 2; i >= 0; i--) {
      const targetMonth = currentMonth - i;
      if (targetMonth > 0 && targetMonth <= yearData.length) {
        const monthData = yearData[targetMonth - 1]; // 數組索引從0開始
        
        // 🎯 關鍵修正：如果是當前月份，需要調整數據以反映最終得分
        if (targetMonth === currentMonth) {
          // 當前月份使用最終得分，確保與數據卡片一致
          let adjustedData = {
            month: monthData.month,
            completion: monthData.completion,
            quality: monthData.quality, 
            efficiency: monthData.efficiency,
            workHours: monthData.workHours || 75,
            attendance: monthData.attendance || 98,
            machineStatus: monthData.machineStatus || 95,
            maintenance: monthData.maintenance || 85,
            targetAchievement: monthData.targetAchievement || 95,
            kpi: monthData.kpi || 88
          };
          
          // 根據當前指標類型調整對應的數值為最終得分
          if (metric.id === 'workCompletion') {
            adjustedData.completion = value; // 使用最終得分
          } else if (metric.id === 'quality') {
            adjustedData.quality = value; // 使用最終得分
          } else if (metric.id === 'workHours') {
            adjustedData.workHours = value; // 使用最終得分
          } else if (metric.id === 'attendance') {
            adjustedData.attendance = value; // 使用最終得分
          } else if (metric.id === 'machineStatus') {
            adjustedData.machineStatus = value; // 使用最終得分
          } else if (metric.id === 'maintenance') {
            adjustedData.maintenance = value; // 使用最終得分
          } else if (metric.id === 'targetAchievement') {
            adjustedData.targetAchievement = value; // 使用最終得分
          } else if (metric.id === 'kpi') {
            adjustedData.kpi = value; // 使用最終得分
          } else if (metric.id === 'efficiency') {
            adjustedData.efficiency = value; // 使用最終得分
          }
          
          recentThreeMonths.push(adjustedData);
        } else {
          // 前幾個月保持原始數據
          recentThreeMonths.push({
            month: monthData.month,
            completion: monthData.completion,
            quality: monthData.quality,
            efficiency: monthData.efficiency,
            workHours: monthData.workHours || 75,
            attendance: monthData.attendance || 98,
            machineStatus: monthData.machineStatus || 95,
            maintenance: monthData.maintenance || 85,
            targetAchievement: monthData.targetAchievement || 95,
            kpi: monthData.kpi || 88
          });
        }
      }
    }
    
    // 如果數據不足三個月，用現有數據填充
    while (recentThreeMonths.length < 3) {
      const lastData = recentThreeMonths[recentThreeMonths.length - 1] || 
        { month: "當月", completion: 75, quality: 75, efficiency: 75, workHours: 75, attendance: 95, machineStatus: 90, maintenance: 80, targetAchievement: 85, kpi: 80 };
      recentThreeMonths.unshift({
        month: `${recentThreeMonths.length + 1}月前`,
        completion: Math.max(0, lastData.completion - 5),
        quality: Math.max(0, lastData.quality - 3),
        efficiency: Math.max(0, lastData.efficiency - 4),
        workHours: Math.max(0, (lastData.workHours || 75) - 2),
        attendance: Math.max(0, (lastData.attendance || 95) - 1),
        machineStatus: Math.max(0, (lastData.machineStatus || 90) - 3),
        maintenance: Math.max(0, (lastData.maintenance || 80) - 2),
        targetAchievement: Math.max(0, (lastData.targetAchievement || 85) - 3),
        kpi: Math.max(0, (lastData.kpi || 80) - 2)
      });
    }
    
    return recentThreeMonths;
  };
  /**
   * 工具方法：獲取指標樣式
   */
  const getMetricStyle = (metricId) => {
    const styleMap = {
      workCompletion: { color: "#3B82F6", name: "完成率" }, // text-blue-500
      quality: { color: "#10B981", name: "質量" }, // text-green-500
      workHours: { color: "#F59E0B", name: "工作時間" }, // text-orange-400
      attendance: { color: "#EC4899", name: "出勤率" }, // text-pink-400
      machineStatus: { color: "#06B6D4", name: "機台狀態" }, // text-cyan-400
      maintenance: { color: "#8B5CF6", name: "維護記錄" }, // text-purple-400
      targetAchievement: { color: "#F87171", name: "目標達成" }, // text-red-400
      kpi: { color: "#FBBF24", name: "KPI" }, // text-yellow-400
      efficiency: { color: "#A3E635", name: "效率" }, // text-lime-400
    };
    return styleMap[metricId] || { color: "#3B82F6", name: "完成率" };
  };

  /**
   * 數據處理方法：獲取詳細得分說明
   */
  const getScoreExplanation = (metric, data) => {
    switch (metric.id) {
      case "workHours":
        const standardHours = data.standardHours || 176;
        const actualHours = data.actualHours || 0;
        const baseScore = Math.round((actualHours / standardHours) * 100);

        return {
          baseScoreExplanation: "工時分數計算依據：",
          baseScoreDetails: [
            `基礎得分：${baseScore}分`,
            "計算公式：(實際工時/標準工時) × 100",
            `標準工時：${standardHours}小時`,
            `實際工時：${actualHours}小時`,
            `計算結果：(${actualHours}/${standardHours}) × 100 = ${baseScore}分`,
          ],
          calculationMethod: "此分數反映員工實際工作時數與標準工時的比例",
        };
      case "quality":
        return {
          baseScoreExplanation: "產品質量基本表現",
          baseScoreDetails: [`基礎得分：${data.productQuality}分`],
          calculationMethod: "基於產品檢驗結果評分",
        };
      case "workCompletion":
        return {
          baseScoreExplanation: "基於完成的工作項目數量計算：",
          baseScoreDetails: [
            `總工作項目數：${data.totalTasks || 0}項`,
            `已完成項目數：${data.completedTasks || 0}項`,
            `完成率：${breakdown.baseScore}%`,
          ],
          calculationMethod: "計算方式：(已完成項目 / 總項目) × 100",
        };
      case "efficiency":
        return {
          baseScoreExplanation: "基於工作效率評估：",
          baseScoreDetails: [
            `標準工時：${data.standardHours || 0}小時`,
            `實際工時：${data.actualHours || 0}小時`,
            `效率指數：${breakdown.baseScore}%`,
          ],
          calculationMethod: "計算方式：(標準工時 / 實際工時) × 100",
        };
      // ... 其他指標的說明
      default:
        return {
          baseScoreExplanation: `${metric.title}基本表現`,
          baseScoreDetails: [`基礎得分：${metric.value(data)}分`],
          calculationMethod: "",
        };
    }
  };

  const scoreExplanation = getScoreExplanation(metric, breakdown);

  /**
   * 工具方法：獲取計算公式文本
   */
  const getCalculationFormula = (metricId, value) => {
    // 導入詳細計算公式配置
    const { getDetailedCalculationFormula } = require('../config/scoringConfig');
    const formulaConfig = getDetailedCalculationFormula(metricId);
    
    if (formulaConfig && formulaConfig.formula !== "計算公式未定義") {
      return `${formulaConfig.formula} = ${value}%`;
    }
    
    // 備用的簡化版本（向後兼容）
    switch (metricId) {
      case "workCompletion":
        return "工作完成量 = 完成量 / 應交量 × 100 = " + value + "%";
      case "quality":
        return "產品質量 = 已完成工單數 / 總工單數 × 100 = " + value + "%";
      case "workHours":
        return "工作時間效率 = 單位時間完成數 / 平均值 x 100 = " + value + "%";
      case "attendance":
        return "差勤紀錄 = 出勤日 / 應出勤日 × 100 = " + value + "%";
      case "machineStatus":
        return "機台稼動率 = Running時間 / 總時間 × 100 = " + value + "%";
      case "maintenance":
        return "維護表現 = 100 - (Alarm時間 / 總時間 × 100) = " + value + "%";
      case "targetAchievement":
        return "目標達成率 = 員工產出 / 工單需求 × 100 = " + value + "%";
      case "kpi":
        return "關鍵績效指標 = 各項指標加權平均 = " + value + "%";
      case "efficiency":
        return "效率指標 = 實際效率 / 標準效率 × 100 = " + value + "%";
      default:
        return "計算結果 = " + value + "%";
    }
  };

  /**
   * 工具方法：獲取個性化建議文本
   * 根據不同指標和分數範圍提供具體且可操作的建議
   */
  const getSuggestions = (value, metric) => {
    const suggestions = [];
    const metricSpecificSuggestions = getMetricSpecificSuggestions(metric.id, value);
    const generalSuggestions = getGeneralSuggestions(value, metric.title);
    
    return [...metricSpecificSuggestions, ...generalSuggestions];
  };

  /**
   * 根據具體指標類型提供針對性建議
   */
  const getMetricSpecificSuggestions = (metricId, value) => {
    const suggestions = [];
    
    switch (metricId) {
      case "workCompletion":
        if (value >= 95) {
          suggestions.push("🎯 恭喜達成超額完成目標！考慮分享時間管理技巧給團隊");
          suggestions.push("📊 可嘗試協助處理更多複雜工單，發揮經驗優勢");
        } else if (value >= 85) {
          suggestions.push("⏰ 建議檢視工作流程，找出可優化的環節");
          suggestions.push("🤝 與高效同事交流，學習任務優先順序安排技巧");
        } else if (value >= 70) {
          suggestions.push("📋 建議使用工作清單工具，追踪任務進度");
          suggestions.push("🎯 專注處理核心任務，避免同時進行太多工作");
        } else {
          suggestions.push("🚨 立即與主管討論工作負荷，確認是否需要資源支援");
          suggestions.push("📚 參加時間管理培訓課程，掌握基本工作技巧");
        }
        break;
        
      case "quality":
        if (value >= 95) {
          suggestions.push("🏆 質量表現卓越！可擔任質量標準制定的關鍵角色");
          suggestions.push("🔍 分享質量控制心得，建立最佳實務範例");
        } else if (value >= 85) {
          suggestions.push("🎯 針對偶發性質量問題建立檢核清單");
          suggestions.push("📈 定期檢視質量數據，找出改善機會點");
        } else if (value >= 70) {
          suggestions.push("🔧 建議加強作業前檢查，確認設備狀況");
          suggestions.push("📖 參與質量管理系統培訓，了解標準作業程序");
        } else {
          suggestions.push("⚠️ 緊急改善質量控制流程，避免持續性缺陷");
          suggestions.push("👨‍🏫 安排一對一質量指導，重新學習作業標準");
        }
        break;
        
      case "workHours":
        if (value >= 90) {
          suggestions.push("⚡ 工時效率優異！可研究自動化改善方案");
          suggestions.push("🎓 分享效率提升經驗，幫助團隊整體進步");
        } else if (value >= 80) {
          suggestions.push("🔄 檢視重複性作業，尋找標準化機會");
          suggestions.push("💡 學習使用更有效的工具或方法");
        } else if (value >= 70) {
          suggestions.push("📊 記錄每日工時分配，找出時間浪費點");
          suggestions.push("🎯 設定每小時產能目標，逐步提升效率");
        } else {
          suggestions.push("🔴 檢查是否存在技能缺口或設備問題");
          suggestions.push("📞 立即尋求技術支援，解決效率瓶頸");
        }
        break;
        
      case "attendance":
        if (value >= 98) {
          suggestions.push("🌟 全勤表現優秀！展現了高度的工作責任感");
          suggestions.push("👥 可擔任團隊出勤模範，鼓勵其他同仁");
        } else if (value >= 90) {
          suggestions.push("📅 維持穩定出勤習慣，避免非必要請假");
          suggestions.push("🏃‍♂️ 注意身體健康，預防因病缺勤");
        } else if (value >= 80) {
          suggestions.push("⏰ 檢討請假原因，建立更好的時間管理");
          suggestions.push("🚗 如有通勤問題，考慮調整交通方式");
        } else {
          suggestions.push("🚨 出勤率需要立即改善，與HR討論具體問題");
          suggestions.push("📋 建立個人出勤改善計劃，設定月度目標");
        }
        break;
        
      case "machineStatus":
        if (value >= 95) {
          suggestions.push("🤖 機台操作技能純熟！可指導新手操作技巧");
          suggestions.push("🔧 參與設備改善專案，提升整體稼動率");
        } else if (value >= 85) {
          suggestions.push("📋 建立機台檢查清單，減少停機時間");
          suggestions.push("🎯 學習預防性維護技巧，提升設備效率");
        } else if (value >= 70) {
          suggestions.push("📚 加強機台操作培訓，熟悉設備特性");
          suggestions.push("⚡ 學習快速故障排除方法，減少待機時間");
        } else {
          suggestions.push("🔴 機台稼動率過低，需要緊急技術支援");
          suggestions.push("👨‍🔧 安排資深技師一對一指導操作技巧");
        }
        break;
        
      case "maintenance":
        if (value >= 90) {
          suggestions.push("🛠️ 維護表現傑出！可擔任維護團隊領導角色");
          suggestions.push("📖 編寫維護最佳實務手冊，傳承經驗");
        } else if (value >= 80) {
          suggestions.push("🔍 建立設備異常早期預警系統");
          suggestions.push("📅 規劃更完善的預防性維護計劃");
        } else if (value >= 70) {
          suggestions.push("📊 記錄設備異常模式，建立維護資料庫");
          suggestions.push("🎓 參加設備維護進階課程，提升技能");
        } else {
          suggestions.push("⚠️ 維護能力需要大幅改善，避免設備損害");
          suggestions.push("👨‍🏫 安排維護專家指導，重新學習維護程序");
        }
        break;
        
      case "targetAchievement":
        if (value >= 95) {
          suggestions.push("🎯 目標達成優異！可參與更有挑戰性的專案");
          suggestions.push("📈 分享目標管理方法，提升團隊整體表現");
        } else if (value >= 85) {
          suggestions.push("🔄 檢視目標設定方式，確保合理且可達成");
          suggestions.push("📊 運用數據分析工具，掌握進度狀況");
        } else if (value >= 70) {
          suggestions.push("📅 將大目標分解為小階段，逐步達成");
          suggestions.push("🤝 主動與主管溝通，尋求目標達成支援");
        } else {
          suggestions.push("🚨 目標達成率過低，需要重新評估能力與資源");
          suggestions.push("🎯 設定更實際的短期目標，重建信心");
        }
        break;
        
      case "kpi":
        if (value >= 90) {
          suggestions.push("📊 KPI表現卓越！可協助制定部門績效標準");
          suggestions.push("🏆 分享績效管理心得，成為標竿學習對象");
        } else if (value >= 80) {
          suggestions.push("🎯 分析各項KPI權重，專注改善關鍵指標");
          suggestions.push("📈 建立個人績效追蹤儀表板");
        } else if (value >= 70) {
          suggestions.push("📚 學習績效改善方法論，系統性提升表現");
          suggestions.push("🤝 與績效優異同事組成學習小組");
        } else {
          suggestions.push("🔴 KPI表現需要全面改善，制定緊急行動計劃");
          suggestions.push("👨‍💼 與主管密切配合，定期檢討改善進度");
        }
        break;
        
      case "efficiency":
        if (value >= 90) {
          suggestions.push("⚡ 效率表現優異！可研究作業流程優化方案");
          suggestions.push("🎓 開發效率提升工具，造福整個團隊");
        } else if (value >= 80) {
          suggestions.push("🔄 運用精實生產原理，消除浪費環節");
          suggestions.push("📊 分析工作瓶頸，找出效率改善機會");
        } else if (value >= 70) {
          suggestions.push("⏱️ 學習時間動作研究，優化作業方法");
          suggestions.push("🛠️ 熟悉更多工具使用技巧，提升作業速度");
        } else {
          suggestions.push("🚨 效率表現急需改善，檢查是否有技能或工具問題");
          suggestions.push("📚 參加效率改善培訓，學習基本作業方法");
        }
        break;
        
      default:
        suggestions.push("📈 持續關注這項指標的表現趨勢");
        suggestions.push("🎯 設定明確的改善目標和時程");
    }
    
    return suggestions;
  };

  /**
   * 根據分數範圍提供通用建議
   */
  const getGeneralSuggestions = (value, metricTitle) => {
    const suggestions = [];
    
    if (value === 100) {
      suggestions.push("🌟 已達到滿分表現，考慮挑戰更高層次的目標");
      suggestions.push("🎯 制定創新改善方案，為團隊帶來突破性進展");
    } else if (value >= 95) {
      suggestions.push("💎 表現接近完美，注意維持穩定的高水準");
      suggestions.push("🚀 可嘗試跨領域學習，擴展專業技能範圍");
    } else if (value >= 90) {
      suggestions.push("🎉 表現優秀，距離頂尖只差一步之遙");
      suggestions.push("🔍 細部檢視流程，找出最後的改善空間");
    } else if (value >= 80) {
      suggestions.push("📈 穩健的表現，持續努力可達到優秀水準");
      suggestions.push("🎓 投資學習新技能，為下一階段成長做準備");
    } else if (value >= 70) {
      suggestions.push("⚡ 表現有改善空間，專注於關鍵能力提升");
      suggestions.push("🤝 主動尋求指導和回饋，加速改善進程");
    } else if (value >= 60) {
      suggestions.push("🎯 制定具體的改善計劃，設定可達成的里程碑");
      suggestions.push("📚 參與相關培訓課程，強化基礎技能");
    } else {
      suggestions.push("🚨 需要立即採取改善行動，尋求專業協助");
      suggestions.push("🛠️ 檢討基本作業方法，重新建立正確習慣");
    }
    
    return suggestions;
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="bg-slate-700/50 p-4 rounded-xl cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm hover:bg-slate-700/60 group"
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`${metric.color} animate-glow`}>
                {metric.icon}
              </span>
              <h3
                className={`text-lg font-semibold ${metric.color} animate-glow`}
              >
                {metric.title}
              </h3>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <p className={`text-3xl font-bold ${metric.color} animate-glow`}>
                {value}%
              </p>
            </div>
            {/* 等級標示 */}
            <div className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${getGradeBadgeColor(scoreData.grade)} animate-glow`}>
              {scoreData.grade}級
            </div>
          </div>
          <div className="trend-indicator flex flex-col items-end gap-1">
            {value > metric.target ? (
              <ReactFeatherTrendingUp className="text-green-400 animate-glow" />
            ) : (
              <ReactFeatherTrendingDown className="text-red-400 animate-glow" />
            )}
            <span className="text-xs text-slate-400">{scoreData.gradeDescription}</span>
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={value} color={metric.color} />
          <div className="flex justify-between items-center mt-1">
            <p className={`text-sm ${metric.color}`}>
              目標: {metric.target}%
            </p>
            <p className="text-sm text-slate-400">
              滿分: 100%
            </p>
          </div>
        </div>
      </div>

      {/* Modal Content */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-600 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
              <div className="flex items-center gap-2">
                <span className={metric.color}>{metric.icon}</span>
                <h3 className="text-xl font-bold text-white">
                  {metric.title}詳細資訊
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div
              className="overflow-y-auto p-4 space-y-6"
              style={{
                maxHeight: "calc(80vh - 60px)",
                scrollbarWidth: "thin",
                scrollbarColor: "#475569 #1e293b",
              }}
            >
              {/* 當前績效表現 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-700 p-4 rounded-lg text-center">
                  <p className="text-slate-300 mb-1">百分比表現</p>
                  <p className={`text-3xl font-bold ${metric.color}`}>
                    {value}%
                  </p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg text-center">
                  <p className="text-slate-300 mb-1">得分計算表積分</p>
                  <p className="text-3xl font-bold text-orange-400">
                    {scoreData.score}分
                  </p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg text-center">
                  <p className="text-slate-300 mb-1">評等級別</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-lg font-bold ${getGradeBadgeColor(scoreData.grade)}`}>
                    {scoreData.grade}級
                  </div>
                </div>
              </div>
              
              {/* 目標與升級資訊 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-slate-300 mb-2">目標設定</p>
                  <div className="space-y-1">
                    <p className="text-white">目標百分比: {metric.target}%</p>
                    <p className="text-white">目標積分: {metric.target}分以上</p>
                  </div>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <p className="text-slate-300 mb-2">升級條件</p>
                  <div className="space-y-1">
                    {performanceAnalysis.upgrade.isMaxGrade ? (
                      <p className="text-green-400 font-medium">{performanceAnalysis.upgrade.message}</p>
                    ) : (
                      <>
                        <p className="text-white">距離{performanceAnalysis.upgrade.nextGrade}級還需: {performanceAnalysis.upgrade.scoreNeeded}分</p>
                        <p className="text-orange-400 text-sm">{performanceAnalysis.upgrade.upgradeMessage}</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* 計算方式說明 */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-white">
                  數據來源與計算依據
                </h4>
                <div className="bg-slate-700 rounded-lg p-4 space-y-3">
                  <div className="space-y-2">
                    <h5 className="text-white font-medium">資料來源：</h5>
                    <div className="bg-slate-600/50 rounded p-3 text-sm text-slate-300">
                      {scoreExplanation.baseScoreExplanation}
                      <div className="text-slate-400 mt-1">
                        {scoreExplanation.calculationMethod}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-white font-medium">計算公式：</h5>
                    <div className="bg-slate-600/50 rounded p-3 text-sm">
                      <div className="text-slate-300 font-mono">
                        {getCalculationFormula(metric.id, value)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 得分計算表整合說明 */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-white">
                  得分計算表整合說明
                </h4>
                <div className="bg-slate-700 rounded-lg p-4 space-y-4">
                  {/* 分數區間說明 */}
                  <div className="space-y-2">
                    <h5 className="text-white font-medium">分數區間：</h5>
                    <div className="bg-slate-600/50 rounded p-3">
                      <div className="flex justify-between text-slate-300">
                        <span>當前分數區間</span>
                        <span>{scoreData.range}</span>
                      </div>
                      <div className="flex justify-between text-slate-300 mt-1">
                        <span>對應等級</span>
                        <span>{scoreData.grade}級 - {scoreData.gradeDescription}</span>
                      </div>
                    </div>
                  </div>

                  {/* 獎懲機制說明 */}
                  <div className="space-y-2">
                    <h5 className="text-white font-medium">獎懲機制：</h5>
                    <div className="bg-slate-600/50 rounded p-3">
                      <div className="flex justify-between text-slate-300">
                        <span>基礎得分</span>
                        <span>{performanceAnalysis.bonus.baseScore}分</span>
                      </div>
                      {performanceAnalysis.bonus.bonusReasons.length > 0 ? (
                        performanceAnalysis.bonus.bonusReasons.map((reason, index) => (
                          <div key={index} className="flex justify-between text-green-400 text-sm">
                            <span>{reason}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 text-sm">無額外加分項目</div>
                      )}
                      <div className="flex justify-between text-white font-semibold pt-2 border-t border-slate-500 mt-2">
                        <span>最終得分</span>
                        <span>{performanceAnalysis.bonus.finalScore}分</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 詳細評分依據 */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-white">
                  詳細評分依據
                </h4>
                <div className="bg-slate-700 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-slate-600/50 rounded p-3">
                      <h6 className="text-green-400 font-medium mb-2">A級標準（90-100分）</h6>
                      <p className="text-sm text-slate-300">90%以上 → 優秀表現</p>
                    </div>
                    <div className="bg-slate-600/50 rounded p-3">
                      <h6 className="text-blue-400 font-medium mb-2">B級標準（80-89分）</h6>
                      <p className="text-sm text-slate-300">80-89% → 良好表現</p>
                    </div>
                    <div className="bg-slate-600/50 rounded p-3">
                      <h6 className="text-yellow-400 font-medium mb-2">C級標準（70-79分）</h6>
                      <p className="text-sm text-slate-300">70-79% → 待改進表現</p>
                    </div>
                    <div className="bg-slate-600/50 rounded p-3">
                      <h6 className="text-orange-400 font-medium mb-2">D級以下（60分以下）</h6>
                      <p className="text-sm text-slate-300">60%以下 → 需加強表現</p>
                    </div>
                  </div>
                  <div className="bg-slate-600/50 rounded p-3 mt-3">
                    <h6 className="text-white font-medium mb-2">目前狀態分析：</h6>
                    <p className="text-slate-300 text-sm">
                      位於{scoreData.grade}級區間（{scoreData.range}），{scoreData.gradeDescription}
                      {!performanceAnalysis.upgrade.isMaxGrade && 
                        `，${performanceAnalysis.upgrade.upgradeMessage}`
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* 修改後的歷史趨勢 */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-white">歷史趨勢</h4>
                <div className="bg-slate-700 p-4 rounded-lg h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getRecentMonthsData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1F2937",
                          border: "none",
                          borderRadius: "0.5rem",
                          color: "#ffffff", // 添加文字顏色
                        }}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey={
                          metric.id === "workCompletion" ? "completion" :
                          metric.id === "quality" ? "quality" :
                          metric.id === "workHours" ? "workHours" :
                          metric.id === "attendance" ? "attendance" :
                          metric.id === "machineStatus" ? "machineStatus" :
                          metric.id === "maintenance" ? "maintenance" :
                          metric.id === "targetAchievement" ? "targetAchievement" :
                          metric.id === "kpi" ? "kpi" :
                          "efficiency"
                        }
                        name={getMetricStyle(metric.id).name}
                        stroke={getMetricStyle(metric.id).color}
                        strokeWidth={2}
                        dot={{
                          fill: "#fff",
                          stroke: getMetricStyle(metric.id).color,
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 改進建議 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">改進建議</h4>

                  {/* 新增：等級說明按鈕 */}
                  <button
                    className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
                    onClick={() => setShowLevelGuide(true)}
                  >
                    <Info className="w-4 h-4" />
                    等級說明
                  </button>
                </div>

                <div
                  className={`bg-slate-700 p-4 rounded-lg border-l-4 ${
                    scoreData.grade === 'A'
                      ? "border-green-500"
                      : scoreData.grade === 'B'
                        ? "border-blue-500"
                        : scoreData.grade === 'C'
                          ? "border-yellow-500"
                          : scoreData.grade === 'D'
                            ? "border-orange-500"
                            : "border-red-500"
                  }`}
                >
                  {/* 等級與表現標籤 */}
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          scoreData.grade === 'A'
                            ? "bg-green-500"
                            : scoreData.grade === 'B'
                              ? "bg-blue-500"
                              : scoreData.grade === 'C'
                                ? "bg-yellow-500"
                                : scoreData.grade === 'D'
                                  ? "bg-orange-500"
                                  : "bg-red-500"
                        }`}
                      ></div>
                      <span className="text-sm text-slate-300">
                        {scoreData.gradeDescription}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${getGradeBadgeColor(scoreData.grade)}`}>
                      {scoreData.grade}級 · {scoreData.score}分
                    </div>
                  </div>

                  {/* 短期目標 */}
                  {!performanceAnalysis.upgrade.isMaxGrade && (
                    <div className="mb-4 p-3 bg-slate-600/50 rounded">
                      <h6 className="text-orange-400 font-medium mb-2">短期目標：</h6>
                      <p className="text-sm text-slate-300 mb-1">
                        1個月內提升至{performanceAnalysis.upgrade.nextGrade}級（{performanceAnalysis.upgrade.nextGradeTarget}分以上）
                      </p>
                      <p className="text-xs text-slate-400">
                        需要提升: {performanceAnalysis.upgrade.scoreNeeded}分（對應{performanceAnalysis.upgrade.percentageNeeded}%）
                      </p>
                    </div>
                  )}

                  {/* 具體建議 */}
                  <div className="space-y-3">
                    <h6 className="text-white font-medium">具體行動建議：</h6>
                    <ul className="space-y-2">
                      {getSuggestions(value, metric).map((suggestion, index) => (
                        <li
                          key={index}
                          className="text-slate-300 flex items-start gap-2"
                        >
                          <span className="text-slate-400 mt-1">•</span>
                          <span>{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 新增：等級說明彈窗 */}
      {showLevelGuide && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-white">績效等級說明</h3>
              <button
                onClick={() => setShowLevelGuide(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <div>
                  <p className="text-white font-medium">優異表現 (90分以上)</p>
                  <p className="text-sm text-slate-400">
                    表現卓越，可作為標竿學習對象
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-white font-medium">良好表現 (80-89分)</p>
                  <p className="text-sm text-slate-400">
                    表現良好，仍有進步空間
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <div>
                  <p className="text-white font-medium">待加強 (70-79分)</p>
                  <p className="text-sm text-slate-400">
                    需要適度改善，建議尋求協助
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <div>
                  <p className="text-white font-medium">需要改進 (60-69分)</p>
                  <p className="text-sm text-slate-400">
                    表現不佳，需要重點關注
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <div>
                  <p className="text-white font-medium">急需協助 (60分以下)</p>
                  <p className="text-sm text-slate-400">
                    表現不足，需要立即介入輔導
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 註：getScoreBreakdown 函數已移至 src/utils/scoreCalculations.js 
// 以避免重複邏輯，提升程式碼維護性

// 修改詳情彈窗組件
const MetricDetails = ({ metric, data, onClose }) => {
  const breakdown = getScoreBreakdown(metric, data);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-white">{metric.title}詳情</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 指標說明 */}
          <div className="bg-slate-700/50 rounded-lg p-4">
            <p className="text-slate-300">
              {metric.description || `${metric.title}的績效表現指標`}
            </p>
          </div>

          {/* 得分明細 */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-2">
              得分計算明細
            </h4>

            {/* 基礎分數 */}
            <div className="mb-4">
              <div className="flex justify-between text-slate-300">
                <span>基礎得分</span>
                <span>{breakdown.baseScore.toFixed(1)}分</span>
              </div>
              <div className="text-sm text-slate-400 mt-1">
                基於{metric.title}的基本表現計算
              </div>
            </div>

            {/* 調整項目 */}
            {breakdown.adjustments.length > 0 && (
              <div className="space-y-3">
                <h5 className="text-white font-medium">加分項目：</h5>
                {breakdown.adjustments.map((adjustment, index) => (
                  <div key={index} className="bg-slate-600/50 rounded p-3">
                    <div className="flex justify-between text-slate-300">
                      <span>{adjustment.reason}</span>
                      <span>+{adjustment.score.toFixed(1)}分</span>
                    </div>
                    <div className="text-sm text-slate-400 mt-1">
                      {adjustment.description}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 最終得分 */}
            <div className="mt-4 pt-3 border-t border-slate-600">
              <div className="flex justify-between text-white font-semibold">
                <span>最終得分</span>
                <span>{breakdown.finalScore.toFixed(1)}分</span>
              </div>
            </div>
          </div>

          {/* 歷史趨勢 */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-2">歷史趨勢</h4>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.historicalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "none",
                    borderRadius: "0.5rem",
                    padding: "0.5rem",
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 改進建議 */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-2">改進建議</h4>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              {generateImprovement(data)
                .suggestions.filter((s) => s.category === metric.id)
                .map((suggestion, index) => (
                  <li key={index} className="text-sm">
                    {suggestion.message}
                  </li>
                ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 組件：評分詳情展示
 * 顯示員工的總體評分和公平性指標
 */
export const ScoreDetails = ({ employeeData, role }) => {
  const totalScore = calculateTotalScore(employeeData, role);
  const fairnessIndex = calculateFairnessIndex([totalScore]);

  return (
    <div className="bg-slate-700 rounded-xl p-6 text-white">
      <h3 className="text-xl font-bold mb-4">評分詳情</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>目標達成率</span>
            <span className="font-semibold">
              {employeeData.workCompletion}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>產品質量</span>
            <span className="font-semibold">
              {employeeData.productQuality}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>工作時間</span>
            <span className="font-semibold">{employeeData.workHours}小時</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span>機台狀態</span>
            <span className="font-semibold">{employeeData.machineStatus}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>總分</span>
            <span className="font-semibold text-lg">
              {totalScore.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span>公平性指標</span>
            <span
              className={`font-semibold ${
                fairnessIndex >= 85 ? "text-green-400" : "text-red-400"
              }`}
            >
              {fairnessIndex.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 主要組件：績效儀表板
 * 整合所有子組件和功能的主容器
 */
export default function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedEmployee, setSelectedEmployee] = useState("EMP001");
  const [isLoading, setIsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2025); // 年份選擇狀態，默認2025年
  const [showPointsManagement, setShowPointsManagement] = useState(false); // 積分管理系統狀態
  const navigate = useNavigate();
  const evaluator = new PerformanceEvaluator("operator");
  const [showLevelGuide, setShowLevelGuide] = useState(false);

  // 修改 employeeData 的初始狀態，確保所有指標都有數據
  const [employeeData, setEmployeeData] = useState({
    workCompletion: 85, // 工作完成量
    productQuality: 92, // 產品質量
    workHours: 88, // 工作時間
    attendance: 95, // 差勤紀錄
    machineStatus: 87, // 機台運行狀態
    maintenanceRecord: 90, // 機台維護紀錄
    targetAchievement: 86, // 目標達成率
    kpi: 89, // 關鍵績效指標
    efficiency: 91, // 效率指標
    historicalData: [
      { month: "1月", value: 85 },
      { month: "2月", value: 87 },
      { month: "3月", value: 89 },
      { month: "4月", value: 86 },
      { month: "5月", value: 88 },
      { month: "6月", value: 90 },
      { month: "7月", value: 91 },
      { month: "8月", value: 89 },
      { month: "9月", value: 92 },
      { month: "10月", value: 93 },
      { month: "11月", value: 91 },
      { month: "12月", value: 94 },
    ],
  });

  /**
   * 配置數據區域
   */

  // 根據選擇的年份和員工動態生成時間序列數據
  const getTimeSeriesData = () => {
    const data = mockEmployeeData[selectedEmployee];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // getMonth()返回0-11，需要+1
    
    if (!data || !data.yearlyData || !data.yearlyData[selectedYear]) {
      // 如果沒有對應年份數據，使用預設數據
      return [
        { month: "1月", completion: 60, quality: 65, efficiency: 62 },
        { month: "2月", completion: 62, quality: 67, efficiency: 64 },
        { month: "3月", completion: 65, quality: 70, efficiency: 67 },
        { month: "4月", completion: 68, quality: 72, efficiency: 70 },
        { month: "5月", completion: 70, quality: 75, efficiency: 72 },
        { month: "6月", completion: 72, quality: 77, efficiency: 75 },
        { month: "7月", completion: 75, quality: 80, efficiency: 77 },
        { month: "8月", completion: 77, quality: 82, efficiency: 80 },
        { month: "9月", completion: 80, quality: 85, efficiency: 82 },
        { month: "10月", completion: 82, quality: 87, efficiency: 85 },
        { month: "11月", completion: 85, quality: 90, efficiency: 87 },
        { month: "12月", completion: 87, quality: 92, efficiency: 90 },
      ];
    }
    
    let yearData = [...data.yearlyData[selectedYear]];
    
    // 如果選中的是當前年份，需要根據當前月份動態處理數據
    if (selectedYear === currentYear) {
      // 如果當前月份超過已有數據的月份，動態生成新的月份數據
      const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
      const existingMonthsCount = yearData.length;
      
      // 如果當前月份超過已有數據，生成缺失的月份數據
      if (currentMonth > existingMonthsCount) {
        const lastDataPoint = yearData[yearData.length - 1];
        
        // 為每個缺失的月份生成數據
        for (let month = existingMonthsCount + 1; month <= currentMonth; month++) {
          // 基於最後一個數據點生成新數據，加入一些變化
          const variation = () => Math.round((Math.random() - 0.5) * 4); // ±2的變化
          
          const newDataPoint = {
            month: monthNames[month - 1],
            completion: Math.max(0, Math.min(100, lastDataPoint.completion + variation())),
            quality: Math.max(0, Math.min(100, lastDataPoint.quality + variation())),
            efficiency: Math.max(0, Math.min(100, lastDataPoint.efficiency + variation()))
          };
          
          yearData.push(newDataPoint);
        }
      } else {
        // 如果當前月份小於等於已有數據，只顯示到當前月份
        yearData = yearData.slice(0, currentMonth);
      }
    }
    
    return yearData;
  };

  const timeSeriesData = getTimeSeriesData();

  // 可選年份列表
  const availableYears = [2025, 2024, 2023, 2022];

  /**
   * 指標配置區域
   * 定義所有績效指標的計算規則和展示方式
   */
  const metrics = [
    {
      id: "workCompletion",
      title: "工作完成量",
      value: (data) => {
        const baseScore = data?.workCompletion || 0;
        const bonus = baseScore >= 95 ? 5 : 0;
        return Math.min(100, baseScore + bonus);
      },
      icon: <Activity className="w-6 h-6" />,
      color: "text-blue-500",
      target: 95,
      weight: 0.125,
    },
    {
      id: "quality",
      title: "產品質量",
      value: (data) => {
        const baseScore = data?.productQuality || 0;
        const stabilityBonus = baseScore >= 90 ? 3 : 0;
        const zeroDefectBonus = baseScore >= 95 ? 2 : 0;
        return Math.min(100, baseScore + stabilityBonus + zeroDefectBonus);
      },
      icon: <Target className="w-6 h-6" />,
      color: "text-green-500",
      target: 98,
      weight: 0.125,
    },
    {
      id: "workHours",
      title: "工作時間",
      value: (data) => {
        const breakdown = getScoreBreakdown({ id: "workHours" }, data);
        return breakdown.finalScore;
      },
      icon: <Clock className="w-6 h-6" />,
      color: "text-orange-400",
      target: 95,
      weight: 0.125,
    },
    {
      id: "attendance",
      title: "差勤紀錄",
      value: (data) => {
        const baseScore = data?.attendance || 0;
        const perfectAttendanceBonus = baseScore >= 98 ? 2 : 0;
        return Math.min(100, baseScore + perfectAttendanceBonus);
      },
      icon: <Calendar className="w-6 h-6" />,
      color: "text-pink-400",
      target: 95,
      weight: 0.125,
    },
    {
      id: "machineStatus",
      title: "機台運行狀態",
      value: (data) => {
        const baseScore = data?.machineStatus || 0;
        const optimizationBonus = baseScore >= 95 ? 3 : 0;
        const maintenanceBonus = data?.maintenanceRecord >= 90 ? 2 : 0;
        return Math.min(100, baseScore + optimizationBonus + maintenanceBonus);
      },
      icon: <Settings className="w-6 h-6" />,
      color: "text-cyan-400",
      target: 90,
      weight: 0.125,
    },
    {
      id: "maintenance",
      title: "機台維護紀錄",
      value: (data) => {
        const baseScore = data?.maintenanceRecord || 0;
        const preventiveBonus = data?.preventiveMaintenance ? 2 : 0;
        const performanceBonus = data?.machineStatus >= 90 ? 2 : 0;
        return Math.min(100, baseScore + preventiveBonus + performanceBonus);
      },
      icon: <Wrench className="w-6 h-6" />,
      color: "text-purple-400",
      target: 90,
      weight: 0.125,
    },
    {
      id: "targetAchievement",
      title: "目標達成率",
      value: (data) => {
        const baseScore = data?.targetAchievement || 0;
        const overachieveBonus = baseScore >= 95 ? 3 : 0;
        const efficiencyBonus = data?.efficiency >= 90 ? 2 : 0;
        return Math.min(100, baseScore + overachieveBonus + efficiencyBonus);
      },
      icon: <Target className="w-6 h-6" />,
      color: "text-red-400",
      target: 90,
      weight: 0.125,
    },
    {
      id: "kpi",
      title: "關鍵績效指標",
      value: (data) => {
        const baseScore = data?.kpi || 0;
        const excellenceBonus = baseScore >= 95 ? 3 : 0;
        const teamworkBonus = data?.teamwork >= 90 ? 2 : 0;
        return Math.min(100, baseScore + excellenceBonus + teamworkBonus);
      },
      icon: <BarChart className="w-6 h-6" />,
      color: "text-yellow-400",
      target: 85,
      weight: 0.125,
    },
    {
      id: "efficiency",
      title: "效率指標",
      value: (data) => {
        const baseScore = data?.efficiency || 0;
        const improvementBonus = baseScore >= 95 ? 3 : 0;
        const resourceBonus = data?.resourceUtilization >= 90 ? 2 : 0;
        return Math.min(100, baseScore + improvementBonus + resourceBonus);
      },
      icon: <Zap className="w-6 h-6" />,
      color: "text-lime-400",
      target: 85,
      weight: 0.125,
    },
  ];

  /**
   * 員工等級計算區域 
   * 在metrics定義之後計算員工等級
   */
  // 動態計算員工等級
  const calculateEmployeeGrade = (employeeId) => {
    const data = mockEmployeeData[employeeId];
    if (!data) return 'E';
    
    const grades = [];
    metrics.forEach(metric => {
      const value = metric.value(data);
      const grade = getGradeFromScore(value);
      grades.push(grade);
    });
    
    // 統計各等級數量
    const gradeCount = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    grades.forEach(grade => gradeCount[grade]++);
    
    // 找出最多的等級作為主要等級
    const maxCount = Math.max(...Object.values(gradeCount));
    const dominantGrade = Object.keys(gradeCount).find(grade => gradeCount[grade] === maxCount);
    
    return dominantGrade;
  };

  const getGradeDescription = (grade) => {
    const descriptions = {
      'A': '優秀',
      'B': '良好', 
      'C': '待改進',
      'D': '需加強',
      'E': '急需協助'
    };
    return descriptions[grade] || '未知';
  };

  const employees = [
    { 
      id: "EMP001", 
      name: "張小明", 
      grade: calculateEmployeeGrade("EMP001"),
      get displayName() { 
        return `${this.name} (${this.grade}級-${getGradeDescription(this.grade)})`;
      }
    },
    { 
      id: "EMP002", 
      name: "李小華", 
      grade: calculateEmployeeGrade("EMP002"),
      get displayName() { 
        return `${this.name} (${this.grade}級-${getGradeDescription(this.grade)})`;
      }
    },
    { 
      id: "EMP003", 
      name: "王大明", 
      grade: calculateEmployeeGrade("EMP003"),
      get displayName() { 
        return `${this.name} (${this.grade}級-${getGradeDescription(this.grade)})`;
      }
    },
    { 
      id: "EMP004", 
      name: "陳小芳", 
      grade: calculateEmployeeGrade("EMP004"),
      get displayName() { 
        return `${this.name} (${this.grade}級-${getGradeDescription(this.grade)})`;
      }
    },
    { 
      id: "EMP005", 
      name: "林小強", 
      grade: calculateEmployeeGrade("EMP005"),
      get displayName() { 
        return `${this.name} (${this.grade}級-${getGradeDescription(this.grade)})`;
      }
    },
  ].sort((a, b) => a.grade.localeCompare(b.grade)); // 按等級A-E排序

  /**
   * 額外指標配置區域
   * 定義加班、推廣等特殊指標
   */
  const additionalMetrics = [
    {
      id: "overtime",
      title: "加班影響",
      description: "加班時數對績效的影響",
      value: (data) => {
        const evaluator = new PerformanceEvaluator(data.role);
        return evaluator.calculateOvertimeImpact(data.overtimeHours);
      },
      color: "bg-yellow-500",
    },
    {
      id: "promotion",
      title: "推廣加成",
      description: "推廣期間的績效加成",
      value: (data) => {
        const evaluator = new PerformanceEvaluator(data.role);
        return evaluator.calculatePromotionBonus(
          data.monthInRole,
          data.baseScore,
        );
      },
      color: "bg-purple-500",
    },
    {
      id: "special",
      title: "特殊貢獻",
      description: "特殊貢獻加分",
      value: (data) => {
        const evaluator = new PerformanceEvaluator(data.role);
        return evaluator.calculateSpecialContribution(data.contributions);
      },
      color: "bg-green-500",
    },
  ];

  /**
   * 生命週期方法區域
   */
  useEffect(() => {
    const loadEmployeeData = async () => {
      setIsLoading(true);

      try {
        console.group('數據整合結果');

        // 並行獲取數據
        const [jsonData, xmlData] = await Promise.all([
          performanceAPI.getEmployeeData(selectedEmployee, 'json'),
          performanceAPI.getEmployeeData(selectedEmployee, 'xml')
        ]);

        // 只顯示關鍵數據比對
        console.log('多格式數據比對：', {
          JSON格式: {
            工作完成度: jsonData.employeeData[selectedEmployee].workCompletion,
            產品質量: jsonData.employeeData[selectedEmployee].productQuality
          },
          XML格式: {
            工作完成度: xmlData.employeeData.employee.workCompletion,
            產品質量: xmlData.employeeData.employee.productQuality
          }
        });

        // 合併API數據和假數據，確保所有指標都有值
        const apiData = jsonData.employeeData[selectedEmployee];
        const mergedData = {
          workCompletion: apiData.workCompletion || 85, // 工作完成量
          productQuality: apiData.productQuality || 92, // 產品質量
          workHours: apiData.workHours || 88, // 工作時間
          attendance: apiData.attendance || 95, // 差勤紀錄
          machineStatus: apiData.machineStatus || 87, // 機台運行狀態
          maintenanceRecord: apiData.maintenanceRecord || 90, // 機台維護紀錄
          targetAchievement: apiData.targetAchievement || 86, // 目標達成率
          kpi: apiData.kpi || 89, // 關鍵績效指標
          efficiency: apiData.efficiency || 91, // 效率指標
          historicalData: apiData.historicalData || [
            { month: "1月", value: 85 },
            { month: "2月", value: 87 },
            { month: "3月", value: 89 },
            { month: "4月", value: 86 },
            { month: "5月", value: 88 },
            { month: "6月", value: 90 },
            { month: "7月", value: 91 },
            { month: "8月", value: 89 },
            { month: "9月", value: 92 },
            { month: "10月", value: 93 },
            { month: "11月", value: 91 },
            { month: "12月", value: 94 },
          ]
        };

        console.log('合併後的數據:', mergedData);
        setEmployeeData(mergedData);
        console.groupEnd();

      } catch (error) {
        console.error("數據整合失敗，使用假數據:", error);
        // API失敗時保持原有的假數據，不做任何更改
      } finally {
        setIsLoading(false);
      }
    };

    loadEmployeeData();
  }, [selectedEmployee]);

  /**
   * 事件處理方法區域
   */
  const handleLogout = () => {
    // ... 登出處理邏輯 ...
    localStorage.removeItem("isAuthenticated");
    navigate("/login");
  };

  useEffect(() => {
    // ... 點擊外部關閉用戶選單邏輯 ...
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest(".user-menu")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  /**
   * 條件渲染：加載狀態
   */
  if (!employeeData || isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-slate-300">載入中...</p>
        </div>
      </div>
    );
  }

  const handleEmployeeChange = (e) => {
    // ... 員工選擇處理邏輯 ...
    setSelectedEmployee(e.target.value);
  };

  /**
   * 主要渲染邏輯
   */

  // 如果顯示積分管理，則渲染整頁積分管理系統
  if (showPointsManagement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900">
        {/* 積分管理內容 */}
        <div className="w-full">
          <PointsManagementDashboard
            onClose={() => setShowPointsManagement(false)}
            currentUser={null}
            isFullPage={true}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* 頁面頭部：標題和用戶選項 */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors duration-200 flex items-center gap-2">
              <Activity className="w-8 h-8" />
              員工智慧考核系統
            </h1>
            <div className="flex items-center gap-4">
              <select
                className="bg-slate-700 text-white border-slate-600 rounded-lg p-2"
                value={selectedEmployee}
                onChange={handleEmployeeChange}
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.displayName}
                  </option>
                ))}
              </select>

              {/* 積分管理按鈕 */}
              <button
                onClick={() => setShowPointsManagement(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                title="開啟積分管理系統"
              >
                <Calculator className="w-5 h-5" />
                <span>積分管理</span>
              </button>

              {/* 用戶選單 */}
              <div className="relative user-menu">
                <button
                  className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <User className="w-5 h-5" />
                  <span>用戶選項</span>
                </button>

                {/* 下拉選單 */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg py-1 z-10">
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-white hover:bg-slate-600 w-full text-left"
                      onClick={() => {
                        // TODO: 實現修改密碼功能
                        alert("修改密碼功能待實現");
                      }}
                    >
                      <Key className="w-4 h-4" />
                      修改密碼
                    </button>
                    <button
                      className="flex items-center gap-2 px-4 py-2 text-white hover:bg-slate-600 w-full text-left text-red-400 hover:text-red-300"
                      onClick={handleLogout}
                    >
                      <LogOut className="w-4 h-4" />
                      登出
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 標籤導航區域 */}
          <div className="flex gap-4 mb-6">
            {[
              {
                id: "dashboard",
                label: "績效儀表板",
                icon: <Activity size={20} />,
              },
              { id: "details", label: "詳細數據", icon: <Target size={20} /> },
              {
                id: "recommendations",
                label: "改進建議",
                icon: <Award size={20} />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? "bg-blue-600 text-white"
                    : "bg-slate-700 text-slate-200 hover:bg-slate-600"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* 主要內容區域 */}
          <div className="space-y-6">
            {/* Dashboard View */}
            {activeTab === "dashboard" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {metrics.map((metric) => (
                    <PerformanceCard
                      key={metric.id}
                      metric={metric}
                      data={employeeData || {}}
                    />
                  ))}
                </div>

                <div className="bg-slate-700 rounded-xl p-6 text-white">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">績效趨勢分析</h3>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-slate-300">選擇年份：</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        className="bg-slate-600 text-white px-3 py-1 rounded border border-slate-500 focus:border-blue-400 focus:outline-none"
                      >
                        {availableYears.map(year => (
                          <option key={year} value={year}>{year}年</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="month" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            border: "none",
                          }}
                        />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="completion"
                          stroke="#10B981"
                          name="完成率"
                        />
                        <Line
                          type="monotone"
                          dataKey="quality"
                          stroke="#3B82F6"
                          name="質量"
                        />
                        <Line
                          type="monotone"
                          dataKey="efficiency"
                          stroke="#F59E0B"
                          name="效率"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* 詳細數據視圖 */}
            {activeTab === "details" && (
              <div className="bg-slate-700 rounded-xl p-6 text-white">
                <h3 className="text-xl font-bold mb-4">詳細績效數據</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-600">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                          評估項目
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                          數值
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                          目標
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
                          狀態
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-600">
                      {metrics.map((metric) => (
                        <tr
                          key={metric.id}
                          className="hover:bg-slate-600/50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                            <div className="flex items-center">
                              <span
                                className={`mr-2 animate-glow ${metric.color}`}
                              >
                                {metric.icon}
                              </span>
                              <span className="animate-glow">
                                {metric.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                            <span className="animate-glow">
                              {metric.value(employeeData)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                            <span className="animate-glow">80%</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-1 rounded-full text-sm animate-glow ${
                                metric.value(employeeData) === 100
                                  ? "bg-gradient-to-r from-purple-300 via-purple-100 to-purple-300 text-purple-800"
                                  : metric.value(employeeData) >= 90
                                    ? "bg-green-100 text-green-800"
                                    : metric.value(employeeData) >= 80
                                      ? "bg-blue-100 text-blue-800"
                                      : metric.value(employeeData) >= 70
                                        ? "bg-yellow-100 text-yellow-800"
                                        : metric.value(employeeData) >= 60
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-red-100 text-red-800"
                              }`}
                            >
                              {metric.value(employeeData) === 100
                                ? "完美"
                                : metric.value(employeeData) >= 90
                                  ? "優秀"
                                  : metric.value(employeeData) >= 80
                                    ? "良好"
                                    : metric.value(employeeData) >= 70
                                      ? "待加強"
                                      : metric.value(employeeData) >= 60
                                        ? "不及格"
                                        : "極需改進"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 改進建議視圖 */}
            {activeTab === "recommendations" && (
              <div className="space-y-4">
                {metrics.map((metric) => {
                  const value = metric.value(employeeData);
                  const performanceLevel =
                    value === 100
                      ? "perfect"
                      : value >= 90
                        ? "excellent"
                        : value >= 80
                          ? "good"
                          : value >= 70
                            ? "needsImprovement"
                            : value >= 60
                              ? "poor"
                              : "critical";

                  return (
                    <div
                      key={metric.id}
                      className={`bg-slate-700 rounded-xl p-6 text-white border-l-4 hover:shadow-lg transition-all duration-300 ${
                        performanceLevel === "perfect"
                          ? "border-purple-500"
                          : performanceLevel === "excellent"
                            ? "border-green-500"
                            : performanceLevel === "good"
                              ? "border-blue-500"
                              : performanceLevel === "needsImprovement"
                                ? "border-yellow-500"
                                : performanceLevel === "poor"
                                  ? "border-orange-500"
                                  : "border-red-500"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className={`mr-2 ${metric.color}`}>
                            {metric.icon}
                          </span>
                          <h3 className="text-lg font-bold">
                            {metric.title}建議
                          </h3>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-sm animate-glow ${
                            performanceLevel === "perfect"
                              ? "bg-purple-100 text-purple-800"
                              : performanceLevel === "excellent"
                                ? "bg-green-100 text-green-800"
                                : performanceLevel === "good"
                                  ? "bg-blue-100 text-blue-800"
                                  : performanceLevel === "needsImprovement"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : performanceLevel === "poor"
                                      ? "bg-orange-100 text-orange-800"
                                      : "bg-red-100 text-red-800"
                          }`}
                        >
                          {performanceLevel === "perfect"
                            ? "表現完美"
                            : performanceLevel === "excellent"
                              ? "表現優異"
                              : performanceLevel === "good"
                                ? "表現良好"
                                : performanceLevel === "needsImprovement"
                                  ? "需要改進"
                                  : performanceLevel === "poor"
                                    ? "表現不佳"
                                    : "急需改進"}
                        </span>
                      </div>
                      <p className="text-slate-300">
                        {performanceLevel === "perfect"
                          ? `目前${metric.title}表現完美，建議持續保持並協助其他同仁。`
                          : performanceLevel === "excellent"
                            ? `目前${metric.title}表現優異，建議持續保持並協助其他同仁。`
                            : performanceLevel === "good"
                              ? `目前${metric.title}表現良好，建議持續保持並協助其他同仁。`
                              : performanceLevel === "needsImprovement"
                                ? `建議參加${metric.title}相關培訓課程，提升專業技能。`
                                : performanceLevel === "poor"
                                  ? `建議參加${metric.title}相關培訓課程，提升專業技能。`
                                  : `急需改進${metric.title}，建議參加相關培訓課程，提升專業技能。`}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>


    </>
  );
}
