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
} from "lucide-react";
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
import { useNavigate } from "react-router-dom";
import { PerformanceEvaluator } from "../utils/performanceCalculations";

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
  const value = metric.value(data);
  const breakdown = getScoreBreakdown(metric, data);

  /**
   * 數據處理方法：獲取最近三個月數據
   */
  const getRecentMonthsData = () => {
    const now = new Date();
    const months = [];

    for (let i = 2; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        now.getDate()
      );
      const monthStr = `${date.getMonth() + 1}月${date.getDate()}日`;

      months.push({
        month: monthStr,
        completion: Math.round(Math.random() * 20 + 80), // 模擬數據
        quality: Math.round(Math.random() * 20 + 80),
        efficiency: Math.round(Math.random() * 20 + 80),
      });
    }
    return months;
  };
  /**
   * 工具方法：獲取指標樣式
   */
  const getMetricStyle = (metricId) => {
    const styleMap = {
      workCompletion: { color: "#3B82F6", name: "完成率" },    // text-blue-500
      quality: { color: "#10B981", name: "質量" },            // text-green-500
      workHours: { color: "#F59E0B", name: "工作時間" },      // text-orange-400
      attendance: { color: "#EC4899", name: "出勤率" },       // text-pink-400
      machineStatus: { color: "#06B6D4", name: "機台狀態" },   // text-cyan-400
      maintenance: { color: "#8B5CF6", name: "維護記錄" },     // text-purple-400
      targetAchievement: { color: "#F87171", name: "目標達成" }, // text-red-400
      kpi: { color: "#FBBF24", name: "KPI" },                // text-yellow-400
      efficiency: { color: "#A3E635", name: "效率" },         // text-lime-400
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
   * 工具方法：獲取建議文本
   */
  const getSuggestions = (value, metric) => {
    const suggestions = [];

    if (value === 100) {
      suggestions.push(
        `目前${metric.title}表現完美，建議持續保持並協助其他同仁。`,
        "可以擔任部門內部的培訓講師，分享經驗。",
        "建議參與跨部門專案，擴展影響力。"
      );
    } else if (value >= 90) {
      suggestions.push(
        `目前${metric.title}表現優異，建議持續保持現有水準。`,
        "可以嘗試挑戰更高難度的任務。",
        "建議分享工作方法，帶領團隊成長。"
      );
    } else if (value >= 80) {
      suggestions.push(
        `目前${metric.title}表現良好，仍有提升空間。`,
        "建議參加進階培訓課程，提升專業技能。",
        "可以向優秀同仁學習，找出改進方向。"
      );
    } else if (value >= 70) {
      suggestions.push(
        `建議參加${metric.title}相關培訓課程，提升專業技能。`,
        "與主管討論制定具體的改進計畫。",
        "建議多與同仁交流，學習優秀經驗。"
      );
    } else if (value >= 60) {
      suggestions.push(
        `需要加強${metric.title}相關能力，建議尋求主管協助。`,
        "制定短期改進目標，逐步提升。",
        "建議安排mentor指導，協助改進。"
      );
    } else {
      suggestions.push(
        `急需改進${metric.title}，建議立即進行專業培訓。`,
        "需要主管特別輔導和協助。",
        "建議調整工作方法，找出問題癥結。"
      );
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
              <span className={`${metric.color} animate-glow`}>{metric.icon}</span>
              <h3 className={`text-lg font-semibold ${metric.color} animate-glow`}>
                {metric.title}
              </h3>
            </div>
            <p className={`text-3xl font-bold ${metric.color} animate-glow`}>{value}%</p>
          </div>
          <div className="trend-indicator">
            {value > metric.target ? (
              <ReactFeatherTrendingUp className="text-green-400 animate-glow" />
            ) : (
              <ReactFeatherTrendingDown className="text-red-400 animate-glow" />
            )}
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar value={value} color={metric.color} />
          <p className={`text-sm mt-1 ${metric.color}`}>
            目標: {metric.target}%
          </p>
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
              {/* 得分資訊 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700 p-4 rounded-lg text-center">
                  <p className="text-slate-300 mb-1">得分</p>
                  <p className={`text-3xl font-bold ${metric.color}`}>
                    {value}%
                  </p>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg text-center">
                  <p className="text-slate-300 mb-1">目標得分</p>
                  <p className="text-3xl font-bold text-white">
                    {metric.target}%
                  </p>
                </div>
              </div>

              {/* 更詳細的得分計算明細 */}
              <div className="space-y-2">
                <h4 className="text-lg font-semibold text-white">
                  得分計算明細
                </h4>
                <div className="bg-slate-700 rounded-lg p-4 space-y-4">
                  {/* 基礎分數說明 */}
                  <div className="space-y-2">
                    <h5 className="text-white font-medium">基礎得分：</h5>
                    <div className="bg-slate-600/50 rounded p-3">
                      <div className="flex justify-between text-slate-300">
                        <span>{scoreExplanation.baseScoreExplanation}</span>
                        <span>{breakdown.baseScore}分</span>
                      </div>
                      <div className="text-sm text-slate-400 mt-1">
                        {scoreExplanation.calculationMethod}
                      </div>
                    </div>
                  </div>

                  {/* 加分項目 */}
                  {breakdown.adjustments.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-slate-600">
                      <h5 className="text-white font-medium">加分項目：</h5>
                      {breakdown.adjustments.map((adjustment, index) => (
                        <div
                          key={index}
                          className="bg-slate-600/50 rounded p-3"
                        >
                          <div className="flex justify-between text-slate-300">
                            <span>{adjustment.reason}</span>
                            <span>+{adjustment.score}分</span>
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {adjustment.description}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 最終得分計算 */}
                  <div className="pt-3 border-t border-slate-600">
                    <div className="space-y-2">
                      <div className="flex justify-between text-slate-300">
                        <span>基礎得分</span>
                        <span>{breakdown.baseScore}分</span>
                      </div>
                      {breakdown.adjustments.map((adj, index) => (
                        <div
                          key={index}
                          className="flex justify-between text-slate-300"
                        >
                          <span>{adj.reason}</span>
                          <span>+{adj.score}分</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-white font-semibold pt-2 border-t border-slate-500">
                        <span>最終得分</span>
                        <span>{breakdown.finalScore}分</span>
                      </div>
                    </div>
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
                          metric.id === "workCompletion"
                            ? "completion"
                            : metric.id === "quality"
                              ? "quality"
                              : "efficiency"
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
                    value >= 90
                      ? "border-green-500"
                      : value >= 80
                        ? "border-blue-500"
                        : value >= 70
                          ? "border-yellow-500"
                          : value >= 60
                            ? "border-orange-500"
                            : "border-red-500"
                  }`}
                >
                  {/* 新增：等級標籤 */}
                  <div className="mb-3 flex items-center gap-2">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        value >= 90
                          ? "bg-green-500"
                          : value >= 80
                            ? "bg-blue-500"
                            : value >= 70
                              ? "bg-yellow-500"
                              : value >= 60
                                ? "bg-orange-500"
                                : "bg-red-500"
                      }`}
                    ></div>
                    <span className="text-sm text-slate-300">
                      {value >= 90
                        ? "優異表現"
                        : value >= 80
                          ? "良好表現"
                          : value >= 70
                            ? "待加強"
                            : value >= 60
                              ? "需要改進"
                              : "急需協助"}
                    </span>
                  </div>

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

// 修改得分計算明細的邏輯
const getScoreBreakdown = (metric, data) => {
  const calculateFinalScore = (baseScore, adjustments) => {
    const totalAdjustments = adjustments.reduce(
      (sum, adj) => sum + adj.score,
      0
    );
    return Math.min(100, baseScore + totalAdjustments);
  };

  switch (metric.id) {
    case "workCompletion":
      const workCompletionAdjustments = [
        {
          reason: "目標達成獎勵",
          score: data.workCompletion >= 95 ? 5 : 0,
          description: "超過95%目標完成率的額外獎勵",
        },
      ];
      return {
        baseScore: data.workCompletion || 0,
        adjustments: workCompletionAdjustments,
        finalScore: calculateFinalScore(
          data.workCompletion || 0,
          workCompletionAdjustments
        ),
      };

    case "quality":
      const qualityAdjustments = [
        {
          reason: "品質穩定度",
          score: data.productQuality >= 90 ? 3 : 0,
          description: "連續保持90%以上的品質水準",
        },
        {
          reason: "零缺陷生產",
          score: data.productQuality >= 95 ? 2 : 0,
          description: "達成零缺陷生產目標",
        },
      ];
      return {
        baseScore: data.productQuality,
        adjustments: qualityAdjustments,
        finalScore: calculateFinalScore(
          data.productQuality,
          qualityAdjustments
        ),
      };

    case "workHours":
      const standardHours = data?.standardHours || 176;
      const actualHours = data?.actualHours || 0;
      const baseScore = Math.round((actualHours / standardHours) * 100);

      const workHoursAdjustments = [
        {
          reason: "效率提升",
          score: data?.efficiency >= 90 ? 3 : 0,
          description: "工作效率超過90%",
        },
        {
          reason: "時間管理",
          score: data?.attendance >= 95 ? 2 : 0,
          description: "優秀的時間管理表現",
        },
      ];

      const finalScore = calculateFinalScore(baseScore, workHoursAdjustments);

      return {
        baseScore: baseScore,
        calculation: {
          formula: "(實際工時 / 標準工時) × 100",
          details: [
            {
              label: "標準工時",
              value: `${standardHours}小時`,
            },
            {
              label: "實際工時",
              value: `${actualHours}小時`,
            },
            {
              label: "計算過程",
              value: `(${actualHours} / ${standardHours}) × 100 = ${baseScore}分`,
            },
          ],
        },
        adjustments: workHoursAdjustments,
        finalScore: finalScore,
      };

    case "attendance":
      const attendanceAdjustments = [
        {
          reason: "全勤獎勵",
          score: data.attendance >= 98 ? 2 : 0,
          description: "月度全勤表現",
        },
      ];
      return {
        baseScore: data.attendance,
        adjustments: attendanceAdjustments,
        finalScore: calculateFinalScore(data.attendance, attendanceAdjustments),
      };

    case "machineStatus":
      const machineStatusAdjustments = [
        {
          reason: "設備優化",
          score: data.machineStatus >= 95 ? 3 : 0,
          description: "設備運行效率優化",
        },
        {
          reason: "預防維護",
          score: data.maintenanceRecord >= 90 ? 2 : 0,
          description: "執行預防性維護工作",
        },
      ];
      return {
        baseScore: data.machineStatus,
        adjustments: machineStatusAdjustments,
        finalScore: calculateFinalScore(
          data.machineStatus,
          machineStatusAdjustments
        ),
      };

    case "maintenance":
      const maintenanceAdjustments = [
        {
          reason: "預防性維護",
          score: data.preventiveMaintenance ? 2 : 0,
          description: "執行預防性維護計劃",
        },
        {
          reason: "設備效能提升",
          score: data.machineStatus >= 90 ? 2 : 0,
          description: "提升設備運行效能",
        },
      ];
      return {
        baseScore: data.maintenanceRecord,
        adjustments: maintenanceAdjustments,
        finalScore: calculateFinalScore(
          data.maintenanceRecord,
          maintenanceAdjustments
        ),
      };

    case "targetAchievement":
      const targetAchievementAdjustments = [
        {
          reason: "超額完成",
          score: data.targetAchievement >= 95 ? 3 : 0,
          description: "超過預期目標的表現",
        },
        {
          reason: "持續改善",
          score: data.efficiency >= 90 ? 2 : 0,
          description: "持續改善流程效率",
        },
      ];
      return {
        baseScore: data.targetAchievement,
        adjustments: targetAchievementAdjustments,
        finalScore: calculateFinalScore(
          data.targetAchievement,
          targetAchievementAdjustments
        ),
      };

    case "kpi":
      const kpiAdjustments = [
        {
          reason: "績效卓越",
          score: data.kpi >= 95 ? 3 : 0,
          description: "卓越的關鍵績效表現",
        },
        {
          reason: "團隊貢獻",
          score: data.teamwork >= 90 ? 2 : 0,
          description: "對團隊績效的正面貢獻",
        },
      ];
      return {
        baseScore: data.kpi,
        adjustments: kpiAdjustments,
        finalScore: calculateFinalScore(data.kpi, kpiAdjustments),
      };

    case "efficiency":
      const efficiencyAdjustments = [
        {
          reason: "效率提升",
          score: data.efficiency >= 95 ? 3 : 0,
          description: "顯著的效率改善",
        },
        {
          reason: "資源優化",
          score: data.resourceUtilization >= 90 ? 2 : 0,
          description: "優化資源使用效率",
        },
      ];
      return {
        baseScore: data.efficiency,
        adjustments: efficiencyAdjustments,
        finalScore: calculateFinalScore(data.efficiency, efficiencyAdjustments),
      };

    default:
      return {
        baseScore: data[metric.id] || 0,
        adjustments: [],
        finalScore: data[metric.id] || 0,
      };
  }
};

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
    ],
  });

  /**
   * 配置數據區域
   */
  const employees = [
    { id: "EMP001", name: "張小明" },
    { id: "EMP002", name: "李小華" },
    { id: "EMP003", name: "王大明" },
  ];

  const timeSeriesData = [
    { month: "1月", completion: 82, quality: 88, efficiency: 85 },
    { month: "2月", completion: 85, quality: 90, efficiency: 86 },
    { month: "3月", completion: 88, quality: 92, efficiency: 89 },
    { month: "4月", completion: 85, quality: 91, efficiency: 87 },
    { month: "5月", completion: 87, quality: 93, efficiency: 88 },
    { month: "6月", completion: 89, quality: 94, efficiency: 90 },
  ];

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
          data.baseScore
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

  // 確保 mockEmployeeData 中有正確的數據
  const mockEmployeeData = {
    EMP001: {
      // 張小明
      standardHours: 176, // 標準工時
      actualHours: 176, // 實際工時
      workHours: 92, // 工時達成率
      workCompletion: 92,
      productQuality: 95,
      attendance: 98,
      machineStatus: 94,
      maintenanceRecord: 92,
      targetAchievement: 91,
      kpi: 88,
      efficiency: 93,
      teamwork: 95,
      resourceUtilization: 92,
      preventiveMaintenance: true,
      historicalData: [
        { month: "1月", completion: 88, quality: 92, efficiency: 90 },
        { month: "2月", completion: 90, quality: 93, efficiency: 91 },
        { month: "3月", completion: 92, quality: 95, efficiency: 93 },
      ],
    },

    EMP002: {
      // 李小華
      standardHours: 176, // 標準工時
      actualHours: 168, // 實際工時
      workHours: 85, // 工時達成率
      workCompletion: 85,
      productQuality: 88,
      attendance: 95,
      machineStatus: 87,
      maintenanceRecord: 86,
      targetAchievement: 84,
      kpi: 82,
      efficiency: 85,
      teamwork: 92,
      resourceUtilization: 88,
      preventiveMaintenance: true,
      historicalData: [
        { month: "1月", completion: 82, quality: 85, efficiency: 83 },
        { month: "2月", completion: 84, quality: 86, efficiency: 84 },
        { month: "3月", completion: 85, quality: 88, efficiency: 85 },
      ],
    },

    EMP003: {
      // 王大明
      standardHours: 176, // 標準工時
      actualHours: 160, // 實際工時
      workHours: 78, // 工時達成率
      workCompletion: 95, // 優異 (≥95)
      productQuality: 88, // 良好 (85-94)
      attendance: 74, // 需協助 (65-74)
      machineStatus: 60, // 不及格 (<65)
      maintenanceRecord: 79, // 待改進
      targetAchievement: 92, // 良好
      kpi: 68, // 需協助
      efficiency: 63, // 不及格
      teamwork: 82, // 待改進
      resourceUtilization: 77, // 待改進
      preventiveMaintenance: false,
      historicalData: [
        { month: "1月", completion: 75, quality: 80, efficiency: 76 },
        { month: "2月", completion: 76, quality: 81, efficiency: 77 },
        { month: "3月", completion: 78, quality: 82, efficiency: 78 },
      ],
    },
  };

  /**
   * 生命週期方法區域
   */
  useEffect(() => {
    // ... 數據加載邏輯 ...
    const loadEmployeeData = async () => {
      setIsLoading(true);
      evaluator.startPerformanceMonitoring();

      try {
        // 使用模擬數據
        setTimeout(() => {
          setEmployeeData(mockEmployeeData[selectedEmployee]);
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error loading employee data:", error);
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
                    {emp.name}
                  </option>
                ))}
              </select>

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
                  <h3 className="text-xl font-bold mb-4">績效趨勢分析</h3>
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
                        <tr key={metric.id} className="hover:bg-slate-600/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                            <div className="flex items-center">
                              <span className={`mr-2 animate-glow ${metric.color}`}>{metric.icon}</span>
                              <span className="animate-glow">{metric.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                            <span className="animate-glow">{metric.value(employeeData)}%</span>
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
                          <span className={`mr-2 ${metric.color}`}>{metric.icon}</span>
                          <h3 className="text-lg font-bold">{metric.title}建議</h3>
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
