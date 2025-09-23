import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../services/authAPI';
import { toastConfig } from './Login';
import { pointsConfig } from '../config/pointsConfig';
import { departmentConfig } from '../config/departmentConfig';
import { REPORT_API } from '../config/apiConfig';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    employeeNumber: '',
    email: '',
    departmentId: '',
    position: '',
    role: 'employee', // 將根據職位自動設定
    password: '',
    confirmPassword: ''
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [autoAssignedRole, setAutoAssignedRole] = useState('employee');
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [departmentsLoaded, setDepartmentsLoaded] = useState(false);
  const [positionCheckResult, setPositionCheckResult] = useState(null);
  const [isCheckingPosition, setIsCheckingPosition] = useState(false);
  const navigate = useNavigate();

  // 根據職位自動分配角色
  const getAutoAssignedRole = (position) => {
    return pointsConfig.positionRoleMapping[position] || 'employee';
  };

  // 檢查是否為高階管理職位
  const isExecutivePosition = (position) => {
    return ['董事長', '負責人', '總經理', '執行長'].includes(position);
  };

  // 根據職位自動分配部門
  const getAutoAssignedDepartment = (position) => {
    const executiveDepartmentMapping = {
      '董事長': 9,   // 董事會
      '負責人': 9,   // 董事會
      '總經理': 10,  // 經營管理層
      '執行長': 10   // 經營管理層
    };
    return executiveDepartmentMapping[position] || '';
  };

  // 獲取部門名稱
  const getDepartmentName = (position) => {
    const executiveDepartmentNames = {
      '董事長': '董事會',
      '負責人': '董事會',
      '總經理': '經營管理層',
      '執行長': '經營管理層'
    };
    return executiveDepartmentNames[position] || '';
  };

  // 檢查職位可用性
  const checkPositionAvailability = async (position) => {
    if (!position || !isExecutivePosition(position)) {
      setPositionCheckResult(null);
      return;
    }

    setIsCheckingPosition(true);
    try {
      const response = await authAPI.checkPositionAvailability(position);
      setPositionCheckResult(response.data);
    } catch (error) {
      console.error('職位檢查失敗:', error);
      // 檢查失敗時假設可用，但提供警告
      setPositionCheckResult({
        isAvailable: true,
        isExclusivePosition: true,
        message: '無法驗證職位狀態，請確保資料正確'
      });
    } finally {
      setIsCheckingPosition(false);
    }
  };

  // 獲取角色描述
  const getRoleDescription = (role) => {
    const descriptions = {
      employee: '基層作業人員 - 可提交積分、查看個人資料',
      manager: '基層管理人員 - 可審核部門員工積分',
      admin: '中高層管理 - 可審核所有部門積分、系統設定',
      boss: '最高管理層 - 擁有全系統權限'
    };
    return descriptions[role] || '';
  };

  useEffect(() => {
    // 防重複載入機制 - 解決React StrictMode重複執行問題
    if (!departmentsLoaded) {
      loadDepartments();
    }
  }, [departmentsLoaded]);

  const loadDepartments = async () => {
    // 如果已經載入過，直接返回
    if (departmentsLoaded) return;
    
    try {
      // 直接使用預設的部門列表，對應報工系統的部門
      const defaultDepartments = [
        { id: '1', name: '管理者' },
        { id: '2', name: '加工' },
        { id: '3', name: '檢驗' },
        { id: '4', name: '品保' },
        { id: '5', name: '生管' },
        { id: '6', name: '技師' },
        { id: '7', name: '業助' },
        { id: '8', name: '其它' }
      ];
      setDepartments(defaultDepartments);
      setDepartmentsLoaded(true);
      setIsOfflineMode(false);
    } catch (error) {
      // 提供預設部門選項作為備用
      const defaultDepartments = [
        { id: 0, name: '主管' },     // 對應資料庫中的主管
        { id: 1, name: '技術' },     // 對應資料庫中的技術部門
        { id: 2, name: '加工' },     // 對應資料庫中的加工部門
        { id: 3, name: '品管' },     // 對應資料庫中的品管部門
        { id: 4, name: '品保' },     // 對應資料庫中的品保部門
        { id: 5, name: '業務' },     // 對應資料庫中的業務部門
        { id: 6, name: '管理者' }    // 對應資料庫中的管理者角色
      ];
      setDepartments(defaultDepartments);
      setDepartmentsLoaded(true);
      
      // 智能錯誤處理 - 區分錯誤類型
      if (error.message === 'Failed to fetch' || error.code === 'ERR_NETWORK') {
        // 連接問題 - 靜默處理，只在開發模式輸出（且只輸出一次）
        if (process.env.NODE_ENV === 'development') {
          console.info('ℹ️ 後端服務未啟動，使用本地部門資料 (功能正常)');
        }
        setIsOfflineMode(true);
        // 不顯示任何toast
      } else {
        // 真正的API錯誤才記錄並提示
        console.error('部門API錯誤:', error);
        toast.warn('正在使用標準部門選項，功能正常', {
          ...toastConfig.error,
          icon: "ℹ️",
          style: { ...toastConfig.error.style, backgroundColor: "#f59e0b", color: "#ffffff" }
        });
      }
    }
  };

  const handleChange = async (e) => {
    const { name, value } = e.target;
    
    // 處理職位選擇
    if (name === 'position') {
      const assignedRole = getAutoAssignedRole(value);
      
      // 檢查是否為高階職位
      if (isExecutivePosition(value)) {
        setFormData(prev => ({
          ...prev,
          position: value,
          role: assignedRole,
          departmentId: '' // 高階職位不需要選擇部門
        }));
        setAutoAssignedRole(assignedRole);
      } else {
        // 職位和部門ID的對應關係
        const positionToDepartmentId = {
          '管理者': '1',
          '加工': '2',
          '檢驗': '3',
          '品保': '4',
          '生管': '5',
          '技師': '6',
          '業助': '7',
          '其它': '8'
        };

        const departmentId = positionToDepartmentId[value] || '';

        setFormData(prev => ({
          ...prev,
          position: value,
          role: assignedRole,
          departmentId
        }));
        setAutoAssignedRole(assignedRole);
      }
      
      // 即時檢查職位可用性
      await checkPositionAvailability(value);
    } 
    // 處理部門選擇
    else if (name === 'departmentId') {
      // 如果是高階職位，禁止手動修改部門
      if (!isExecutivePosition(formData.position)) {
        // 部門ID和職位的對應關係
        const departmentIdToPosition = {
          '1': '管理者',
          '2': '加工',
          '3': '檢驗',
          '4': '品保',
          '5': '生管',
          '6': '技師',
          '7': '業助',
          '8': '其它'
        };

        const position = departmentIdToPosition[value] || '';
        if (position) {
          const assignedRole = getAutoAssignedRole(position);
          
          setFormData(prev => ({
            ...prev,
            departmentId: value,
            position: position,
            role: assignedRole
          }));
          setAutoAssignedRole(assignedRole);
        }
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('密碼確認不符！', toastConfig.error);
      return;
    }

    if (formData.password.length < 6) {
      toast.error('密碼至少需要6個字元！', toastConfig.error);
      return;
    }

    // 驗證部門
    if (!formData.departmentId) {
      toast.error('請選擇部門！', toastConfig.error);
      return;
    }

    // 驗證職位
    if (!formData.position.trim()) {
      toast.error('請選擇職位！', toastConfig.error);
      return;
    }

    // 檢查高階職位可用性
    if (isExecutivePosition(formData.position)) {
      if (positionCheckResult && !positionCheckResult.isAvailable) {
        toast.error(positionCheckResult.message + (positionCheckResult.suggestion ? `，${positionCheckResult.suggestion}` : ''), toastConfig.error);
        return;
      }
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        email: formData.email || null // Email為可選
      };
      
      // 注意：保留 confirmPassword 字段給後端驗證

      await authAPI.register(submitData);
      toast.success('註冊成功！請登入', toastConfig.success);
      
      // 註冊成功後導向登入頁面
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      let errorMessage = '註冊失敗，請稍後再試！';
      
      // 處理具體的錯誤類型
      if (error.response?.status === 409) {
        // 職位衝突錯誤
        const responseData = error.response.data;
        errorMessage = responseData.message || '職位已被佔用';
        if (responseData.suggestion) {
          errorMessage += `，${responseData.suggestion}`;
        }
      } else if (error.response?.status === 400) {
        // 一般驗證錯誤
        errorMessage = error.response.data?.message || '註冊資料有誤，請檢查後重試';
      } else if (error.response?.data?.message) {
        // 其他已知錯誤
        errorMessage = error.response.data.message;
      }
      
      toast.error(errorMessage, toastConfig.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* 背景裝飾 - 優化透明度呈現更好看的效果 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 transform rotate-12 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 transform -rotate-12 blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 transform rotate-45 blur-2xl"></div>
      </div>

      {/* 主要註冊卡片 */}
      <div className="max-w-lg w-full space-y-8 relative z-10">
        <div className="bg-slate-700/60 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-600/30">
          {/* Logo 區域 */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              員工註冊
            </h2>
            <p className="text-slate-300 text-center mb-8">
              創建您的積分管理系統帳號
            </p>
          </div>

          {/* 職位與角色對應說明 */}
          {/* <div className="bg-blue-600/10 border border-blue-400/30 rounded-xl p-4 mb-6">
            <h4 className="text-blue-300 font-medium mb-3 flex items-center">
              <span className="mr-2">ℹ️</span>
              職位與系統權限說明
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="w-16 text-blue-300 font-medium">員工：</span>
                  <span className="text-slate-300">技術士、技術員、品檢員、作業員</span>
                </div>
                <div className="flex items-center">
                  <span className="w-16 text-orange-300 font-medium">主管：</span>
                  <span className="text-slate-300">組長、領班、副理、副課長、廠長、課長</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="w-16 text-green-300 font-medium">管理員：</span>
                  <span className="text-slate-300">經理、協理、副總經理、執行長</span>
                </div>
                <div className="flex items-center">
                  <span className="w-16 text-purple-300 font-medium">老闆：</span>
                  <span className="text-slate-300">總經理、董事長、負責人</span>
                </div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400">
              系統將根據您選擇的職位自動分配相應的系統權限，無需手動選擇角色。
            </div>
          </div> */}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 姓名 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                姓名 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="請輸入姓名"
              />
            </div>

            {/* 員工編號 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                員工編號 *
              </label>
              <input
                type="text"
                name="employeeNumber"
                value={formData.employeeNumber}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="例如: EMP006"
              />
            </div>

            {/* Email (可選) */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email <span className="text-slate-400">(可選)</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="example@company.com (選填)"
              />
            </div>

            {/* 部門和職位 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  部門 *
                  {isExecutivePosition(formData.position) && (
                    <span className="text-xs text-blue-400 ml-2">
                      (系統已自動分配適當部門)
                    </span>
                  )}
                  {isOfflineMode && !isExecutivePosition(formData.position) && (
                    <span className="text-xs text-slate-400 ml-2">
                      (使用標準選項)
                    </span>
                  )}
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                  disabled={isExecutivePosition(formData.position)}
                  className={`w-full px-4 py-3 border rounded-xl focus:outline-none transition-all duration-200 ${
                    isExecutivePosition(formData.position)
                      ? 'bg-slate-700/50 border-slate-600/50 opacity-75 cursor-not-allowed text-slate-400'
                      : 'bg-slate-600/50 border-slate-500/50 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  }`}
                >
                  <option value="" className="bg-slate-700">請選擇部門</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id} className="bg-slate-700">
                      {dept.name}
                    </option>
                  ))}
                </select>
                {isExecutivePosition(formData.position) && (
                  <div className="mt-2 p-3 bg-amber-500/10 border border-amber-400/30 rounded-lg">
                    <div className="flex items-center text-amber-300 text-sm">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span>👑 高階管理職位已自動分配到「{getDepartmentName(formData.position)}」</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  職位 *
                </label>
                <select
                  name="position"
                  value={formData.position}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="" className="bg-slate-700">請選擇職位</option>
                  {pointsConfig.positionOptions.map(position => (
                    <option key={position} value={position} className="bg-slate-700">
                      {position}
                    </option>
                  ))}
                </select>
                
                {/* 職位檢查狀態顯示 */}
                {isCheckingPosition && (
                  <div className="mt-2 p-3 bg-blue-500/10 border border-blue-400/30 rounded-lg">
                    <div className="flex items-center text-blue-300 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300 mr-2"></div>
                      <span>正在檢查職位可用性...</span>
                    </div>
                  </div>
                )}
                
                {positionCheckResult && !isCheckingPosition && (
                  <div className={`mt-2 p-3 border rounded-lg ${
                    positionCheckResult.isAvailable 
                      ? 'bg-green-500/10 border-green-400/30' 
                      : 'bg-red-500/10 border-red-400/30'
                  }`}>
                    <div className={`flex items-center text-sm ${
                      positionCheckResult.isAvailable 
                        ? 'text-green-300' 
                        : 'text-red-300'
                    }`}>
                      {positionCheckResult.isAvailable ? (
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                      )}
                      <div>
                        <div>{positionCheckResult.message}</div>
                        {positionCheckResult.suggestion && !positionCheckResult.isAvailable && (
                          <div className="text-xs mt-1 text-orange-300">
                            💡 {positionCheckResult.suggestion}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 自動分配的角色顯示 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                系統自動分配角色
              </label>
              <div className="w-full px-4 py-3 bg-slate-600/30 border border-slate-500/50 rounded-xl text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-blue-300">
                      {pointsConfig.userRoles[autoAssignedRole] || '員工'}
                    </span>
                    {formData.position && (
                      <span className="text-slate-400 text-sm ml-2">
                        (根據職位「{formData.position}」自動分配)
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    🔒 自動分配
                  </div>
                </div>
                {autoAssignedRole && (
                  <div className="mt-2 text-sm text-slate-300">
                    {getRoleDescription(autoAssignedRole)}
                  </div>
                )}
              </div>
            </div>

            {/* 密碼 */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  密碼 *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  className="w-full px-4 py-3 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="至少6個字元"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  確認密碼 *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  placeholder="再次輸入密碼"
                />
              </div>
            </div>

            {/* 註冊按鈕 */}
            <button
              type="submit"
              disabled={loading || (positionCheckResult && !positionCheckResult.isAvailable) || isCheckingPosition}
              className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-4 px-6 rounded-xl font-medium hover:from-green-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                  註冊中...
                </div>
              ) : (
                '建立帳號'
              )}
            </button>

            {/* 登入連結 */}
            <div className="text-center">
              <p className="text-slate-300">
                已經有帳號了？{' '}
                <Link
                  to="/login"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  立即登入
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 