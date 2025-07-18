import React, { useState } from 'react';
import { User, UserCheck, CheckSquare, Edit, Upload, Star } from 'lucide-react';
import InteractivePointsForm from '../EmployeePanel/InteractivePointsForm';
import ManagerReviewForm from '../AdminPanel/ManagerReviewForm';

const FullFeaturedDemo = () => {
  const [currentView, setCurrentView] = useState('employee');
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
      id: 'employee',
      title: '👤 員工填寫功能',
      icon: User,
      description: '完整的積分表單填寫體驗',
      highlights: [
        '✅ 勾選完成的工作項目',
        '✅ 填寫具體數量和類型',
        '✅ 詳細描述工作內容',
        '✅ 上傳證明文件',
        '✅ 即時積分計算',
        '✅ 推廣期倍數自動應用'
      ]
    },
    {
      id: 'manager',
      title: '👨‍💼 主管審核功能',
      icon: UserCheck,
      description: '完整的審核和評分體驗',
      highlights: [
        '✅ 查看員工提交的表單',
        '✅ 檢視工作說明和文件',
        '✅ 編輯和評分功能',
        '✅ 星級評分系統',
        '✅ 核准或拒絕申請',
        '✅ 添加審核意見'
      ]
    }
  ];

  const systemFeatures = [
    {
      icon: CheckSquare,
      title: '真實可用的表單',
      description: '33個積分項目，支援勾選、數量輸入、下拉選擇'
    },
    {
      icon: Edit,
      title: '主管編輯權限',
      description: '主管可以編輯員工填寫的內容並進行評分'
    },
    {
      icon: Upload,
      title: '檔案上傳功能',
      description: '支援多種格式的證明文件上傳'
    },
    {
      icon: Star,
      title: '評分系統',
      description: '5星評分系統，量化工作表現'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 標題區域 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            🎯 積分管理系統 - 完整功能演示
          </h1>
          <p className="text-xl opacity-90">
            真正可填寫的積分表單 + 主管審核評分功能
          </p>
        </div>
      </div>

      {/* 功能選擇 */}
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">🚀 選擇體驗功能</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.id}
                  onClick={() => setCurrentView(feature.id)}
                  className={`p-6 rounded-lg border-2 cursor-pointer transition-all ${
                    currentView === feature.id
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                    <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  <ul className="space-y-1">
                    {feature.highlights.map((highlight, index) => (
                      <li key={index} className="text-sm text-gray-700">{highlight}</li>
                    ))}
                  </ul>
                  {currentView === feature.id && (
                    <div className="mt-4 text-blue-600 font-medium">✓ 當前選擇</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 用戶角色選擇 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">選擇用戶角色</h3>
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

        {/* 系統特色 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">🌟 系統特色</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <Icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-medium text-gray-900 mb-1">{feature.title}</h4>
                  <p className="text-xs text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 使用說明 */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-bold text-green-900 mb-3">📋 使用說明</h3>
          {currentView === 'employee' ? (
            <div className="text-sm text-green-800 space-y-2">
              <p><strong>員工填寫流程：</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>瀏覽下方的積分項目表單</li>
                <li>勾選您已完成的工作項目</li>
                <li>填寫具體的數量或選擇對應類型</li>
                <li>在每個項目下詳細描述工作內容</li>
                <li>上傳相關的證明文件（照片、報告等）</li>
                <li>查看右上角的總積分計算</li>
                <li>點擊「提交積分表單」完成提交</li>
              </ol>
            </div>
          ) : (
            <div className="text-sm text-green-800 space-y-2">
              <p><strong>主管審核流程：</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>從左側列表選擇要審核的員工提交</li>
                <li>查看員工填寫的工作內容和上傳的文件</li>
                <li>點擊「編輯評分」進入評分模式</li>
                <li>為每個項目給予1-5星評分</li>
                <li>填寫審核意見和建議</li>
                <li>選擇「核准」或「拒絕」</li>
              </ol>
            </div>
          )}
        </div>

        {/* 功能展示區域 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {currentView === 'employee' ? (
            <InteractivePointsForm currentUser={demoUser} />
          ) : (
            <ManagerReviewForm currentUser={demoUser} />
          )}
        </div>

        {/* 底部說明 */}
        <div className="mt-6 text-center text-gray-600">
          <p className="text-sm">
            💡 這是一個完整功能的演示系統，所有操作都會在控制台輸出模擬的API調用
          </p>
          <p className="text-xs mt-2">
            實際部署時，這些操作會連接到真實的後端API和資料庫
          </p>
        </div>
      </div>
    </div>
  );
};

export default FullFeaturedDemo;
