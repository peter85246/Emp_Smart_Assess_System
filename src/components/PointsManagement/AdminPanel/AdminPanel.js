import React, { useState, useEffect } from 'react';
import { Settings, Users, BarChart3, FileText, Target, Award } from 'lucide-react';
import ManagerReviewForm from './ManagerReviewForm';
import { pointsAPI } from '../../../services/pointsAPI';

// 積分審核面板
const PointsReviewPanel = ({ currentUser }) => {
  const [pendingEntries, setPendingEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingEntries();
  }, []);

  const loadPendingEntries = async () => {
    setLoading(true);
    try {
      console.log('載入待審核積分記錄');
      const response = await pointsAPI.getPendingEntries();
      console.log('獲取待審核記錄成功:', response);

      // 檢查響應格式並獲取數據
      const pendingData = response.data || response;
      console.log('處理後的待審核數據:', pendingData);

      setPendingEntries(Array.isArray(pendingData) ? pendingData : []);
    } catch (error) {
      console.error('載入待審核項目失敗:', error);
      // API失敗時顯示空列表
      setPendingEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (entryId) => {
    try {
      console.log('核准積分記錄:', entryId);
      await pointsAPI.approvePointsEntry(entryId, currentUser.id, '審核通過');
      console.log('積分記錄審核通過');
      await loadPendingEntries(); // 重新載入列表
    } catch (error) {
      console.error('核准失敗:', error);
      alert('核准失敗：' + (error.response?.data?.message || error.message));
    }
  };

  const handleReject = async (entryId, reason = '不符合標準') => {
    try {
      console.log('拒絕積分記錄:', entryId);
      await pointsAPI.rejectPointsEntry(entryId, currentUser.id, reason);
      console.log('積分記錄已拒絕');
      await loadPendingEntries(); // 重新載入列表
    } catch (error) {
      console.error('拒絕失敗:', error);
      alert('拒絕失敗：' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4">📋 積分審核管理</h3>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">載入中...</p>
        </div>
      ) : !pendingEntries || pendingEntries.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>目前沒有待審核的積分記錄</p>
        </div>
      ) : (
        <div className="space-y-4">
          {(pendingEntries || []).map((entry) => (
            <div key={entry?.id || Math.random()} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{entry?.standardName || '未知項目'}</h4>
                  <p className="text-sm text-gray-600">
                    {entry?.employeeName || '未知員工'} • {entry?.department || '未知部門'} • {entry?.submittedAt || '未知時間'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600">{entry?.pointsCalculated || 0} 積分</div>
                  <div className="text-xs text-gray-500">計算後積分</div>
                </div>
              </div>

              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">工作說明：</h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{entry?.description || '無說明'}</p>
              </div>

              {entry?.evidenceFiles && Array.isArray(entry.evidenceFiles) && entry.evidenceFiles.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">證明文件：</h5>
                  <div className="flex flex-wrap gap-2">
                    {entry.evidenceFiles.map((file, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        📎 {file}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleReject(entry?.id)}
                  className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
                >
                  ❌ 拒絕
                </button>
                <button
                  onClick={() => handleApprove(entry?.id)}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  ✅ 核准
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 子組件（暫時創建基本結構）
const StandardSettingsPanel = ({ currentUser }) => (
  <div className="p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">評分標準設定</h3>
    <div className="bg-gray-100 rounded-lg p-8 text-center">
      <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">評分標準設定功能開發中...</p>
    </div>
  </div>
);

const TargetScoreView = ({ currentUser }) => (
  <div className="p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">目標分數顯示</h3>
    <div className="bg-gray-100 rounded-lg p-8 text-center">
      <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">目標分數顯示功能開發中...</p>
    </div>
  </div>
);

const WorkLogManagement = ({ currentUser }) => (
  <div className="p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">工作日誌管理</h3>
    <div className="bg-gray-100 rounded-lg p-8 text-center">
      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">工作日誌管理功能開發中...</p>
    </div>
  </div>
);

const PointsSystemConfig = ({ currentUser }) => (
  <div className="p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">積分制度定義</h3>
    <div className="bg-gray-100 rounded-lg p-8 text-center">
      <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">積分制度定義功能開發中...</p>
    </div>
  </div>
);

const AdminPanel = ({ currentUser }) => {
  const [activeView, setActiveView] = useState('manager-review');

  const menuItems = [
    {
      id: 'manager-review',
      name: '主管審核評分',
      icon: FileText,
      description: '審核和評分員工積分表單',
      component: ManagerReviewForm
    },
    {
      id: 'review',
      name: '積分審核列表',
      icon: Users,
      description: '查看所有積分審核記錄',
      component: PointsReviewPanel
    },
    {
      id: 'standards',
      name: '評分標準設定',
      icon: Settings,
      description: '定義與選擇評分標準欄位',
      component: StandardSettingsPanel
    },
    {
      id: 'system',
      name: '積分制度定義',
      icon: Award,
      description: '設計與整理積分制度表',
      component: PointsSystemConfig
    },
    {
      id: 'targets',
      name: '目標分數顯示',
      icon: Target,
      description: '查看所有員工的目標達成率',
      component: TargetScoreView
    },
    {
      id: 'worklog',
      name: '工作日誌管理',
      icon: Users,
      description: '搜索與分類管理工作日誌',
      component: WorkLogManagement
    }
  ];

  const ActiveComponent = menuItems.find(item => item.id === activeView)?.component || StandardSettingsPanel;

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-800 to-slate-900">
      {/* 左側導航 */}
      <div className="w-80 bg-gradient-to-b from-slate-700/50 to-slate-800/50 border-r border-slate-600/50 p-6 shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
            <Settings className="h-5 w-5 text-blue-400 mr-2" />
            管理功能
          </h3>
          <p className="text-sm text-slate-300">
            管理員專用功能，可以設定評分標準、查看整體統計等
          </p>
        </div>

        {/* 管理員統計卡片 */}
        <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 mb-6 shadow-md border border-slate-600/50">
          <h4 className="text-sm font-medium text-slate-200 mb-3">系統統計</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">總員工數</span>
              <span className="text-lg font-bold text-blue-400">25</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">評分標準</span>
              <span className="text-sm text-white">33項</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">待審核</span>
              <span className="text-sm font-medium text-yellow-400">12項</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">平均分數</span>
              <span className="text-sm font-medium text-green-400">78.5%</span>
            </div>
          </div>
        </div>

        {/* 功能選單 */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-200 mb-3 flex items-center">
            <BarChart3 className="h-4 w-4 text-blue-400 mr-2" />
            管理選單
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

        {/* 快速操作 */}
        <div className="mt-6 p-4 bg-gradient-to-r from-slate-600/30 to-slate-700/30 rounded-lg border border-slate-500/50">
          <h4 className="text-sm font-medium text-yellow-300 mb-2 flex items-center">
            <Target className="h-4 w-4 text-yellow-400 mr-2" />
            快速操作
          </h4>
          <div className="space-y-2">
            <button className="w-full text-left text-xs text-yellow-300 hover:text-yellow-200 flex items-center">
              <span className="text-yellow-400 mr-1">⚡</span>
              批量審核積分記錄
            </button>
            <button className="w-full text-left text-xs text-green-300 hover:text-green-200 flex items-center">
              <span className="text-green-400 mr-1">📊</span>
              導出月度報表
            </button>
            <button className="w-full text-left text-xs text-blue-300 hover:text-blue-200 flex items-center">
              <span className="text-blue-400 mr-1">⚙️</span>
              設定推廣期參數
            </button>
          </div>
        </div>
      </div>

      {/* 右側內容區域 */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800">
        <ActiveComponent currentUser={currentUser} />
      </div>
    </div>
  );
};

export default AdminPanel;
