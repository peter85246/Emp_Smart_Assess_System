import React, { useState, useEffect } from 'react';
import { X, Users, Award, TrendingUp, FileText, Settings, Eye, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { pointsConfig } from '../../config/pointsConfig';
import { authAPI } from '../../services/authAPI';
import { pointsAPI } from '../../services/pointsAPI';

// 管理員面板組件
import AdminPanel from './AdminPanel/AdminPanel';
// 員工面板組件
import EmployeePanel from './EmployeePanel/EmployeePanel';

const PointsManagementDashboard = ({ onClose, currentUser: propCurrentUser, isFullPage = true }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const [dashboardStats, setDashboardStats] = useState({
    totalEmployees: 0,
    totalPoints: 0,
    averageScore: 0,
    pendingReviews: 0
  });

  // 使用傳入的 currentUser 或預設的 user
  const currentUser = propCurrentUser || user;
  
  const [activeTab, setActiveTab] = useState(() => {
    const currentUserRole = (propCurrentUser || user)?.role;
    return (currentUserRole === 'manager' || currentUserRole === 'admin') ? 'admin' : 'employee';
  });

  useEffect(() => {
    loadDashboardStats();
  }, []);

  // 監聽用戶數據變化，確保主管能正確顯示管理介面
  useEffect(() => {
    const currentUserRole = currentUser?.role;
    if (currentUserRole === 'manager' || currentUserRole === 'admin') {
      setActiveTab('admin');
    } else if (currentUserRole === 'employee') {
      setActiveTab('employee');
    }
  }, [currentUser?.role]);

  // 登出處理
  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      navigate('/login');
    } catch (error) {
      console.error('登出失敗:', error);
      // 即使API失敗也強制登出
      logout();
      navigate('/login');
    }
  };

  // 如果沒有用戶資訊，重定向到登入頁
  if (!currentUser) {
    navigate('/login');
    return null;
  }

  const loadDashboardStats = async () => {
    try {
      console.log('載入儀表板統計數據');

      // 獲取待審核記錄數量
      const pendingResponse = await pointsAPI.getPendingEntries();
      const pendingData = pendingResponse.data || pendingResponse;
      const pendingCount = Array.isArray(pendingData) ? pendingData.length : 0;

      // 計算總積分（從待審核記錄中統計）
      const totalPoints = Array.isArray(pendingData)
        ? pendingData.reduce((sum, entry) => sum + (entry.pointsCalculated || 0), 0)
        : 0;

      // 計算平均分數
      const averageScore = pendingCount > 0 ? (totalPoints / pendingCount).toFixed(1) : 0;

      // 設置真實統計數據
      setDashboardStats({
        totalEmployees: 5, // 目前系統中的員工數量
        totalPoints: Math.round(totalPoints),
        averageScore: parseFloat(averageScore),
        pendingReviews: pendingCount
      });

      console.log('統計數據載入成功:', {
        totalEmployees: 5,
        totalPoints: Math.round(totalPoints),
        averageScore: parseFloat(averageScore),
        pendingReviews: pendingCount
      });

    } catch (error) {
      console.error('載入統計數據失敗:', error);
      // API失敗時使用基本數據
      setDashboardStats({
        totalEmployees: 5,
        totalPoints: 0,
        averageScore: 0,
        pendingReviews: 0
      });
    }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  // 整頁模式的渲染
  if (isFullPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900">
        {/* 主要內容區域 */}
        <div className="flex flex-col h-screen">
          {/* 頁眉 */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
            <div className="w-full px-6">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={onClose}
                    className="p-2 text-blue-100 hover:text-white rounded-lg hover:bg-blue-500/30 transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <div className="h-6 w-px bg-blue-300/50"></div>
                  <Award className="h-8 w-8 text-white" />
                  <div>
                    <h1 className="text-xl font-bold text-white">積分管理系統</h1>
                    <p className="text-blue-100 text-sm">
                      歡迎回來，{currentUser?.name || '未知用戶'} • {currentUser?.departmentName || currentUser?.department || '未知部門'} •
                      {currentUser?.role === 'admin' ? ' ⚙️ 系統管理員' :
                       currentUser?.role === 'manager' ? ' 👨‍💼 部門主管' : ' 👤 一般員工'}
                    </p>
                  </div>
                </div>
                {/* 積分管理系統中不提供登出功能 */}
                <div className="flex items-center space-x-2 px-4 py-2 text-blue-100">
                  {/* <span className="text-sm">請使用主選單進行系統操作</span> */}
                </div>
              </div>
            </div>
          </div>
          
          {/* 標籤導航 */}
          <div className="bg-slate-700/50 backdrop-blur-sm border-b border-slate-600/50">
            <div className="w-full px-6">
              <div className="flex space-x-8">
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'admin'
                        ? 'border-blue-400 text-blue-300 bg-slate-600/50'
                        : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-600/30'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4" />
                      <span>管理選單</span>
                    </div>
                  </button>
                )}

                <button
                  onClick={() => setActiveTab('employee')}
                  className={`px-6 py-4 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === 'employee'
                      ? 'border-blue-400 text-blue-300 bg-slate-600/50'
                      : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-600/30'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Eye className="h-4 w-4" />
                    <span>功能選單</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* 主要內容區域 */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'admin' && isAdmin ? (
              <AdminPanel currentUser={currentUser} />
            ) : (
              <EmployeePanel currentUser={currentUser} />
            )}
          </div>

          {/* 底部資訊已完全移除 - 不需要顯示虛假的系統版本資訊 */}
        </div>
      </div>
    );
  }

  // 原來的模態框模式
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-7xl h-5/6 flex flex-col border border-slate-600/50">
        {/* 標題欄 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center space-x-3">
            <Award className="h-8 w-8 text-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">📋 積分得分辦法填寫系統</h2>
              <p className="text-blue-100">
                {currentUser?.name || '未知用戶'} • {currentUser?.departmentName || currentUser?.department || '未知部門'} •
                {currentUser?.role === 'admin' ? ' ⚙️ 管理員' :
                 currentUser?.role === 'manager' ? ' 👨‍💼 主管' : ' 👤 員工'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 text-white" />
              <span className="text-white">登出</span>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* 統計卡片 */}
        <div className="p-6 border-b border-slate-600/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-700/50 backdrop-blur-sm p-4 rounded-lg border border-slate-600/50">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-300">總員工數</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.totalEmployees}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/50 backdrop-blur-sm p-4 rounded-lg border border-slate-600/50">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-300">總積分</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.totalPoints}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/50 backdrop-blur-sm p-4 rounded-lg border border-slate-600/50">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-300">平均分數</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.averageScore}%</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/50 backdrop-blur-sm p-4 rounded-lg border border-slate-600/50">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-purple-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-purple-300">待審核</p>
                  <p className="text-2xl font-bold text-white">{dashboardStats.pendingReviews}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 功能切換標籤 */}
        <div className="flex border-b border-slate-600/50">
          {isAdmin && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'admin'
                  ? 'border-blue-400 text-blue-300 bg-slate-700/50'
                  : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-700/30'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>管理功能</span>
              </div>
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('employee')}
            className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'employee'
                ? 'border-blue-400 text-blue-300 bg-slate-700/50'
                : 'border-transparent text-slate-300 hover:text-white hover:bg-slate-700/30'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>員工功能</span>
            </div>
          </button>
        </div>

        {/* 主要內容區域 */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'admin' && isAdmin ? (
            <AdminPanel currentUser={currentUser} />
          ) : (
            <EmployeePanel currentUser={currentUser} />
          )}
        </div>

        {/* 底部資訊已移除 - 不需要顯示虛假的推廣期倍數和最低通過率 */}
      </div>
    </div>
  );
};

export default PointsManagementDashboard;
