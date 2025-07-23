import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

// ===== React層級的ResizeObserver錯誤處理 =====

// 針對React開發模式的特殊處理
if (process.env.NODE_ENV === 'development') {
  // 攔截React錯誤覆蓋層
  const originalReactErrorHandler = window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.onCommitFiberRoot;
  if (originalReactErrorHandler) {
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = function(...args) {
      try {
        return originalReactErrorHandler.apply(this, args);
      } catch (error) {
        if (error && error.message && error.message.includes('ResizeObserver')) {
          return; // 忽略ResizeObserver錯誤
        }
        throw error;
      }
    };
  }
  
  // 攔截Webpack HMR錯誤
  if (module.hot) {
    const originalUpdateCallback = module.hot.accept;
    module.hot.accept = function(...args) {
      const originalCallback = args[args.length - 1];
      if (typeof originalCallback === 'function') {
        args[args.length - 1] = function(error) {
          if (error && error.message && error.message.includes('ResizeObserver')) {
            return; // 忽略ResizeObserver錯誤
          }
          return originalCallback(error);
        };
      }
      return originalUpdateCallback.apply(this, args);
    };
  }
}

// React錯誤邊界組件
class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // 如果是ResizeObserver錯誤，不顯示錯誤UI
    if (error && error.message && error.message.includes('ResizeObserver')) {
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // 只記錄非ResizeObserver錯誤
    if (!(error && error.message && error.message.includes('ResizeObserver'))) {
      console.error('React錯誤:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#ff6b6b',
          backgroundColor: '#2a2a2a',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div>
            <h2>應用程式發生錯誤</h2>
            <p>請重新整理頁面重試</p>
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              重新整理頁面
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

console.log('🚀 React應用程式啟動中...');

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>,
);
