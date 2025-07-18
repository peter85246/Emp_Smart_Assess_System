import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Login from "./components/Login";
import Register from "./components/Register";
import PerformanceDashboard from "./components/PerformanceDashboard";
import PointsManagementDashboard from "./components/PointsManagement/PointsManagementDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import ApiTestPage from "./components/ApiTestPage";
import DebugTestPage from "./components/DebugTestPage";
import { AuthProvider } from "./contexts/AuthContext";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/api-test" element={<ApiTestPage />} />
          <Route path="/debug-test" element={<DebugTestPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <PerformanceDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/points-management"
            element={
              <ProtectedRoute>
                <PointsManagementDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
