import React, { useState, useEffect } from 'react';
import { Settings, Users, BarChart3, FileText, Target, Award } from 'lucide-react';
import ManagerReviewForm from './ManagerReviewForm';
import { pointsAPI } from '../../../services/pointsAPI';



// 子組件（暫時創建基本結構）
const StandardSettingsPanel = ({ currentUser }) => (
  <div className="min-h-screen p-6 flex flex-col">
    <h3 className="text-xl font-bold text-white mb-4">評分標準設定</h3>
    <div className="flex-1 bg-slate-700/30 backdrop-blur-sm rounded-lg p-8 flex items-center justify-center border border-slate-600/50">
      <div className="text-center">
        <Settings className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-300">評分標準設定功能開發中...</p>
        <p className="text-sm text-slate-400 mt-2">此功能將允許管理員設定各種積分項目的評分標準</p>
      </div>
    </div>
  </div>
);

const TargetScoreView = ({ currentUser }) => (
  <div className="min-h-screen p-6 flex flex-col">
    <h3 className="text-xl font-bold text-white mb-4">目標分數顯示</h3>
    <div className="flex-1 bg-slate-700/30 backdrop-blur-sm rounded-lg p-8 flex items-center justify-center border border-slate-600/50">
      <div className="text-center">
        <Target className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-300">目標分數顯示功能開發中...</p>
        <p className="text-sm text-slate-400 mt-2">此功能將顯示所有員工的目標達成率</p>
      </div>
    </div>
  </div>
);

const WorkLogManagement = ({ currentUser }) => (
  <div className="min-h-screen p-6 flex flex-col">
    <h3 className="text-xl font-bold text-white mb-4">工作日誌管理</h3>
    <div className="flex-1 bg-slate-700/30 backdrop-blur-sm rounded-lg p-8 flex items-center justify-center border border-slate-600/50">
      <div className="text-center">
        <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-300">工作日誌管理功能開發中...</p>
        <p className="text-sm text-slate-400 mt-2">此功能將允許搜索與分類管理工作日誌</p>
      </div>
    </div>
  </div>
);

const PointsSystemConfig = ({ currentUser }) => (
  <div className="min-h-screen p-6 flex flex-col">
    <h3 className="text-xl font-bold text-white mb-4">積分制度定義</h3>
    <div className="flex-1 bg-slate-700/30 backdrop-blur-sm rounded-lg p-8 flex items-center justify-center border border-slate-600/50">
      <div className="text-center">
        <Award className="h-12 w-12 text-slate-400 mx-auto mb-4" />
        <p className="text-slate-300">積分制度定義功能開發中...</p>
        <p className="text-sm text-slate-400 mt-2">此功能將允許設計與整理積分制度表</p>
      </div>
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
    <div className="min-h-screen flex bg-gradient-to-br from-slate-800 to-slate-900">
      {/* 左側導航 */}
      <div className="w-80 bg-gradient-to-b from-slate-700/50 to-slate-800/50 border-r border-slate-600/50 p-6 shadow-sm flex-shrink-0">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white mb-2 flex items-center">
            <Settings className="h-5 w-5 text-blue-400 mr-2" />
            管理功能
          </h3>
          <p className="text-sm text-slate-300">
            管理員專用功能，可以設定評分標準、查看整體統計等
          </p>
        </div>

        {/* 管理員統計卡片 */}
        <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 mb-4 shadow-md border border-slate-600/50">
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
          <h4 className="text-sm font-medium text-slate-200 mb-2 flex items-center">
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
      <div className="flex-1 min-h-screen overflow-auto bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800">
        <div className="h-full">
          <ActiveComponent currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
