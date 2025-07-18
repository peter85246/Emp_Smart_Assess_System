import React, { useState } from 'react';
import { Play, User, UserCheck, Settings, Award, FileText, Target } from 'lucide-react';
import PointsManagementDashboard from '../PointsManagementDashboard';

const PointsSystemDemo = () => {
  const [showDemo, setShowDemo] = useState(false);
  const [demoUser, setDemoUser] = useState({
    id: 1,
    name: '張小明',
    role: 'employee',
    departmentId: 1,
    department: '製造部'
  });

  const demoUsers = [
    { id: 1, name: '張小明', role: 'employee', departmentId: 1, department: '製造部' },
    { id: 2, name: '李小華', role: 'employee', departmentId: 2, department: '品質工程部' },
    { id: 3, name: '王大明', role: 'manager', departmentId: 1, department: '製造部' },
    { id: 4, name: '陳小芳', role: 'admin', departmentId: 3, department: '管理部' }
  ];

  const features = [
    {
      icon: User,
      title: '員工功能',
      description: '積分項目填寫、個人分數查看、工作日誌記錄',
      items: [
        '✅ 選擇積分類型（一般/專業/管理/核心職能）',
        '✅ 填寫詳細工作說明',
        '✅ 上傳證明文件',
        '✅ 即時積分計算預覽',
        '✅ 個人積分統計圖表',
        '✅ 工作日誌管理'
      ]
    },
    {
      icon: UserCheck,
      title: '主管功能',
      description: '審核員工積分申請、部門統計查看',
      items: [
        '✅ 積分申請審核（核准/拒絕）',
        '✅ 部門積分統計',
        '✅ 員工排名查看',
        '✅ 工作日誌審核',
        '✅ 評分標準調整'
      ]
    },
    {
      icon: Settings,
      title: '管理員功能',
      description: '系統設定、全域管理',
      items: [
        '✅ 評分標準定義',
        '✅ 積分制度設定',
        '✅ 用戶權限管理',
        '✅ 系統統計報表',
        '✅ 推廣期參數設定'
      ]
    }
  ];

  const systemHighlights = [
    {
      icon: Award,
      title: '智能積分計算',
      description: '基礎積分 + 獎勵積分 - 懲罰積分 × 推廣倍數'
    },
    {
      icon: FileText,
      title: '完整審核流程',
      description: '員工填寫 → 主管審核 → 系統計算 → 統計分析'
    },
    {
      icon: Target,
      title: '數據可視化',
      description: '豐富的圖表統計，清晰的進度追蹤'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 標題區域 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🎯 積分管理系統演示
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            完整實現PDF系統需求的員工積分評估系統
          </p>
          
          {/* 快速啟動按鈕 */}
          <div className="flex justify-center space-x-4 mb-8">
            <button
              onClick={() => setShowDemo(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 shadow-lg transition-all"
            >
              <Play className="h-5 w-5" />
              <span>🚀 立即體驗</span>
            </button>
          </div>

          {/* 用戶角色選擇 */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">選擇體驗角色</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {demoUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setDemoUser(user)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    demoUser.id === user.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="text-center">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.department}</div>
                    <div className="text-xs mt-1">
                      {user.role === 'employee' && '👤 員工'}
                      {user.role === 'manager' && '👨‍💼 主管'}
                      {user.role === 'admin' && '⚙️ 管理員'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 功能特色 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                <div className="flex items-center space-x-3 mb-4">
                  <Icon className="h-8 w-8 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-gray-600 mb-4">{feature.description}</p>
                <ul className="space-y-1">
                  {feature.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="text-sm text-gray-700">{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* 系統亮點 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">🌟 系統亮點</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {systemHighlights.map((highlight, index) => {
              const Icon = highlight.icon;
              return (
                <div key={index} className="text-center">
                  <Icon className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                  <h4 className="font-semibold text-gray-900 mb-2">{highlight.title}</h4>
                  <p className="text-sm text-gray-600">{highlight.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 使用流程 */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">📋 使用流程</h3>
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h4 className="font-medium text-gray-900">員工填寫</h4>
              <p className="text-sm text-gray-600">選擇積分項目並填寫工作內容</p>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h4 className="font-medium text-gray-900">主管審核</h4>
              <p className="text-sm text-gray-600">審核工作內容並核准積分</p>
            </div>
            <div className="text-gray-400">→</div>
            <div className="flex-1 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h4 className="font-medium text-gray-900">系統計算</h4>
              <p className="text-sm text-gray-600">自動計算最終積分並統計</p>
            </div>
          </div>
        </div>

        {/* 技術特色 */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🔧 技術特色</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">⚛️</div>
              <div className="text-sm font-medium">React 18</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🔷</div>
              <div className="text-sm font-medium">.NET Core 8</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🐘</div>
              <div className="text-sm font-medium">PostgreSQL</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-2xl mb-2">🐳</div>
              <div className="text-sm font-medium">Docker</div>
            </div>
          </div>
        </div>
      </div>

      {/* 積分管理系統模態框 */}
      {showDemo && (
        <PointsManagementDashboard 
          onClose={() => setShowDemo(false)}
          currentUser={demoUser}
        />
      )}
    </div>
  );
};

export default PointsSystemDemo;
