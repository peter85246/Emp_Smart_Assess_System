import React, { useState, useEffect } from 'react';
import { Plus, FileText, BarChart3, Calendar } from 'lucide-react';

// 子組件
import InteractivePointsForm from './InteractivePointsForm';
import PersonalScoreView from './PersonalScoreView';
import WorkLogEntry from './WorkLogEntry';
import { pointsAPI } from '../../../services/pointsAPI';

const EmployeePanel = ({ currentUser }) => {
  const [activeView, setActiveView] = useState('entry'); // 'entry', 'score', 'worklog'
  const [refreshTrigger, setRefreshTrigger] = useState(0); // 用於觸發數據刷新
  const [employeeStats, setEmployeeStats] = useState({
    currentMonthPoints: 0,
    targetPoints: 100,
    achievementRate: 0,
    pendingEntries: 0,
    approvedEntries: 0,
    rejectedEntries: 0,
    totalEntries: 0
  });

  useEffect(() => {
    loadEmployeeStats();
  }, [currentUser.id, refreshTrigger]);

  // 監聽積分表單提交事件
  useEffect(() => {
    const handlePointsSubmitted = () => {
      console.log('監聽到積分表單提交事件，刷新數據');
      refreshEmployeeData();
    };

    // 添加事件監聽器
    window.addEventListener('pointsSubmitted', handlePointsSubmitted);
    window.addEventListener('pointsApproved', handlePointsSubmitted);
    window.addEventListener('pointsRejected', handlePointsSubmitted);

    return () => {
      window.removeEventListener('pointsSubmitted', handlePointsSubmitted);
      window.removeEventListener('pointsApproved', handlePointsSubmitted);
      window.removeEventListener('pointsRejected', handlePointsSubmitted);
    };
  }, []);

  // 刷新統計數據
  const refreshEmployeeData = async () => {
    console.log('觸發員工數據刷新');
    console.log('當前 refreshTrigger:', refreshTrigger);
    setRefreshTrigger(prev => {
      console.log('更新 refreshTrigger:', prev + 1);
      return prev + 1;
    });
  };

  const loadEmployeeStats = async () => {
    try {
      // 確保用戶ID是數字格式
      let employeeId;
      if (typeof currentUser.id === 'string' && currentUser.id.startsWith('EMP')) {
        employeeId = parseInt(currentUser.id.replace('EMP', '').replace(/^0+/, '')) || 1;
      } else {
        employeeId = parseInt(currentUser.id) || 1;
      }

      console.log('載入員工統計數據 - 員工ID:', employeeId);

      // 獲取員工積分記錄
      let pointsData = [];
      try {
        const pointsResponse = await pointsAPI.getEmployeePoints(employeeId);
        pointsData = pointsResponse.data || pointsResponse || [];
        console.log('積分記錄API響應:', pointsResponse);
        console.log('處理後的積分記錄:', pointsData);
      } catch (pointsError) {
        console.error('獲取積分記錄失敗:', pointsError);
        pointsData = [];
      }

      // 獲取員工積分統計
      let summaryData = {};
      try {
        const summaryResponse = await pointsAPI.getEmployeePointsSummary(employeeId);
        summaryData = summaryResponse.data || summaryResponse || {};
        console.log('統計數據API響應:', summaryResponse);
        console.log('處理後的統計數據:', summaryData);
      } catch (summaryError) {
        console.error('獲取積分統計失敗:', summaryError);
        summaryData = {};
      }

      // 計算當前月積分 - 只計算已核准的積分
      const currentMonth = new Date();
      const currentMonthPoints = Array.isArray(pointsData) ?
        pointsData
          .filter(entry => {
            const entryDate = new Date(entry.entryDate || entry.submittedAt);
            return entryDate.getMonth() === currentMonth.getMonth() &&
                   entryDate.getFullYear() === currentMonth.getFullYear() &&
                   entry.status === 'approved'; // 只計算已核准的積分
          })
          .reduce((sum, entry) => sum + (entry.pointsEarned || entry.pointsCalculated || 0), 0) : 0;

      // 計算達成率
      const targetPoints = summaryData?.targetPoints || 100;
      const achievementRate = targetPoints > 0 ? Math.round((currentMonthPoints / targetPoints) * 100) : 0;

      // 按狀態統計項目數量 - 只統計當前月的項目
      let pendingEntries = 0;
      let approvedEntries = 0;
      let rejectedEntries = 0;

      console.log('=== 統計項目狀態 ===');
      console.log('積分數據:', pointsData);
      console.log('積分數據是否為數組:', Array.isArray(pointsData));
      console.log('積分數據長度:', pointsData?.length);

      if (Array.isArray(pointsData)) {
        // 篩選當前月的項目
        const currentMonthEntries = pointsData.filter(entry => {
          const entryDate = new Date(entry.entryDate || entry.submittedAt);
          return entryDate.getMonth() === currentMonth.getMonth() &&
                 entryDate.getFullYear() === currentMonth.getFullYear();
        });

        console.log('當前月項目數量:', currentMonthEntries.length);

        currentMonthEntries.forEach((entry, index) => {
          console.log(`積分記錄 ${index + 1}:`, {
            id: entry.id,
            status: entry.status,
            description: entry.description,
            entryDate: entry.entryDate || entry.submittedAt,
            pointsEarned: entry.pointsEarned || entry.pointsCalculated
          });

          switch (entry.status) {
            case 'pending':
              pendingEntries++;
              break;
            case 'approved':
              approvedEntries++;
              break;
            case 'rejected':
              rejectedEntries++;
              break;
            default:
              console.log(`未知狀態 "${entry.status}"，視為待審核`);
              pendingEntries++; // 預設為待審核
              break;
          }
        });
      }
      
      console.log('統計結果:', {
        pendingEntries,
        approvedEntries,
        rejectedEntries,
        total: pendingEntries + approvedEntries + rejectedEntries
      });
      
      const totalEntries = pendingEntries + approvedEntries + rejectedEntries;

      // 部門排名功能已移除
      const departmentRank = 0;
      const totalEmployees = 0;
      const departmentName = '';

      setEmployeeStats({
        currentMonthPoints: Math.round(currentMonthPoints * 10) / 10, // 保留一位小數
        targetPoints: targetPoints,
        achievementRate: Math.min(achievementRate, 100), // 最大100%
        pendingEntries: pendingEntries,
        approvedEntries: approvedEntries,
        rejectedEntries: rejectedEntries,
        totalEntries: totalEntries
      });

    } catch (error) {
      console.error('載入員工統計數據失敗:', error);
      // 如果API失敗，使用默認值
      setEmployeeStats({
        currentMonthPoints: 0,
        targetPoints: 100,
        achievementRate: 0,
        pendingEntries: 0,
        approvedEntries: 0,
        rejectedEntries: 0,
        totalEntries: 0
      });
    }
  };

  const menuItems = [
    {
      id: 'score',
      name: '個人分數查看',
      icon: BarChart3,
      description: '查看個人積分統計和趨勢'
    },
    {
      id: 'entry',
      name: '積分表單填寫',
      icon: Plus,
      description: '勾選和填寫積分得分辦法'
    },
    {
      id: 'worklog',
      name: '工作日誌',
      icon: FileText,
      description: '記錄日常工作內容'
    }
  ];

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-800 to-slate-900">
      {/* 左側導航 */}
      <div className="w-80 bg-gradient-to-b from-slate-700/50 to-slate-800/50 border-r border-slate-600/50 p-6 shadow-sm overflow-y-auto pb-8">
        {/* 個人統計卡片 */}
        <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md border border-slate-600/50">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
            <BarChart3 className="h-5 w-5 text-blue-400 mr-2" />
            本月統計
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">當前積分</span>
              <span className="text-lg font-bold text-blue-400">
                {employeeStats.currentMonthPoints}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">目標積分</span>
              <span className="text-sm text-white">{employeeStats.targetPoints}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">達成率</span>
              <span className={`text-sm font-medium ${
                employeeStats.achievementRate >= 80 ? 'text-green-400' :
                employeeStats.achievementRate >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {employeeStats.achievementRate}%
              </span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  employeeStats.achievementRate >= 80 ? 'bg-green-400' :
                  employeeStats.achievementRate >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                }`}
                style={{ width: `${Math.min(employeeStats.achievementRate, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 功能選單 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-200 mb-3 flex items-center">
            <Calendar className="h-4 w-4 text-blue-400 mr-2" />
            功能選單
          </h4>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 shadow-sm ${
                  activeView === item.id
                    ? 'bg-gradient-to-r from-slate-600/50 to-slate-700/50 text-blue-300 border border-blue-400/50 shadow-md'
                    : 'bg-slate-700/30 text-slate-200 hover:bg-gradient-to-r hover:from-slate-600/30 hover:to-slate-700/30 border border-slate-500/50 hover:border-blue-400/30'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                    activeView === item.id ? 'text-blue-300' : 'text-slate-400'
                  }`} />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-slate-400 mt-1">{item.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* 快速資訊 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-600/30 to-slate-700/30 rounded-lg border border-slate-500/50">
          <h4 className="text-sm font-medium text-blue-300 mb-2 flex items-center">
            <FileText className="h-4 w-4 text-blue-400 mr-2" />
            本月提醒
          </h4>
          <div className="text-xs text-blue-200 space-y-1">
            <div className="flex items-center">
              <span className="text-yellow-400 mr-1">⏳</span>
              待審核項目: {employeeStats.pendingEntries}
            </div>
            <div className="flex items-center">
              <span className="text-green-400 mr-1">✅</span>
              已核准項目: {employeeStats.approvedEntries}
            </div>
            <div className="flex items-center">
              <span className="text-red-400 mr-1">❌</span>
              已拒絕項目: {employeeStats.rejectedEntries}
            </div>
          </div>
        </div>
      </div>

      {/* 右側內容區域 */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 pb-8">
        {activeView === 'score' && (
          <PersonalScoreView 
            currentUser={currentUser} 
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeView === 'entry' && (
          <InteractivePointsForm 
            currentUser={currentUser} 
            onSubmissionSuccess={refreshEmployeeData}
          />
        )}

        {activeView === 'worklog' && (
          <WorkLogEntry />
        )}
      </div>
    </div>
  );
};

export default EmployeePanel;
