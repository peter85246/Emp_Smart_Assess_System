import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 預設帳密
const DEFAULT_CREDENTIALS = {
  username: 'admin',
  password: '123456'
};

// 成功和錯誤的 toast 配置 (顏色)
export const toastConfig = {
  success: {
    style: {
      backgroundColor: '#cbd5e1',  // slate-300
      color: '#1e293b',           // slate-800
      fontWeight: 500
    },
    progressStyle: {
      background: '#22c55e'        // green-500
    },
    icon: '✨',
    autoClose: 2000
  },
  error: {
    style: {
      backgroundColor: '#cbd5e1',  // slate-300
      color: '#1e293b',           // slate-800
      fontWeight: 500
    },
    progressStyle: {
      background: '#ef4444'        // red-500
    },
    icon: '❌',
    autoClose: 2000
  }
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 設定為固定的 2 秒載入時間
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      if (username === DEFAULT_CREDENTIALS.username && 
          password === DEFAULT_CREDENTIALS.password) {
        toast.success('登入成功！', toastConfig.success);
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/dashboard');
      } else {
        toast.error('帳號或密碼錯誤！', toastConfig.error);
      }
    } catch (error) {
      toast.error('登入失敗，請稍後再試！', toastConfig.error);
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

      {/* 主要登入卡片 */}
      <div className="max-w-md w-full space-y-8">
        <div className="bg-slate-700/50 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-slate-600/50">
          {/* Logo 區域 */}
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2 text-center">
              員工智慧考核系統
            </h2>
            <p className="text-slate-300 text-sm mb-8">
              請輸入您的帳號密碼進行登入
            </p>
          </div>

          {/* 表單區域 */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">
                  帳號
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/25 rounded-lg text-white placeholder-slate-400 transition-all duration-200"
                  placeholder="請輸入帳號"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                  密碼
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-2.5 bg-slate-800/50 border border-slate-600/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/25 rounded-lg text-white placeholder-slate-400 transition-all duration-200"
                  placeholder="請輸入密碼"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* 登入按鈕 */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-lg text-white font-medium transition-all duration-200 ${
                loading 
                  ? 'bg-blue-500/50 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-500/25'
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg 
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" 
                    xmlns="http://www.w3.org/2000/svg" 
                    fill="none" 
                    viewBox="0 0 24 24"
                    style={{ 
                      animation: 'spin 1s linear infinite',
                      animationDuration: '2s'
                    }}
                  >
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4"
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  登入中...
                </div>
              ) : (
                '登入'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}