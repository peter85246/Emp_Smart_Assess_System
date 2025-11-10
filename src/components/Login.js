import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../contexts/AuthContext";
import { authAPI } from "../services/authAPI";
import "react-toastify/dist/ReactToastify.css";

// 成功和錯誤的 toast 配置 (顏色)
export const toastConfig = {
  success: {
    style: {
      backgroundColor: "#cbd5e1", // slate-300
      color: "#1e293b", // slate-800
      fontWeight: 500,
    },
    progressStyle: {
      background: "#22c55e", // green-500
    },
    icon: "✨",
    autoClose: 2000,
  },
  error: {
    style: {
      backgroundColor: "#cbd5e1", // slate-300
      color: "#1e293b", // slate-800
      fontWeight: 500,
    },
    progressStyle: {
      background: "#ef4444", // red-500
    },
    icon: "❌",
    autoClose: 2000,
  },
};

export default function Login() {
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const credentials = {
        employeeNumber,
        password
      };

      const response = await authAPI.login(credentials);
      const userData = response.data.user;

      // 使用AuthContext的login方法保存用戶資訊
      await login(userData);

      // 顯示成功提示，並在1秒後跳轉
      toast.success(`歡迎回來，${userData.name}！`, {
        ...toastConfig.success,
        autoClose: 1000,
        onClose: () => navigate("/dashboard")
      });
    } catch (error) {
      const errorMessage = error.response?.data?.message || "登入失敗，請稍後再試！";
      toast.error(errorMessage, toastConfig.error);
    } finally {
      // 確保Loading效果至少顯示1秒
      setTimeout(() => {
        setLoading(false);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative">
      {/* 背景裝飾 - 與註冊頁面保持一致的優化效果 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 transform rotate-12 blur-3xl"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 transform -rotate-12 blur-3xl"></div>
        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 transform rotate-45 blur-2xl"></div>
      </div>

      {/* 主要登入卡片 */}
      <div className="max-w-md w-full space-y-6 md:space-y-8 relative z-10">
        <div className="bg-slate-700/60 backdrop-blur-xl p-6 sm:p-8 rounded-2xl shadow-2xl border border-slate-600/30">
          {/* Logo 區域 */}
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 sm:h-10 sm:w-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">
              積分管理系統
            </h2>
            <p className="text-slate-300 text-sm mb-6 sm:mb-8 text-center">
              請輸入您的員工編號和密碼
            </p>
          </div>

          {/* 表單區域 */}
          <form onSubmit={handleLogin} className="space-y-5 sm:space-y-6">
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="employeeNumber"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  員工編號
                </label>
                <input
                  id="employeeNumber"
                  name="employeeNumber"
                  type="text"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-600/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/25 rounded-lg text-white placeholder-slate-400 transition-all duration-200 text-base"
                  placeholder="例如: EMP001"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300 mb-1"
                >
                  密碼
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-800/50 border border-slate-600/50 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/25 rounded-lg text-white placeholder-slate-400 transition-all duration-200 text-base"
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
              className={`w-full py-3 sm:py-2.5 px-4 rounded-lg text-white font-medium transition-all duration-200 min-h-[44px] ${
                loading
                  ? "bg-blue-500/50 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-500/25"
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
                      animation: "spin 1s linear infinite",
                      animationDuration: "2s",
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
                "登入"
              )}
            </button>
            
            {/* 註冊連結 */}
            <div className="text-center mt-6">
              <p className="text-slate-300">
                還沒有帳號？{' '}
                <Link
                  to="/register"
                  className="text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
                >
                  立即註冊
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
