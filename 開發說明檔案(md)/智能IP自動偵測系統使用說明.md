# 智能 IP 自動偵測系統 - 使用說明

> **版本：** v1.0
> **更新日期：** 2025-11-10
> **參考專案：** WebAR 生成式AR售服平台

---

## 📌 功能簡介

本系統實現了智能 API 端點自動偵測功能，解決了以下問題：

✅ **localhost 開發** - 自動使用 `http://localhost:5001/api`
✅ **區域網路測試** - 自動使用 `http://192.168.1.xxx:5001/api`
✅ **手動設定** - 支援管理員手動指定 API 地址
✅ **設定持久化** - 使用 localStorage 儲存設定
✅ **連線測試** - 內建 API 連線測試功能

---

## 🚀 快速開始

### 1. 自動偵測模式 (預設)

系統會自動偵測當前訪問的 IP 並設定 API 地址：

```
訪問方式                    →  API 地址
http://localhost:3001       →  http://localhost:5001/api
http://192.168.1.210:3001   →  http://192.168.1.210:5001/api
```

**無需任何設定，開箱即用！**

### 2. 手動設定模式

在瀏覽器 Console (F12) 中執行：

```javascript
// 設定主系統 API
window.saveNetworkSettings('192.168.1.100', '5001', 'http');

// 設定報工系統 API (選填)
window.saveNetworkSettings(null, null, null, 'http://192.168.1.200:7117/api');

// 重新整理頁面生效
location.reload();
```

### 3. 測試連線

```javascript
// 測試主系統 API
window.testApiConnection('http://192.168.1.100:5001/api');

// 查看結果
// 成功: { success: true, status: 200, message: '連線成功' }
// 失敗: { success: false, message: '無法連線到伺服器...' }
```

### 4. 查看當前設定

```javascript
window.getNetworkSettings();

// 輸出範例:
// {
//   apiUrl: "http://192.168.1.210:5001/api",
//   apiIp: "192.168.1.210",
//   apiPort: "5001",
//   apiProtocol: "http",
//   isAutoDetected: true,  // 是否為自動偵測
//   reportApiUrl: "http://127.0.0.1:7117/api"
// }
```

### 5. 重置為自動偵測

```javascript
window.resetNetworkSettings();
location.reload();
```

---

## 🔧 技術架構

### 檔案結構

```
project/
├── public/
│   ├── index.html              ← 引入 appsetting.js
│   └── appsetting.js           ← 智能偵測核心邏輯
├── src/
│   └── config/
│       └── apiConfig.js        ← 從 appsetting.js 讀取配置
└── PointsManagementAPI/
    └── Program.cs              ← CORS 支援區域網路 IP
```

### 工作原理

```
┌─────────────────────────────────────────┐
│  1. 瀏覽器載入 public/appsetting.js      │
│     → 執行 getApiUrl() 函數              │
│     → 設定 window.apiUrl 全局變數        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  2. React 載入 src/config/apiConfig.js   │
│     → 從 window.apiUrl 讀取              │
│     → 設定 API_CONFIG.BASE_URL           │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│  3. API 請求發送到偵測到的地址           │
│     → fetch(API_CONFIG.BASE_URL + ...)  │
└─────────────────────────────────────────┘
```

### 優先級順序

```
1️⃣ 手動設定 (localStorage)
   ↓ 沒有
2️⃣ 自動偵測 (window.location.hostname)
   ↓ 失敗
3️⃣ 預設值 (localhost:5001)
```

---

## 📱 使用場景

### 場景 1: 本機開發

```bash
# 後端運行
cd PointsManagementAPI
dotnet run

# 前端運行
cd employee_smart_assessment_system
npm start

# 瀏覽器訪問
http://localhost:3001

# 自動偵測結果
API: http://localhost:5001/api  ✅
```

### 場景 2: 區域網路測試 (手機/平板)

```bash
# 1. 查看電腦 IP
ipconfig  # Windows
# 假設得到: 192.168.1.210

# 2. 確保後端監聽 0.0.0.0
# PointsManagementAPI/Properties/launchSettings.json
# "applicationUrl": "http://0.0.0.0:5001"

# 3. 前端仍然運行在 localhost:3001

# 4. 手機瀏覽器訪問
http://192.168.1.210:3001

# 自動偵測結果
API: http://192.168.1.210:5001/api  ✅
```

### 場景 3: 前後端分離部署

```bash
# 前端部署在: http://192.168.1.100:3001
# 後端部署在: http://192.168.1.200:5001

# 前端 Console 執行
window.saveNetworkSettings('192.168.1.200', '5001', 'http');
location.reload();

# 設定結果
API: http://192.168.1.200:5001/api  ✅
```

### 場景 4: 生產環境

```bash
# 前端: https://yourdomain.com
# 後端: https://api.yourdomain.com

# 手動設定
window.saveNetworkSettings('api.yourdomain.com', '443', 'https');
location.reload();

# 設定結果
API: https://api.yourdomain.com:443/api  ✅
```

---

## ⚙️ 後端設定

### 確保後端監聽所有 IP

**`PointsManagementAPI/Properties/launchSettings.json`**

```json
{
  "profiles": {
    "PointsManagementAPI": {
      "commandName": "Project",
      "launchBrowser": false,
      "applicationUrl": "http://0.0.0.0:5001",  // 改為 0.0.0.0
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
```

### CORS 已自動配置

系統已自動支援以下來源：
- ✅ localhost
- ✅ 127.0.0.1
- ✅ 192.168.x.x (區域網路)
- ✅ 10.x.x.x (區域網路)
- ✅ 172.16-31.x.x (區域網路)

**無需手動修改 CORS 設定！**

---

## 🔍 除錯指南

### 檢查當前配置

```javascript
// 在瀏覽器 Console (F12) 執行
console.log('當前網路配置:', window.getNetworkSettings());
```

### 測試 API 連線

```javascript
// 測試當前 API
const settings = window.getNetworkSettings();
window.testApiConnection(settings.apiUrl)
  .then(result => console.log('測試結果:', result));
```

### 清除設定

```javascript
// 清除所有手動設定
window.resetNetworkSettings();
localStorage.clear();  // 清除所有 localStorage
location.reload();
```

### 查看 Console 日誌

系統會自動輸出偵測結果：

```
🌐 自動偵測 API 地址 (預設Port 5001): http://192.168.1.210:5001/api
   - 主機名稱: 192.168.1.210
   - 後端端口: 5001
🌐 員工評估系統網路配置: {...}
```

---

## ❓ 常見問題

### Q1: 手機訪問出現 CORS 錯誤

**檢查：**
1. 後端是否監聽 `0.0.0.0`
2. 防火牆是否允許 5001 端口
3. 電腦和手機是否在同一網路

**解決：**
```bash
# Windows 防火牆允許 5001
netsh advfirewall firewall add rule name="ASP.NET Core 5001" dir=in action=allow protocol=TCP localport=5001

# 檢查後端監聽地址
netstat -an | findstr 5001
```

### Q2: 自動偵測的 IP 不正確

**手動設定正確的 IP：**
```javascript
window.saveNetworkSettings('正確的IP', '5001', 'http');
location.reload();
```

### Q3: 如何在生產環境使用

**方法 1: 手動設定** (推薦)
```javascript
window.saveNetworkSettings('yourdomain.com', '443', 'https');
```

**方法 2: 修改預設值**
編輯 `public/appsetting.js`:
```javascript
// 第 32 行附近
const defaultPort = '443';  // 改為生產環境端口
const apiUrl = `https://${hostname}:${defaultPort}/api`;  // 改為 https
```

### Q4: 報工系統 API 如何設定

```javascript
// 只設定報工系統 API
window.saveNetworkSettings(null, null, null, 'http://192.168.1.200:7117/api');
location.reload();
```

### Q5: 如何查看是否使用自動偵測

```javascript
const settings = window.getNetworkSettings();
console.log('是否自動偵測:', settings.isAutoDetected);
// true = 自動偵測
// false = 手動設定
```

---

## 📝 API 參考

### window.getNetworkSettings()

取得當前網路設定

**回傳：**
```javascript
{
  apiUrl: string,           // 完整 API URL
  apiIp: string,            // IP 地址
  apiPort: string,          // 端口號
  apiProtocol: string,      // 協議 (http/https)
  isAutoDetected: boolean,  // 是否自動偵測
  reportApiUrl: string,     // 報工系統 API URL
  reportApiIp: string,      // 報工系統 IP
  reportApiPort: string     // 報工系統端口
}
```

### window.saveNetworkSettings(ip, port, protocol, reportApiUrl)

儲存網路設定

**參數：**
- `ip` (string): API IP 地址
- `port` (string): API 端口號 (預設: '5001')
- `protocol` (string): 協議 (預設: 'http')
- `reportApiUrl` (string): 報工系統 API URL (選填)

**回傳：**
```javascript
{
  success: boolean,
  message: string
}
```

### window.resetNetworkSettings()

重置為自動偵測

**回傳：**
```javascript
{
  success: boolean,
  message: string
}
```

### window.testApiConnection(url)

測試 API 連線

**參數：**
- `url` (string): 要測試的 API URL

**回傳：** (Promise)
```javascript
{
  success: boolean,
  status: number,      // HTTP 狀態碼
  message: string,
  error: string        // 錯誤訊息 (失敗時)
}
```

---

## 🎯 最佳實踐

### 1. 開發環境

```javascript
// 保持自動偵測，無需設定
// 系統會自動適應 localhost 或區域網路 IP
```

### 2. 測試環境

```javascript
// 固定測試伺服器 IP
window.saveNetworkSettings('192.168.1.100', '5001', 'http');
```

### 3. 生產環境

```javascript
// 使用網域名稱 + HTTPS
window.saveNetworkSettings('api.yourdomain.com', '443', 'https');
```

### 4. 多環境切換

```javascript
// 建立快速切換腳本
const envs = {
  local: () => window.resetNetworkSettings(),
  test: () => window.saveNetworkSettings('192.168.1.100', '5001', 'http'),
  prod: () => window.saveNetworkSettings('api.yourdomain.com', '443', 'https')
};

// 使用
envs.test();
location.reload();
```

---

## 📚 相關文件

- [RWD 響應式設計實現說明](./RWD響應式設計實現說明.md)
- [專案打包指令教學說明](./專案打包指令教學說明.md)

---

## 🔄 更新紀錄

| 版本 | 日期 | 更新內容 |
|------|------|---------|
| v1.0 | 2025-11-10 | 初版完成，實現完整智能IP自動偵測系統 |

---

**📞 技術支援：** 如有問題請查閱專案 README.md 或聯繫開發團隊
