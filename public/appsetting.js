// ============================================
// 潤鼓員工智慧評估系統 - 智能網路配置
// 支援自動偵測與手動設定，解決內外網訪問問題
// 參考 WebAR 專案設計
// ============================================

// 智能配置邏輯: 優先使用手動設定，否則自動偵測
// 支援 IP 和 Port 分離設定，預設 Port 5001
function getApiUrl() {
  // 優先檢查完整 URL（向後兼容舊設定）
  const storedUrl = localStorage.getItem('EMP_apiUrl');
  if (storedUrl) {
    console.log('🔧 使用手動設定的 API 地址 (完整URL):', storedUrl);
    return storedUrl;
  }

  // 檢查分離的 IP 和 Port（新設定方式）
  const storedIp = localStorage.getItem('EMP_apiIp');
  const storedPort = localStorage.getItem('EMP_apiPort') || '5001';
  const storedProtocol = localStorage.getItem('EMP_apiProtocol') || 'http';

  if (storedIp) {
    const apiUrl = `${storedProtocol}://${storedIp}:${storedPort}/api`;
    console.log('🔧 使用手動設定的 API 地址 (分離設定):', apiUrl);
    console.log('   - 協議:', storedProtocol);
    console.log('   - IP:', storedIp);
    console.log('   - Port:', storedPort);
    return apiUrl;
  }

  // 自動偵測: 預設使用 Port 5001，IP 使用當前訪問的主機名稱
  const hostname = window.location.hostname;
  const defaultPort = '5001';
  const apiUrl = `http://${hostname}:${defaultPort}/api`;

  console.log('🌐 自動偵測 API 地址 (預設Port 5001):', apiUrl);
  console.log('   - 主機名稱:', hostname);
  console.log('   - 後端端口:', defaultPort);

  return apiUrl;
}

// 報工系統 API 配置 (獨立配置)
function getReportApiUrl() {
  const storedUrl = localStorage.getItem('EMP_reportApiUrl');
  if (storedUrl) {
    console.log('🔧 使用手動設定的報工系統 API:', storedUrl);
    return storedUrl;
  }

  // 預設使用 localhost:7117
  const defaultUrl = 'http://127.0.0.1:7117/api';
  console.log('🌐 使用預設報工系統 API:', defaultUrl);
  return defaultUrl;
}

// 全局變數
var apiUrl = getApiUrl();
var reportApiUrl = getReportApiUrl();

// ============================================
// 網路設定管理函數 (供 React 組件調用)
// ============================================

// 獲取當前網路設定
window.getNetworkSettings = function() {
  // 解析當前 API URL 為 IP、Port 和 Protocol
  let parsedIp = '';
  let parsedPort = '5001';
  let parsedProtocol = 'http';

  try {
    const url = new URL(apiUrl);
    parsedIp = url.hostname;
    parsedPort = url.port || '5001';
    parsedProtocol = url.protocol.replace(':', '');
  } catch (e) {
    console.error('解析 API URL 失敗:', e);
  }

  // 解析報工系統 URL
  let reportParsedIp = '';
  let reportParsedPort = '7117';

  try {
    const reportUrl = new URL(reportApiUrl);
    reportParsedIp = reportUrl.hostname;
    reportParsedPort = reportUrl.port || '7117';
  } catch (e) {
    console.error('解析報工系統 API URL 失敗:', e);
  }

  return {
    // 主系統 API
    apiUrl: apiUrl,
    apiIp: parsedIp,
    apiPort: parsedPort,
    apiProtocol: parsedProtocol,
    isAutoDetected: !localStorage.getItem('EMP_apiUrl') && !localStorage.getItem('EMP_apiIp'),

    // 報工系統 API
    reportApiUrl: reportApiUrl,
    reportApiIp: reportParsedIp,
    reportApiPort: reportParsedPort
  };
};

// 儲存網路設定（支援分離的 IP、Port、Protocol）
window.saveNetworkSettings = function(newApiIp, newApiPort, newApiProtocol, newReportApiUrl) {
  try {
    // 儲存主系統 API 設定
    if (newApiIp) {
      localStorage.setItem('EMP_apiIp', newApiIp);
      localStorage.setItem('EMP_apiPort', newApiPort || '5001');
      localStorage.setItem('EMP_apiProtocol', newApiProtocol || 'http');

      // 清除舊的完整 URL 設定（確保使用新方式）
      localStorage.removeItem('EMP_apiUrl');
    }

    // 儲存報工系統 API 設定
    if (newReportApiUrl) {
      localStorage.setItem('EMP_reportApiUrl', newReportApiUrl);
    }

    return { success: true, message: '網路設定已儲存，請重新整理頁面' };
  } catch (error) {
    console.error('儲存網路設定失敗:', error);
    return { success: false, message: error.message };
  }
};

// 重置為自動偵測
window.resetNetworkSettings = function() {
  // 清除所有網路設定（包含新舊格式）
  localStorage.removeItem('EMP_apiUrl');      // 舊格式
  localStorage.removeItem('EMP_apiIp');       // 新格式
  localStorage.removeItem('EMP_apiPort');     // 新格式
  localStorage.removeItem('EMP_apiProtocol'); // 新格式
  localStorage.removeItem('EMP_reportApiUrl'); // 報工系統

  return { success: true, message: '已重置為自動偵測，請重新整理頁面' };
};

// 測試 API 連線
window.testApiConnection = async function(testUrl) {
  try {
    const response = await fetch(testUrl + '/Health', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? '連線成功' : `連線失敗 (HTTP ${response.status})`
    };
  } catch (error) {
    console.error('API 連線測試失敗:', error);
    return {
      success: false,
      error: error.message,
      message: '無法連線到伺服器，請檢查 IP 和 Port 是否正確'
    };
  }
};

// 控制台輸出當前配置 (方便開發除錯)
console.log('🌐 員工評估系統網路配置:', window.getNetworkSettings());
console.log('📌 提示: 如需手動設定 API 地址，請使用 window.saveNetworkSettings() 函數');
