// import React, { useState, useEffect } from "react";
// import {
//   LineChart,
//   Line,
//   XAxis,
//   YAxis,
//   CartesianGrid,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import {
//   Activity,
//   Target,
//   Award,
//   Zap,
//   Clock,
//   Calendar,
//   Settings,
//   Wrench,
//   BarChart,
//   User,
//   Key,
//   LogOut,
//   Info,
//   Calculator,
// } from "lucide-react";
// import PointsManagementDashboard from './PointsManagement/PointsManagementDashboard';
// import {
//   TrendingUp as ReactFeatherTrendingUp,
//   TrendingDown as ReactFeatherTrendingDown,
//   X,
// } from "react-feather";
// import {
//   calculateFairnessIndex,
//   calculateTotalScore,
// } from "../utils/performanceCalculations";
// import {
//   convertPercentageToScore,
//   getPerformanceAnalysis,
//   getGradeBadgeColor,
//   getGradeFromScore,
//   getScoreBreakdown  // 新增：從工具模組導入
// } from "../utils/scoreCalculations";
// import { useNavigate } from "react-router-dom";
// import { performanceAPI } from "../services/api";
// import { mockEmployeeData } from "../models/employeeData";
// import { REPORT_API } from "../config/apiConfig";

// /**
//  * 共用組件：進度條
//  * 用於顯示各種指標的完成度
//  */
// const ProgressBar = ({ value, color }) => {
//   // 創建一個顏色映射對象
//   const colorMap = {
//     "text-blue-500": "bg-blue-500",
//     "text-green-500": "bg-green-500",
//     "text-orange-400": "bg-orange-400",
//     "text-pink-400": "bg-pink-400",
//     "text-cyan-400": "bg-cyan-400",
//     "text-purple-400": "bg-purple-400",
//     "text-red-400": "bg-red-400",
//     "text-yellow-400": "bg-yellow-400",
//     "text-lime-400": "bg-lime-400",
//   };

//   // 使用映射獲取背景顏色類
//   const bgColorClass = colorMap[color] || "bg-gray-400";

//   return (
//     <div className="w-full h-2 bg-slate-600/50 rounded-full overflow-hidden">
//       <div
//         className={`h-full relative ${bgColorClass} animate-glow before:absolute before:inset-0 before:bg-progress-gradient before:animate-progressFlow`}
//         style={{
//           width: `${Math.min(Math.max(value, 0), 100)}%`,
//           transition: "width 0.5s ease-in-out",
//         }}
//       />
//     </div>
//   );
// };

// /**
//  * 核心組件：績效指標卡片
//  * 顯示單個績效指標的詳細信息，包括：
//  * - 基本指標展示
//  * - 詳細模態框
//  * - 歷史趨勢圖表
//  * - 改進建議
//  */
// const PerformanceCard = ({ metric, data }) => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [showLevelGuide, setShowLevelGuide] = useState(false);
//   const breakdown = getScoreBreakdown(metric, data);

//   // 直接使用 metric 的 value 函數獲取值
//   let value = metric.value(data);

//   // 檢查並修復NaN值
//   if (isNaN(value) || value === null || value === undefined) {
//     console.warn(`Invalid value for metric ${metric.id}:`, value, 'data:', data);
//     value = 0;
//   }

//   // 如果是百分比指標，確保在0-100範圍內
//   if (metric.unit === "%") {
//     value = Math.max(0, Math.min(100, value));
//   }

//   // 得分計算表整合
//   const scoreData = convertPercentageToScore(value);
//   const performanceAnalysis = getPerformanceAnalysis(value, metric.id, metric.title);

//   /**
//    * 數據處理方法：獲取最近三個月數據
//    * 🎯 完整修正歷史趨勢一致性問題：
//    * - 支援所有9個指標的歷史數據映射
//    * - 當前月份（7月）使用最終得分（包含加分機制）
//    * - 前兩個月使用基礎分數（原始數據）
//    * - 確保每個指標的7月歷史數據與當前顯示的得分一致
//    * - 修正dataKey映射邏輯，避免所有指標錯誤使用同一字段
//    */
//   const getRecentMonthsData = () => {
//     const now = new Date();
//     const currentYear = now.getFullYear();
//     const currentMonth = now.getMonth() + 1; // getMonth()返回0-11，需要+1
    
//     // 獲取對應員工的年度數據
//     const employeeId = data?.employeeId || 'EMP001'; // 從data中獲取員工ID，預設為EMP001
//     const employeeAllData = mockEmployeeData[employeeId];
    
//     if (!employeeAllData || !employeeAllData.yearlyData || !employeeAllData.yearlyData[currentYear]) {
//       // 如果沒有年度數據，使用預設的三個月數據（調整為與當前最終得分一致）
//       const currentFieldValue = metric.id === 'workCompletion' ? 'completion' :
//                                metric.id === 'quality' ? 'quality' :
//                                metric.id === 'workHours' ? 'workHours' :
//                                metric.id === 'attendance' ? 'attendance' :
//                                metric.id === 'machineStatus' ? 'machineStatus' :
//                                metric.id === 'maintenance' ? 'maintenance' :
//                                metric.id === 'targetAchievement' ? 'targetAchievement' :
//                                metric.id === 'kpi' ? 'kpi' : 'efficiency';
      
//       return [
//         { month: "5月", completion: 70, quality: 75, efficiency: 72, workHours: 75, attendance: 95, machineStatus: 90, maintenance: 80, targetAchievement: 85, kpi: 80 },
//         { month: "6月", completion: 72, quality: 77, efficiency: 75, workHours: 75, attendance: 96, machineStatus: 92, maintenance: 82, targetAchievement: 87, kpi: 82 },
//         { month: "7月", [currentFieldValue]: value, completion: 75, quality: 80, efficiency: 77, workHours: 75, attendance: 98, machineStatus: 95, maintenance: 85, targetAchievement: 90, kpi: 85 } // 使用當前最終得分
//       ];
//     }
    
//     const yearData = employeeAllData.yearlyData[currentYear];
    
//     // 獲取最近三個月的數據，包括當前月份
//     const recentThreeMonths = [];
//     for (let i = 2; i >= 0; i--) {
//       const targetMonth = currentMonth - i;
//       if (targetMonth > 0 && targetMonth <= yearData.length) {
//         const monthData = yearData[targetMonth - 1]; // 數組索引從0開始
        
//         // 🎯 關鍵修正：如果是當前月份，需要調整數據以反映最終得分
//         if (targetMonth === currentMonth) {
//           // 當前月份使用最終得分，確保與數據卡片一致
//           let adjustedData = {
//             month: monthData.month,
//             completion: monthData.completion,
//             quality: monthData.quality, 
//             efficiency: monthData.efficiency,
//             workHours: monthData.workHours || 75,
//             attendance: monthData.attendance || 98,
//             machineStatus: monthData.machineStatus || 95,
//             maintenance: monthData.maintenance || 85,
//             targetAchievement: monthData.targetAchievement || 95,
//             kpi: monthData.kpi || 88
//           };
          
//           // 根據當前指標類型調整對應的數值為最終得分
//           if (metric.id === 'workCompletion') {
//             adjustedData.completion = value; // 使用最終得分
//           } else if (metric.id === 'quality') {
//             adjustedData.quality = value; // 使用最終得分
//           } else if (metric.id === 'workHours') {
//             adjustedData.workHours = value; // 使用最終得分
//           } else if (metric.id === 'attendance') {
//             adjustedData.attendance = value; // 使用最終得分
//           } else if (metric.id === 'machineStatus') {
//             adjustedData.machineStatus = value; // 使用最終得分
//           } else if (metric.id === 'maintenance') {
//             adjustedData.maintenance = value; // 使用最終得分
//           } else if (metric.id === 'targetAchievement') {
//             adjustedData.targetAchievement = value; // 使用最終得分
//           } else if (metric.id === 'kpi') {
//             adjustedData.kpi = value; // 使用最終得分
//           } else if (metric.id === 'efficiency') {
//             adjustedData.efficiency = value; // 使用最終得分
//           }
          
//           recentThreeMonths.push(adjustedData);
//         } else {
//           // 前幾個月保持原始數據
//           recentThreeMonths.push({
//             month: monthData.month,
//             completion: monthData.completion,
//             quality: monthData.quality,
//             efficiency: monthData.efficiency,
//             workHours: monthData.workHours || 75,
//             attendance: monthData.attendance || 98,
//             machineStatus: monthData.machineStatus || 95,
//             maintenance: monthData.maintenance || 85,
//             targetAchievement: monthData.targetAchievement || 95,
//             kpi: monthData.kpi || 88
//           });
//         }
//       }
//     }
    
//     // 如果數據不足三個月，用現有數據填充
//     while (recentThreeMonths.length < 3) {
//       const lastData = recentThreeMonths[recentThreeMonths.length - 1] || 
//         { month: "當月", completion: 75, quality: 75, efficiency: 75, workHours: 75, attendance: 95, machineStatus: 90, maintenance: 80, targetAchievement: 85, kpi: 80 };
//       recentThreeMonths.unshift({
//         month: `${recentThreeMonths.length + 1}月前`,
//         completion: Math.max(0, lastData.completion - 5),
//         quality: Math.max(0, lastData.quality - 3),
//         efficiency: Math.max(0, lastData.efficiency - 4),
//         workHours: Math.max(0, (lastData.workHours || 75) - 2),
//         attendance: Math.max(0, (lastData.attendance || 95) - 1),
//         machineStatus: Math.max(0, (lastData.machineStatus || 90) - 3),
//         maintenance: Math.max(0, (lastData.maintenance || 80) - 2),
//         targetAchievement: Math.max(0, (lastData.targetAchievement || 85) - 3),
//         kpi: Math.max(0, (lastData.kpi || 80) - 2)
//       });
//     }
    
//     return recentThreeMonths;
//   };
//   /**
//    * 工具方法：獲取指標樣式
//    */
//   const getMetricStyle = (metricId) => {
//     const styleMap = {
//       workCompletion: { color: "#3B82F6", name: "完成率" }, // text-blue-500
//       quality: { color: "#10B981", name: "質量" }, // text-green-500
//       workHours: { color: "#F59E0B", name: "工作時間" }, // text-orange-400
//       attendance: { color: "#EC4899", name: "出勤率" }, // text-pink-400
//       machineStatus: { color: "#06B6D4", name: "機台狀態" }, // text-cyan-400
//       maintenance: { color: "#8B5CF6", name: "維護記錄" }, // text-purple-400
//       targetAchievement: { color: "#F87171", name: "目標達成" }, // text-red-400
//       kpi: { color: "#FBBF24", name: "KPI" }, // text-yellow-400
//       efficiency: { color: "#A3E635", name: "效率" }, // text-lime-400
//     };
//     return styleMap[metricId] || { color: "#3B82F6", name: "完成率" };
//   };

//   /**
//    * 數據處理方法：獲取詳細得分說明
//    */
//   const getScoreExplanation = (metric, data) => {
//     switch (metric.id) {
//       case "workHours":
//         const standardHours = data.standardHours || 176;
//         const actualHours = data.actualHours || 0;
//         const baseScore = Math.round((actualHours / standardHours) * 100);

//         return {
//           baseScoreExplanation: "工時分數計算依據：",
//           baseScoreDetails: [
//             `基礎得分：${baseScore}分`,
//             "計算公式：(實際工時/標準工時) × 100",
//             `標準工時：${standardHours}小時`,
//             `實際工時：${actualHours}小時`,
//             `計算結果：(${actualHours}/${standardHours}) × 100 = ${baseScore}分`,
//           ],
//           calculationMethod: "此分數反映員工實際工作時數與標準工時的比例",
//         };
//       case "quality":
//         return {
//           baseScoreExplanation: "產品質量基本表現",
//           baseScoreDetails: [`基礎得分：${data.productQuality}分`],
//           calculationMethod: "基於產品檢驗結果評分",
//         };
//       case "workCompletion":
//         return {
//           baseScoreExplanation: "基於完成的工作項目數量計算：",
//           baseScoreDetails: [
//             `總工作項目數：${data.totalTasks || 0}項`,
//             `已完成項目數：${data.completedTasks || 0}項`,
//             `完成率：${breakdown.baseScore}%`,
//           ],
//           calculationMethod: "計算方式：(已完成項目 / 總項目) × 100",
//         };
//       case "efficiency":
//         return {
//           baseScoreExplanation: "基於工作效率評估：",
//           baseScoreDetails: [
//             `標準工時：${data.standardHours || 0}小時`,
//             `實際工時：${data.actualHours || 0}小時`,
//             `效率指數：${breakdown.baseScore}%`,
//           ],
//           calculationMethod: "計算方式：(標準工時 / 實際工時) × 100",
//         };
//       // ... 其他指標的說明
//       default:
//         return {
//           baseScoreExplanation: `${metric.title}基本表現`,
//           baseScoreDetails: [`基礎得分：${metric.value(data)}分`],
//           calculationMethod: "",
//         };
//     }
//   };

//   const scoreExplanation = getScoreExplanation(metric, breakdown);

//   /**
//    * 工具方法：獲取計算公式文本
//    */
//   const getCalculationFormula = (metricId, value) => {
//     // 導入詳細計算公式配置
//     const { getDetailedCalculationFormula } = require('../config/scoringConfig');
//     const formulaConfig = getDetailedCalculationFormula(metricId);
    
//     if (formulaConfig && formulaConfig.formula !== "計算公式未定義") {
//       return `${formulaConfig.formula} = ${value}%`;
//     }
    
//     // 備用的簡化版本（向後兼容）
//     switch (metricId) {
//       case "workCompletion":
//         return "工作完成量 = 完成量 / 應交量 × 100 = " + value + "%";
//       case "quality":
//         return "產品質量 = 已完成工單數 / 總工單數 × 100 = " + value + "%";
//       case "workHours":
//         return "工作時間效率 = 單位時間完成數 / 平均值 x 100 = " + value + "%";
//       case "attendance":
//         return "差勤紀錄 = 出勤日 / 應出勤日 × 100 = " + value + "%";
//       case "machineStatus":
//         return "機台稼動率 = Running時間 / 總時間 × 100 = " + value + "%";
//       case "maintenance":
//         return "維護表現 = 100 - (Alarm時間 / 總時間 × 100) = " + value + "%";
//       case "targetAchievement":
//         return "目標達成率 = 員工產出 / 工單需求 × 100 = " + value + "%";
//       case "kpi":
//         return "關鍵績效指標 = 各項指標加權平均 = " + value + "%";
//       case "efficiency":
//         return "效率指標 = 實際效率 / 標準效率 × 100 = " + value + "%";
//       default:
//         return "計算結果 = " + value + "%";
//     }
//   };

//   /**
//    * 工具方法：獲取個性化建議文本
//    * 根據不同指標和分數範圍提供具體且可操作的建議
//    */
//   const getSuggestions = (value, metric) => {
//     const metricSpecificSuggestions = getMetricSpecificSuggestions(metric.id, value);
//     const generalSuggestions = getGeneralSuggestions(value, metric.title);
    
//     return [...metricSpecificSuggestions, ...generalSuggestions];
//   };

//   /**
//    * 根據具體指標類型提供針對性建議
//    */
//   const getMetricSpecificSuggestions = (metricId, value) => {
//     const suggestions = [];
    
//     switch (metricId) {
//       case "workCompletion":
//         if (value >= 95) {
//           suggestions.push("🎯 恭喜達成超額完成目標！考慮分享時間管理技巧給團隊");
//           suggestions.push("📊 可嘗試協助處理更多複雜工單，發揮經驗優勢");
//         } else if (value >= 85) {
//           suggestions.push("⏰ 建議檢視工作流程，找出可優化的環節");
//           suggestions.push("🤝 與高效同事交流，學習任務優先順序安排技巧");
//         } else if (value >= 70) {
//           suggestions.push("📋 建議使用工作清單工具，追踪任務進度");
//           suggestions.push("🎯 專注處理核心任務，避免同時進行太多工作");
//         } else {
//           suggestions.push("🚨 立即與主管討論工作負荷，確認是否需要資源支援");
//           suggestions.push("📚 參加時間管理培訓課程，掌握基本工作技巧");
//         }
//         break;
        
//       case "quality":
//         if (value >= 95) {
//           suggestions.push("🏆 質量表現卓越！可擔任質量標準制定的關鍵角色");
//           suggestions.push("🔍 分享質量控制心得，建立最佳實務範例");
//         } else if (value >= 85) {
//           suggestions.push("🎯 針對偶發性質量問題建立檢核清單");
//           suggestions.push("📈 定期檢視質量數據，找出改善機會點");
//         } else if (value >= 70) {
//           suggestions.push("🔧 建議加強作業前檢查，確認設備狀況");
//           suggestions.push("📖 參與質量管理系統培訓，了解標準作業程序");
//         } else {
//           suggestions.push("⚠️ 緊急改善質量控制流程，避免持續性缺陷");
//           suggestions.push("👨‍🏫 安排一對一質量指導，重新學習作業標準");
//         }
//         break;
        
//       case "workHours":
//         if (value >= 90) {
//           suggestions.push("⚡ 工時效率優異！可研究自動化改善方案");
//           suggestions.push("🎓 分享效率提升經驗，幫助團隊整體進步");
//         } else if (value >= 80) {
//           suggestions.push("🔄 檢視重複性作業，尋找標準化機會");
//           suggestions.push("💡 學習使用更有效的工具或方法");
//         } else if (value >= 70) {
//           suggestions.push("📊 記錄每日工時分配，找出時間浪費點");
//           suggestions.push("🎯 設定每小時產能目標，逐步提升效率");
//         } else {
//           suggestions.push("🔴 檢查是否存在技能缺口或設備問題");
//           suggestions.push("📞 立即尋求技術支援，解決效率瓶頸");
//         }
//         break;
        
//       case "attendance":
//         if (value >= 98) {
//           suggestions.push("🌟 全勤表現優秀！展現了高度的工作責任感");
//           suggestions.push("👥 可擔任團隊出勤模範，鼓勵其他同仁");
//         } else if (value >= 90) {
//           suggestions.push("📅 維持穩定出勤習慣，避免非必要請假");
//           suggestions.push("🏃‍♂️ 注意身體健康，預防因病缺勤");
//         } else if (value >= 80) {
//           suggestions.push("⏰ 檢討請假原因，建立更好的時間管理");
//           suggestions.push("🚗 如有通勤問題，考慮調整交通方式");
//         } else {
//           suggestions.push("🚨 出勤率需要立即改善，與HR討論具體問題");
//           suggestions.push("📋 建立個人出勤改善計劃，設定月度目標");
//         }
//         break;
        
//       case "machineStatus":
//         if (value >= 95) {
//           suggestions.push("🤖 機台操作技能純熟！可指導新手操作技巧");
//           suggestions.push("🔧 參與設備改善專案，提升整體稼動率");
//         } else if (value >= 85) {
//           suggestions.push("📋 建立機台檢查清單，減少停機時間");
//           suggestions.push("🎯 學習預防性維護技巧，提升設備效率");
//         } else if (value >= 70) {
//           suggestions.push("📚 加強機台操作培訓，熟悉設備特性");
//           suggestions.push("⚡ 學習快速故障排除方法，減少待機時間");
//         } else {
//           suggestions.push("🔴 機台稼動率過低，需要緊急技術支援");
//           suggestions.push("👨‍🔧 安排資深技師一對一指導操作技巧");
//         }
//         break;
        
//       case "maintenance":
//         if (value >= 90) {
//           suggestions.push("🛠️ 維護表現傑出！可擔任維護團隊領導角色");
//           suggestions.push("📖 編寫維護最佳實務手冊，傳承經驗");
//         } else if (value >= 80) {
//           suggestions.push("🔍 建立設備異常早期預警系統");
//           suggestions.push("📅 規劃更完善的預防性維護計劃");
//         } else if (value >= 70) {
//           suggestions.push("📊 記錄設備異常模式，建立維護資料庫");
//           suggestions.push("🎓 參加設備維護進階課程，提升技能");
//         } else {
//           suggestions.push("⚠️ 維護能力需要大幅改善，避免設備損害");
//           suggestions.push("👨‍🏫 安排維護專家指導，重新學習維護程序");
//         }
//         break;
        
//       case "targetAchievement":
//         if (value >= 95) {
//           suggestions.push("🎯 目標達成優異！可參與更有挑戰性的專案");
//           suggestions.push("📈 分享目標管理方法，提升團隊整體表現");
//         } else if (value >= 85) {
//           suggestions.push("🔄 檢視目標設定方式，確保合理且可達成");
//           suggestions.push("📊 運用數據分析工具，掌握進度狀況");
//         } else if (value >= 70) {
//           suggestions.push("📅 將大目標分解為小階段，逐步達成");
//           suggestions.push("🤝 主動與主管溝通，尋求目標達成支援");
//         } else {
//           suggestions.push("🚨 目標達成率過低，需要重新評估能力與資源");
//           suggestions.push("🎯 設定更實際的短期目標，重建信心");
//         }
//         break;
        
//       case "kpi":
//         if (value >= 90) {
//           suggestions.push("📊 KPI表現卓越！可協助制定部門績效標準");
//           suggestions.push("🏆 分享績效管理心得，成為標竿學習對象");
//         } else if (value >= 80) {
//           suggestions.push("🎯 分析各項KPI權重，專注改善關鍵指標");
//           suggestions.push("📈 建立個人績效追蹤儀表板");
//         } else if (value >= 70) {
//           suggestions.push("📚 學習績效改善方法論，系統性提升表現");
//           suggestions.push("🤝 與績效優異同事組成學習小組");
//         } else {
//           suggestions.push("🔴 KPI表現需要全面改善，制定緊急行動計劃");
//           suggestions.push("👨‍💼 與主管密切配合，定期檢討改善進度");
//         }
//         break;
        
//       case "efficiency":
//         if (value >= 90) {
//           suggestions.push("⚡ 效率表現優異！可研究作業流程優化方案");
//           suggestions.push("🎓 開發效率提升工具，造福整個團隊");
//         } else if (value >= 80) {
//           suggestions.push("🔄 運用精實生產原理，消除浪費環節");
//           suggestions.push("📊 分析工作瓶頸，找出效率改善機會");
//         } else if (value >= 70) {
//           suggestions.push("⏱️ 學習時間動作研究，優化作業方法");
//           suggestions.push("🛠️ 熟悉更多工具使用技巧，提升作業速度");
//         } else {
//           suggestions.push("🚨 效率表現急需改善，檢查是否有技能或工具問題");
//           suggestions.push("📚 參加效率改善培訓，學習基本作業方法");
//         }
//         break;
        
//       default:
//         suggestions.push("📈 持續關注這項指標的表現趨勢");
//         suggestions.push("🎯 設定明確的改善目標和時程");
//     }
    
//     return suggestions;
//   };

//   /**
//    * 根據分數範圍提供通用建議
//    */
//   const getGeneralSuggestions = (value, metricTitle) => {
//     const suggestions = [];
    
//     if (value === 100) {
//       suggestions.push("🌟 已達到滿分表現，考慮挑戰更高層次的目標");
//       suggestions.push("🎯 制定創新改善方案，為團隊帶來突破性進展");
//     } else if (value >= 95) {
//       suggestions.push("💎 表現接近完美，注意維持穩定的高水準");
//       suggestions.push("🚀 可嘗試跨領域學習，擴展專業技能範圍");
//     } else if (value >= 90) {
//       suggestions.push("🎉 表現優秀，距離頂尖只差一步之遙");
//       suggestions.push("🔍 細部檢視流程，找出最後的改善空間");
//     } else if (value >= 80) {
//       suggestions.push("📈 穩健的表現，持續努力可達到優秀水準");
//       suggestions.push("🎓 投資學習新技能，為下一階段成長做準備");
//     } else if (value >= 70) {
//       suggestions.push("⚡ 表現有改善空間，專注於關鍵能力提升");
//       suggestions.push("🤝 主動尋求指導和回饋，加速改善進程");
//     } else if (value >= 60) {
//       suggestions.push("🎯 制定具體的改善計劃，設定可達成的里程碑");
//       suggestions.push("📚 參與相關培訓課程，強化基礎技能");
//     } else {
//       suggestions.push("🚨 需要立即採取改善行動，尋求專業協助");
//       suggestions.push("🛠️ 檢討基本作業方法，重新建立正確習慣");
//     }
    
//     return suggestions;
//   };

//   return (
//     <>
//       <div
//         onClick={() => setIsModalOpen(true)}
//         className="bg-slate-700/50 p-4 rounded-xl cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl backdrop-blur-sm hover:bg-slate-700/60 group"
//       >
//         <div className="flex justify-between items-start">
//           <div>
//             <div className="flex items-center gap-2 mb-2">
//               <span className={`${metric.color} animate-glow`}>
//                 {metric.icon}
//               </span>
//               <h3
//                 className={`text-lg font-semibold ${metric.color} animate-glow`}
//               >
//                 {metric.title}
//               </h3>
//             </div>
//             <div className="flex flex-col gap-1 mb-1">
//               <p className={`text-3xl font-bold ${metric.color} animate-glow`}>
//                 {value === 'N/A' ? 'N/A' : `${value}${metric.unit}`}
//               </p>
//               {/* {metric.description && (
//                 <p className="text-xs text-slate-400">
//                   {metric.description(data)}
//                 </p>
//               )} */}
//             </div>
//             {/* 等級標示 */}
//             <div className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${getGradeBadgeColor(scoreData.grade)} animate-glow`}>
//               {scoreData.grade}級
//             </div>
//           </div>
//           <div className="trend-indicator flex flex-col items-end gap-1">
//             {value > metric.target ? (
//               <ReactFeatherTrendingUp className="text-green-400 animate-glow" />
//             ) : (
//               <ReactFeatherTrendingDown className="text-red-400 animate-glow" />
//             )}
//             <span className="text-xs text-slate-400">{scoreData.gradeDescription}</span>
//           </div>
//         </div>
//         <div className="mt-4">
//           <ProgressBar value={value} color={metric.color} />
//           <div className="flex justify-between items-center mt-1">
//             <p className={`text-sm ${metric.color}`}>
//               目標: {metric.target}%
//             </p>
//             <p className="text-sm text-slate-400">
//               滿分: 100%
//             </p>
//           </div>
//         </div>
//       </div>

//       {/* Modal Content */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
//           <div className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
//             {/* Modal Header */}
//             <div className="p-4 border-b border-slate-600 flex justify-between items-center sticky top-0 bg-slate-800 z-10">
//               <div className="flex items-center gap-2">
//                 <span className={metric.color}>{metric.icon}</span>
//                 <h3 className="text-xl font-bold text-white">
//                   {metric.title}詳細資訊
//                 </h3>
//               </div>
//               <button
//                 onClick={() => setIsModalOpen(false)}
//                 className="text-slate-400 hover:text-white transition-colors"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>

//             <div
//               className="overflow-y-auto p-4 space-y-6"
//               style={{
//                 maxHeight: "calc(80vh - 60px)",
//                 scrollbarWidth: "thin",
//                 scrollbarColor: "#475569 #1e293b",
//               }}
//             >
//               {/* 當前績效表現 */}
//               <div className="grid grid-cols-3 gap-4">
//                 <div className="bg-slate-700 p-4 rounded-lg text-center">
//                   <p className="text-slate-300 mb-1">百分比表現</p>
//                   <p className={`text-3xl font-bold ${metric.color}`}>
//                     {value}%
//                   </p>
//                 </div>
//                 <div className="bg-slate-700 p-4 rounded-lg text-center">
//                   <p className="text-slate-300 mb-1">得分計算表積分</p>
//                   <p className="text-3xl font-bold text-orange-400">
//                     {scoreData.score}分
//                   </p>
//                 </div>
//                 <div className="bg-slate-700 p-4 rounded-lg text-center">
//                   <p className="text-slate-300 mb-1">評等級別</p>
//                   <div className={`inline-block px-3 py-1 rounded-full text-lg font-bold ${getGradeBadgeColor(scoreData.grade)}`}>
//                     {scoreData.grade}級
//                   </div>
//                 </div>
//               </div>
              
//               {/* 目標與升級資訊 */}
//               <div className="grid grid-cols-2 gap-4">
//                 <div className="bg-slate-700 p-4 rounded-lg">
//                   <p className="text-slate-300 mb-2">目標設定</p>
//                   <div className="space-y-1">
//                     <p className="text-white">目標百分比: {metric.target}%</p>
//                     <p className="text-white">目標積分: {metric.target}分以上</p>
//                   </div>
//                 </div>
//                 <div className="bg-slate-700 p-4 rounded-lg">
//                   <p className="text-slate-300 mb-2">升級條件</p>
//                   <div className="space-y-1">
//                     {performanceAnalysis.upgrade.isMaxGrade ? (
//                       <p className="text-green-400 font-medium">{performanceAnalysis.upgrade.message}</p>
//                     ) : (
//                       <>
//                         <p className="text-white">距離{performanceAnalysis.upgrade.nextGrade}級還需: {performanceAnalysis.upgrade.scoreNeeded}分</p>
//                         <p className="text-orange-400 text-sm">{performanceAnalysis.upgrade.upgradeMessage}</p>
//                       </>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* 計算方式說明 */}
//               <div className="space-y-2">
//                 <h4 className="text-lg font-semibold text-white">
//                   數據來源與計算依據
//                 </h4>
//                 <div className="bg-slate-700 rounded-lg p-4 space-y-3">
//                   <div className="space-y-2">
//                     <h5 className="text-white font-medium">資料來源：</h5>
//                     <div className="bg-slate-600/50 rounded p-3 text-sm text-slate-300">
//                       {scoreExplanation.baseScoreExplanation}
//                       <div className="text-slate-400 mt-1">
//                         {scoreExplanation.calculationMethod}
//                       </div>
//                     </div>
//                   </div>
//                   <div className="space-y-2">
//                     <h5 className="text-white font-medium">計算公式：</h5>
//                     <div className="bg-slate-600/50 rounded p-3 text-sm">
//                       <div className="text-slate-300 font-mono">
//                         {getCalculationFormula(metric.id, value)}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* 得分計算表整合說明 */}
//               <div className="space-y-2">
//                 <h4 className="text-lg font-semibold text-white">
//                   得分計算表整合說明
//                 </h4>
//                 <div className="bg-slate-700 rounded-lg p-4 space-y-4">
//                   {/* 分數區間說明 */}
//                   <div className="space-y-2">
//                     <h5 className="text-white font-medium">分數區間：</h5>
//                     <div className="bg-slate-600/50 rounded p-3">
//                       <div className="flex justify-between text-slate-300">
//                         <span>當前分數區間</span>
//                         <span>{scoreData.range}</span>
//                       </div>
//                       <div className="flex justify-between text-slate-300 mt-1">
//                         <span>對應等級</span>
//                         <span>{scoreData.grade}級 - {scoreData.gradeDescription}</span>
//                       </div>
//                     </div>
//                   </div>

//                   {/* 獎懲機制說明 */}
//                   <div className="space-y-2">
//                     <h5 className="text-white font-medium">獎懲機制：</h5>
//                     <div className="bg-slate-600/50 rounded p-3">
//                       <div className="flex justify-between text-slate-300">
//                         <span>基礎得分</span>
//                         <span>{performanceAnalysis.bonus.baseScore}分</span>
//                       </div>
//                       {performanceAnalysis.bonus.bonusReasons.length > 0 ? (
//                         performanceAnalysis.bonus.bonusReasons.map((reason, index) => (
//                           <div key={index} className="flex justify-between text-green-400 text-sm">
//                             <span>{reason}</span>
//                           </div>
//                         ))
//                       ) : (
//                         <div className="text-slate-400 text-sm">無額外加分項目</div>
//                       )}
//                       <div className="flex justify-between text-white font-semibold pt-2 border-t border-slate-500 mt-2">
//                         <span>最終得分</span>
//                         <span>{performanceAnalysis.bonus.finalScore}分</span>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               {/* 詳細評分依據 */}
//               <div className="space-y-2">
//                 <h4 className="text-lg font-semibold text-white">
//                   詳細評分依據
//                 </h4>
//                 <div className="bg-slate-700 rounded-lg p-4 space-y-3">
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
//                     <div className="bg-slate-600/50 rounded p-3">
//                       <h6 className="text-green-400 font-medium mb-2">A級標準（90-100分）</h6>
//                       <p className="text-sm text-slate-300">90%以上 → 優秀表現</p>
//                     </div>
//                     <div className="bg-slate-600/50 rounded p-3">
//                       <h6 className="text-blue-400 font-medium mb-2">B級標準（80-89分）</h6>
//                       <p className="text-sm text-slate-300">80-89% → 良好表現</p>
//                     </div>
//                     <div className="bg-slate-600/50 rounded p-3">
//                       <h6 className="text-yellow-400 font-medium mb-2">C級標準（70-79分）</h6>
//                       <p className="text-sm text-slate-300">70-79% → 待改進表現</p>
//                     </div>
//                     <div className="bg-slate-600/50 rounded p-3">
//                       <h6 className="text-orange-400 font-medium mb-2">D級以下（60分以下）</h6>
//                       <p className="text-sm text-slate-300">60%以下 → 需加強表現</p>
//                     </div>
//                   </div>
//                   <div className="bg-slate-600/50 rounded p-3 mt-3">
//                     <h6 className="text-white font-medium mb-2">目前狀態分析：</h6>
//                     <p className="text-slate-300 text-sm">
//                       位於{scoreData.grade}級區間（{scoreData.range}），{scoreData.gradeDescription}
//                       {!performanceAnalysis.upgrade.isMaxGrade && 
//                         `，${performanceAnalysis.upgrade.upgradeMessage}`
//                       }
//                     </p>
//                   </div>
//                 </div>
//               </div>

//               {/* 修改後的歷史趨勢 */}
//               <div className="space-y-2">
//                 <h4 className="text-lg font-semibold text-white">歷史趨勢</h4>
//                 <div className="bg-slate-700 p-4 rounded-lg h-64">
//                   <ResponsiveContainer width="100%" height="100%">
//                     <LineChart data={getRecentMonthsData()}>
//                       <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
//                       <XAxis dataKey="month" stroke="#9CA3AF" />
//                       <YAxis stroke="#9CA3AF" domain={[0, 100]} />
//                       <Tooltip
//                         contentStyle={{
//                           backgroundColor: "#1F2937",
//                           border: "none",
//                           borderRadius: "0.5rem",
//                           color: "#ffffff", // 添加文字顏色
//                         }}
//                       />
//                       <Legend />
//                       <Line
//                         type="monotone"
//                         dataKey={
//                           metric.id === "workCompletion" ? "completion" :
//                           metric.id === "quality" ? "quality" :
//                           metric.id === "workHours" ? "workHours" :
//                           metric.id === "attendance" ? "attendance" :
//                           metric.id === "machineStatus" ? "machineStatus" :
//                           metric.id === "maintenance" ? "maintenance" :
//                           metric.id === "targetAchievement" ? "targetAchievement" :
//                           metric.id === "kpi" ? "kpi" :
//                           "efficiency"
//                         }
//                         name={getMetricStyle(metric.id).name}
//                         stroke={getMetricStyle(metric.id).color}
//                         strokeWidth={2}
//                         dot={{
//                           fill: "#fff",
//                           stroke: getMetricStyle(metric.id).color,
//                           strokeWidth: 2,
//                         }}
//                       />
//                     </LineChart>
//                   </ResponsiveContainer>
//                 </div>
//               </div>

//               {/* 改進建議 */}
//               <div className="space-y-2">
//                 <div className="flex items-center justify-between mb-4">
//                   <h4 className="text-lg font-semibold text-white">改進建議</h4>

//                   {/* 新增：等級說明按鈕 */}
//                   <button
//                     className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm"
//                     onClick={() => setShowLevelGuide(true)}
//                   >
//                     <Info className="w-4 h-4" />
//                     等級說明
//                   </button>
//                 </div>

//                 <div
//                   className={`bg-slate-700 p-4 rounded-lg border-l-4 ${
//                     scoreData.grade === 'A'
//                       ? "border-green-500"
//                       : scoreData.grade === 'B'
//                         ? "border-blue-500"
//                         : scoreData.grade === 'C'
//                           ? "border-yellow-500"
//                           : scoreData.grade === 'D'
//                             ? "border-orange-500"
//                             : "border-red-500"
//                   }`}
//                 >
//                   {/* 等級與表現標籤 */}
//                   <div className="mb-3 flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                       <div
//                         className={`w-3 h-3 rounded-full ${
//                           scoreData.grade === 'A'
//                             ? "bg-green-500"
//                             : scoreData.grade === 'B'
//                               ? "bg-blue-500"
//                               : scoreData.grade === 'C'
//                                 ? "bg-yellow-500"
//                                 : scoreData.grade === 'D'
//                                   ? "bg-orange-500"
//                                   : "bg-red-500"
//                         }`}
//                       ></div>
//                       <span className="text-sm text-slate-300">
//                         {scoreData.gradeDescription}
//                       </span>
//                     </div>
//                     <div className={`px-2 py-1 rounded text-xs font-medium ${getGradeBadgeColor(scoreData.grade)}`}>
//                       {scoreData.grade}級 · {scoreData.score}分
//                     </div>
//                   </div>

//                   {/* 短期目標 */}
//                   {!performanceAnalysis.upgrade.isMaxGrade && (
//                     <div className="mb-4 p-3 bg-slate-600/50 rounded">
//                       <h6 className="text-orange-400 font-medium mb-2">短期目標：</h6>
//                       <p className="text-sm text-slate-300 mb-1">
//                         1個月內提升至{performanceAnalysis.upgrade.nextGrade}級（{performanceAnalysis.upgrade.nextGradeTarget}分以上）
//                       </p>
//                       <p className="text-xs text-slate-400">
//                         需要提升: {performanceAnalysis.upgrade.scoreNeeded}分（對應{performanceAnalysis.upgrade.percentageNeeded}%）
//                       </p>
//                     </div>
//                   )}

//                   {/* 具體建議 */}
//                   <div className="space-y-3">
//                     <h6 className="text-white font-medium">具體行動建議：</h6>
//                     <ul className="space-y-2">
//                       {getSuggestions(value, metric).map((suggestion, index) => (
//                         <li
//                           key={index}
//                           className="text-slate-300 flex items-start gap-2"
//                         >
//                           <span className="text-slate-400 mt-1">•</span>
//                           <span>{suggestion}</span>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* 新增：等級說明彈窗 */}
//       {showLevelGuide && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold text-white">績效等級說明</h3>
//               <button
//                 onClick={() => setShowLevelGuide(false)}
//                 className="text-slate-400 hover:text-white transition-colors"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div className="flex items-center gap-3">
//                 <div className="w-4 h-4 rounded-full bg-green-500"></div>
//                 <div>
//                   <p className="text-white font-medium">優異表現 (90分以上)</p>
//                   <p className="text-sm text-slate-400">
//                     表現卓越，可作為標竿學習對象
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-center gap-3">
//                 <div className="w-4 h-4 rounded-full bg-blue-500"></div>
//                 <div>
//                   <p className="text-white font-medium">良好表現 (80-89分)</p>
//                   <p className="text-sm text-slate-400">
//                     表現良好，仍有進步空間
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-center gap-3">
//                 <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
//                 <div>
//                   <p className="text-white font-medium">待加強 (70-79分)</p>
//                   <p className="text-sm text-slate-400">
//                     需要適度改善，建議尋求協助
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-center gap-3">
//                 <div className="w-4 h-4 rounded-full bg-orange-500"></div>
//                 <div>
//                   <p className="text-white font-medium">需要改進 (60-69分)</p>
//                   <p className="text-sm text-slate-400">
//                     表現不佳，需要重點關注
//                   </p>
//                 </div>
//               </div>

//               <div className="flex items-center gap-3">
//                 <div className="w-4 h-4 rounded-full bg-red-500"></div>
//                 <div>
//                   <p className="text-white font-medium">急需協助 (60分以下)</p>
//                   <p className="text-sm text-slate-400">
//                     表現不足，需要立即介入輔導
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>
//   );
// };

// // 註：getScoreBreakdown 函數已移至 src/utils/scoreCalculations.js 
// // 以避免重複邏輯，提升程式碼維護性



// /**
//  * 組件：評分詳情展示
//  * 顯示員工的總體評分和公平性指標
//  */
// export const ScoreDetails = ({ employeeData, role }) => {
//   const totalScore = calculateTotalScore(employeeData, role);
//   const fairnessIndex = calculateFairnessIndex([totalScore]);

//   return (
//     <div className="bg-slate-700 rounded-xl p-6 text-white">
//       <h3 className="text-xl font-bold mb-4">評分詳情</h3>
//       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//         <div className="space-y-2">
//           <div className="flex justify-between items-center">
//             <span>目標達成率</span>
//             <span className="font-semibold">
//               {employeeData.workCompletion}%
//             </span>
//           </div>
//           <div className="flex justify-between items-center">
//             <span>產品質量</span>
//             <span className="font-semibold">
//               {employeeData.productQuality}%
//             </span>
//           </div>
//           <div className="flex justify-between items-center">
//             <span>工作時間</span>
//             <span className="font-semibold">{employeeData.workHours}小時</span>
//           </div>
//         </div>
//         <div className="space-y-2">
//           <div className="flex justify-between items-center">
//             <span>機台狀態</span>
//             <span className="font-semibold">{employeeData.machineStatus}%</span>
//           </div>
//           <div className="flex justify-between items-center">
//             <span>總分</span>
//             <span className="font-semibold text-lg">
//               {totalScore.toFixed(1)}
//             </span>
//           </div>
//           <div className="flex justify-between items-center">
//             <span>公平性指標</span>
//             <span
//               className={`font-semibold ${
//                 fairnessIndex >= 85 ? "text-green-400" : "text-red-400"
//               }`}
//             >
//               {fairnessIndex.toFixed(1)}%
//             </span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// /**
//  * 主要組件：績效儀表板
//  * 整合所有子組件和功能的主容器
//  */
// export default function PerformanceDashboard() {
//   const [activeTab, setActiveTab] = useState("dashboard");
//   const [selectedEmployee, setSelectedEmployee] = useState(""); // 初始狀態為空
//   const [isLoading, setIsLoading] = useState(false);
//   const [showUserMenu, setShowUserMenu] = useState(false);
//   const [selectedYear, setSelectedYear] = useState(2025); // 年份選擇狀態，默認2025年
//   const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 月份選擇狀態
//   const [selectedDay, setSelectedDay] = useState(1); // 日期選擇狀態
//   const [viewMode, setViewMode] = useState("monthly"); // 檢視方式狀態
//   const [showPointsManagement, setShowPointsManagement] = useState(false); // 積分管理系統狀態
//   const navigate = useNavigate();


//   // 修改 employeeData 的初始狀態，確保所有指標都有數據
//   const [employeeData, setEmployeeData] = useState({
//     workCompletion: 85, // 工作完成量
//     productQuality: 92, // 產品質量
//     workHours: 88, // 工作時間
//     attendance: 95, // 差勤紀錄
//     machineStatus: 87, // 機台運行狀態
//     maintenanceRecord: 90, // 機台維護紀錄
//     targetAchievement: 86, // 目標達成率
//     kpi: 89, // 關鍵績效指標
//     efficiency: 91, // 效率指標
//     historicalData: [
//       { month: "1月", value: 85 },
//       { month: "2月", value: 87 },
//       { month: "3月", value: 89 },
//       { month: "4月", value: 86 },
//       { month: "5月", value: 88 },
//       { month: "6月", value: 90 },
//       { month: "7月", value: 91 },
//       { month: "8月", value: 89 },
//       { month: "9月", value: 92 },
//       { month: "10月", value: 93 },
//       { month: "11月", value: 91 },
//       { month: "12月", value: 94 },
//     ],
//   });

//   /**
//    * 配置數據區域
//    */

//   // 根據選擇的年份和員工動態生成時間序列數據
//   const getTimeSeriesData = () => {
//     const data = mockEmployeeData[selectedEmployee];
//     const currentDate = new Date();
//     const currentYear = currentDate.getFullYear();
//     const currentMonth = currentDate.getMonth() + 1; // getMonth()返回0-11，需要+1
    
//     if (!data || !data.yearlyData || !data.yearlyData[selectedYear]) {
//       // 如果沒有對應年份數據，使用預設數據
//       return [
//         { month: "1月", completion: 60, quality: 65, efficiency: 62 },
//         { month: "2月", completion: 62, quality: 67, efficiency: 64 },
//         { month: "3月", completion: 65, quality: 70, efficiency: 67 },
//         { month: "4月", completion: 68, quality: 72, efficiency: 70 },
//         { month: "5月", completion: 70, quality: 75, efficiency: 72 },
//         { month: "6月", completion: 72, quality: 77, efficiency: 75 },
//         { month: "7月", completion: 75, quality: 80, efficiency: 77 },
//         { month: "8月", completion: 77, quality: 82, efficiency: 80 },
//         { month: "9月", completion: 80, quality: 85, efficiency: 82 },
//         { month: "10月", completion: 82, quality: 87, efficiency: 85 },
//         { month: "11月", completion: 85, quality: 90, efficiency: 87 },
//         { month: "12月", completion: 87, quality: 92, efficiency: 90 },
//       ];
//     }
    
//     let yearData = [...data.yearlyData[selectedYear]];
    
//     // 如果選中的是當前年份，需要根據當前月份動態處理數據
//     if (selectedYear === currentYear) {
//       // 如果當前月份超過已有數據的月份，動態生成新的月份數據
//       const monthNames = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
//       const existingMonthsCount = yearData.length;
      
//       // 如果當前月份超過已有數據，生成缺失的月份數據
//       if (currentMonth > existingMonthsCount) {
//         const lastDataPoint = yearData[yearData.length - 1];
        
//         // 為每個缺失的月份生成數據
//         for (let month = existingMonthsCount + 1; month <= currentMonth; month++) {
//           // 基於最後一個數據點生成新數據，加入一些變化
//           const variation = () => Math.round((Math.random() - 0.5) * 4); // ±2的變化
          
//           const newDataPoint = {
//             month: monthNames[month - 1],
//             completion: Math.max(0, Math.min(100, lastDataPoint.completion + variation())),
//             quality: Math.max(0, Math.min(100, lastDataPoint.quality + variation())),
//             efficiency: Math.max(0, Math.min(100, lastDataPoint.efficiency + variation()))
//           };
          
//           yearData.push(newDataPoint);
//         }
//       } else {
//         // 如果當前月份小於等於已有數據，只顯示到當前月份
//         yearData = yearData.slice(0, currentMonth);
//       }
//     }
    
//     return yearData;
//   };

//   const timeSeriesData = getTimeSeriesData();

//   // 可選年份列表狀態
//   const [availableYears, setAvailableYears] = useState([]);

//   // 獲取可用年份列表
//   const loadAvailableYears = async () => {
//     try {
//       console.log('開始獲取可用年份列表');
//       const response = await fetch(`${REPORT_API.BASE_URL}/AREditior/GetAvailableYears`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error('獲取年份列表失敗');
//       }

//       const data = await response.json();
      
//       if (data.code === "0000" && Array.isArray(data.result)) {
//         // 確保年份是數字並排序
//         const years = data.result
//           .map(year => parseInt(year))
//           .filter(year => !isNaN(year))
//           .sort((a, b) => b - a); // 降序排列，最新年份在前

//         console.log('獲取到的年份列表:', years);
        
//         if (years.length > 0) {
//           setAvailableYears(years);
//           // 如果當前選擇的年份不在列表中，設置為最新的年份
//           if (!years.includes(selectedYear)) {
//             setSelectedYear(years[0]);
//           }
//         } else {
//           // 如果沒有獲取到年份，使用當前年份作為預設
//           const currentYear = new Date().getFullYear();
//           setAvailableYears([currentYear]);
//           setSelectedYear(currentYear);
//         }
//       } else {
//         console.error('年份數據格式錯誤:', data);
//         // 使用當前年份作為預設
//         const currentYear = new Date().getFullYear();
//         setAvailableYears([currentYear]);
//         setSelectedYear(currentYear);
//       }
//     } catch (error) {
//       console.error('獲取年份列表失敗:', error);
//       // 發生錯誤時使用當前年份作為預設
//       const currentYear = new Date().getFullYear();
//       setAvailableYears([currentYear]);
//       setSelectedYear(currentYear);
//     }
//   };

//   /**
//    * 指標配置區域
//    * 定義所有績效指標的計算規則和展示方式
//    */
//   const metrics = [
//     {
//       id: "workCompletion",
//       title: "工作完成量",
//       value: (data) => data?.completion_Rate ? Number((data.completion_Rate * 100).toFixed(2)) : 0,
//       unit: "%",
//       description: (data) => `(completion_Rate: ${data?.completion_Rate?.toFixed(2) || 'N/A'})`,
//       icon: <Activity className="w-6 h-6" />,
//       color: "text-blue-500",
//       target: 95,
//       weight: 0.125,
//     },
//     {
//       id: "quality",
//       title: "產品質量",
//       value: (data) => data?.yield_Percent ? Number(data.yield_Percent.toFixed(2)) : 0,
//       unit: "%",
//       description: (data) => `(yield_Percent: ${data?.yield_Percent?.toFixed(2) || 'N/A'})`,
//       icon: <Target className="w-6 h-6" />,
//       color: "text-green-500",
//       target: 98,
//       weight: 0.125,
//     },
//     {
//       id: "workHours",
//       title: "工作時間",
//       value: (data) => data?.total_Hours || 0,
//       unit: "小時",
//       description: (data) => `(total_Hours: ${data?.total_Hours?.toFixed(2) || 'N/A'})`,
//       icon: <Clock className="w-6 h-6" />,
//       color: "text-orange-400",
//       target: 95,
//       weight: 0.125,
//     },
//     {
//       id: "attendance",
//       title: "差勤紀錄",
//       value: (data) => {
//         // 如果沒有數據，顯示 N/A
//         if (!data || data.attendance === undefined || data.attendance === null) {
//           return 'N/A';
//         }
//         return data.attendance;
//       },
//       unit: "%",
//       description: (data) => {
//         if (!data || data.attendance === undefined || data.attendance === null) {
//           return '(attendance: 無數據)';
//         }
//         return `(attendance: ${data.attendance})`;
//       },
//       icon: <Calendar className="w-6 h-6" />,
//       color: "text-pink-400",
//       target: 95,
//       weight: 0.125,
//     },
//     {
//       id: "machineStatus",
//       title: "機台運行狀態",
//       value: (data) => data?.machine_Run_Hours || 0,
//       unit: "小時",
//       description: (data) => `(machine_Run_Hours: ${data?.machine_Run_Hours?.toFixed(2) || 'N/A'})`,
//       icon: <Settings className="w-6 h-6" />,
//       color: "text-cyan-400",
//       target: 90,
//       weight: 0.125,
//     },
//     {
//       id: "maintenance",
//       title: "機台維護紀錄",
//       value: (data) => data?.maintenance_Count || 0,
//       unit: "次",
//       description: (data) => `(maintenance_Count: ${data?.maintenance_Count || 'N/A'})`,
//       icon: <Wrench className="w-6 h-6" />,
//       color: "text-purple-400",
//       target: 90,
//       weight: 0.125,
//     },
//     {
//       id: "targetAchievement",
//       title: "目標達成率",
//       value: (data) => data?.otd_Rate ? Number((data.otd_Rate * 100).toFixed(2)) : 0,
//       unit: "%",
//       description: (data) => `(otd_Rate: ${data?.otd_Rate?.toFixed(2) || 'N/A'})`,
//       icon: <Target className="w-6 h-6" />,
//       color: "text-red-400",
//       target: 90,
//       weight: 0.125,
//     },
//     {
//       id: "kpi",
//       title: "關鍵績效指標",
//       value: (data) => data?.kpi_Percent ? Number(data.kpi_Percent.toFixed(2)) : 0,
//       unit: "%",
//       description: (data) => `(kpi_Percent: ${data?.kpi_Percent?.toFixed(2) || 'N/A'})`,
//       icon: <BarChart className="w-6 h-6" />,
//       color: "text-yellow-400",
//       target: 85,
//       weight: 0.125,
//     },
//     {
//       id: "efficiency",
//       title: "效率指標",
//       value: (data) => data?.units_Per_Hour ? Number((data.units_Per_Hour).toFixed(2)) : 0,
//       unit: "%",
//       description: (data) => `(units_Per_Hour: ${data?.units_Per_Hour?.toFixed(2) || 'N/A'})`,
//       icon: <Zap className="w-6 h-6" />,
//       color: "text-lime-400",
//       target: 85,
//       weight: 0.125,
//     },
//   ];

//   /**
//    * 員工等級計算區域 
//    * 在metrics定義之後計算員工等級
//    */
//   // 動態計算員工等級
//   const calculateEmployeeGrade = (employeeId) => {
//     const data = mockEmployeeData[employeeId];
//     if (!data) return 'E';
    
//     const grades = [];
//     metrics.forEach(metric => {
//       const value = metric.value(data);
//       const grade = getGradeFromScore(value);
//       grades.push(grade);
//     });
    
//     // 統計各等級數量
//     const gradeCount = { A: 0, B: 0, C: 0, D: 0, E: 0 };
//     grades.forEach(grade => gradeCount[grade]++);
    
//     // 找出最多的等級作為主要等級
//     const maxCount = Math.max(...Object.values(gradeCount));
//     const dominantGrade = Object.keys(gradeCount).find(grade => gradeCount[grade] === maxCount);
    
//     return dominantGrade;
//   };

//   const getGradeDescription = (grade) => {
//     const descriptions = {
//       'A': '優秀',
//       'B': '良好', 
//       'C': '待改進',
//       'D': '需加強',
//       'E': '急需協助'
//     };
//     return descriptions[grade] || '未知';
//   };

//   // 使用state來存儲員工列表
//   const [employees, setEmployees] = useState([]);
  
//   // 添加 debug 日誌
//   const debugLog = (message, data) => {
//     console.log(`[Debug] ${message}:`, data);
//   };

//   // 獲取員工列表
//   // 初始化時加載年份列表
//   useEffect(() => {
//     loadAvailableYears();
//   }, []);

//   useEffect(() => {
//     const loadEmployees = async () => {
//       try {
//         debugLog('開始獲取員工列表', null);
//         console.log('正在獲取員工列表...');
//         const response = await fetch(`${REPORT_API.BASE_URL}/AREditior/GetAllUserinfoByFilter`, {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             'Accept': 'application/json'
//           },
//           body: JSON.stringify({
//             Keyword: "",
//             Year: selectedYear.toString(),
//             Month: selectedMonth.toString().padStart(2, '0')
//           })
//         });

//         if (!response.ok) {
//           throw new Error('獲取員工列表失敗');
//         }

//         const data = await response.json();
//          // 檢查API回應格式
//         if (!data || !data.result || !Array.isArray(data.result)) {
//           console.error('API回應格式錯誤:', data);
//           throw new Error('API回應格式錯誤');
//         }

//         console.log('API回傳的員工數據:', data.result);
        
//         // 過濾並整理員工數據
//         const uniqueEmployees = data.result
//           .filter(emp => emp.user_name && emp.role_name) // 確保有名稱和職位
//           .map(emp => ({
//             id: emp.user_name,
//             name: emp.user_name,
//             employee_name: emp.user_name,
//             department: '技術部', // 預設部門
//             role: emp.role_name,
//             grade: 'A',
//             displayName: `${emp.user_name} (技術部 - ${emp.role_name})`
//           }));

//         console.log('處理後的員工列表:', uniqueEmployees);
//         setEmployees(uniqueEmployees.sort((a, b) => a.grade.localeCompare(b.grade)));
//       } catch (error) {
//         console.error('獲取員工列表失敗:', error);
//         // 使用預設的員工列表作為後備
//         setEmployees([
//           { 
//             id: "張技師", 
//             name: "張技師",
//             employee_name: "張技師",
//             department: "技術部",
//             role: "技術員",
//             grade: "A",
//             get displayName() { 
//               return `${this.name} (${this.department} - ${this.role})`;
//             }
//           },
//           { 
//             id: "Manager", 
//             name: "Manager",
//             employee_name: "Manager",
//             department: "技術部",
//             role: "主管",
//             grade: "A",
//             get displayName() { 
//               return `${this.name} (${this.department} - ${this.role})`;
//             }
//           }
//         ]);
//       }
//     };

//     loadEmployees();
//   }, []); // 按等級A-E排序



//   /**
//    * 生命週期方法區域
//    */
//   // 載入員工KPI資料的函數
//   const loadEmployeeData = async (employeeId, targetYear, targetMonth, targetDay, isYearly = false) => {
//     if (!employeeId) {
//       return;
//     }
    
//     setIsLoading(true);
//     try {
//       console.group('載入KPI資料');
//       console.log('參數:', { 
//         employeeId, 
//         targetYear, 
//         targetMonth, 
//         targetDay,
//         mode: isYearly ? '年度統計' : targetDay ? '每日統計' : '月度統計'
//       });

//       // 同時發送兩個API請求
//       const [yearResponse, monthResponse] = await Promise.all([
//         // 年度KPI資料
//         fetch(`${REPORT_API.BASE_URL}${REPORT_API.ENDPOINTS.kpiOverviewYear}`, {
//           method: 'POST',
//           headers: REPORT_API.headers,
//           body: JSON.stringify(targetYear)
//         }),
//         // 日期KPI資料
//         fetch(`${REPORT_API.BASE_URL}${REPORT_API.ENDPOINTS.kpiOverviewMonth}`, {
//           method: 'POST',
//           headers: REPORT_API.headers,
//           body: JSON.stringify({
//             Year: targetYear,
//             Month: targetMonth,
//             Day: targetDay
//           })
//         })
//       ]);

//       // 檢查回應狀態
//       if (!yearResponse.ok) {
//         throw new Error(`年度KPI API錯誤: ${yearResponse.status}`);
//       }
//       if (!monthResponse.ok) {
//         throw new Error(`月度KPI API錯誤: ${monthResponse.status}`);
//       }

//       // 解析回應資料
//       const [yearData, monthData] = await Promise.all([
//         yearResponse.json(),
//         monthResponse.json()
//       ]);

//       console.log('API回應:', { yearData, monthData });

//       // 更新資料
//       if (yearData.code === "0000" && monthData.code === "0000") {
//         // 找到選中員工的數據
//         let employeeData;
        
//         if (isYearly) {
//           // 年度統計模式
//           const employeeYearData = yearData.result.filter(item => 
//             item.user_Name === employeeId
//           );

//           console.log('找到的年度數據:', employeeYearData);

//           if (employeeYearData.length > 0) {
//             // 計算年度總和
//             const yearlyTotals = employeeYearData.reduce((acc, curr) => ({
//               completion_Rate: (acc.completion_Rate || 0) + (curr.completion_Rate || 0),
//               yield_Percent: (acc.yield_Percent || 0) + (curr.yield_Percent || 0),
//               total_Hours: (acc.total_Hours || 0) + (curr.total_Hours || 0),
//               machine_Run_Hours: (acc.machine_Run_Hours || 0) + (curr.machine_Run_Hours || 0),
//               maintenance_Count: (acc.maintenance_Count || 0) + (curr.maintenance_Count || 0),
//               otd_Rate: (acc.otd_Rate || 0) + (curr.otd_Rate || 0),
//               kpi_Percent: (acc.kpi_Percent || 0) + (curr.kpi_Percent || 0),
//               units_Per_Hour: (acc.units_Per_Hour || 0) + (curr.units_Per_Hour || 0)
//             }), {});

//             // 計算平均值
//             const monthCount = employeeYearData.length;
//             employeeData = {
//               ...employeeYearData[0],
//               work_Month: `${targetYear}-01-01T00:00:00`,
//               completion_Rate: yearlyTotals.completion_Rate / monthCount,
//               yield_Percent: yearlyTotals.yield_Percent / monthCount,
//               total_Hours: yearlyTotals.total_Hours,  // 總和
//               machine_Run_Hours: yearlyTotals.machine_Run_Hours,  // 總和
//               maintenance_Count: yearlyTotals.maintenance_Count,  // 總和
//               otd_Rate: yearlyTotals.otd_Rate / monthCount,
//               kpi_Percent: yearlyTotals.kpi_Percent / monthCount,
//               units_Per_Hour: yearlyTotals.units_Per_Hour / monthCount,
//               attendance: 100,
//               isYearlyView: true  // 標記為年度統計視圖
//             };

//             // 更新檢視方式
//             setViewMode("yearly");

//             console.log('年度統計數據:', {
//               monthCount,
//               totals: yearlyTotals,
//               processed: employeeData
//             });
//           }
//       } else if (targetDay) {
//         // 每日統計模式
//         const targetDate = `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T00:00:00`;
//         console.log('尋找日期:', targetDate);
        
//         // 檢查是否有該日期的數據
//         console.log('開始查找日期數據:', {
//           targetDate,
//           employeeId,
//           availableData: monthData.result.length
//         });

//         // 先找出所有該員工的數據
//         const employeeMonthData = monthData.result.filter(item => item.user_Name === employeeId);
//         console.log('該員工本月數據:', employeeMonthData.length, '筆');

//         // 在員工數據中找出指定日期的數據
//         const dailyData = employeeMonthData.find(item => {
//           const itemDate = new Date(item.work_Day);
//           const targetDateObj = new Date(targetDate);
          
//           const match = itemDate.getFullYear() === targetDateObj.getFullYear() &&
//                        itemDate.getMonth() === targetDateObj.getMonth() &&
//                        itemDate.getDate() === targetDateObj.getDate();
          
//           console.log('比對日期:', {
//             itemDate: item.work_Day,
//             targetDate,
//             match,
//             data: match ? item : null
//           });
          
//           return match;
//         });

//         if (dailyData) {
//           console.log('找到指定日期的數據:', dailyData);
          
//           // 檢查是否有有效數據
//           const hasValidData = dailyData.completion_Rate !== null ||
//                              dailyData.yield_Percent !== null ||
//                              dailyData.total_Hours > 0 ||
//                              dailyData.machine_Run_Hours > 0 ||
//                              dailyData.maintenance_Count > 0;
          
//           if (hasValidData) {
//             // 使用找到的有效數據，將null值轉換為0
//             employeeData = {
//               ...dailyData,
//               completion_Rate: dailyData.completion_Rate || 0,
//               yield_Percent: dailyData.yield_Percent || 0,
//               total_Hours: dailyData.total_Hours || 0,
//               machine_Run_Hours: dailyData.machine_Run_Hours || 0,
//               maintenance_Count: dailyData.maintenance_Count || 0,
//               otd_Rate: dailyData.otd_Rate || 0,
//               kpi_Percent: dailyData.kpi_Percent || 0,
//               units_Per_Hour: dailyData.units_Per_Hour || 0,
//               attendance: dailyData.attendance || 0
//             };
//           } else {
//             // 數據全為null，使用預設值但保留基本信息
//             employeeData = {
//               ...dailyData,
//               completion_Rate: 0,
//               yield_Percent: 0,
//               total_Hours: 0,
//               machine_Run_Hours: 0,
//               maintenance_Count: 0,
//               otd_Rate: 0,
//               kpi_Percent: 0,
//               units_Per_Hour: 0,
//               attendance: 0,
//               cnt_Done: 0,
//               cnt_Running_Done: 0,
//               machines_Used: 0,
//               items_Contributed: 0,
//               items_On_Time: 0,
//               in_Qty: 0,
//               qc_Qty: 0,
//               yield_Rate: 0
//             };
//           }
//         } else {
//           // 找不到數據，使用完全預設值
//           employeeData = {
//             work_Day: targetDate,
//             user_Name: employeeId,
//             completion_Rate: 0,
//             yield_Percent: 0,
//             total_Hours: 0,
//             machine_Run_Hours: 0,
//             maintenance_Count: 0,
//             otd_Rate: 0,
//             kpi_Percent: 0,
//             units_Per_Hour: 0,
//             attendance: 0,
//             user_Id: null,
//             employee_Name: employeeId,
//             department_Name: '技術部',
//             work_Month: `${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00`,
//             cnt_Done: 0,
//             cnt_Running_Done: 0,
//             machines_Used: 0,
//             items_Contributed: 0,
//             items_On_Time: 0,
//             in_Qty: 0,
//             qc_Qty: 0,
//             yield_Rate: 0
//           };
//         }
        
//         // 確保更新後的數據使用正確的日期和值
//         console.log('最終使用的數據:', {
//           requestedDate: targetDate,
//           actualDate: employeeData.work_Day,
//           hasData: !!dailyData,
//           values: {
//             completion_Rate: employeeData.completion_Rate,
//             yield_Percent: employeeData.yield_Percent,
//             total_Hours: employeeData.total_Hours,
//             machine_Run_Hours: employeeData.machine_Run_Hours,
//             kpi_Percent: employeeData.kpi_Percent
//           }
//         });
        
//         // 確保更新後的數據使用正確的日期
//         console.log('最終使用的數據:', {
//           requestedDate: targetDate,
//           actualDate: employeeData.work_Day,
//           hasData: !!dailyData
//         });
          
//           if (employeeData) {
//             // 更新檢視方式
//             setViewMode("daily");
//           }
//         } else {
//           // 月度統計模式
//           // 先找出所有該員工的數據
//           const employeeYearData = yearData.result.filter(item => 
//             item.user_Name === employeeId
//           );

//           console.log('找到的年度數據:', employeeYearData);
//           console.log('當前查詢月份:', targetMonth);

//           // 構建目標月份字符串
//           const targetMonthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01T00:00:00`;
//           console.log('目標月份字符串:', targetMonthStr);

//           // 找出該月份的數據
//           const targetMonthData = employeeYearData.filter(item => {
//             const match = item.work_Month === targetMonthStr;
//             console.log('比較月份:', {
//               targetMonthStr,
//               itemMonth: item.work_Month,
//               department: item.department_Name,
//               match
//             });
//             return match;
//           });

//           console.log('該月份找到的數據:', targetMonthData);

//           // 如果有數據，選擇其中一個有效的數據
//           if (targetMonthData.length > 0) {
//             // 優先選擇有實際數據的記錄
//             const validData = targetMonthData.find(data => 
//               data.completion_Rate !== null || 
//               data.total_Hours > 0 || 
//               data.cnt_Done > 0
//             );

//             // 使用找到的數據，確保work_Month是正確的月份
//             const selectedData = validData || targetMonthData[0];
            
//             employeeData = {
//               ...selectedData,
//               work_Month: targetMonthStr,
//               completion_Rate: selectedData.completion_Rate || 0,
//               yield_Percent: selectedData.yield_Percent || 0,
//               total_Hours: selectedData.total_Hours || 0,
//               machine_Run_Hours: selectedData.machine_Run_Hours || 0,
//               maintenance_Count: selectedData.maintenance_Count || 0,
//               otd_Rate: selectedData.otd_Rate || 0,
//               kpi_Percent: selectedData.kpi_Percent || 0,
//               units_Per_Hour: selectedData.units_Per_Hour || 0,
//               attendance: 100,
//               isYearlyView: false  // 清除年度統計標記
//             };
            
//             // 更新檢視方式
//             setViewMode("monthly");
            
//             console.log('選擇的月度數據:', {
//               targetMonth,
//               original: selectedData,
//               processed: employeeData
//             });
//           } else {
//             // 如果找不到數據，返回空值
//             employeeData = {
//               work_Month: targetMonthStr,
//               completion_Rate: 0,
//               yield_Percent: 0,
//               total_Hours: 0,
//               machine_Run_Hours: 0,
//               maintenance_Count: 0,
//               otd_Rate: 0,
//               kpi_Percent: 0,
//               units_Per_Hour: 0,
//               attendance: 0
//             };
            
//             console.log('未找到該月份數據，使用空值:', {
//               targetMonth,
//               employeeData
//             });
//           }

//           // 確保使用正確的月份數據
//           if (employeeData) {
//             const metrics = {
//               completion_Rate: employeeData.completion_Rate || 0,
//               yield_Percent: employeeData.yield_Percent || 0,
//               total_Hours: employeeData.total_Hours || 0,
//               machine_Run_Hours: employeeData.machine_Run_Hours || 0,
//               maintenance_Count: employeeData.maintenance_Count || 0,
//               otd_Rate: employeeData.otd_Rate || 0,
//               kpi_Percent: employeeData.kpi_Percent || 0,
//               units_Per_Hour: employeeData.units_Per_Hour || 0,
//               attendance: 100
//             };

//             console.log('處理後的指標數據:', metrics);
//             employeeData = {
//               ...employeeData,
//               ...metrics
//             };
//           }

//           if (!employeeData) {
//             console.log('未找到指定月份的數據:', targetMonth);
//             // 如果找不到數據，返回空值
//             employeeData = {
//               completion_Rate: 0,
//               yield_Percent: 0,
//               total_Hours: 0,
//               machine_Run_Hours: 0,
//               maintenance_Count: 0,
//               otd_Rate: 0,
//               kpi_Percent: 0,
//               units_Per_Hour: 0,
//               attendance: 0
//             };
//           }

//           console.log('選中的月份數據:', {
//             targetMonth,
//             employeeData
//           });
//         }
        
//         console.log('查找條件:', {
//           employeeId,
//           targetYear,
//           targetMonth,
//           targetDay,
//           mode: targetDay ? '每日統計' : '年度統計'
//         });
        
//         console.log('查找員工數據:', {
//           employeeId,
//           targetDate: `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T00:00:00`,
//           foundData: employeeData
//         });

//         if (!employeeData) {
//           console.log('找不到員工數據，使用預設值:', {
//             employeeId,
//             targetYear,
//             targetMonth,
//             targetDay
//           });
//           const defaultData = {
//             completion_Rate: 0,
//             yield_Percent: 0,
//             total_Hours: 0,
//             machine_Run_Hours: 0,
//             maintenance_Count: 0,
//             otd_Rate: 0,
//             kpi_Percent: 0,
//             units_Per_Hour: 0,
//             attendance: 0,
//             user_Name: employeeId
//           };
//           setEmployeeData(defaultData);
//           employeeData = defaultData;
//         }

//         console.log('找到的員工數據:', employeeData);
        
//         // 使用已經處理好的 employeeData
//         console.log('使用的數據來源:', selectedDay ? '每日統計' : '月度統計');
//         console.log('最終使用的數據:', employeeData);
        
//         // 構建最終數據結構
//         const newData = {
//           // 基本指標
//           completion_Rate: employeeData.completion_Rate || 0,
//           yield_Percent: employeeData.yield_Percent || 0,
//           total_Hours: employeeData.total_Hours || 0,
//           machine_Run_Hours: employeeData.machine_Run_Hours || 0,
//           maintenance_Count: employeeData.maintenance_Count || 0,
//           otd_Rate: employeeData.otd_Rate || 0,
//           kpi_Percent: employeeData.kpi_Percent || 0,
//           units_Per_Hour: employeeData.units_Per_Hour || 0,
//           attendance: employeeData.attendance || 0,
          
//           // 其他相關資訊
//           machines_used: employeeData.machines_Used || 0,
//           items_contributed: employeeData.items_Contributed || 0,
//           items_on_time: employeeData.items_On_Time || 0,
          
//           // 員工資訊
//           employeeId: employeeData.user_Id || employeeId,
//           employeeName: employeeData.user_Name || '',
//           departmentName: employeeData.department_Name || '',
          
//           // 歷史資料
//           historicalData: [
//             { 
//               month: employeeData.work_Month ? 
//                 new Date(employeeData.work_Month).getMonth() + 1 + '月' : 
//                 `${targetMonth}月`,
//               value: employeeData.kpi_Percent || 0
//             }
//           ],
          
//           // 保存原始資料
//           yearlyData: yearData.result,
//           monthlyData: monthData.result
//         };

//         console.log('更新後的數據:', newData);
//         setEmployeeData(newData);

//         // 輸出轉換後的資料以供檢查
//         console.log('處理後的資料:', employeeData);
//       }

//       console.groupEnd();
//     } catch (error) {
//       console.error('載入KPI資料失敗:', error);
//       // 使用預設數據
//       setEmployeeData(prevData => ({
//         ...prevData,
//         workCompletion: 85,
//         productQuality: 92,
//         workHours: 88,
//         attendance: 95,
//         machineStatus: 87,
//         maintenanceRecord: 90,
//         targetAchievement: 86,
//         kpi: 89,
//         efficiency: 91
//       }));
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     const initializeData = async () => {
//       if (!selectedEmployee) {
//         return;
//       }

//       try {
//         // 根據當前檢視方式載入數據
//         const isDaily = viewMode === "daily";
//         const isYearly = viewMode === "yearly";
//         const currentDay = isDaily ? 1 : null;
//         const currentMonth = isYearly ? 1 : selectedMonth;

//         console.log('初始化數據:', {
//           employee: selectedEmployee,
//           year: selectedYear,
//           month: currentMonth,
//           day: currentDay,
//           viewMode,
//           isYearly
//         });

//         // 載入數據
//         await loadEmployeeData(
//           selectedEmployee,
//           selectedYear,
//           currentMonth,
//           currentDay,
//           isYearly
//         );
//       } catch (error) {
//         console.error("初始化資料失敗:", error);
//       }
//     };

//     // 執行初始化
//     initializeData();
//   }, [selectedEmployee, selectedYear, selectedMonth, selectedDay, viewMode]);

//   const handleEmployeeChange = async (e) => {
//     const employeeId = e.target.value;
//     console.log('選擇的員工名稱:', employeeId);
    
//     // 先清空現有數據
//     setEmployeeData(null);
//     setSelectedEmployee(employeeId);
    
//     // 重新加載可用年份列表
//     await loadAvailableYears();
    
//     if (employeeId) {
//       try {
//         // 根據當前檢視方式載入數據
//         const isDaily = viewMode === "daily";
//         const isYearly = viewMode === "yearly";
//         const currentDay = isDaily ? 1 : null;
//         const currentMonth = isYearly ? 1 : selectedMonth;
        
//         console.log('載入新員工數據:', {
//           employeeId,
//           year: selectedYear,
//           month: currentMonth,
//           day: currentDay,
//           viewMode,
//           isYearly
//         });
        
//         // 載入數據
//         await loadEmployeeData(
//           employeeId,
//           selectedYear,
//           currentMonth,
//           currentDay,
//           isYearly
//         );
//       } catch (error) {
//         console.error('載入員工數據失敗:', error);
//         setEmployeeData({});
//       }
//     } else {
//       // 如果選擇了空值，清空數據
//       setEmployeeData({});
//     }
//   };

//   // ... 其他渲染邏輯保持不變 ...

//   /**
//    * 事件處理方法區域
//    */
//   const handleLogout = () => {
//     // ... 登出處理邏輯 ...
//     localStorage.removeItem("isAuthenticated");
//     navigate("/login");
//   };

//   useEffect(() => {
//     // ... 點擊外部關閉用戶選單邏輯 ...
//     const handleClickOutside = (event) => {
//       if (showUserMenu && !event.target.closest(".user-menu")) {
//         setShowUserMenu(false);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, [showUserMenu]);

//   /**
//    * 條件渲染：加載狀態
//    */
//   // 只在真正loading時顯示loading畫面
//   // 使用遮罩層而不是全頁loading
//   const LoadingOverlay = () => (
//     <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50">
//       <div className="text-center bg-slate-800 p-6 rounded-lg shadow-xl">
//         <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4 mx-auto"></div>
//         <p className="text-slate-300">載入中...</p>
//       </div>
//     </div>
//   );

//   // 如果沒有employeeData，使用預設值
//   const currentEmployeeData = employeeData || {
//     completion_Rate: 0,
//     yield_Percent: 0,
//     total_Hours: 0,
//     machine_Run_Hours: 0,
//     maintenance_Count: 0,
//     otd_Rate: 0,
//     kpi_Percent: 0,
//     units_Per_Hour: 0,
//     attendance: 0
//   };

//   // 已經在前面定義過 handleEmployeeChange，這裡移除重複的定義

//   /**
//    * 主要渲染邏輯
//    */

//   // 如果顯示積分管理，則渲染整頁積分管理系統
//   if (showPointsManagement) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900">
//         {/* 積分管理內容 */}
//         <div className="w-full">
//           <PointsManagementDashboard
//             onClose={() => setShowPointsManagement(false)}
//             currentUser={null}
//             isFullPage={true}
//           />
//         </div>
//       </div>
//     );
//   }

//   return (
//     <>
//       <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-6 relative">
//         {isLoading && <LoadingOverlay />}
//         <div className="max-w-7xl mx-auto">
//           {/* 頁面頭部：標題和用戶選項 */}
//           <div className="flex flex-col gap-4 mb-6">
//             {/* 第一行：標題和基本操作 */}
//             <div className="flex justify-between items-center">
//               <h1 className="text-3xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors duration-200 flex items-center gap-2">
//                 <Activity className="w-8 h-8" />
//                 員工智慧考核系統
//               </h1>
//               <div className="flex items-center gap-4">
//                 {/* 積分管理按鈕 */}
//                 <button
//                   onClick={() => setShowPointsManagement(true)}
//                   className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
//                   title="開啟積分管理系統"
//                 >
//                   <Calculator className="w-5 h-5" />
//                   <span>積分管理</span>
//                 </button>

//                 {/* 用戶選單 */}
//                 <div className="relative user-menu">
//                   <button
//                     className="flex items-center gap-2 bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
//                     onClick={() => setShowUserMenu(!showUserMenu)}
//                   >
//                     <User className="w-5 h-5" />
//                     <span>用戶選項</span>
//                   </button>

//                   {/* 下拉選單 */}
//                   {showUserMenu && (
//                     <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-lg shadow-lg py-1 z-10">
//                       <button
//                         className="flex items-center gap-2 px-4 py-2 text-white hover:bg-slate-600 w-full text-left"
//                         onClick={() => {
//                           // TODO: 實現修改密碼功能
//                           alert("修改密碼功能待實現");
//                         }}
//                       >
//                         <Key className="w-4 h-4" />
//                         修改密碼
//                       </button>
//                       <button
//                         className="flex items-center gap-2 px-4 py-2 text-white hover:bg-slate-600 w-full text-left text-red-400 hover:text-red-300"
//                         onClick={handleLogout}
//                       >
//                         <LogOut className="w-4 h-4" />
//                         登出
//                       </button>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>

//             {/* 第二行：員工選擇和日期選擇 */}
//             <div className="flex items-center gap-4 bg-slate-700/50 p-4 rounded-lg">
//               <div className="flex items-center gap-2">
//                 <span className="text-white">員工：</span>
//                   <select
//                   className="bg-slate-700 text-white border border-slate-600 rounded-lg p-2 min-w-[200px] cursor-pointer hover:bg-slate-600 transition-colors"
//                   value={selectedEmployee}
//                   onChange={handleEmployeeChange}
//                 >
//                   <option value="">請選擇員工</option>
//                   {employees && employees.length > 0 ? (
//                     employees.map((emp) => (
//                       <option key={emp.id} value={emp.id}>
//                         {emp.displayName || `${emp.name} (${emp.department})`}
//                       </option>
//                     ))
//                   ) : (
//                     <option value="" disabled>無可用員工資料</option>
//                   )}
//                 </select>
//               </div>

//               <div className="flex items-center gap-4">
//                 <div className="flex items-center gap-2">
//                   <span className="text-white">年份：</span>
//                   <div className="relative inline-block">
//                     <select
//                       value={selectedYear}
//                       onChange={async (e) => {
//                         const newYear = parseInt(e.target.value);
                        
//                         // 設置loading狀態
//                         setIsLoading(true);
                        
//                         try {
//                           // 先更新年份
//                           setSelectedYear(newYear);
                          
//                           // 等待一個極短的時間以確保狀態更新
//                           await new Promise(resolve => setTimeout(resolve, 10));
                          
//                           // 根據當前檢視模式決定是否需要重置月份
//                           const currentMonth = viewMode === "yearly" ? 1 : selectedMonth;
//                           const currentDay = viewMode === "daily" ? selectedDay : null;
//                           const isYearlyView = viewMode === "yearly";
                          
//                           // 重新加載數據
//                           await loadEmployeeData(
//                             selectedEmployee,
//                             newYear,
//                             currentMonth,
//                             currentDay,
//                             isYearlyView
//                           );
                          
//                           console.log('年份變更:', {
//                             newYear,
//                             currentMonth,
//                             currentDay,
//                             selectedEmployee,
//                             viewMode
//                           });
//                         } catch (error) {
//                           console.error('載入年度數據失敗:', error);
//                         } finally {
//                           setIsLoading(false);
//                         }
//                       }}
//                       className="appearance-none bg-slate-700 text-white px-4 py-2 pr-10 rounded-lg border border-slate-600 
//                         hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
//                         transition-all duration-200 cursor-pointer min-w-[120px] backdrop-blur-sm
//                         shadow-sm hover:shadow-md"
//                     >
//                       {availableYears.map(year => (
//                         <option 
//                           key={year} 
//                           value={year}
//                           className="bg-slate-700 text-white hover:bg-slate-600"
//                         >
//                           {year}年
//                         </option>
//                       ))}
//                     </select>
//                     <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
//                       <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
//                         <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
//                       </svg>
//                     </div>
//                   </div>
//                 </div>
                
//                 {viewMode !== "yearly" && (
//                   <div className="flex items-center gap-2">
//                     <span className="text-white">月份：</span>
//                     <div className="relative inline-block">
//                       <select
//                         value={selectedMonth}
//                         onChange={async (e) => {
//                           const newMonth = parseInt(e.target.value);
//                           console.log('切換到新月份:', newMonth);
                          
//                           // 先清空數據
//                           setEmployeeData(null);
                          
//                           // 更新月份
//                           setSelectedMonth(newMonth);
                          
//                           // 等待狀態更新
//                           await new Promise(resolve => setTimeout(resolve, 0));
                          
//                           // 重新加載數據
//                           console.log('開始加載新月份數據:', {
//                             employee: selectedEmployee,
//                             year: selectedYear,
//                             month: newMonth,
//                             day: selectedDay,
//                             mode: selectedDay ? '每日統計' : '月度統計'
//                           });
                          
//                           try {
//                             // 確保使用新的月份
//                             await loadEmployeeData(
//                               selectedEmployee,
//                               selectedYear,
//                               newMonth,
//                               selectedDay,
//                               false  // 不是年度統計
//                             );
//                           } catch (error) {
//                             console.error('加載數據失敗:', error);
//                             setEmployeeData({});
//                           }
//                         }}
//                         className="appearance-none bg-slate-700 text-white px-4 py-2 pr-10 rounded-lg border border-slate-600 
//                           hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
//                           transition-all duration-200 cursor-pointer min-w-[100px] backdrop-blur-sm
//                           shadow-sm hover:shadow-md"
//                       >
//                         {Array.from({length: 12}, (_, i) => i + 1).map(month => (
//                           <option 
//                             key={month} 
//                             value={month}
//                             className="bg-slate-700 text-white hover:bg-slate-600"
//                           >
//                             {month}月
//                           </option>
//                         ))}
//                       </select>
//                       <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
//                         <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
//                           <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
//                         </svg>
//                       </div>
//                     </div>
//                   </div>
//                 )}
                
//                 <div className="flex items-center gap-2">
//                   <span className="text-white">檢視方式：</span>
//                   <div className="relative inline-block">
//                     <select
//                       value={viewMode}
//                       onChange={async (e) => {
//                         const newViewMode = e.target.value;
//                         const isDaily = newViewMode === "daily";
//                         const isYearly = newViewMode === "yearly";
//                         const newDay = isDaily ? 1 : null;
                        
//                         console.log('切換檢視方式:', {
//                           newViewMode,
//                           isDaily,
//                           isYearly,
//                           newDay,
//                           currentViewMode: viewMode
//                         });
                        
//                         // 先清空數據
//                         setEmployeeData(null);
                        
//                         // 更新檢視方式狀態
//                         setViewMode(newViewMode);
//                         setSelectedDay(newDay);
                        
//                         // 如果是年度統計，強制設置月份為1月
//                         if (isYearly) {
//                           setSelectedMonth(1);
//                         }
                        
//                         // 等待狀態更新
//                         await new Promise(resolve => setTimeout(resolve, 0));
                        
//                         // 重新加載數據
//                         try {
//                           const currentMonth = isYearly ? 1 : selectedMonth;
                          
//                           console.log('開始加載新數據:', {
//                             mode: newViewMode,
//                             year: selectedYear,
//                             month: currentMonth,
//                             day: newDay,
//                             employee: selectedEmployee,
//                             isYearly
//                           });
                          
//                           await loadEmployeeData(
//                             selectedEmployee,
//                             selectedYear,
//                             currentMonth,
//                             newDay,
//                             isYearly
//                           );
//                         } catch (error) {
//                           console.error('加載數據失敗:', error);
//                           setEmployeeData({});
//                         }
//                       }}
//                       className="appearance-none bg-slate-700 text-white px-4 py-2 pr-10 rounded-lg border border-slate-600 
//                         hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
//                         transition-all duration-200 cursor-pointer min-w-[120px] backdrop-blur-sm
//                         shadow-sm hover:shadow-md"
//                     >
//                       <option value="yearly" className="bg-slate-700 text-white hover:bg-slate-600">年度統計</option>
//                       <option value="monthly" className="bg-slate-700 text-white hover:bg-slate-600">月度統計</option>
//                       <option value="daily" className="bg-slate-700 text-white hover:bg-slate-600">每日統計</option>
//                     </select>
//                     <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
//                       <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
//                         <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
//                       </svg>
//                     </div>
//                   </div>
//                   {viewMode === "daily" && (
//                     <div className="relative inline-block">
//                       <select
//                         value={selectedDay}
//                         onChange={async (e) => {
//                           const newDay = parseInt(e.target.value);
//                           console.log('切換到新日期:', {
//                             currentDay: selectedDay,
//                             newDay,
//                             year: selectedYear,
//                             month: selectedMonth
//                           });
                          
//                           // 先清空數據
//                           setEmployeeData(null);
//                           setSelectedDay(newDay);
                          
//                           // 等待狀態更新
//                           await new Promise(resolve => setTimeout(resolve, 0));
                          
//                           try {
//                             // 重新加載數據
//                             await loadEmployeeData(
//                               selectedEmployee,
//                               selectedYear,
//                               selectedMonth,
//                               newDay,
//                               false  // 不是年度統計
//                             );
//                           } catch (error) {
//                             console.error('載入日期數據失敗:', error);
//                             setEmployeeData({});
//                           }
//                         }}
//                         className="appearance-none bg-slate-700 text-white px-4 py-2 pr-10 rounded-lg border border-slate-600 
//                           hover:border-blue-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
//                           transition-all duration-200 cursor-pointer min-w-[100px] backdrop-blur-sm
//                           shadow-sm hover:shadow-md"
//                       >
//                         {Array.from({length: 31}, (_, i) => i + 1).map(day => (
//                           <option 
//                             key={day} 
//                             value={day}
//                             className="bg-slate-700 text-white hover:bg-slate-600"
//                           >
//                             {day}日
//                           </option>
//                         ))}
//                       </select>
//                       <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-400">
//                         <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
//                           <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
//                         </svg>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* 標籤導航區域 */}
//           <div className="flex gap-4 mb-6">
//             {[
//               {
//                 id: "dashboard",
//                 label: "績效儀表板",
//                 icon: <Activity size={20} />,
//               },
//               { id: "details", label: "詳細數據", icon: <Target size={20} /> },
//               {
//                 id: "recommendations",
//                 label: "改進建議",
//                 icon: <Award size={20} />,
//               },
//             ].map((tab) => (
//               <button
//                 key={tab.id}
//                 className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
//                   activeTab === tab.id
//                     ? "bg-blue-600 text-white"
//                     : "bg-slate-700 text-slate-200 hover:bg-slate-600"
//                 }`}
//                 onClick={() => setActiveTab(tab.id)}
//               >
//                 {tab.icon}
//                 {tab.label}
//               </button>
//             ))}
//           </div>

//           {/* 主要內容區域 */}
//           <div className="space-y-6">
//             {/* 無數據提示 */}
//             {selectedEmployee && !isLoading && (
//               <div className={`mb-6 ${Object.values(currentEmployeeData).every(value => value === 0 || value === null) ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-blue-500/10 border border-blue-500/20'} rounded-lg p-4 ${Object.values(currentEmployeeData).every(value => value === 0 || value === null) ? 'text-yellow-400' : 'text-blue-400'}`}>
//                 <div className="flex items-center gap-2">
//                   <Info className="w-5 h-5" />
//                   <span className="font-medium">
//                     {Object.values(currentEmployeeData).every(value => value === 0 || value === null) ? '無可用數據' : '數據載入成功'}
//                   </span>
//                 </div>
//                 <p className="mt-1 text-sm opacity-80">
//                   {Object.values(currentEmployeeData).every(value => value === 0 || value === null) ? (
//                     <>
//                       目前所選的{viewMode === "yearly" ? "年度" : viewMode === "monthly" ? "月份" : "日期"}
//                       尚無績效數據，系統將顯示預設值。請確認選擇的時間區間是否正確，或選擇其他時間區間查看。
//                     </>
//                   ) : (
//                     <>
//                       已成功載入 {selectedEmployee} 在 {selectedYear}年
//                       {viewMode !== "yearly" ? `${selectedMonth}月` : ""}
//                       {viewMode === "daily" ? `${selectedDay}日` : ""} 的績效數據。
//                     </>
//                   )}
//                 </p>
//               </div>
//             )}

//             {/* Dashboard View */}
//             {activeTab === "dashboard" && (
//               <>
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                   {metrics.map((metric) => (
//                     <PerformanceCard
//                       key={metric.id}
//                       metric={metric}
//                       data={currentEmployeeData}
//                     />
//                   ))}
//                 </div>

//                 <div className="bg-slate-700 rounded-xl p-6 text-white">
//                   <div className="flex justify-between items-center mb-4">
//                     <h3 className="text-xl font-bold">績效趨勢分析</h3>
//                   </div>
//                   <div className="h-[400px]">
//                     <ResponsiveContainer width="100%" height="100%">
//                       <LineChart data={timeSeriesData}>
//                         <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
//                         <XAxis dataKey="month" stroke="#9CA3AF" />
//                         <YAxis stroke="#9CA3AF" />
//                         <Tooltip
//                           contentStyle={{
//                             backgroundColor: "#1F2937",
//                             border: "none",
//                           }}
//                         />
//                         <Legend />
//                         <Line
//                           type="monotone"
//                           dataKey="completion"
//                           stroke="#10B981"
//                           name="完成率"
//                         />
//                         <Line
//                           type="monotone"
//                           dataKey="quality"
//                           stroke="#3B82F6"
//                           name="質量"
//                         />
//                         <Line
//                           type="monotone"
//                           dataKey="efficiency"
//                           stroke="#F59E0B"
//                           name="效率"
//                         />
//                       </LineChart>
//                     </ResponsiveContainer>
//                   </div>
//                 </div>
//               </>
//             )}

//             {/* 詳細數據視圖 */}
//             {activeTab === "details" && (
//               <div className="bg-slate-700 rounded-xl p-6 text-white">
//                 <h3 className="text-xl font-bold mb-4">詳細績效數據</h3>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full divide-y divide-slate-600">
//                     <thead>
//                       <tr>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
//                           評估項目
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
//                           數值
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
//                           目標
//                         </th>
//                         <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase">
//                           狀態
//                         </th>
//                       </tr>
//                     </thead>
//                     <tbody className="divide-y divide-slate-600">
//                       {metrics.map((metric) => (
//                         <tr
//                           key={metric.id}
//                           className="hover:bg-slate-600/50 transition-colors"
//                         >
//                           <td className="px-6 py-4 whitespace-nowrap text-slate-200">
//                             <div className="flex items-center">
//                               <span
//                                 className={`mr-2 animate-glow ${metric.color}`}
//                               >
//                                 {metric.icon}
//                               </span>
//                               <span className="animate-glow">
//                                 {metric.title}
//                               </span>
//                             </div>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-slate-200">
//                             <span className="animate-glow">
//                               {metric.value(employeeData)}%
//                             </span>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap text-slate-200">
//                             <span className="animate-glow">80%</span>
//                           </td>
//                           <td className="px-6 py-4 whitespace-nowrap">
//                             <span
//                               className={`px-2 py-1 rounded-full text-sm animate-glow ${
//                                 metric.value(employeeData) === 100
//                                   ? "bg-gradient-to-r from-purple-300 via-purple-100 to-purple-300 text-purple-800"
//                                   : metric.value(employeeData) >= 90
//                                     ? "bg-green-100 text-green-800"
//                                     : metric.value(employeeData) >= 80
//                                       ? "bg-blue-100 text-blue-800"
//                                       : metric.value(employeeData) >= 70
//                                         ? "bg-yellow-100 text-yellow-800"
//                                         : metric.value(employeeData) >= 60
//                                           ? "bg-orange-100 text-orange-800"
//                                           : "bg-red-100 text-red-800"
//                               }`}
//                             >
//                               {metric.value(employeeData) === 100
//                                 ? "完美"
//                                 : metric.value(employeeData) >= 90
//                                   ? "優秀"
//                                   : metric.value(employeeData) >= 80
//                                     ? "良好"
//                                     : metric.value(employeeData) >= 70
//                                       ? "待加強"
//                                       : metric.value(employeeData) >= 60
//                                         ? "不及格"
//                                         : "極需改進"}
//                             </span>
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {/* 改進建議視圖 */}
//             {activeTab === "recommendations" && (
//               <div className="space-y-4">
//                 {metrics.map((metric) => {
//                   const value = metric.value(employeeData);
//                   const performanceLevel =
//                     value === 100
//                       ? "perfect"
//                       : value >= 90
//                         ? "excellent"
//                         : value >= 80
//                           ? "good"
//                           : value >= 70
//                             ? "needsImprovement"
//                             : value >= 60
//                               ? "poor"
//                               : "critical";

//                   return (
//                     <div
//                       key={metric.id}
//                       className={`bg-slate-700 rounded-xl p-6 text-white border-l-4 hover:shadow-lg transition-all duration-300 ${
//                         performanceLevel === "perfect"
//                           ? "border-purple-500"
//                           : performanceLevel === "excellent"
//                             ? "border-green-500"
//                             : performanceLevel === "good"
//                               ? "border-blue-500"
//                               : performanceLevel === "needsImprovement"
//                                 ? "border-yellow-500"
//                                 : performanceLevel === "poor"
//                                   ? "border-orange-500"
//                                   : "border-red-500"
//                       }`}
//                     >
//                       <div className="flex items-center justify-between mb-2">
//                         <div className="flex items-center">
//                           <span className={`mr-2 ${metric.color}`}>
//                             {metric.icon}
//                           </span>
//                           <h3 className="text-lg font-bold">
//                             {metric.title}建議
//                           </h3>
//                         </div>
//                         <span
//                           className={`px-2 py-1 rounded-full text-sm animate-glow ${
//                             performanceLevel === "perfect"
//                               ? "bg-purple-100 text-purple-800"
//                               : performanceLevel === "excellent"
//                                 ? "bg-green-100 text-green-800"
//                                 : performanceLevel === "good"
//                                   ? "bg-blue-100 text-blue-800"
//                                   : performanceLevel === "needsImprovement"
//                                     ? "bg-yellow-100 text-yellow-800"
//                                     : performanceLevel === "poor"
//                                       ? "bg-orange-100 text-orange-800"
//                                       : "bg-red-100 text-red-800"
//                           }`}
//                         >
//                           {performanceLevel === "perfect"
//                             ? "表現完美"
//                             : performanceLevel === "excellent"
//                               ? "表現優異"
//                               : performanceLevel === "good"
//                                 ? "表現良好"
//                                 : performanceLevel === "needsImprovement"
//                                   ? "需要改進"
//                                   : performanceLevel === "poor"
//                                     ? "表現不佳"
//                                     : "急需改進"}
//                         </span>
//                       </div>
//                       <p className="text-slate-300">
//                         {performanceLevel === "perfect"
//                           ? `目前${metric.title}表現完美，建議持續保持並協助其他同仁。`
//                           : performanceLevel === "excellent"
//                             ? `目前${metric.title}表現優異，建議持續保持並協助其他同仁。`
//                             : performanceLevel === "good"
//                               ? `目前${metric.title}表現良好，建議持續保持並協助其他同仁。`
//                               : performanceLevel === "needsImprovement"
//                                 ? `建議參加${metric.title}相關培訓課程，提升專業技能。`
//                                 : performanceLevel === "poor"
//                                   ? `建議參加${metric.title}相關培訓課程，提升專業技能。`
//                                   : `急需改進${metric.title}，建議參加相關培訓課程，提升專業技能。`}
//                       </p>
//                     </div>
//                   );
//                 })}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>


//     </>
//   );
// }
