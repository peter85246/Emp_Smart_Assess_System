import React, { createContext, useState, useContext, useEffect } from "react";
import { authStats } from "../utils/authStats";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 檢查本地存儲的登錄狀態
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    const startTime = performance.now();
    try {
      // 模擬API調用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // 模擬驗證邏輯
      if (
        credentials.username === "admin" &&
        credentials.password === "password"
      ) {
        const userData = {
          id: 1,
          username: credentials.username,
          role: "admin",
        };

        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));

        // 記錄登錄統計
        authStats.loginSuccess++;
        authStats.loginAttempts++;
        authStats.responseTime.push(performance.now() - startTime);

        return { success: true };
      } else {
        authStats.loginAttempts++;
        authStats.unauthorizedAttempts++;
        throw new Error("無效的憑證");
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const value = {
    user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth必須在AuthProvider內使用");
  }
  return context;
};
