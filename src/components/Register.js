import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { authAPI } from '../services/authAPI';
import { toastConfig } from './Login';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    employeeNumber: '',
    email: '',
    departmentId: '',
    position: '',
    customPosition: '',
    role: 'employee',
    password: '',
    confirmPassword: ''
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCustomPosition, setShowCustomPosition] = useState(false);

  // 預設職位選項
  const positionOptions = [
    '技術士',
    '技術員',
    '品檢員',
    '作業員',
    '組長',
    '領班',
    '副理',
    '經理',
    '副課長',
    '課長',
    '廠長',
    '自訂...'
  ];
  const navigate = useNavigate();

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await authAPI.getDepartments();
      setDepartments(response.data);
    } catch (error) {
      console.error('載入部門失敗:', error);
      // 提供預設部門選項作為備用
      const defaultDepartments = [
        { id: 1, name: '製造部' },
        { id: 2, name: '品質工程部' },
        { id: 3, name: '管理部' },
        { id: 4, name: '業務部' },
        { id: 5, name: '研發部' },
        { id: 6, name: '資訊部' },
        { id: 7, name: '財務部' },
        { id: 8, name: '採購部' }
      ];
      setDepartments(defaultDepartments);
      toast.error('載入部門資料失敗，使用預設選項', toastConfig.error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // 處理職位選擇
    if (name === 'position') {
      if (value === '自訂...') {
        setShowCustomPosition(true);
        setFormData(prev => ({
          ...prev,
          position: '',
          customPosition: ''
        }));
      } else {
        setShowCustomPosition(false);
        setFormData(prev => ({
          ...prev,
          position: value,
          customPosition: ''
        }));
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
    const finalPosition = showCustomPosition ? formData.customPosition : formData.position;
    if (!finalPosition.trim()) {
      toast.error('請選擇或輸入職位！', toastConfig.error);
      return;
    }

    setLoading(true);

    try {
      const submitData = {
        ...formData,
        position: finalPosition,
        email: formData.email || null // Email為可選
      };
      
      // 移除不需要的欄位
      delete submitData.customPosition;
      // 注意：保留 confirmPassword 字段給後端驗證

      await authAPI.register(submitData);
      toast.success('註冊成功！請登入', toastConfig.success);
      
      // 註冊成功後導向登入頁面
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || '註冊失敗，請稍後再試！';
      toast.error(errorMessage, toastConfig.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* 背景裝飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/10 to-purple-500/10 transform rotate-12 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-cyan-500/10 to-blue-500/10 transform -rotate-12 blur-3xl"></div>
      </div>

      {/* 主要註冊卡片 */}
      <div className="max-w-lg w-full space-y-8">
        <div className="bg-slate-700/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-600/50">
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
                </label>
                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="" className="bg-slate-700">請選擇部門</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id} className="bg-slate-700">
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  職位 *
                </label>
                <select
                  name="position"
                  value={showCustomPosition ? '自訂...' : formData.position}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="" className="bg-slate-700">請選擇職位</option>
                  {positionOptions.map(position => (
                    <option key={position} value={position} className="bg-slate-700">
                      {position}
                    </option>
                  ))}
                </select>

                {/* 自訂職位輸入框 */}
                {showCustomPosition && (
                  <input
                    type="text"
                    name="customPosition"
                    value={formData.customPosition}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 mt-2 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder="請輸入職位名稱"
                  />
                )}
              </div>
            </div>

            {/* 角色 */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                身分角色 *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 bg-slate-600/50 border border-slate-500/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="employee" className="bg-slate-700">員工</option>
                <option value="manager" className="bg-slate-700">主管</option>
              </select>
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
              disabled={loading}
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