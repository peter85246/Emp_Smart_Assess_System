import React, { useState, useEffect, useMemo } from "react";
import { Tabs } from 'antd';
import WorkLogApproval from './worklog/WorkLogApproval';
import WorkLogHistory from './worklog/WorkLogHistory';
import { useAuth } from '../contexts/AuthContext';
import { pointsConfig } from '../config/pointsConfig';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
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
  User,
  Key,
  LogOut,
  Info,
  Calculator,
} from "lucide-react";
import PointsManagementDashboard from './PointsManagement/PointsManagementDashboard';
import {
  TrendingUp as ReactFeatherTrendingUp,
  TrendingDown as ReactFeatherTrendingDown,
  X,
} from "react-feather";
import {
  calculateFairnessIndex,
  calculateTotalScore,
} from "../utils/performanceCalculations";
import {
  convertPercentageToScore,
  getPerformanceAnalysis,
  getGradeBadgeColor,
  getGradeFromScore,
  getScoreBreakdown  // 新增：從工具模組導入
} from "../utils/scoreCalculations";
import { useNavigate } from "react-router-dom";
import { performanceAPI } from "../services/api";
import { workLogAPI } from "../services/pointsAPI";
import { mockEmployeeData } from "../models/employeeData";
import { REPORT_API } from "../config/apiConfig";

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
  const breakdown = getScoreBreakdown(metric, data);

  // 直接使用 metric 的 value 函數獲取值
  let value = metric.value(data);

  // 檢查並修復NaN值，但允許出勤率指標使用字符串格式
  if ((isNaN(value) || value === null || value === undefined) && metric.id !== 'attendance') {
    console.warn(`Invalid value for metric ${metric.id}:`, value, 'data:', data);
    value = 0;
  } else if (metric.id === 'attendance' && (value === null || value === undefined || value === 'N/A')) {
    value = 'N/A';
  }

  // 如果是百分比指標，確保在0-100範圍內（出勤率指標除外，因為它使用字符串格式）
  if (metric.unit === "%" && metric.id !== 'attendance') {
    value = Math.max(0, Math.min(100, value));
  }

  // 得分計算表整合
  // 對於特殊指標，使用相應的評分計算邏輯
  let scoreValue;
  if (metric.id === 'attendance') {
    // 出勤率指標使用實際的百分比數值進行評分計算
    scoreValue = data?.attendance || 0;
  } else if (metric.scoreCalculation) {
    // 維護指標等使用特殊評分計算
    scoreValue = metric.scoreCalculation(data);
  } else {
    // 一般指標使用顯示值
    scoreValue = value;
  }
  const scoreData = convertPercentageToScore(scoreValue);
  const performanceAnalysis = getPerformanceAnalysis(scoreValue, metric.id, metric.title);

  /**
   * 數據處理方法：獲取最近6個月數據（智能洞察用）
   * 🎯 使用真實後端數據，支援智能分析
   * - 優先使用後端API數據
   * - 回退到模擬數據作為備用
   * - 確保數據一致性和完整性
   */
  const getRecentMonthsData = () => {
    // 嘗試從全局API響應中獲取真實數據
    const apiResponse = window.apiResponse;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 如果有真實API數據，優先使用
    if (apiResponse && apiResponse.yearData && apiResponse.yearData.result) {
      const yearData = apiResponse.yearData.result;
      const selectedEmployee = data?.user_Name || data?.employeeId || 'EMP001';

      // 獲取最近6個月的數據
      const recentMonths = [];
      for (let i = 5; i >= 0; i--) {
        const targetMonth = currentMonth - i;
        const targetYear = targetMonth > 0 ? currentYear : currentYear - 1;
        const adjustedMonth = targetMonth > 0 ? targetMonth : targetMonth + 12;

        // 查找對應月份的數據
        const monthStr = `${targetYear}-${String(adjustedMonth).padStart(2, '0')}-01T00:00:00`;
        const monthData = yearData.find(item =>
          item.work_Month === monthStr && item.user_Name === selectedEmployee
        );

        if (monthData) {
          recentMonths.push({
            month: `${adjustedMonth}月`,
            completion: monthData.completion_Rate ? Math.round(monthData.completion_Rate * 100) : 0,
            quality: monthData.yield_Percent ? Math.round(monthData.yield_Percent) : 0,
            efficiency: monthData.kpi_Percent ? Math.round(monthData.kpi_Percent) : 0,
            workHours: monthData.total_Hours ? Math.round(monthData.total_Hours) : 0,
            attendance: monthData.attendance || 0, // 使用實際出勤率數據
            machineStatus: monthData.machine_Run_Hours ? Math.round(monthData.machine_Run_Hours) : 0,
            maintenance: monthData.maintenance_Count || 0,
            targetAchievement: monthData.otd_Rate ? Math.round(monthData.otd_Rate * 100) : 0,
            kpi: monthData.kpi_Percent ? Math.round(monthData.kpi_Percent) : 0
          });
        } else {
          // 如果沒有數據，使用預設值
          recentMonths.push({
            month: `${adjustedMonth}月`,
            completion: 0, quality: 0, efficiency: 0, workHours: 0,
            attendance: 0, machineStatus: 0, maintenance: 0, targetAchievement: 0, kpi: 0
          });
        }
      }

      // 確保當前月份使用最終計算值
      if (recentMonths.length > 0) {
        const lastMonth = recentMonths[recentMonths.length - 1];
        const dataKey = metric.id === 'workCompletion' ? 'completion' :
                       metric.id === 'quality' ? 'quality' :
                       metric.id === 'workHours' ? 'workHours' :
                       metric.id === 'attendance' ? 'attendance' :
                       metric.id === 'machineStatus' ? 'machineStatus' :
                       metric.id === 'maintenance' ? 'maintenance' :
                       metric.id === 'targetAchievement' ? 'targetAchievement' :
                       metric.id === 'kpi' ? 'kpi' : 'efficiency';

        // 對於出勤率指標，使用實際的百分比數值而不是字符串格式
        if (metric.id === 'attendance' && data?.attendance) {
          lastMonth[dataKey] = data.attendance; // 使用實際的百分比數值（77.3）
        } else {
          lastMonth[dataKey] = value; // 使用當前計算的最終值
        }
      }

      return recentMonths;
    }

    // 回退到模擬數據
    const employeeId = data?.employeeId || 'EMP001';
    const employeeAllData = mockEmployeeData[employeeId];

    if (!employeeAllData || !employeeAllData.yearlyData || !employeeAllData.yearlyData[currentYear]) {
      // 使用預設的6個月數據
      return [
        { month: "4月", completion: 70, quality: 75, efficiency: 72, workHours: 75, attendance: 95, machineStatus: 90, maintenance: 80, targetAchievement: 85, kpi: 80 },
        { month: "5月", completion: 72, quality: 77, efficiency: 74, workHours: 76, attendance: 96, machineStatus: 91, maintenance: 81, targetAchievement: 86, kpi: 81 },
        { month: "6月", completion: 74, quality: 79, efficiency: 76, workHours: 77, attendance: 97, machineStatus: 93, maintenance: 83, targetAchievement: 88, kpi: 83 },
        { month: "7月", completion: 76, quality: 81, efficiency: 78, workHours: 78, attendance: 97, machineStatus: 94, maintenance: 84, targetAchievement: 89, kpi: 84 },
        { month: "8月", completion: 78, quality: 83, efficiency: 80, workHours: 79, attendance: 98, machineStatus: 95, maintenance: 85, targetAchievement: 90, kpi: 85 },
        {
          month: "9月",
          completion: value,
          quality: value,
          efficiency: value,
          workHours: value,
          attendance: metric.id === 'attendance' && data?.attendance ? data.attendance : value,
          machineStatus: value,
          maintenance: value,
          targetAchievement: value,
          kpi: value
        }
      ];
    }

    const yearData = employeeAllData.yearlyData[currentYear];

    // 獲取最近6個月的數據
    const recentSixMonths = [];
    for (let i = 5; i >= 0; i--) {
      const targetMonth = currentMonth - i;
      if (targetMonth > 0 && targetMonth <= yearData.length) {
        const monthData = yearData[targetMonth - 1];

        if (targetMonth === currentMonth) {
          // 當前月份使用最終得分
          let adjustedData = { ...monthData };
          const dataKey = metric.id === 'workCompletion' ? 'completion' :
                         metric.id === 'quality' ? 'quality' :
                         metric.id === 'workHours' ? 'workHours' :
                         metric.id === 'attendance' ? 'attendance' :
                         metric.id === 'machineStatus' ? 'machineStatus' :
                         metric.id === 'maintenance' ? 'maintenance' :
                         metric.id === 'targetAchievement' ? 'targetAchievement' :
                         metric.id === 'kpi' ? 'kpi' : 'efficiency';

          adjustedData[dataKey] = value;
          recentSixMonths.push(adjustedData);
        } else {
          recentSixMonths.push(monthData);
        }
      } else {
        // 生成歷史數據
        const baseValue = Math.max(0, value - (6 - i) * 2);
        recentSixMonths.push({
          month: `${targetMonth > 0 ? targetMonth : targetMonth + 12}月`,
          completion: baseValue, quality: baseValue, efficiency: baseValue,
          workHours: baseValue, attendance: Math.min(100, baseValue + 10),
          machineStatus: baseValue, maintenance: baseValue, targetAchievement: baseValue, kpi: baseValue
        });
      }
    }

    return recentSixMonths;
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
      case "workCompletion":
        return {
          baseScoreExplanation: "工單系統的狀態統計（已完成、進行中）",
          calculationMethod: "完成率 = 已完成工單數 / (進行中+已完成工單數) × 100%"
        };
      case "workHours":
        return {
          baseScoreExplanation: "工單系統的開始與結束時間記錄",
          calculationMethod: "總工時 = 所有工單的工作時間總和"
        };
      case "machineStatus":
        return {
          baseScoreExplanation: "機台運轉記錄系統",
          calculationMethod: "計算項目：\n- 今日使用的機台數量\n- 機台實際運轉時間\n- 目前運轉狀態"
        };
      case "maintenance":
        return {
          baseScoreExplanation: "維護作業紀錄系統",
          calculationMethod: "統計當日維護作業次數"
        };
      case "targetAchievement":
        return {
          baseScoreExplanation: "訂單完成與交期記錄",
          calculationMethod: "準時達交率 = 準時完成數量 / 總訂單數量 × 100%"
        };
      case "efficiency":
        return {
          baseScoreExplanation: "生產數量與工時統計",
          calculationMethod: "單位效率 = 總生產數量 / 總工時"
        };
      case "kpi":
        return {
          baseScoreExplanation: "綜合三項指標評估",
          calculationMethod: "KPI = (工作完成率 + 準時達交率 + 效率達成率) / 3"
        };
      case "attendance":
        return {
          baseScoreExplanation: "每日工作日誌填寫記錄",
          calculationMethod: "出勤率 = 已填寫日誌天數 / 當月工作天數"
        };
      case "quality":
        return {
          baseScoreExplanation: "生產製程品質記錄",
          calculationMethod: "良率 = 品檢合格數量 / 總生產數量 × 100%"
        };
      default:
        return {
          baseScoreExplanation: `${metric.title}基本表現`,
          calculationMethod: "計算方式未定義"
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
    
    const getValueWithUnit = (metricId, value) => {
      // 🔧 修正：統一顯示到小數點後2位
      const formattedValue = (value === 'N/A' || value === null || value === undefined || isNaN(value))
        ? 'N/A'
        : Number(value).toFixed(2);

      if (formattedValue === 'N/A') {
        return 'N/A';
      }

      switch (metricId) {
        case "workHours":
          return `${formattedValue} 小時`;
        case "maintenance":
          return `${formattedValue} 次`;
        case "machineStatus":
          return `${formattedValue} 小時`;
        default:
          return `${formattedValue}%`;
      }
    };

    if (formulaConfig && formulaConfig.formula !== "計算公式未定義") {
      return `${formulaConfig.formula} = ${getValueWithUnit(metricId, value)}`;
    }
    
    // 修改九張卡片數據的"數據來源與計算依據"內的"資料來源、計算公式"的內容
    switch (metricId) {
      case "workCompletion":
        return `完成率 = 已完成工單數 / (進行中+已完成工單數) × 100% = ${value}%`;
      case "quality":
        return `良率 = 品檢合格數量 / 總生產數量 × 100% = ${value}%`;
      case "workHours":
        return `總工時 = 所有工單的工作時間總和 = ${value} 小時`;
      case "attendance":
        // 對於出勤率，顯示天數格式的計算說明
        if (data?.attendanceDetails) {
          return `工作日誌填寫 = ${data.attendanceDetails.filledDays}天 / ${data.attendanceDetails.workDays}天 = ${data.attendance}%`;
        }
        return `出勤率 = 已填寫日誌天數 / 當月工作天數 = ${data?.attendance || 0}%`;
      case "machineStatus":
        return `機台運轉時間 = ${value} 小時`;
      case "maintenance":
        return `維護作業次數 = ${value} 次`;
      case "targetAchievement":
        return `準時達交率 = 準時完成數量 / 總訂單數量 × 100% = ${value}%`;
      case "kpi":
        return `KPI = (工作完成率 + 準時達交率 + 效率達成率) / 3 = ${value}%`;
      case "efficiency":
        return `單位效率 = 總生產數量 / 總工時 = ${value}%`;
      default:
        return `計算結果 = ${value}%`;
    }
  };

  /**
   * 工具方法：獲取個性化建議文本
   * 根據不同指標和分數範圍提供具體且可操作的建議
   */
  const getSuggestions = (value, metric) => {
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
            <div className="flex flex-col gap-1 mb-1">
              <p className={`text-3xl font-bold ${metric.color} animate-glow`}>
                {value === 'N/A' ? 'N/A' : `${value}${metric.unit}`}
              </p>
              {/* {metric.description && (
                <p className="text-xs text-slate-400">
                  {metric.description(data)}
                </p>
              )} */}
            </div>
            {/* 等級標示 */}
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold bg-${scoreData.grade === 'A' ? 'green' : scoreData.grade === 'B' ? 'blue' : scoreData.grade === 'C' ? 'yellow' : scoreData.grade === 'D' ? 'orange' : 'red'}-100 text-${scoreData.grade === 'A' ? 'green' : scoreData.grade === 'B' ? 'blue' : scoreData.grade === 'C' ? 'yellow' : scoreData.grade === 'D' ? 'orange' : 'red'}-800 border border-${scoreData.grade === 'A' ? 'green' : scoreData.grade === 'B' ? 'blue' : scoreData.grade === 'C' ? 'yellow' : scoreData.grade === 'D' ? 'orange' : 'red'}-200 animate-glow`}>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700 p-4 rounded-lg text-center">
                  <p className="text-slate-300 mb-1">績效表現</p>
                  <p className={`text-3xl font-bold ${metric.color} animate-glow`}>
                    {value === 'N/A' ? 'N/A' : `${value}${metric.unit}`}
                  </p>
                </div>
                {/* 註釋掉得分計算表積分
                <div className="bg-slate-700 p-4 rounded-lg text-center">
                  <p className="text-slate-300 mb-1">得分計算表積分</p>
                  <p className="text-3xl font-bold text-orange-400">
                    {scoreData.score}分
                  </p>
                </div>
                */}
                <div className="bg-slate-700 p-4 rounded-lg text-center">
                  <p className="text-slate-300 mb-1">評等級別</p>
                  <div className={`inline-block px-3 py-1 rounded-full text-lg font-bold bg-${scoreData.grade === 'A' ? 'green' : scoreData.grade === 'B' ? 'blue' : scoreData.grade === 'C' ? 'yellow' : scoreData.grade === 'D' ? 'orange' : 'red'}-100 text-${scoreData.grade === 'A' ? 'green' : scoreData.grade === 'B' ? 'blue' : scoreData.grade === 'C' ? 'yellow' : scoreData.grade === 'D' ? 'orange' : 'red'}-800 border border-${scoreData.grade === 'A' ? 'green' : scoreData.grade === 'B' ? 'blue' : scoreData.grade === 'C' ? 'yellow' : scoreData.grade === 'D' ? 'orange' : 'red'}-200 animate-glow`}>
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
                      <p className="text-green-400 font-medium animate-glow">{performanceAnalysis.upgrade.message}</p>
                    ) : (
                      <>
                        <p className="text-white">距離{performanceAnalysis.upgrade.nextGrade}級還需: {performanceAnalysis.upgrade.scoreNeeded}分</p>
                        <p className="text-orange-400 text-sm animate-glow">{performanceAnalysis.upgrade.upgradeMessage}</p>
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
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">當前分數區間</span>
                        <span className={`${getGradeBadgeColor(scoreData.grade)} animate-glow`}>
                          {scoreData.range}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-slate-300">對應等級</span>
                        <span className={`${getGradeBadgeColor(scoreData.grade)} animate-glow`}>
                          {scoreData.grade}級 - {scoreData.gradeDescription}
                        </span>
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
                      <div className="flex justify-between items-center pt-2 border-t border-slate-500 mt-2">
                        <span className="text-white font-semibold">最終得分</span>
                        <span className={`text-lg font-bold ${metric.color} animate-glow`}>
                          {performanceAnalysis.bonus.finalScore}分
                        </span>
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

              {/* 智能洞察卡片 */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  績效洞察分析
                </h4>
                <div className="bg-slate-700 p-4 rounded-lg">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* 左側：趨勢軌跡 */}
                    <div className="space-y-3">
                      <h5 className="text-white font-medium flex items-center gap-2">
                        <ReactFeatherTrendingUp className="w-4 h-4 text-blue-400" />
                        趨勢軌跡
                      </h5>
                      <div className="space-y-2">
                        {getRecentMonthsData().map((item, index) => {
                          const dataKey = metric.id === "workCompletion" ? "completion" :
                                         metric.id === "quality" ? "quality" :
                                         metric.id === "workHours" ? "workHours" :
                                         metric.id === "attendance" ? "attendance" :
                                         metric.id === "machineStatus" ? "machineStatus" :
                                         metric.id === "maintenance" ? "maintenance" :
                                         metric.id === "targetAchievement" ? "targetAchievement" :
                                         metric.id === "kpi" ? "kpi" : "efficiency";
                          const itemValue = item[dataKey] || 0;
                          const isLatest = index === getRecentMonthsData().length - 1;

                          return (
                            <div key={index} className="flex items-center gap-3">
                              <span className="text-xs text-slate-400 w-8">{item.month}</span>
                              <div className="flex-1 bg-slate-600 rounded-full h-2.5 relative overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isLatest
                                      ? `${metric.color.replace('text-', 'bg-')} animate-pulse`
                                      : 'bg-slate-500'
                                  }`}
                                  style={{
                                    width: itemValue === 'N/A' ? '0%' :
                                           metric.unit === '%' ? `${Math.min(Math.max(itemValue, 0), 100)}%` :
                                           `${Math.min(Math.max((itemValue / metric.target) * 100, 0), 100)}%`
                                  }}
                                />
                                {isLatest && (
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                                )}
                              </div>
                              <span className={`text-sm font-medium min-w-[80px] text-right ${isLatest ? metric.color : 'text-slate-300'}`}>
                                {itemValue === 'N/A' ? 'N/A' :
                                 metric.id === 'attendance' && isLatest && data?.attendanceDetails ?
                                   `${data.attendanceDetails.filledDays}/${data.attendanceDetails.workDays}天` :
                                   `${Number(itemValue).toFixed(2)}${metric.unit}`}
                              </span>
                              {isLatest && (
                                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                  當前
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 右側：關鍵指標 */}
                    <div className="space-y-3">
                      <h5 className="text-white font-medium flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-400" />
                        關鍵指標
                      </h5>
                      <div className="space-y-3">
                        {(() => {
                          const recentData = getRecentMonthsData();
                          const dataKey = metric.id === "workCompletion" ? "completion" :
                                         metric.id === "quality" ? "quality" :
                                         metric.id === "workHours" ? "workHours" :
                                         metric.id === "attendance" ? "attendance" :
                                         metric.id === "machineStatus" ? "machineStatus" :
                                         metric.id === "maintenance" ? "maintenance" :
                                         metric.id === "targetAchievement" ? "targetAchievement" :
                                         metric.id === "kpi" ? "kpi" : "efficiency";

                          // 獲取原始數值，不做限制
                          let values = recentData.map(item => item[dataKey] || 0);

                          // 對於特殊指標，使用相應的數值進行統計計算
                          if (metric.id === 'attendance') {
                            // 使用實際的出勤率百分比數值，而不是字符串格式
                            values = recentData.map(item => {
                              // 如果是當前月份且有詳細數據，使用實際出勤率
                              if (item === recentData[recentData.length - 1] && data?.attendance) {
                                return data.attendance;
                              }
                              return item[dataKey] || 0;
                            });
                          } else if (metric.id === 'maintenance') {
                            // 維護指標：使用評分值進行穩定性計算
                            values = recentData.map(item => {
                              // 如果是當前月份且有詳細數據，使用評分計算
                              if (item === recentData[recentData.length - 1] && data?.maintenance_Count !== undefined) {
                                return metric.scoreCalculation(data);
                              }
                              // 歷史數據：計算評分
                              const maintenanceCount = item[dataKey] || 0;
                              const maxMaintenanceCount = 10;
                              return Math.max(0, 100 - (maintenanceCount / maxMaintenanceCount) * 100);
                            });
                          }

                          // 🔧 調試信息：檢查原始數據
                          console.log(`${metric.title} 原始數據:`, {
                            recentData,
                            dataKey,
                            values
                          });

                          // 🔧 修正：根據指標類型顯示正確單位（統一顯示到小數點後2位）
                          const getValueWithUnit = (val, isCurrentValue = false, isPrediction = false) => {
                            // 處理 N/A 情況
                            if (val === 'N/A' || val === null || val === undefined || isNaN(val)) {
                              return 'N/A';
                            }

                            // 對於出勤率指標，如果是當前值且有詳細數據，顯示天數格式
                            if (metric.id === 'attendance' && isCurrentValue && data?.attendanceDetails) {
                              return `${data.attendanceDetails.filledDays}/${data.attendanceDetails.workDays}天`;
                            }

                            // 對於出勤率指標的歷史數據，顯示百分比格式
                            if (metric.id === 'attendance') {
                              return `${Number(val).toFixed(1)}%`;
                            }

                            // 對於維護指標，顯示實際維護次數而不是評分
                            if (metric.id === 'maintenance') {
                              if (isCurrentValue && data?.maintenance_Count !== undefined) {
                                return `${data.maintenance_Count}次`;
                              }
                              if (isPrediction) {
                                // 預測值已經是次數，直接顯示
                                return `${Math.round(val)}次`;
                              }
                              // 歷史數據：從評分反推維護次數
                              const maxMaintenanceCount = 10;
                              const maintenanceCount = Math.round(maxMaintenanceCount * (100 - val) / 100);
                              return `${Math.max(0, maintenanceCount)}次`;
                            }

                            // 統一顯示到小數點後2位，並根據 metrics 配置的單位顯示
                            return `${Number(val).toFixed(2)}${metric.unit}`;
                          };

                          // 處理數值計算（過濾掉 N/A 值）
                          const numericValues = values.filter(val => val !== 'N/A' && val !== null && val !== undefined && !isNaN(val));

                          const currentValue = values[values.length - 1];
                          const previousValue = values[values.length - 2];

                          // 只有數值才能進行統計計算
                          let maxValue = 0, minValue = 0, avgValue = 0, stability = 0, predictedValue = currentValue;

                          if (numericValues.length > 0) {
                            maxValue = Math.max(...numericValues);
                            minValue = Math.min(...numericValues);
                            avgValue = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;

                            // 🔧 修正穩定指數計算邏輯（需要至少3個有效數據點才能評估穩定性）
                            if (numericValues.length >= 3) {
                              // 檢查是否所有數值都是0或接近0
                              const allZeroOrNear = numericValues.every(val => Math.abs(val) < 0.01);

                              if (allZeroOrNear) {
                                // 對於維護指標，0次維護是好事，應該有高穩定性
                                if (metric.id === 'maintenance') {
                                  stability = 100; // 維護次數都是0，表示設備穩定
                                } else {
                                  stability = 0; // 其他指標，0表示無表現
                                }
                              } else if (maxValue === minValue) {
                                // 如果所有數值完全相同，穩定指數為100（完全穩定）
                                stability = 100;
                              } else {
                                // 使用變異係數計算穩定性
                                const range = maxValue - minValue;
                                const avgRange = Math.abs(avgValue) > 0.01 ? Math.abs(avgValue) : 1;
                                const variationRatio = range / avgRange;

                                // 穩定指數：變異係數越小越穩定
                                if (variationRatio <= 0.1) stability = 100; // 變化<10%，非常穩定
                                else if (variationRatio <= 0.2) stability = 80; // 變化<20%，穩定
                                else if (variationRatio <= 0.3) stability = 60; // 變化<30%，一般
                                else if (variationRatio <= 0.5) stability = 40; // 變化<50%，不穩定
                                else stability = 20; // 變化>50%，很不穩定
                              }
                            } else {
                              // 數據點不足（少於3個），無法評估穩定性
                              if (metric.id === 'maintenance' && numericValues.length > 0) {
                                // 維護指標：即使數據點不足，如果都是高分也應該有穩定性
                                const allHighScores = numericValues.every(val => val >= 90);
                                stability = allHighScores ? 80 : 0; // 給予較高但不是滿分的穩定性
                              } else {
                                stability = 0;
                              }
                            }

                            // 🔧 調試信息：檢查穩定指數計算
                            console.log(`${metric.title} 穩定指數計算:`, {
                              numericValues,
                              numericValuesLength: numericValues.length,
                              maxValue,
                              minValue,
                              avgValue,
                              stability,
                              stabilityCalculation: {
                                range: maxValue - minValue,
                                avgRange: Math.abs(avgValue) > 0.01 ? Math.abs(avgValue) : 1,
                                variationRatio: (maxValue - minValue) / (Math.abs(avgValue) > 0.01 ? Math.abs(avgValue) : 1)
                              }
                            });

                            // 🔧 修正系統預測邏輯（需要至少3個有效數據點才能預測）
                            if (numericValues.length >= 3 && !isNaN(currentValue) && currentValue !== 'N/A') {
                              // 使用線性回歸預測
                              const recentValues = numericValues.slice(-3);
                              const trend = (recentValues[2] - recentValues[0]) / 2;
                              let rawPrediction = currentValue + trend;

                              // 🔧 限制百分比指標和出勤率指標的預測值不超過100%
                              if (metric.unit === '%' || metric.id === 'attendance') {
                                predictedValue = Number(Math.min(100, Math.max(0, rawPrediction)).toFixed(2));
                              } else if (metric.id === 'maintenance') {
                                // 維護指標：特殊預測邏輯
                                // 如果歷史維護次數都很低（表示設備穩定），預測也應該保持低維護
                                const recentMaintenanceCounts = recentData.map(item => item.maintenance || 0);
                                const avgMaintenanceCount = recentMaintenanceCounts.reduce((a, b) => a + b, 0) / recentMaintenanceCounts.length;

                                if (avgMaintenanceCount <= 1) {
                                  // 如果平均維護次數很低，預測維持低維護
                                  predictedValue = Math.max(0, Math.min(2, Math.round(avgMaintenanceCount)));
                                } else {
                                  // 否則使用趨勢預測，但限制在合理範圍內
                                  const maxMaintenanceCount = 10;
                                  const predictedCount = Math.round(maxMaintenanceCount * (100 - rawPrediction) / 100);
                                  predictedValue = Math.max(0, Math.min(5, predictedCount)); // 限制最大5次
                                }
                              } else {
                                // 非百分比指標不限制上限，但不能為負數
                                predictedValue = Number(Math.max(0, rawPrediction).toFixed(2));
                              }
                            } else {
                              // 數據不足，無法進行預測
                              if (metric.id === 'maintenance') {
                                // 維護指標：即使數據不足，也給予保守預測
                                predictedValue = 0;
                              } else {
                                predictedValue = 'N/A';
                              }
                            }
                          }

                          // 計算變化量
                          const change = (!isNaN(currentValue) && !isNaN(previousValue) &&
                                         currentValue !== 'N/A' && previousValue !== 'N/A')
                                         ? Number((currentValue - previousValue).toFixed(2)) : 0;

                          return (
                            <>
                              <div className="bg-slate-600/50 rounded-lg p-3 space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-300 text-sm">當前表現</span>
                                  <div className="flex items-center gap-1">
                                    <span className={`font-bold ${metric.color}`}>
                                      {getValueWithUnit(currentValue, true)}
                                    </span>
                                    {change !== 0 && (
                                      <span className={`text-xs flex items-center gap-1 ${
                                        change > 0 ? 'text-green-400' : 'text-red-400'
                                      }`}>
                                        {change > 0 ? '↗️' : '↘️'} {getValueWithUnit(Math.abs(change), false)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-300 text-sm">最佳記錄</span>
                                  <span className="text-yellow-400 font-medium">
                                    {getValueWithUnit(maxValue, false)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-300 text-sm">平均水準</span>
                                  <span className="text-blue-400 font-medium">
                                    {getValueWithUnit(avgValue, false)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-300 text-sm">穩定指數</span>
                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: 5 }, (_, i) => {
                                      // 🔧 修正星星顯示邏輯：根據穩定指數百分比計算星星數量
                                      // 0-19%: 0星, 20-39%: 1星, 40-59%: 2星, 60-79%: 3星, 80-99%: 4星, 100%: 5星
                                      let starCount = 0;
                                      if (stability >= 100) starCount = 5;
                                      else if (stability >= 80) starCount = 4;
                                      else if (stability >= 60) starCount = 3;
                                      else if (stability >= 40) starCount = 2;
                                      else if (stability >= 20) starCount = 1;
                                      else starCount = 0;

                                      // 🔧 調試信息：檢查所有星星計算
                                      console.log(`${metric.title} 星星${i+1}計算:`, {
                                        i,
                                        stability,
                                        starCount,
                                        shouldShowStar: i < starCount,
                                        condition: `${i} < ${starCount} = ${i < starCount}`
                                      });

                                      const shouldShowStar = i < starCount;

                                      return (
                                        <span key={i} className={`text-xs ${
                                          shouldShowStar ? 'text-yellow-400' : 'text-gray-400'
                                        }`}>
                                          {shouldShowStar ? '⭐' : '✩'}
                                        </span>
                                      );
                                    })}
                                    <span className="text-xs text-slate-400 ml-1">
                                      ({stability.toFixed(0)}%)
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* 系統預測 */}
                              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-3 border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-purple-400 text-sm">🔮 系統預測</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-slate-300 text-sm">下月預期</span>
                                  <span className="text-purple-400 font-medium">
                                    {predictedValue === 'N/A' ? '數據不足' : getValueWithUnit(predictedValue, false, true)}
                                  </span>
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 智能建議 */}
                  <div className="mt-4 pt-4 border-t border-slate-600">
                    <div className="flex items-start gap-2">
                      <span className="text-yellow-400 text-sm">💡</span>
                      <div className="flex-1">
                        <span className="text-yellow-400 text-sm font-medium">智能建議：</span>
                        <p className="text-slate-300 text-sm mt-1">
                          {(() => {
                            const recentData = getRecentMonthsData();
                            const dataKey = metric.id === "workCompletion" ? "completion" :
                                           metric.id === "quality" ? "quality" :
                                           metric.id === "workHours" ? "workHours" :
                                           metric.id === "attendance" ? "attendance" :
                                           metric.id === "machineStatus" ? "machineStatus" :
                                           metric.id === "maintenance" ? "maintenance" :
                                           metric.id === "targetAchievement" ? "targetAchievement" :
                                           metric.id === "kpi" ? "kpi" : "efficiency";

                            // 獲取原始數值，不做限制
                            const values = recentData.map(item => item[dataKey] || 0);

                            // 過濾數值型數據進行趨勢分析
                            const numericValues = values.filter(val => val !== 'N/A' && val !== null && val !== undefined && !isNaN(val));

                            const currentValue = values[values.length - 1];
                            const previousValue = values[values.length - 2];

                            // 計算趨勢（只對數值進行計算）
                            let trend = 0;
                            if (numericValues.length >= 2 && !isNaN(currentValue) && !isNaN(previousValue) &&
                                currentValue !== 'N/A' && previousValue !== 'N/A') {
                              trend = currentValue - previousValue;
                            }

                            // 根據指標類型設定優秀標準（基於目標值）
                            const excellentThreshold = metric.target;

                            // 🔧 修正智能建議邏輯（基於六個月趨勢軌跡數據）
                            // 檢查六個月內的數據質量
                            const validDataCount = recentData.filter(item => {
                              const value = item[dataKey];
                              return value !== 'N/A' && value !== null && value !== undefined && !isNaN(value) && Math.abs(value) > 0.01;
                            }).length;

                            const hasValidData = validDataCount > 0;
                            const allZeroOrNear = recentData.every(item => {
                              const value = item[dataKey];
                              return value === 'N/A' || value === null || value === undefined || isNaN(value) || Math.abs(value) < 0.01;
                            });

                            if (currentValue === 'N/A' || !hasValidData) {
                              if (metric.id === 'attendance') {
                                return `差勤紀錄目前無可用數據，建議確認數據收集流程是否正常運作。`;
                              }
                              return `${metric.title}目前無可用數據，建議確認數據收集流程是否正常運作。`;
                            } else if (allZeroOrNear) {
                              return `${metric.title}六個月內缺乏有效表現數據，建議建立完整的監控機制並設定基礎目標。`;
                            } else if (validDataCount < 3) {
                              return `${metric.title}數據收集不足（僅${validDataCount}個月有數據），建議持續記錄以建立完整的表現軌跡。`;
                            } else if (!isNaN(currentValue) && currentValue >= excellentThreshold) {
                              return `表現優異！${metric.title}已達到優秀水準，建議保持當前工作模式，並考慮分享成功經驗給團隊。`;
                            } else if (trend > 0) {
                              const trendDesc = metric.unit === "小時" || metric.unit === "次" ? "增加" : "提升";
                              return `${metric.title}呈${trendDesc}趨勢，建議繼續保持當前改善方向，穩步提升表現。`;
                            } else if (trend < 0) {
                              const trendDesc = metric.unit === "小時" || metric.unit === "次" ? "減少" : "下滑";
                              return `近期${metric.title}有所${trendDesc}，建議檢視相關工作流程，找出可能的改善點。`;
                            } else if (currentValue < excellentThreshold * 0.5) {
                              return `${metric.title}表現需要關注，建議制定具體的改善計劃並設定階段性目標。`;
                            } else {
                              return `${metric.title}表現相對穩定，建議設定新的挑戰目標，尋求突破性進展。`;
                            }
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
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
                      <span className="text-lg text-slate-300 animate-glow">
                        {scoreData.gradeDescription}
                      </span>
                    </div>
                    <div className={`px-2 py-1 rounded text-lg font-medium ${getGradeBadgeColor(scoreData.grade)} animate-glow`}>
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
                        需要提升: {performanceAnalysis.upgrade.scoreNeeded}分
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
// 登入用戶資訊組件
const LoginUserInfo = () => {
  const { user } = useAuth();
  
  const getDisplayName = (user) => {
    if (!user) return '未登入';
    return `${user.name || user.username} ( ${pointsConfig.userRoles[user.role] || user.role} )`;
  };
  
  return (
    <div className="flex items-center gap-2 text-slate-300 mt-2">
      <User className="w-4 h-4" />
      <span>目前登入：{getDisplayName(user)}</span>
    </div>
  );
};

export default function PerformanceDashboard() {
  // 工作日誌管理組件
  const WorkLogManagement = () => {
    return (
      <div className="worklog-management-container">
        <Tabs defaultActiveKey="approval">
          <Tabs.TabPane tab="審核管理" key="approval">
            <WorkLogApproval />
          </Tabs.TabPane>
          <Tabs.TabPane tab="編輯歷史" key="history">
            <WorkLogHistory />
          </Tabs.TabPane>
        </Tabs>
      </div>
    );
  };
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedEmployee, setSelectedEmployee] = useState("");  // 初始狀態為空
  const { user } = useAuth();
  
  // 檢查用戶是否有查看所有員工數據的權限
  const canViewAllEmployees = useMemo(() => {
    // 只有高階管理層和管理者可以查看所有員工
    return ['boss', 'admin', 'president'].includes(user?.role);
  }, [user?.role]);
  const [viewMode, setViewMode] = useState("monthly"); // 'yearly', 'monthly', 'daily'
  const [isLoading, setIsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2025); // 年份選擇狀態，默認2025年
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 月份選擇狀態
  const [selectedDay, setSelectedDay] = useState(1); // 日期選擇狀態
  const [showPointsManagement, setShowPointsManagement] = useState(false); // 積分管理系統狀態
  const navigate = useNavigate();


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

  // 可選年份列表狀態
  const [availableYears, setAvailableYears] = useState([]);

  // 獲取可用年份列表
  const loadAvailableYears = async () => {
    try {
      console.log('開始獲取可用年份列表');
      const response = await fetch(`${REPORT_API.BASE_URL}/AREditior/GetAvailableYears`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('獲取年份列表失敗');
      }

      const data = await response.json();
      
      if (data.code === "0000" && Array.isArray(data.result)) {
        // 確保年份是數字並排序
        const years = data.result
          .map(year => parseInt(year))
          .filter(year => !isNaN(year))
          .sort((a, b) => b - a); // 降序排列，最新年份在前

        console.log('獲取到的年份列表:', years);
        
        if (years.length > 0) {
          setAvailableYears(years);
          // 如果當前選擇的年份不在列表中，設置為最新的年份
          if (!years.includes(selectedYear)) {
            setSelectedYear(years[0]);
          }
        } else {
          // 如果沒有獲取到年份，使用當前年份作為預設
          const currentYear = new Date().getFullYear();
          setAvailableYears([currentYear]);
          setSelectedYear(currentYear);
        }
      } else {
        console.error('年份數據格式錯誤:', data);
        // 使用當前年份作為預設
        const currentYear = new Date().getFullYear();
        setAvailableYears([currentYear]);
        setSelectedYear(currentYear);
      }
    } catch (error) {
      console.error('獲取年份列表失敗:', error);
      // 發生錯誤時使用當前年份作為預設
      const currentYear = new Date().getFullYear();
      setAvailableYears([currentYear]);
      setSelectedYear(currentYear);
    }
  };

  /**
   * 指標配置區域
   * 定義所有績效指標的計算規則和展示方式
   */
  // 處理趨勢圖表數據
const processChartData = (data, viewMode, year, month, day = 1) => {
  console.log('處理圖表數據:', { data, viewMode, year, month }); // 添加日誌

  if (!data) return [];

  try {
    let chartData = [];
    
    switch(viewMode) {
      case 'yearly': {
        // 確保有年度數據
        const yearData = data.yearData?.result || [];
        console.log('年度數據:', yearData);
        
        // 生成12個月的基礎數據點
        chartData = Array.from({ length: 12 }, (_, i) => {
          const monthStr = `${year}-${String(i + 1).padStart(2, '0')}-01`;
          
          // 找出當月的數據
          const monthDataList = yearData.filter(d => {
            if (!d || !d.work_Month) return false;
            const dataDate = new Date(d.work_Month);
            return dataDate.getMonth() === i && d.user_Name === selectedEmployee;
          });
          
          // 計算當月值
          let formattedData = {
            date: monthStr,
            工作完成量: 0,
            產品質量: 0,
            效率指標: 0
          };

          // 獲取當月數據
          const monthData = monthDataList.length > 0 ? monthDataList[0] : null;

          if (monthData) {
            // 使用與九張卡片相同的計算邏輯
            formattedData = {
              date: monthStr,
              工作完成量: monthData.completion_Rate ? Math.min(100, Number((monthData.completion_Rate * 100).toFixed(2))) : 0,
              產品質量: monthData.yield_Percent ? Math.min(100, Number(monthData.yield_Percent.toFixed(2))) : 0,
              效率指標: monthData.kpi_Percent ? Math.min(100, Number(monthData.kpi_Percent.toFixed(2))) : 0
            };
            
          }
          
          console.log(`${monthStr} 月份數據詳情:`, {
            原始數據: monthData,
            計算過程: monthData ? {
              工作完成量: `completion_Rate: ${monthData.completion_Rate} * 100 (限制最大值100%)`,
              產品質量: `yield_Percent: ${monthData.yield_Percent} (限制最大值100%)`,
              效率指標: `kpi_Percent: ${monthData.kpi_Percent} (限制最大值100%)`
            } : null,
            格式化數據: formattedData
          });
          
          return formattedData;
        });
        break;
      }
      
      case 'monthly': {
        // 確保有月度數據
        const monthData = data.monthData?.result || [];
        console.log('月度數據:', monthData);
        
        // 過濾當前員工的數據
        const employeeData = monthData.filter(d => d.user_Name === selectedEmployee);
        console.log('當前員工數據:', employeeData);
        
        // 生成當月每一天的數據點
        const getDaysInMonth = (year, month) => {
          // month 參數需要是 1-12
          const thirtyDaysMonths = [4, 6, 9, 11];
          const thirtyOneDaysMonths = [1, 3, 5, 7, 8, 10, 12];
          
          if (month === 2) {
            // 檢查是否為閏年
            return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 29 : 28;
          }
          if (thirtyDaysMonths.includes(month)) {
            return 30;
          }
          if (thirtyOneDaysMonths.includes(month)) {
            return 31;
          }
          console.error(`Invalid month: ${month}`);
          return 31; // 預設返回31天
        };
        
        const daysInMonth = getDaysInMonth(year, month);
        console.log(`${year}年${month}月的天數: ${daysInMonth}天`);
        chartData = Array.from({ length: daysInMonth }, (_, i) => {
          const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`;
          
          // 找出當天的數據
          const dayData = employeeData.find(d => {
            if (!d || !d.work_Day) return false;
            const dataDate = new Date(d.work_Day);
            return dataDate.getDate() === (i + 1);
          });
          
          // 格式化數據
          const formattedData = {
            date: dayStr,
            工作完成量: dayData?.completion_Rate ? Math.min(100, Number((dayData.completion_Rate * 100).toFixed(2))) : 0,
            產品質量: dayData?.yield_Percent ? Math.min(100, Number(dayData.yield_Percent.toFixed(2))) : 0,
            效率指標: dayData?.kpi_Percent ? Math.min(100, Number(dayData.kpi_Percent.toFixed(2))) : 0
          };
          
          console.log(`${dayStr} 數據詳情:`, {
            原始數據: dayData,
            計算過程: dayData ? {
              工作完成量: `completion_Rate: ${dayData.completion_Rate} * 100 (限制最大值100%)`,
              產品質量: `yield_Percent: ${dayData.yield_Percent} (限制最大值100%)`,
              效率指標: `kpi_Percent: ${dayData.kpi_Percent} (限制最大值100%)`
            } : null,
            格式化數據: formattedData
          });
          
          return formattedData;
        });
        break;
      }
      
      case 'daily': {
        // 確保有日度數據
        const dailyData = data.monthData?.result || [];
        
        // 生成當日每小時數據點
        chartData = Array.from({ length: 24 }, (_, i) => {
          const hourStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(i).padStart(2, '0')}:00:00`;
          const hourData = dailyData.find(d => {
            if (!d || !d.work_Day) return false;
            const dataDate = new Date(d.work_Day);
            return dataDate.getHours() === i;
          }) || {};

          return {
            date: hourStr,
            完成率: hourData.completion_Rate ? Number((hourData.completion_Rate * 100).toFixed(2)) : 0,
            質量: hourData.yield_Percent ? Number((hourData.yield_Percent || 0).toFixed(2)) : 0,
            效率: hourData.units_Per_Hour ? Number((hourData.units_Per_Hour || 0).toFixed(2)) : 0
          };
        });
        break;
      }
      
      default:
        return [];
    }
    
    console.log('處理後的圖表數據:', chartData);
    return chartData;
  } catch (error) {
    console.error('處理圖表數據時出錯:', error);
    return [];
  }
};

// 自定義 Tooltip 組件
const CustomTooltip = ({ active, payload, label, viewMode }) => {
  if (active && payload && payload.length) {
    const date = new Date(label);
    let dateStr = '';
    
    switch(viewMode) {
      case 'yearly':
        dateStr = `${date.getFullYear()}年${date.getMonth() + 1}月`;
        break;
      case 'monthly':
        dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
        break;
      case 'daily':
        dateStr = `${date.getHours()}:00`;
        break;
      default:
        dateStr = label;
    }

    return (
      <div className="bg-slate-800 p-3 rounded-lg shadow-lg">
        <p className="text-sm font-semibold text-slate-200 mb-2">{dateStr}</p>
        {payload.map((item, index) => (
          <p key={index} className="text-sm" style={{ color: item.color }}>
            {`${item.name}: ${Number(item.value).toFixed(2)}%`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// 績效趨勢圖表組件
const PerformanceTrendChart = ({ data, viewMode }) => {
  console.log('趨勢圖表數據:', { data, viewMode }); // 添加日誌

  // 確保數據有效性
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-400">暫無數據</p>
      </div>
    );
  }

  // 根據檢視模式設置 X 軸標籤
  const getXAxisLabel = () => {
    switch(viewMode) {
      case 'yearly':
        return '月份';
      case 'monthly':
        return '日期';
      default:
        return '';
    }
  };

  return (
    <div className="w-full bg-slate-800 rounded-lg p-4 mt-6" style={{ minHeight: '400px' }}>
      {data && data.length > 0 ? (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 30, right: 50, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis 
              dataKey="date" 
              stroke="#888"
              interval={0}
              minTickGap={10}
              axisLine={{ strokeWidth: 2 }}
              tickFormatter={(date) => {
                if (!date) return '';
                const d = new Date(date);
                switch(viewMode) {
                  case 'yearly':
                    return d.getMonth() + 1;
                  case 'monthly':
                    return d.getDate();
                  case 'daily':
                    return d.getHours();
                  default:
                    return date;
                }
              }}
              label={{ 
                value: viewMode === 'yearly' ? '(月)' : viewMode === 'monthly' ? '(日)' : '(時)',
                position: 'right',
                offset: 15,
                style: { fill: '#888', fontSize: 14 }
              }}
            />
            <YAxis 
              stroke="#888"
              domain={[0, 100]}
              ticks={[0, 20, 40, 60, 80, 100]}
              tickFormatter={(value) => value}
              label={{ 
                value: '(%)',
                position: 'top',
                offset: 20,
                style: { fill: '#888', fontSize: 14 }
              }}
              allowDataOverflow={false}
            />
            <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
            <Legend 
              verticalAlign="top" 
              height={36}
              wrapperStyle={{
                paddingBottom: '20px',
                color: '#fff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="工作完成量" 
              name="工作完成量"
              stroke="#8884d8" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
              isAnimationActive={true}
              animationDuration={1000}
              unit="%"
            />
            <Line 
              type="monotone" 
              dataKey="產品質量" 
              name="產品質量"
              stroke="#82ca9d" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
              isAnimationActive={true}
              animationDuration={1000}
              unit="%"
            />
            <Line 
              type="monotone" 
              dataKey="效率指標" 
              name="效率指標"
              stroke="#ffc658" 
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 8 }}
              isAnimationActive={true}
              animationDuration={1000}
              unit="%"
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[400px] text-slate-400">
          暫無趨勢數據
        </div>
      )}
    </div>
  );
};

const metrics = [
    {
      id: "workCompletion",
      title: "工作完成量",
      value: (data) => data?.completion_Rate ? Number((data.completion_Rate * 100).toFixed(2)) : 0,
      unit: "%",
      description: (data) => `(completion_Rate: ${data?.completion_Rate?.toFixed(2) || 'N/A'})`,
      icon: <Activity className="w-6 h-6" />,
      color: "text-blue-500",
      target: 90,
      weight: 0.125,
    },
    {
      id: "quality",
      title: "產品質量",
      value: (data) => data?.yield_Percent ? Number(data.yield_Percent.toFixed(2)) : 0,
      unit: "%",
      description: (data) => `(yield_Percent: ${data?.yield_Percent?.toFixed(2) || 'N/A'})`,
      icon: <Target className="w-6 h-6" />,
      color: "text-green-500",
      target: 90,
      weight: 0.125,
    },
    {
      id: "workHours",
      title: "工作時間",
      value: (data) => data?.total_Hours || 0,
      unit: "小時",
      description: (data) => `(total_Hours: ${data?.total_Hours?.toFixed(2) || 'N/A'})`,
      icon: <Clock className="w-6 h-6" />,
      color: "text-orange-400",
      target: 85,
      weight: 0.125,
      // 評分計算：工作時間轉換為效率百分比
      scoreCalculation: (data) => {
        const hours = data?.total_Hours || 0;
        const standardHours = 176; // 標準月工作時數
        return hours > 0 ? Number(((hours / standardHours) * 100).toFixed(2)) : 0;
      },
    },
    {
      id: "attendance",
      title: "差勤紀錄",
      value: (data) => {
        // 如果沒有數據，顯示 N/A
        if (!data || data.attendance === undefined || data.attendance === null) {
          return 'N/A';
        }
        // 優先顯示天數格式，如果沒有詳細數據則顯示 N/A
        if (data.attendanceDetails) {
          return `${data.attendanceDetails.filledDays}/${data.attendanceDetails.workDays}`;
        }
        return 'N/A';
      },
      unit: "天",
      description: (data) => {
        if (!data || data.attendance === undefined || data.attendance === null) {
          return '(基於工作日誌填寫記錄)';
        }
        // 顯示出勤率百分比作為補充信息
        if (data.attendanceDetails && data.attendance) {
          return `出勤率 ${data.attendance}%`;
        }
        return `(出勤率: ${data.attendance}%)`;
      },
      icon: <Calendar className="w-6 h-6" />,
      color: "text-pink-400",
      target: 85,
      weight: 0.125,
      dataSource: "每日工作日誌填寫記錄",
      needsCalculation: true,
      formula: "出勤率 = 已填寫日誌天數 / 當月工作天數"
    },
    {
      id: "machineStatus",
      title: "機台運行狀態",
      value: (data) => data?.machine_Run_Hours || 0,
      unit: "小時",
      description: (data) => `(machine_Run_Hours: ${data?.machine_Run_Hours?.toFixed(2) || 'N/A'})`,
      icon: <Settings className="w-6 h-6" />,
      color: "text-cyan-400",
      target: 80,
      weight: 0.125,
      // 評分計算：機台運行時間轉換為效率百分比
      scoreCalculation: (data) => {
        const runHours = data?.machine_Run_Hours || 0;
        const standardRunHours = 720; // 標準月運行時數 (30天 * 24小時)
        return runHours > 0 ? Number(((runHours / standardRunHours) * 100).toFixed(2)) : 0;
      },
    },
    {
      id: "maintenance",
      title: "機台維護紀錄",
      value: (data) => data?.maintenance_Count || 0,
      unit: "次",
      description: (data) => `(maintenance_Count: ${data?.maintenance_Count || 'N/A'})`,
      icon: <Wrench className="w-6 h-6" />,
      color: "text-purple-400",
      target: 85,
      weight: 0.125,
      // 特殊評分邏輯：維護次數越少分數越高
      scoreCalculation: (data) => {
        const maintenanceCount = data?.maintenance_Count || 0;
        // 假設最大維護次數為10次，0次維護得100分
        const maxMaintenanceCount = 10;
        return Math.max(0, 100 - (maintenanceCount / maxMaintenanceCount) * 100);
      },
    },
    {
      id: "targetAchievement",
      title: "目標達成率",
      value: (data) => data?.otd_Rate ? Number((data.otd_Rate * 100).toFixed(2)) : 0,
      unit: "%",
      description: (data) => `(otd_Rate: ${data?.otd_Rate?.toFixed(2) || 'N/A'})`,
      icon: <Target className="w-6 h-6" />,
      color: "text-red-400",
      target: 80,
      weight: 0.125,
    },
    {
      id: "kpi",
      title: "關鍵績效指標",
      value: (data) => data?.kpi_Percent ? Number(data.kpi_Percent.toFixed(2)) : 0,
      unit: "%",
      description: (data) => `(kpi_Percent: ${data?.kpi_Percent?.toFixed(2) || 'N/A'})`,
      icon: <BarChart className="w-6 h-6" />,
      color: "text-yellow-400",
      target: 85,
      weight: 0.125,
    },
    {
      id: "efficiency",
      title: "效率指標",
      value: (data) => {
        // 將效率數值轉換為合理的百分比，超過100%就顯示100%
        const efficiency = data?.units_Per_Hour || 0;
        // 假設標準效率為1000單位/小時，進行百分比轉換
        const standardEfficiency = 1000;
        const percentage = efficiency > 0 ? (efficiency / standardEfficiency) * 100 : 0;
        return Number(Math.min(100, percentage).toFixed(2));
      },
      unit: "%",
      description: (data) => `(units_Per_Hour: ${data?.units_Per_Hour?.toFixed(2) || 'N/A'})`,
      icon: <Zap className="w-6 h-6" />,
      color: "text-lime-400",
      target: 80,
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
      let scoreValue;
      if (metric.scoreCalculation) {
        // 使用特殊評分計算（如維護指標）
        scoreValue = metric.scoreCalculation(data);
      } else {
        // 使用一般數值
        scoreValue = metric.value(data);
      }
      const grade = getGradeFromScore(scoreValue);
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

  // 使用state來存儲員工列表
  const [employees, setEmployees] = useState([]);
  
  // 添加 debug 日誌
  const debugLog = (message, data) => {
    console.log(`[Debug] ${message}:`, data);
  };

  // 獲取員工列表
  // 初始化時加載年份列表
  useEffect(() => {
    loadAvailableYears();
  }, []);

  // 當用戶信息載入後，如果是一般員工則自動選擇自己
  useEffect(() => {
    if (user && !canViewAllEmployees) {
      setSelectedEmployee(user.name);
    }
  }, [user, canViewAllEmployees]);

  useEffect(() => {
    const loadEmployees = async () => {
      try {
        debugLog('開始獲取員工列表', null);
        console.log('正在獲取員工列表...');

        // 如果是一般員工，直接返回當前用戶
        if (!canViewAllEmployees) {
          const currentUserData = {
            id: user.name,
            name: user.name,
            employee_name: user.name,
            department: user.department || '未指定',
            position: user.position || user.role_name, // 使用 position 或 role_name
            role: pointsConfig.positionRoleMapping[user.position || user.role_name] || 'employee'
          };
          setEmployees([currentUserData]);
          setSelectedEmployee(user.name); // 自動選擇當前用戶
          return;
        }

        const response = await fetch(`${REPORT_API.BASE_URL}/AREditior/GetAllUserinfoByFilter`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            Keyword: "",
            Year: selectedYear.toString(),
            Month: selectedMonth.toString().padStart(2, '0')
          })
        });

        if (!response.ok) {
          throw new Error('獲取員工列表失敗');
        }

        const data = await response.json();
        // 檢查API回應格式
        if (!data || !data.result || !Array.isArray(data.result)) {
          console.error('API回應格式錯誤:', data);
          return;
        }

        console.log('API回傳的員工數據:', data.result);

        // 處理員工數據
        const processedEmployees = data.result.map(emp => ({
          id: emp.user_name,
          name: emp.user_name,
          employee_name: emp.user_name,
          department: emp.department || '未指定',
          position: emp.position || emp.role_name, // 使用 position 或 role_name
          role: pointsConfig.positionRoleMapping[emp.position || emp.role_name] || 'employee'
        }));

        console.log('處理後的員工數據:', processedEmployees);
        setEmployees(processedEmployees);
        
        // 過濾並整理員工數據
        const uniqueEmployees = data.result
          .filter(emp => emp.user_name && emp.role_name) // 確保有名稱和職位
          .map(emp => ({
            id: emp.user_name,
            name: emp.user_name,
            employee_name: emp.user_name,
            department: '技術部', // 預設部門
            role: emp.role_name,
            grade: 'A',
            displayName: `${emp.user_name} ( ${emp.role_name} )`
          }));

        console.log('處理後的員工列表:', uniqueEmployees);
        setEmployees(uniqueEmployees.sort((a, b) => a.grade.localeCompare(b.grade)));
      } catch (error) {
        console.error('獲取員工列表失敗:', error);
        // 使用預設的員工列表作為後備
        setEmployees([
          { 
            id: "張技師", 
            name: "張技師",
            employee_name: "張技師",
            department: "技術部",
            role: "技術員",
            grade: "A",
            get displayName() { 
              return `${this.name} (${this.department} - ${this.role})`;
            }
          },
          { 
            id: "Manager", 
            name: "Manager",
            employee_name: "Manager",
            department: "技術部",
            role: "主管",
            grade: "A",
            get displayName() { 
              return `${this.name} (${this.department} - ${this.role})`;
            }
          }
        ]);
      }
    };

    loadEmployees();
  }, []); // 按等級A-E排序



  /**
   * 生命週期方法區域
   */
  // 自動更新數據 (刷新首頁)
  useEffect(() => {
    // 設置30秒自動更新
    const intervalId = setInterval(() => {
      console.log('執行30秒定時更新...');
      if (selectedEmployee) {
        const isDaily = viewMode === "daily";
        const isYearly = viewMode === "yearly";
        const currentDay = isDaily ? selectedDay : null;
        const currentMonth = isYearly ? 1 : selectedMonth;

        loadEmployeeData(
          selectedEmployee,
          selectedYear,
          currentMonth,
          currentDay,
          isYearly
        );
      }
    }, 30000); // 30秒

    // 組件卸載時清理定時器
    return () => {
      clearInterval(intervalId);
      console.log('清理定時更新');
    };
  }, [selectedEmployee, selectedYear, selectedMonth, selectedDay, viewMode]);

  // 載入員工KPI資料的函數
  const loadEmployeeData = async (employeeId, targetYear, targetMonth, targetDay, isYearly = false) => {
    if (!employeeId) {
      return;
    }
    
    setIsLoading(true);
    try {
      console.group('載入KPI資料');
      console.log('參數:', { 
        employeeId, 
        targetYear, 
        targetMonth, 
        targetDay,
        mode: isYearly ? '年度統計' : targetDay ? '每日統計' : '月度統計'
      });

      // 同時發送兩個API請求
      const [yearResponse, monthResponse] = await Promise.all([
        // 年度KPI資料
        fetch(`${REPORT_API.BASE_URL}${REPORT_API.ENDPOINTS.kpiOverviewYear}`, {
          method: 'POST',
          headers: REPORT_API.headers,
          body: JSON.stringify(targetYear)
        }),
        // 日期KPI資料
        fetch(`${REPORT_API.BASE_URL}${REPORT_API.ENDPOINTS.kpiOverviewMonth}`, {
          method: 'POST',
          headers: REPORT_API.headers,
          body: JSON.stringify({
            Year: targetYear,
            Month: targetMonth,
            Day: targetDay
          })
        })
      ]);

      // 檢查回應狀態
      if (!yearResponse.ok) {
        throw new Error(`年度KPI API錯誤: ${yearResponse.status}`);
      }
      if (!monthResponse.ok) {
        throw new Error(`月度KPI API錯誤: ${monthResponse.status}`);
      }

      // 解析回應資料
      const [yearData, monthData] = await Promise.all([
        yearResponse.json(),
        monthResponse.json()
      ]);

      // 保存原始API回應
      window.apiResponse = {
        yearData,
        monthData
      };
      
      // 處理並組織數據
      let processedData;
      
      if (isYearly) {
        // 年度統計模式
        processedData = yearData.result || [];
      } else if (targetDay) {
        // 每日統計模式
        processedData = monthData.result || [];
      } else {
        // 月度統計模式
        processedData = monthData.result || [];
      }

      console.log('API回應:', { yearData, monthData });

      // 更新資料
      if (yearData.code === "0000" && monthData.code === "0000") {
        setEmployeeData(processedData);
        // 找到選中員工的數據
        let employeeData;
        
        if (isYearly) {
          // 年度統計模式
          const employeeYearData = yearData.result.filter(item => 
            item.user_Name === employeeId
          );

          console.log('找到的年度數據:', employeeYearData);

          if (employeeYearData.length > 0) {
            // 計算年度總和
            const yearlyTotals = employeeYearData.reduce((acc, curr) => ({
              completion_Rate: (acc.completion_Rate || 0) + (curr.completion_Rate || 0),
              yield_Percent: (acc.yield_Percent || 0) + (curr.yield_Percent || 0),
              total_Hours: (acc.total_Hours || 0) + (curr.total_Hours || 0),
              machine_Run_Hours: (acc.machine_Run_Hours || 0) + (curr.machine_Run_Hours || 0),
              maintenance_Count: (acc.maintenance_Count || 0) + (curr.maintenance_Count || 0),
              otd_Rate: (acc.otd_Rate || 0) + (curr.otd_Rate || 0),
              kpi_Percent: (acc.kpi_Percent || 0) + (curr.kpi_Percent || 0),
              units_Per_Hour: (acc.units_Per_Hour || 0) + (curr.units_Per_Hour || 0)
            }), {});

            // 計算年度出勤率
            let yearlyAttendance = null;
            let yearlyAttendanceDetails = null;

            try {
              // 計算年度總工作天數和已填寫天數
              let totalWorkDays = 0;
              let totalFilledDays = 0;

              for (let month = 1; month <= 12; month++) {
                try {
                  const monthAttendance = await workLogAPI.getEmployeeAttendance(employeeId, targetYear, month);
                  if (monthAttendance) {
                    totalWorkDays += monthAttendance.workDays || 0;
                    totalFilledDays += monthAttendance.filledDays || 0;
                  }
                } catch (error) {
                  console.warn(`獲取${month}月出勤率失敗:`, error);
                }
              }

              if (totalWorkDays > 0) {
                yearlyAttendance = Math.round((totalFilledDays / totalWorkDays) * 100 * 10) / 10;
                yearlyAttendanceDetails = {
                  filledDays: totalFilledDays,
                  workDays: totalWorkDays
                };
              }

              console.log('年度出勤率計算:', {
                totalWorkDays,
                totalFilledDays,
                yearlyAttendance
              });
            } catch (error) {
              console.warn('計算年度出勤率失敗:', error);
            }

            // 計算平均值
            const monthCount = employeeYearData.length;
            employeeData = {
              ...employeeYearData[0],
              work_Month: `${targetYear}-01-01T00:00:00`,
              completion_Rate: yearlyTotals.completion_Rate / monthCount,
              yield_Percent: yearlyTotals.yield_Percent / monthCount,
              total_Hours: yearlyTotals.total_Hours,  // 總和
              machine_Run_Hours: yearlyTotals.machine_Run_Hours,  // 總和
              maintenance_Count: yearlyTotals.maintenance_Count,  // 總和
              otd_Rate: yearlyTotals.otd_Rate / monthCount,
              kpi_Percent: yearlyTotals.kpi_Percent / monthCount,
              units_Per_Hour: yearlyTotals.units_Per_Hour / monthCount,
              attendance: yearlyAttendance || 0,
              attendanceDetails: yearlyAttendanceDetails,
              isYearlyView: true  // 標記為年度統計視圖
            };

            // 更新檢視方式
            setViewMode("yearly");

            console.log('年度統計數據:', {
              monthCount,
              totals: yearlyTotals,
              processed: employeeData
            });
          }
      } else if (targetDay) {
        // 每日統計模式
        const targetDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T00:00:00`;
        console.log('尋找日期:', targetDate);
        
        // 檢查是否有該日期的數據
        console.log('開始查找日期數據:', {
          targetDate,
          employeeId,
          availableData: monthData.result.length
        });

        // 先找出所有該員工的數據
        const employeeMonthData = monthData.result.filter(item => item.user_Name === employeeId);
        console.log('該員工本月數據:', employeeMonthData.length, '筆');

        // 在員工數據中找出指定日期的數據
        const dailyData = employeeMonthData.find(item => {
          const itemDate = new Date(item.work_Day);
          const targetDateObj = new Date(targetDate);
          
          const match = itemDate.getFullYear() === targetDateObj.getFullYear() &&
                       itemDate.getMonth() === targetDateObj.getMonth() &&
                       itemDate.getDate() === targetDateObj.getDate();
          
          console.log('比對日期:', {
            itemDate: item.work_Day,
            targetDate,
            match,
            data: match ? item : null
          });
          
          return match;
        });

        if (dailyData) {
          console.log('找到指定日期的數據:', dailyData);
          
          // 檢查是否有有效數據
          const hasValidData = dailyData.completion_Rate !== null ||
                             dailyData.yield_Percent !== null ||
                             dailyData.total_Hours > 0 ||
                             dailyData.machine_Run_Hours > 0 ||
                             dailyData.maintenance_Count > 0;
          
          if (hasValidData) {
            // 使用找到的有效數據，將null值轉換為0
            employeeData = {
              ...dailyData,
              completion_Rate: dailyData.completion_Rate || 0,
              yield_Percent: dailyData.yield_Percent || 0,
              total_Hours: dailyData.total_Hours || 0,
              machine_Run_Hours: dailyData.machine_Run_Hours || 0,
              maintenance_Count: dailyData.maintenance_Count || 0,
              otd_Rate: dailyData.otd_Rate || 0,
              kpi_Percent: dailyData.kpi_Percent || 0,
              units_Per_Hour: dailyData.units_Per_Hour || 0,
              attendance: dailyData.attendance || 0
            };
          } else {
            // 數據全為null，使用預設值但保留基本信息
            employeeData = {
              ...dailyData,
              completion_Rate: 0,
              yield_Percent: 0,
              total_Hours: 0,
              machine_Run_Hours: 0,
              maintenance_Count: 0,
              otd_Rate: 0,
              kpi_Percent: 0,
              units_Per_Hour: 0,
              attendance: 0,
              cnt_Done: 0,
              cnt_Running_Done: 0,
              machines_Used: 0,
              items_Contributed: 0,
              items_On_Time: 0,
              in_Qty: 0,
              qc_Qty: 0,
              yield_Rate: 0
            };
          }
        } else {
          // 找不到數據，使用完全預設值
          employeeData = {
            work_Day: targetDate,
            user_Name: employeeId,
            completion_Rate: 0,
            yield_Percent: 0,
            total_Hours: 0,
            machine_Run_Hours: 0,
            maintenance_Count: 0,
            otd_Rate: 0,
            kpi_Percent: 0,
            units_Per_Hour: 0,
            attendance: 0,
            user_Id: null,
            employee_Name: employeeId,
            department_Name: '技術部',
            work_Month: `${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00`,
            cnt_Done: 0,
            cnt_Running_Done: 0,
            machines_Used: 0,
            items_Contributed: 0,
            items_On_Time: 0,
            in_Qty: 0,
            qc_Qty: 0,
            yield_Rate: 0
          };
        }
        
        // 確保更新後的數據使用正確的日期和值
        console.log('最終使用的數據:', {
          requestedDate: targetDate,
          actualDate: employeeData.work_Day,
          hasData: !!dailyData,
          values: {
            completion_Rate: employeeData.completion_Rate,
            yield_Percent: employeeData.yield_Percent,
            total_Hours: employeeData.total_Hours,
            machine_Run_Hours: employeeData.machine_Run_Hours,
            kpi_Percent: employeeData.kpi_Percent
          }
        });
        
        // 確保更新後的數據使用正確的日期
        console.log('最終使用的數據:', {
          requestedDate: targetDate,
          actualDate: employeeData.work_Day,
          hasData: !!dailyData
        });
          
          if (employeeData) {
            // 更新檢視方式
            setViewMode("daily");
          }
        } else {
          // 月度統計模式
          // 先找出所有該員工的數據
          const employeeYearData = yearData.result.filter(item => 
            item.user_Name === employeeId
          );

          console.log('找到的年度數據:', employeeYearData);
          console.log('當前查詢月份:', targetMonth);

          // 構建目標月份字符串
          const targetMonthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00`;
          console.log('目標月份字符串:', targetMonthStr);

          // 找出該月份的數據
          const targetMonthData = employeeYearData.filter(item => {
            const match = item.work_Month === targetMonthStr;
            console.log('比較月份:', {
              targetMonthStr,
              itemMonth: item.work_Month,
              department: item.department_Name,
              match
            });
            return match;
          });

          console.log('該月份找到的數據:', targetMonthData);

          // 如果有數據，選擇其中一個有效的數據
          if (targetMonthData.length > 0) {
            // 優先選擇有實際數據的記錄
            const validData = targetMonthData.find(data => 
              data.completion_Rate !== null || 
              data.total_Hours > 0 || 
              data.cnt_Done > 0
            );

            // 使用找到的數據，確保work_Month是正確的月份
            const selectedData = validData || targetMonthData[0];
            
            // 獲取出勤率數據
            let attendanceData = null;
            try {
              // 使用員工姓名而不是ID來調用API
              attendanceData = await workLogAPI.getEmployeeAttendance(employeeId, targetYear, targetMonth);
              console.log('出勤率數據:', attendanceData);
              console.log('出勤率數據類型:', typeof attendanceData);
              console.log('filledDays:', attendanceData?.filledDays);
              console.log('workDays:', attendanceData?.workDays);
            } catch (error) {
              console.warn('獲取出勤率失敗:', error);
            }

            employeeData = {
              ...selectedData,
              work_Month: targetMonthStr,
              completion_Rate: selectedData.completion_Rate || 0,
              yield_Percent: selectedData.yield_Percent || 0,
              total_Hours: selectedData.total_Hours || 0,
              machine_Run_Hours: selectedData.machine_Run_Hours || 0,
              maintenance_Count: selectedData.maintenance_Count || 0,
              otd_Rate: selectedData.otd_Rate || 0,
              kpi_Percent: selectedData.kpi_Percent || 0,
              units_Per_Hour: selectedData.units_Per_Hour || 0,
              attendance: attendanceData ? attendanceData.attendanceRate : 0,
              attendanceDetails: attendanceData ? {
                filledDays: attendanceData.filledDays,
                workDays: attendanceData.workDays,
                displayText: attendanceData.displayText
              } : null,
              isYearlyView: false  // 清除年度統計標記
            };

            console.log('最終設置的employeeData:', {
              attendance: employeeData.attendance,
              attendanceDetails: employeeData.attendanceDetails
            });
            
            // 更新檢視方式
            setViewMode("monthly");
            
            console.log('選擇的月度數據:', {
              targetMonth,
              original: selectedData,
              processed: employeeData
            });
          } else {
            // 如果找不到數據，仍然嘗試獲取出勤率
            let attendanceData = null;
            try {
              attendanceData = await workLogAPI.getEmployeeAttendance(employeeId, targetYear, targetMonth);
              console.log('出勤率數據 (無其他數據):', attendanceData);
            } catch (error) {
              console.warn('獲取出勤率失敗:', error);
            }

            // 返回空值但包含出勤率
            employeeData = {
              work_Month: targetMonthStr,
              completion_Rate: 0,
              yield_Percent: 0,
              total_Hours: 0,
              machine_Run_Hours: 0,
              maintenance_Count: 0,
              otd_Rate: 0,
              kpi_Percent: 0,
              units_Per_Hour: 0,
              attendance: attendanceData ? attendanceData.attendanceRate : 0,
              attendanceDetails: attendanceData ? {
                filledDays: attendanceData.filledDays,
                workDays: attendanceData.workDays,
                displayText: attendanceData.displayText
              } : null
            };
            
            console.log('未找到該月份數據，使用空值:', {
              targetMonth,
              employeeData
            });
          }

          // 確保使用正確的月份數據
          if (employeeData) {
            const metrics = {
              completion_Rate: employeeData.completion_Rate || 0,
              yield_Percent: employeeData.yield_Percent || 0,
              total_Hours: employeeData.total_Hours || 0,
              machine_Run_Hours: employeeData.machine_Run_Hours || 0,
              maintenance_Count: employeeData.maintenance_Count || 0,
              otd_Rate: employeeData.otd_Rate || 0,
              kpi_Percent: employeeData.kpi_Percent || 0,
              units_Per_Hour: employeeData.units_Per_Hour || 0,
              attendance: employeeData.attendance || 0  // 使用實際的出勤率數據
            };

            console.log('處理後的指標數據:', metrics);
            employeeData = {
              ...employeeData,
              ...metrics
            };
          }

          if (!employeeData) {
            console.log('未找到指定月份的數據:', targetMonth);
            // 如果找不到數據，返回空值
            employeeData = {
              completion_Rate: 0,
              yield_Percent: 0,
              total_Hours: 0,
              machine_Run_Hours: 0,
              maintenance_Count: 0,
              otd_Rate: 0,
              kpi_Percent: 0,
              units_Per_Hour: 0,
              attendance: 0
            };
          }

          console.log('選中的月份數據:', {
            targetMonth,
            employeeData
          });
        }
        
        console.log('查找條件:', {
          employeeId,
          targetYear,
          targetMonth,
          targetDay,
          mode: targetDay ? '每日統計' : '年度統計'
        });
        
        console.log('查找員工數據:', {
          employeeId,
          targetDate: `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T00:00:00`,
          foundData: employeeData
        });

        if (!employeeData) {
          console.log('找不到員工數據，使用預設值:', {
            employeeId,
            targetYear,
            targetMonth,
            targetDay
          });
          const defaultData = {
            completion_Rate: 0,
            yield_Percent: 0,
            total_Hours: 0,
            machine_Run_Hours: 0,
            maintenance_Count: 0,
            otd_Rate: 0,
            kpi_Percent: 0,
            units_Per_Hour: 0,
            attendance: 0,
            user_Name: employeeId
          };
          setEmployeeData(defaultData);
          employeeData = defaultData;
        }

        console.log('找到的員工數據:', employeeData);
        
        // 使用已經處理好的 employeeData
        console.log('使用的數據來源:', selectedDay ? '每日統計' : '月度統計');
        console.log('最終使用的數據:', employeeData);
        
        // 構建最終數據結構
        const newData = {
          // 基本指標
          completion_Rate: employeeData.completion_Rate || 0,
          yield_Percent: employeeData.yield_Percent || 0,
          total_Hours: employeeData.total_Hours || 0,
          machine_Run_Hours: employeeData.machine_Run_Hours || 0,
          maintenance_Count: employeeData.maintenance_Count || 0,
          otd_Rate: employeeData.otd_Rate || 0,
          kpi_Percent: employeeData.kpi_Percent || 0,
          units_Per_Hour: employeeData.units_Per_Hour || 0,
          attendance: employeeData.attendance || 0,
          attendanceDetails: employeeData.attendanceDetails || null,

          // 其他相關資訊
          machines_used: employeeData.machines_Used || 0,
          items_contributed: employeeData.items_Contributed || 0,
          items_on_time: employeeData.items_On_Time || 0,
          
          // 員工資訊
          employeeId: employeeData.user_Id || employeeId,
          employeeName: employeeData.user_Name || '',
          departmentName: employeeData.department_Name || '',
          
          // 歷史資料
          historicalData: [
            { 
              month: employeeData.work_Month ? 
                new Date(employeeData.work_Month).getMonth() + 1 + '月' : 
                `${targetMonth}月`,
              value: employeeData.kpi_Percent || 0
            }
          ],
          
          // 保存原始資料
          yearlyData: yearData.result,
          monthlyData: monthData.result
        };

        console.log('更新後的數據:', newData);
        setEmployeeData(newData);

        // 輸出轉換後的資料以供檢查
        console.log('處理後的資料:', employeeData);
      }

      console.groupEnd();
    } catch (error) {
      console.error('載入KPI資料失敗:', error);
      // 使用預設數據
      setEmployeeData(prevData => ({
        ...prevData,
        workCompletion: 85,
        productQuality: 92,
        workHours: 88,
        attendance: 95,
        machineStatus: 87,
        maintenanceRecord: 90,
        targetAchievement: 86,
        kpi: 89,
        efficiency: 91
      }));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      if (!selectedEmployee) {
        setEmployeeData({});
        setIsLoading(false);
        return;
      }

      // 防止重複載入
      if (isLoading) {
        return;
      }

      setIsLoading(true);

      try {
        // 根據當前檢視方式載入數據
        const isDaily = viewMode === "daily";
        const isYearly = viewMode === "yearly";
        const currentDay = isDaily ? 1 : null;
        const currentMonth = isYearly ? 1 : selectedMonth;

        console.log('初始化數據:', {
          employee: selectedEmployee,
          year: selectedYear,
          month: currentMonth,
          day: currentDay,
          viewMode,
          isYearly
        });

        // 載入數據
        await loadEmployeeData(
          selectedEmployee,
          selectedYear,
          currentMonth,
          currentDay,
          isYearly
        );
      } catch (error) {
        console.error("初始化資料失敗:", error);
        setEmployeeData({});
      } finally {
        setIsLoading(false);
      }
    };

    // 使用防抖延遲執行，避免快速切換時的閃爍
    const timeoutId = setTimeout(initializeData, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [selectedEmployee, selectedYear, selectedMonth, selectedDay, viewMode]);

  const handleEmployeeChange = async (e) => {
    const employeeId = e.target.value;
    console.log('選擇的員工名稱:', employeeId);

    // 設置Loading狀態，避免畫面閃爍
    setIsLoading(true);
    setSelectedEmployee(employeeId);

    // 重新加載可用年份列表
    await loadAvailableYears();
    
    if (employeeId) {
      try {
        // 根據當前檢視方式載入數據
        const isDaily = viewMode === "daily";
        const isYearly = viewMode === "yearly";
        const currentDay = isDaily ? 1 : null;
        const currentMonth = isYearly ? 1 : selectedMonth;
        
        console.log('載入新員工數據:', {
          employeeId,
          year: selectedYear,
          month: currentMonth,
          day: currentDay,
          viewMode,
          isYearly
        });
        
        // 載入數據
        await loadEmployeeData(
          employeeId,
          selectedYear,
          currentMonth,
          currentDay,
          isYearly
        );
      } catch (error) {
        console.error('載入員工數據失敗:', error);
        setEmployeeData({});
      } finally {
        // 無論成功或失敗都關閉Loading狀態
        setIsLoading(false);
      }
    } else {
      // 如果選擇了空值，清空數據
      setEmployeeData({});
      setIsLoading(false);
    }
  };

  // ... 其他渲染邏輯保持不變 ...

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
  // 只在真正loading時顯示loading畫面
  // 使用遮罩層而不是全頁loading
  const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center bg-slate-800 p-6 rounded-lg shadow-xl">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4 mx-auto"></div>
        <p className="text-slate-300">載入中...</p>
      </div>
    </div>
  );

  // 如果沒有employeeData，使用預設值
  const currentEmployeeData = employeeData || {
    completion_Rate: 0,
    yield_Percent: 0,
    total_Hours: 0,
    machine_Run_Hours: 0,
    maintenance_Count: 0,
    otd_Rate: 0,
    kpi_Percent: 0,
    units_Per_Hour: 0,
    attendance: 0
  };

  // 已經在前面定義過 handleEmployeeChange，這裡移除重複的定義

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
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-6 relative">
        {isLoading && <LoadingOverlay />}
        <div className="max-w-7xl mx-auto">
          {/* 頁面頭部：標題和用戶選項 */}
          <div className="flex flex-col gap-4 mb-6">
            {/* 第一行：標題和基本操作 */}
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <h1 className="text-3xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors duration-200 flex items-center gap-2">
                  <Activity className="w-8 h-8" />
                  員工智慧考核系統
                </h1>
                <LoginUserInfo />
              </div>
              <div className="flex items-center gap-4">
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

            {/* 第二行：員工選擇和日期選擇 */}
            <div className="flex items-center gap-4 bg-slate-700/50 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-white">員工：</span>
                {canViewAllEmployees ? (
                  <select
                    className="bg-slate-700 text-white border border-slate-600 rounded-lg p-2 min-w-[200px] cursor-pointer hover:bg-slate-600 transition-colors"
                    value={selectedEmployee}
                    onChange={handleEmployeeChange}
                  >
                    <option value="">請選擇員工</option>
                    {employees && employees.length > 0 ? (
                      employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {`${emp.name} ( ${pointsConfig.userRoles[pointsConfig.positionRoleMapping[emp.position] || emp.role] || emp.role} )`}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>無可用員工資料</option>
                    )}
                  </select>
                ) : (
                  <div className="bg-slate-700 text-white border border-slate-600 rounded-lg p-2 min-w-[200px]">
                    {`${user.name} ( ${pointsConfig.userRoles[user.role] || user.role} )`}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-white">年份：</span>
                  <div className="relative inline-block">
                    <select
                      value={selectedYear}
                      onChange={async (e) => {
                        const newYear = parseInt(e.target.value);
                        
                        // 設置loading狀態
                        setIsLoading(true);
                        
                        try {
                          // 先更新年份
                          setSelectedYear(newYear);
                          
                          // 等待一個極短的時間以確保狀態更新
                          await new Promise(resolve => setTimeout(resolve, 10));
                          
                          // 根據當前檢視模式決定是否需要重置月份
                          const currentMonth = viewMode === "yearly" ? 1 : selectedMonth;
                          const currentDay = viewMode === "daily" ? selectedDay : null;
                          const isYearlyView = viewMode === "yearly";
                          
                          // 重新加載數據
                          await loadEmployeeData(
                            selectedEmployee,
                            newYear,
                            currentMonth,
                            currentDay,
                            isYearlyView
                          );
                          
                          console.log('年份變更:', {
                            newYear,
                            currentMonth,
                            currentDay,
                            selectedEmployee,
                            viewMode
                          });
                        } catch (error) {
                          console.error('載入年度數據失敗:', error);
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      className="appearance-none bg-slate-700 text-white px-4 py-2 pr-10 rounded-lg border border-slate-600 
                        hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
                        transition-all duration-200 cursor-pointer min-w-[120px] backdrop-blur-sm
                        shadow-sm hover:shadow-md"
                    >
                      {availableYears.map(year => (
                        <option 
                          key={year} 
                          value={year}
                          className="bg-slate-700 text-white hover:bg-slate-600"
                        >
                          {year}年
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {viewMode !== "yearly" && (
                  <div className="flex items-center gap-2">
                    <span className="text-white">月份：</span>
                    <div className="relative inline-block">
                      <select
                        value={selectedMonth}
                        onChange={async (e) => {
                          const newMonth = parseInt(e.target.value);
                          console.log('切換到新月份:', newMonth);

                          // 設置Loading狀態，避免閃爍
                          setIsLoading(true);

                          // 更新月份
                          setSelectedMonth(newMonth);

                          // 等待狀態更新
                          await new Promise(resolve => setTimeout(resolve, 10));
                          
                          // 重新加載數據
                          console.log('開始加載新月份數據:', {
                            employee: selectedEmployee,
                            year: selectedYear,
                            month: newMonth,
                            day: selectedDay,
                            mode: selectedDay ? '每日統計' : '月度統計'
                          });
                          
                          try {
                            // 確保使用新的月份
                            await loadEmployeeData(
                              selectedEmployee,
                              selectedYear,
                              newMonth,
                              selectedDay,
                              false  // 不是年度統計
                            );
                          } catch (error) {
                            console.error('加載數據失敗:', error);
                            setEmployeeData({});
                          } finally {
                            // 無論成功或失敗都關閉Loading狀態
                            setIsLoading(false);
                          }
                        }}
                        className="appearance-none bg-slate-700 text-white px-4 py-2 pr-10 rounded-lg border border-slate-600 
                          hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
                          transition-all duration-200 cursor-pointer min-w-[100px] backdrop-blur-sm
                          shadow-sm hover:shadow-md"
                      >
                        {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                          <option 
                            key={month} 
                            value={month}
                            className="bg-slate-700 text-white hover:bg-slate-600"
                          >
                            {month}月
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <span className="text-white">檢視方式：</span>
                  <div className="relative inline-block">
                    <select
                      value={viewMode}
                      onChange={async (e) => {
                        const newViewMode = e.target.value;
                        const isDaily = newViewMode === "daily";
                        const isYearly = newViewMode === "yearly";
                        const newDay = isDaily ? 1 : null;
                        
                        console.log('切換檢視方式:', {
                          newViewMode,
                          isDaily,
                          isYearly,
                          newDay,
                          currentViewMode: viewMode
                        });
                        
                        // 設置Loading狀態，避免閃爍
                        setIsLoading(true);

                        // 更新檢視方式狀態
                        setViewMode(newViewMode);
                        setSelectedDay(newDay);

                        // 如果是年度統計，強制設置月份為1月
                        if (isYearly) {
                          setSelectedMonth(1);
                        }

                        // 等待狀態更新
                        await new Promise(resolve => setTimeout(resolve, 10));
                        
                        // 重新加載數據
                        try {
                          const currentMonth = isYearly ? 1 : selectedMonth;
                          
                          console.log('開始加載新數據:', {
                            mode: newViewMode,
                            year: selectedYear,
                            month: currentMonth,
                            day: newDay,
                            employee: selectedEmployee,
                            isYearly
                          });
                          
                          await loadEmployeeData(
                            selectedEmployee,
                            selectedYear,
                            currentMonth,
                            newDay,
                            isYearly
                          );
                        } catch (error) {
                          console.error('加載數據失敗:', error);
                          setEmployeeData({});
                        } finally {
                          // 無論成功或失敗都關閉Loading狀態
                          setIsLoading(false);
                        }
                      }}
                      className="appearance-none bg-slate-700 text-white px-4 py-2 pr-10 rounded-lg border border-slate-600 
                        hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
                        transition-all duration-200 cursor-pointer min-w-[120px] backdrop-blur-sm
                        shadow-sm hover:shadow-md"
                    >
                      <option value="yearly" className="bg-slate-700 text-white hover:bg-slate-600">年度統計</option>
                      <option value="monthly" className="bg-slate-700 text-white hover:bg-slate-600">月度統計</option>
                      <option value="daily" className="bg-slate-700 text-white hover:bg-slate-600">每日統計</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                      </svg>
                    </div>
                  </div>
                  {viewMode === "daily" && (
                    <div className="relative inline-block">
                      <select
                        value={selectedDay}
                        onChange={async (e) => {
                          const newDay = parseInt(e.target.value);
                          console.log('切換到新日期:', {
                            currentDay: selectedDay,
                            newDay,
                            year: selectedYear,
                            month: selectedMonth
                          });
                          
                          // 設置Loading狀態，避免閃爍
                          setIsLoading(true);
                          setSelectedDay(newDay);

                          // 等待狀態更新
                          await new Promise(resolve => setTimeout(resolve, 10));
                          
                          try {
                            // 重新加載數據
                            await loadEmployeeData(
                              selectedEmployee,
                              selectedYear,
                              selectedMonth,
                              newDay,
                              false  // 不是年度統計
                            );
                          } catch (error) {
                            console.error('載入日期數據失敗:', error);
                            setEmployeeData({});
                          } finally {
                            setIsLoading(false);
                          }
                        }}
                        className="appearance-none bg-slate-700 text-white px-4 py-2 pr-10 rounded-lg border border-slate-600 
                          hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
                          transition-all duration-200 cursor-pointer min-w-[100px] backdrop-blur-sm
                          shadow-sm hover:shadow-md"
                      >
                        {Array.from({length: 31}, (_, i) => i + 1).map(day => (
                          <option 
                            key={day} 
                            value={day}
                            className="bg-slate-700 text-white hover:bg-slate-600"
                          >
                            {day}日
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
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
            {/* 無數據提示 */}
            {selectedEmployee && !isLoading && (
              <div className={`mb-6 ${Object.values(currentEmployeeData).every(value => value === 0 || value === null) ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-blue-500/10 border border-blue-500/20'} rounded-lg p-4 ${Object.values(currentEmployeeData).every(value => value === 0 || value === null) ? 'text-yellow-400' : 'text-blue-400'}`}>
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  <span className="font-medium">
                    {Object.values(currentEmployeeData).every(value => value === 0 || value === null) ? '無可用數據' : '數據載入成功'}
                  </span>
                </div>
                <p className="mt-1 text-sm opacity-80">
                  {Object.values(currentEmployeeData).every(value => value === 0 || value === null) ? (
                    <>
                      目前所選的{viewMode === "yearly" ? "年度" : viewMode === "monthly" ? "月份" : "日期"}
                      尚無績效數據，系統將顯示預設值。請確認選擇的時間區間是否正確，或選擇其他時間區間查看。
                    </>
                  ) : (
                    <>
                      已成功載入 {selectedEmployee} 在 {selectedYear}年
                      {viewMode !== "yearly" ? `${selectedMonth}月` : ""}
                      {viewMode === "daily" ? `${selectedDay}日` : ""} 的績效數據。
                    </>
                  )}
                </p>
              </div>
            )}

            {/* Dashboard View */}
            {activeTab === "dashboard" && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {metrics.map((metric) => (
                    <PerformanceCard
                      key={metric.id}
                      metric={metric}
                      data={currentEmployeeData}
                    />
                  ))}
                </div>

                {/* 績效趨勢圖表 */}
                <div className="mt-6">
                  <div className="bg-slate-800 rounded-lg p-6 relative">
                    <h3 className="text-xl font-semibold mb-4 text-slate-200">績效趨勢分析</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="absolute top-4 right-6 flex items-center gap-3">
                        <div className={`flex items-center bg-slate-700/50 rounded-lg py-1 px-1.5 border border-slate-600 ${viewMode !== 'monthly' ? 'opacity-0 pointer-events-none' : ''}`}>
                          <span className="text-slate-300 text-sm px-2">月份：</span>
                          <select
                            value={selectedMonth}
                            onChange={async (e) => {
                              const newMonth = parseInt(e.target.value);
                              setIsLoading(true);
                              setSelectedMonth(newMonth);

                              if (selectedEmployee) {
                                try {
                                  await loadEmployeeData(
                                    selectedEmployee,
                                    selectedYear,
                                    newMonth,
                                    viewMode === "daily" ? 1 : null,
                                    viewMode === "yearly"
                                  );
                                } catch (error) {
                                  console.error('載入數據失敗:', error);
                                } finally {
                                  setIsLoading(false);
                                }
                              } else {
                                setIsLoading(false);
                              }
                            }}
                            className="bg-slate-800 text-white rounded px-4 text-sm font-medium min-w-[100px] h-[38px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={month} value={month}>{month}月</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center bg-slate-700/50 rounded-lg py-1 px-1.5 border border-slate-600">
                          <button
                            onClick={() => setViewMode('yearly')}
                            className={`h-[38px] px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                              viewMode === 'yearly'
                                ? 'bg-blue-500 text-white'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            年度檢視
                          </button>
                          <button
                            onClick={() => setViewMode('monthly')}
                            className={`h-[38px] px-3 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                              viewMode === 'monthly'
                                ? 'bg-blue-500 text-white'
                                : 'text-slate-300 hover:text-white'
                            }`}
                          >
                            月度檢視
                          </button>
                        </div>
                      </div>
                    </div>
                    <PerformanceTrendChart
                      data={processChartData(
                        window.apiResponse || {
                          yearData: { result: [] },
                          monthData: { result: [] }
                        },
                        viewMode,
                        selectedYear,
                        selectedMonth,
                        selectedDay
                      )}
                      viewMode={viewMode}
                    />
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
                      {metrics.map((metric) => {
                        // 計算評分值（用於狀態判斷）
                        let scoreValue;
                        if (metric.scoreCalculation) {
                          // 使用特殊評分計算（維護指標、工作時間、機台運行狀態）
                          scoreValue = metric.scoreCalculation(currentEmployeeData);
                        } else if (metric.id === 'attendance') {
                          // 出勤率使用百分比數值
                          scoreValue = currentEmployeeData?.attendance || 0;
                        } else {
                          // 其他指標使用原始數值
                          scoreValue = metric.value(currentEmployeeData);
                        }

                        // 顯示值（用於數值欄位）
                        let displayValue;
                        if (metric.id === 'attendance') {
                          // 出勤率顯示百分比
                          displayValue = `${currentEmployeeData?.attendance || 0}%`;
                        } else if (metric.id === 'maintenance') {
                          // 維護指標顯示次數，但評分用百分比
                          displayValue = `${metric.value(currentEmployeeData)}次 (評分: ${scoreValue.toFixed(1)}%)`;
                        } else if (metric.id === 'workHours') {
                          // 工作時間顯示小時數和評分
                          displayValue = `${metric.value(currentEmployeeData)}小時 (評分: ${scoreValue.toFixed(1)}%)`;
                        } else if (metric.id === 'machineStatus') {
                          // 機台運行狀態顯示小時數和評分
                          displayValue = `${metric.value(currentEmployeeData)}小時 (評分: ${scoreValue.toFixed(1)}%)`;
                        } else {
                          // 其他指標根據單位顯示
                          displayValue = `${metric.value(currentEmployeeData)}${metric.unit}`;
                        }

                        return (
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
                                {displayValue}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                              <span className="animate-glow">{metric.target}%</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-2 py-1 rounded-full text-sm animate-glow ${
                                  scoreValue === 100
                                    ? "bg-gradient-to-r from-purple-300 via-purple-100 to-purple-300 text-purple-800"
                                    : scoreValue >= 90
                                      ? "bg-green-100 text-green-800"
                                      : scoreValue >= 80
                                        ? "bg-blue-100 text-blue-800"
                                        : scoreValue >= 70
                                          ? "bg-yellow-100 text-yellow-800"
                                          : scoreValue >= 60
                                            ? "bg-orange-100 text-orange-800"
                                            : "bg-red-100 text-red-800"
                                }`}
                              >
                                {scoreValue === 100
                                  ? "完美"
                                  : scoreValue >= 90
                                    ? "優秀"
                                    : scoreValue >= 80
                                      ? "良好"
                                      : scoreValue >= 70
                                        ? "待加強"
                                        : scoreValue >= 60
                                          ? "不及格"
                                          : "極需改進"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 改進建議視圖 */}
            {activeTab === "recommendations" && (
              <div className="space-y-4">
                {metrics.map((metric) => {
                  // 計算評分值（用於建議判斷）
                  let scoreValue;
                  if (metric.scoreCalculation) {
                    // 使用特殊評分計算（維護指標、工作時間、機台運行狀態）
                    scoreValue = metric.scoreCalculation(currentEmployeeData);
                  } else if (metric.id === 'attendance') {
                    // 出勤率使用百分比數值
                    scoreValue = currentEmployeeData?.attendance || 0;
                  } else {
                    // 其他指標使用原始數值
                    scoreValue = metric.value(currentEmployeeData);
                  }

                  const performanceLevel =
                    scoreValue === 100
                      ? "perfect"
                      : scoreValue >= 90
                        ? "excellent"
                        : scoreValue >= 80
                          ? "good"
                          : scoreValue >= 70
                            ? "needsImprovement"
                            : scoreValue >= 60
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
                        {(() => {
                          // 根據不同指標提供專門的建議
                          const getSpecificRecommendation = (metricId, level) => {
                            const recommendations = {
                              workCompletion: {
                                perfect: "工作完成量表現完美！建議分享經驗給團隊成員，協助提升整體效率。",
                                excellent: "工作完成量優異，建議持續保持高效率，並考慮承擔更多挑戰性任務。",
                                good: "工作完成量良好，建議優化工作流程，朝向更高效率目標邁進。",
                                needsImprovement: "建議檢視工作方法，參加時間管理培訓，提升工作效率。",
                                poor: "建議重新規劃工作流程，尋求主管指導，參加相關技能培訓。",
                                critical: "急需改進工作方法，建議接受一對一指導，制定詳細改進計畫。"
                              },
                              quality: {
                                perfect: "產品質量完美無瑕！建議擔任質量標準制定者，指導其他同仁。",
                                excellent: "產品質量優異，建議持續保持高標準，分享品質控制經驗。",
                                good: "產品質量良好，建議加強細節檢查，朝向零缺陷目標努力。",
                                needsImprovement: "建議參加品質管理培訓，加強作業標準化流程。",
                                poor: "建議重新學習品質標準，加強自我檢查機制。",
                                critical: "急需品質意識培訓，建議暫停獨立作業，接受密切指導。"
                              },
                              workHours: {
                                perfect: "工作時間管理完美！建議分享時間管理技巧給團隊。",
                                excellent: "工作時間安排優異，建議持續保持良好的工作節奏。",
                                good: "工作時間安排良好，建議進一步優化時間分配效率。",
                                needsImprovement: "建議參加時間管理課程，學習更有效的工作安排。",
                                poor: "建議重新檢視工作時間分配，尋求主管協助調整工作負荷。",
                                critical: "急需時間管理指導，建議制定詳細的工作時間計畫。"
                              },
                              attendance: {
                                perfect: "出勤記錄完美！建議持續保持，成為團隊出勤典範。",
                                excellent: "出勤表現優異，建議持續保持良好的工作紀律。",
                                good: "出勤記錄良好，建議進一步提升出勤穩定性。",
                                needsImprovement: "建議改善出勤習慣，確保按時完成工作日誌填寫。",
                                poor: "建議重視出勤紀律，養成每日填寫工作日誌的習慣。",
                                critical: "急需改善出勤狀況，建議與主管討論工作安排問題。"
                              },
                              machineStatus: {
                                perfect: "機台運行管理完美！建議分享設備維護經驗。",
                                excellent: "機台運行狀況優異，建議持續保持設備最佳狀態。",
                                good: "機台運行良好，建議加強預防性維護措施。",
                                needsImprovement: "建議參加設備操作培訓，提升機台運行效率。",
                                poor: "建議重新學習設備操作規範，加強日常維護。",
                                critical: "急需設備操作指導，建議暫停獨立操作，接受專業培訓。"
                              },
                              maintenance: {
                                perfect: "設備維護表現完美！零維護需求顯示優秀的預防性管理。",
                                excellent: "維護需求極低，顯示良好的設備管理能力。",
                                good: "維護頻率合理，建議加強預防性檢查減少維護需求。",
                                needsImprovement: "維護頻率偏高，建議學習預防性維護技巧。",
                                poor: "維護需求過多，建議重新檢視設備操作方式。",
                                critical: "維護頻率過高，急需設備操作培訓和維護指導。"
                              },
                              targetAchievement: {
                                perfect: "目標達成率完美！建議設定更具挑戰性的目標。",
                                excellent: "目標達成表現優異，建議持續保持高達成率。",
                                good: "目標達成良好，建議優化執行策略提升達成率。",
                                needsImprovement: "建議重新檢視目標設定，調整執行計畫。",
                                poor: "建議分解目標為小階段，逐步提升達成能力。",
                                critical: "急需目標管理指導，建議重新制定可達成的階段性目標。"
                              },
                              kpi: {
                                perfect: "KPI表現完美！建議分享成功經驗給團隊。",
                                excellent: "KPI表現優異，建議持續保持高績效水準。",
                                good: "KPI表現良好，建議針對弱項進行重點改善。",
                                needsImprovement: "建議參加績效管理培訓，提升關鍵指標表現。",
                                poor: "建議重新檢視工作方法，尋求績效改善指導。",
                                critical: "急需績效改善計畫，建議接受一對一績效輔導。"
                              },
                              efficiency: {
                                perfect: "效率指標完美！建議分享高效工作方法。",
                                excellent: "效率表現優異，建議持續保持高效率工作模式。",
                                good: "效率表現良好，建議進一步優化工作流程。",
                                needsImprovement: "建議參加效率提升培訓，學習更有效的工作方法。",
                                poor: "建議重新檢視工作流程，尋求效率改善指導。",
                                critical: "急需效率改善計畫，建議接受工作方法指導。"
                              }
                            };

                            return recommendations[metricId]?.[level] || `建議針對${metric.title}進行專項改善。`;
                          };

                          return getSpecificRecommendation(metric.id, performanceLevel);
                        })()}
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
