import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
         ComposedChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Activity, Target, Award, Zap, Clock, Calendar, Settings, Wrench, BarChart, 
         Grid, Table, TrendingUp, TrendingDown, User, Key, LogOut } from 'lucide-react';
import { TrendingUp as ReactFeatherTrendingUp, TrendingDown as ReactFeatherTrendingDown, X } from 'react-feather';
import { calculateWeightedScore, calculateFairnessIndex, generateImprovement, calculateTotalScore } from '../utils/performanceCalculations';
import { useNavigate } from 'react-router-dom';
import { PerformanceEvaluator } from '../utils/performanceCalculations';

// 修改進度條組件
const ProgressBar = ({ value, color }) => {
  // 創建一個顏色映射對象
  const colorMap = {
    'text-blue-500': 'bg-blue-500',
    'text-green-500': 'bg-green-500',
    'text-orange-400': 'bg-orange-400',
    'text-pink-400': 'bg-pink-400',
    'text-cyan-400': 'bg-cyan-400',
    'text-purple-400': 'bg-purple-400',
    'text-red-400': 'bg-red-400',
    'text-yellow-400': 'bg-yellow-400',
    'text-lime-400': 'bg-lime-400'
  };

  // 使用映射獲取背景顏色類
  const bgColorClass = colorMap[color] || 'bg-gray-400';
  
  return (
    <div className="w-full h-2 bg-slate-600/50 rounded-full overflow-hidden">
      <div 
        className={`h-full transition-all duration-300 ${bgColorClass}`}
        style={{ 
          width: `${Math.min(Math.max(value, 0), 100)}%`,
          transition: 'width 0.5s ease-in-out'
        }}
      />
    </div>
  );
};

// 績效指標卡片組件
const PerformanceCard = ({ metric, data }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const value = metric.value(data);
  
  // 添加除錯日誌
  console.log('PerformanceCard Render:', {
    metricId: metric.id,
    metricTitle: metric.title,
    value: value,
    data: data,
    color: metric.color
  });

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className={`
          bg-slate-700/50
          p-4 rounded-xl cursor-pointer 
          hover:scale-105 transition-all duration-300
          shadow-lg hover:shadow-xl
        `}
      >
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`${metric.color}`}>{metric.icon}</span>
              <h3 className={`text-lg font-semibold ${metric.color}`}>{metric.title}</h3>
            </div>
            <p className={`text-3xl font-bold ${metric.color}`}>{value}%</p>
          </div>
          <div className="trend-indicator">
            {value > metric.target ? 
              <ReactFeatherTrendingUp className="text-green-400" /> : 
              <ReactFeatherTrendingDown className="text-red-400" />
            }
          </div>
        </div>
        <div className="mt-4">
          <ProgressBar 
            value={value}
            color={metric.color}
          />
          <p className={`text-sm mt-1 ${metric.color}`}>目標: {metric.target}%</p>
        </div>
      </div>

      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="bg-slate-800 rounded-xl p-6 max-w-lg w-full mx-4"
            onClick={e => e.stopPropagation()}
          >
            {/* 標題和關閉按鈕 */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{metric.title}詳情</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* 得分明細 */}
            <div className="bg-slate-700 rounded-lg p-4 mb-4">
              <h4 className="text-lg font-semibold text-white mb-2">得分計算明細</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-slate-300">
                  <span>當前得分</span>
                  <span>{value}分</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>目標分數</span>
                  <span>{metric.target}分</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>達成率</span>
                  <span>{((value / metric.target) * 100).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* 歷史趨勢圖表 */}
            <div className="bg-slate-700 rounded-lg p-4 mb-4">
              <h4 className="text-lg font-semibold text-white mb-2">歷史趨勢</h4>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.historicalData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 改進建議 */}
            <div className="bg-slate-700 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-white mb-2">改進建議</h4>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>持續保持目前的表現水準</li>
                <li>關注相關指標的變化趨勢</li>
                <li>定期檢視改進空間</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// 修改得分計算明細的邏輯
const getScoreBreakdown = (metric, data) => {
  const value = metric.value(data);
  let breakdown = {
    baseScore: 0,
    adjustments: [],
    finalScore: value
  };
  
  switch (metric.id) {
    case 'workCompletion':
      breakdown = {
        baseScore: Math.min(data.workCompletion, 100),
        adjustments: [
          {
            reason: '準時完成任務',
            score: data.onTimeCompletion ? 5 : 0,
            description: '準時完成所有任務可獲得額外5分'
          },
          {
            reason: '品質達標',
            score: data.qualityMet ? 5 : 0,
            description: '產品品質達標可獲得額外5分'
          }
        ],
        finalScore: value
      };
      break;
      
    case 'quality':
      breakdown = {
        baseScore: data.productQuality,
        adjustments: [
          {
            reason: '零缺陷生產',
            score: data.productQuality >= 98 ? 10 : 0,
            description: '產品質量達到98%以上可獲得額外10分'
          },
          {
            reason: '品質改善',
            score: data.qualityImprovement ? 5 : 0,
            description: '持續改善品質可獲得額外5分'
          }
        ],
        finalScore: value
      };
      break;
      
    case 'efficiency':
      breakdown = {
        baseScore: data.workHours,
        adjustments: [
          {
            reason: '效率提升',
            score: data.efficiencyImprovement ? 8 : 0,
            description: '相比上月效率提升可獲得額外8分'
          }
        ],
        finalScore: value
      };
      break;
      
    case 'attendance':
      breakdown = {
        baseScore: data.attendance,
        adjustments: [
          {
            reason: '全勤獎勵',
            score: data.attendance >= 98 ? 5 : 0,
            description: '出勤率達98%以上可獲得額外5分'
          }
        ],
        finalScore: value
      };
      break;
      
    case 'maintenance':
      breakdown = {
        baseScore: data.machineStatus,
        adjustments: [
          {
            reason: '預防性維護',
            score: data.preventiveMaintenance ? 5 : 0,
            description: '執行預防性維護可獲得額外5分'
          },
          {
            reason: '設備效能提升',
            score: data.equipmentEfficiency > 90 ? 5 : 0,
            description: '設備效能超過90%可獲得額外5分'
          }
        ],
        finalScore: value
      };
      break;
  }
  
  return breakdown;
};

// 修改詳情彈窗組件
const MetricDetailModal = ({ metric, data, isOpen, onClose }) => {
  if (!isOpen) return null;
  
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
            <p className="text-slate-300">{metric.description}</p>
          </div>
          
          {/* 得分明細 */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-2">得分計算明細</h4>
            
            {/* 基礎分數 */}
            <div className="mb-4">
              <div className="flex justify-between text-slate-300">
                <span>基礎得分</span>
                <span>{breakdown.baseScore}分</span>
              </div>
              <div className="text-sm text-slate-400 mt-1">
                基於基本工作表現計算的得分
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
                      <span>+{adjustment.score}分</span>
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
                <span>{breakdown.finalScore}分</span>
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
                    backgroundColor: '#1e293b',
                    border: 'none',
                    borderRadius: '0.5rem',
                    padding: '0.5rem'
                  }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* 改進建議 */}
          <div className="bg-slate-700 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-white mb-2">改進建議</h4>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              {generateImprovement(data).suggestions
                .filter(s => s.category === metric.id)
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
            <span className="font-semibold">{employeeData.workCompletion}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span>產品質量</span>
            <span className="font-semibold">{employeeData.productQuality}%</span>
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
            <span className="font-semibold text-lg">{totalScore.toFixed(1)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>公平性指標</span>
            <span className={`font-semibold ${
              fairnessIndex >= 85 ? 'text-green-400' : 'text-red-400'
            }`}>
              {fairnessIndex.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PerformanceDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedEmployee, setSelectedEmployee] = useState('EMP001');
  const [isLoading, setIsLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  const evaluator = new PerformanceEvaluator('operator');
  
  // 修改 employeeData 的初始狀態，確保所有指標都有數據
  const [employeeData, setEmployeeData] = useState({
    workCompletion: 85,        // 工作完成量
    productQuality: 92,        // 產品質量
    workHours: 88,            // 工作時間
    attendance: 95,           // 差勤紀錄
    machineStatus: 87,        // 機台運行狀態
    maintenanceRecord: 90,    // 機台維護紀錄
    targetAchievement: 86,    // 目標達成率
    kpi: 89,                  // 關鍵績效指標
    efficiency: 91,           // 效率指標
    historicalData: [
      { month: '1月', value: 85 },
      { month: '2月', value: 87 },
      { month: '3月', value: 89 },
      { month: '4月', value: 86 },
      { month: '5月', value: 88 },
      { month: '6月', value: 90 }
    ]
  });

  const employees = [
    { id: 'EMP001', name: '張小明' },
    { id: 'EMP002', name: '李小華' },
    { id: 'EMP003', name: '王大明' }
  ];

  const timeSeriesData = [
    { month: '1月', completion: 82, quality: 88, efficiency: 85 },
    { month: '2月', completion: 85, quality: 90, efficiency: 86 },
    { month: '3月', completion: 88, quality: 92, efficiency: 89 },
    { month: '4月', completion: 85, quality: 91, efficiency: 87 },
    { month: '5月', completion: 87, quality: 93, efficiency: 88 },
    { month: '6月', completion: 89, quality: 94, efficiency: 90 }
  ];

  const metrics = [
    {
      id: 'workCompletion',
      title: '工作完成量',
      value: (data) => data?.workCompletion || 0,
      icon: <Activity className="w-6 h-6" />,
      color: 'text-blue-500',
      target: 95,
      weight: 0.125
    },
    {
      id: 'quality',
      title: '產品質量',
      value: (data) => data?.productQuality || 0,
      icon: <Target className="w-6 h-6" />,
      color: 'text-green-500',
      target: 98,
      weight: 0.125
    },
    {
      id: 'workHours',
      title: '工作時間',
      value: (data) => data?.workHours || 0,
      icon: <Clock className="w-6 h-6" />,
      color: 'text-orange-400',
      target: 100,
      weight: 0.125
    },
    {
      id: 'attendance',
      title: '差勤紀錄',
      value: (data) => data?.attendance || 0,
      icon: <Calendar className="w-6 h-6" />,
      color: 'text-pink-400',
      target: 95,
      weight: 0.125
    },
    {
      id: 'machineStatus',
      title: '機台運行狀態',
      value: (data) => data?.machineStatus || 0,
      icon: <Settings className="w-6 h-6" />,
      color: 'text-cyan-400',
      target: 90,
      weight: 0.125
    },
    {
      id: 'maintenance',
      title: '機台維護紀錄',
      value: (data) => data?.maintenanceRecord || 0,
      icon: <Wrench className="w-6 h-6" />,
      color: 'text-purple-400',
      target: 90,
      weight: 0.125
    },
    {
      id: 'targetAchievement',
      title: '目標達成率',
      value: (data) => data?.targetAchievement || 0,
      icon: <Target className="w-6 h-6" />,
      color: 'text-red-400',
      target: 90,
      weight: 0.125
    },
    {
      id: 'kpi',
      title: '關鍵績效指標',
      value: (data) => data?.kpi || 0,
      icon: <BarChart className="w-6 h-6" />,
      color: 'text-yellow-400',
      target: 85,
      weight: 0.125
    },
    {
      id: 'efficiency',
      title: '效率指標',
      value: (data) => data?.efficiency || 0,
      icon: <Zap className="w-6 h-6" />,
      color: 'text-lime-400',
      target: 85,
      weight: 0.125
    }
  ];

  // 新增：顯示加班影響和特殊貢獻的指標
  const additionalMetrics = [
    {
      id: 'overtime',
      title: '加班影響',
      description: '加班時數對績效的影響',
      value: (data) => {
        const evaluator = new PerformanceEvaluator(data.role);
        return evaluator.calculateOvertimeImpact(data.overtimeHours);
      },
      color: 'bg-yellow-500'
    },
    {
      id: 'promotion',
      title: '推廣加成',
      description: '推廣期間的績效加成',
      value: (data) => {
        const evaluator = new PerformanceEvaluator(data.role);
        return evaluator.calculatePromotionBonus(data.monthInRole, data.baseScore);
      },
      color: 'bg-purple-500'
    },
    {
      id: 'special',
      title: '特殊貢獻',
      description: '特殊貢獻加分',
      value: (data) => {
        const evaluator = new PerformanceEvaluator(data.role);
        return evaluator.calculateSpecialContribution(data.contributions);
      },
      color: 'bg-green-500'
    }
  ];

  // 模擬數據
  const mockEmployeeData = {
    EMP001: {
      workCompletion: 92,
      productQuality: 95,
      workHours: 176,
      attendance: 98,
      machineStatus: 94,
      maintenanceRecord: 92,
      targetAchievement: 91,
      kpi: 88,
      efficiency: 93,
      historicalData: [
        { month: '1月', completion: 88, quality: 92, efficiency: 90 },
        { month: '2月', completion: 90, quality: 93, efficiency: 91 },
        { month: '3月', completion: 92, quality: 95, efficiency: 93 }
      ],
      efficiencyData: [
        { category: '工作效率', value: 85 },
        { category: '機台效率', value: 90 },
        { category: '品質效率', value: 88 },
        { category: '時間效率', value: 92 }
      ]
    },
    EMP002: {
      workCompletion: 85,
      productQuality: 88,
      workHours: 168,
      attendance: 95,
      machineStatus: 87,
      maintenanceRecord: 86,
      targetAchievement: 84,
      kpi: 82,
      efficiency: 85,
      historicalData: [
        { month: '1月', completion: 82, quality: 85, efficiency: 83 },
        { month: '2月', completion: 84, quality: 86, efficiency: 84 },
        { month: '3月', completion: 85, quality: 88, efficiency: 85 }
      ]
    },
    EMP003: {
      workCompletion: 78,
      productQuality: 82,
      workHours: 160,
      attendance: 88,
      machineStatus: 80,
      maintenanceRecord: 79,
      targetAchievement: 77,
      kpi: 75,
      efficiency: 78,
      historicalData: [
        { month: '1月', completion: 75, quality: 80, efficiency: 76 },
        { month: '2月', completion: 76, quality: 81, efficiency: 77 },
        { month: '3月', completion: 78, quality: 82, efficiency: 78 }
      ]
    }
  };

  useEffect(() => {
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
        console.error('Error loading employee data:', error);
        setIsLoading(false);
      }
    };

    loadEmployeeData();
  }, [selectedEmployee]);

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

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
    setSelectedEmployee(e.target.value);
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 
              className="text-3xl font-bold text-white cursor-pointer hover:text-blue-400 transition-colors duration-200 flex items-center gap-2"
            >
              <Activity className="w-8 h-8" />
              員工智慧考核系統
            </h1>
            <div className="flex items-center gap-4">
              <select
                className="bg-slate-700 text-white border-slate-600 rounded-lg p-2"
                value={selectedEmployee}
                onChange={handleEmployeeChange}
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
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
                        alert('修改密碼功能待實現');
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

          {/* Tabs */}
          <div className="flex gap-4 mb-6">
            {[
              { id: 'dashboard', label: '績效儀表板', icon: <Activity size={20} /> },
              { id: 'details', label: '詳細數據', icon: <Target size={20} /> },
              { id: 'recommendations', label: '改進建議', icon: <Award size={20} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Dashboard View */}
            {activeTab === 'dashboard' && (
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
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                        <Legend />
                        <Line type="monotone" dataKey="completion" stroke="#10B981" name="完成率" />
                        <Line type="monotone" dataKey="quality" stroke="#3B82F6" name="質量" />
                        <Line type="monotone" dataKey="efficiency" stroke="#F59E0B" name="效率" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {/* Details View */}
            {activeTab === 'details' && (
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
                        <tr key={metric.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                            <div className="flex items-center">
                              <span className="mr-2">{metric.icon}</span>
                              {metric.title}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                            {metric.value(employeeData)}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-slate-200">
                            80%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span 
                              className={`px-2 py-1 rounded-full text-sm ${
                                metric.value(employeeData) === 100
                                  ? 'bg-gradient-to-r from-purple-300 via-purple-100 to-purple-300 text-purple-800'
                                  : metric.value(employeeData) >= 90
                                  ? 'bg-green-100 text-green-800'
                                  : metric.value(employeeData) >= 80
                                  ? 'bg-blue-100 text-blue-800'
                                  : metric.value(employeeData) >= 70
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : metric.value(employeeData) >= 60
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                              style={metric.value(employeeData) === 100 ? {
                                backgroundSize: '200% 100%',
                                animation: 'shimmer 2s infinite linear'
                              } : undefined}
                            >
                              {/* {metric.value(employeeData) === 100 && (
                                <span className="mr-1">✨</span>
                              )} */}
                              {metric.value(employeeData) === 100
                                ? '完美'
                                : metric.value(employeeData) >= 90
                                ? '優秀'
                                : metric.value(employeeData) >= 80
                                ? '良好'
                                : metric.value(employeeData) >= 70
                                ? '待加強'
                                : metric.value(employeeData) >= 60
                                ? '不及格'
                                : '極需改進'}
                              {/* {metric.value(employeeData) === 100 && (
                                <span className="ml-1">✨</span>
                              )} */}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recommendations View */}
            {activeTab === 'recommendations' && (
              <div className="space-y-4">
                {metrics.map((metric) => {
                  const value = metric.value(employeeData);
                  const performanceLevel = 
                    value === 100 ? 'perfect' :
                    value >= 90 ? 'excellent' :
                    value >= 80 ? 'good' :
                    value >= 70 ? 'needsImprovement' :
                    value >= 60 ? 'poor' : 'critical';

                  return (
                    <div
                      key={metric.id}
                      className={`bg-slate-700 rounded-xl p-6 text-white border-l-4 ${
                        performanceLevel === 'perfect' ? 'border-purple-500' :
                        performanceLevel === 'excellent' ? 'border-green-500' :
                        performanceLevel === 'good' ? 'border-blue-500' :
                        performanceLevel === 'needsImprovement' ? 'border-yellow-500' :
                        performanceLevel === 'poor' ? 'border-orange-500' : 'border-red-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className="mr-2">{metric.icon}</span>
                          <h3 className="text-lg font-bold">{metric.title}建議</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-sm ${
                          performanceLevel === 'perfect' 
                            ? 'bg-gradient-to-r from-purple-300 via-purple-100 to-purple-300 text-purple-800 animate-shimmer relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent'
                            : performanceLevel === 'excellent' 
                            ? 'bg-green-100 text-green-800'
                            : performanceLevel === 'good' 
                            ? 'bg-blue-100 text-blue-800'
                            : performanceLevel === 'needsImprovement' 
                            ? 'bg-yellow-100 text-yellow-800'
                            : performanceLevel === 'poor' 
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                        style={performanceLevel === 'perfect' ? {
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite linear'
                        } : undefined}>
                          {/* {performanceLevel === 'perfect' && (
                            <span className="mr-1">✨</span>
                          )} */}
                          {performanceLevel === 'perfect' ? '表現完美' :
                           performanceLevel === 'excellent' ? '表現優異' :
                           performanceLevel === 'good' ? '表現良好' :
                           performanceLevel === 'needsImprovement' ? '需要改進' :
                           performanceLevel === 'poor' ? '表現不佳' : '急需改進'}
                          {/* {performanceLevel === 'perfect' && (
                            <span className="ml-1">✨</span>
                          )} */}
                        </span>
                      </div>
                      <p className="text-slate-300">
                        {performanceLevel === 'perfect'
                          ? `目前${metric.title}表現完美，建議持續保持並協助其他同仁。`
                          : performanceLevel === 'excellent'
                          ? `目前${metric.title}表現優異，建議持續保持並協助其他同仁。`
                          : performanceLevel === 'good'
                          ? `目前${metric.title}表現良好，建議持續保持並協助其他同仁。`
                          : performanceLevel === 'needsImprovement'
                          ? `建議參加${metric.title}相關培訓課程，提升專業技能。`
                          : performanceLevel === 'poor'
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