# 員工智慧評估系統 (Employee Smart Assessment System)

## 🚀 專案概述

員工智慧評估系統是一個基於React 18.3.1 + Tailwind CSS開發的現代化員工績效管理平台，採用9項核心數據指標進行全方位績效評估，並整合工作積分得分計算表，提供公平、透明、智慧化的評估機制。

> ⚠️ **重要提醒**：本系統目前使用Mock數據進行開發測試，數據卡片顯示的是**最終得分**（包含獎懲機制後的分數），並非基礎百分比分數。

## 📁 重要檔案架構與功能說明

### 🎯 核心業務邏輯檔案

#### `src/components/PerformanceDashboard.js` - 主要績效儀表板元件
**主要功能：**
- 績效數據卡片渲染與顯示邏輯
- 最終得分計算（基礎分數+獎懲機制）
- 歷史趨勢圖生成（確保與當前月份數據一致）
- 個性化改進建議系統（針對不同指標提供具體建議）
- 績效評估結果模態框顯示

**設計特色：**
- 採用`getScoreBreakdown`函數計算最終得分
- 歷史趨勢數據與當前7月數據保持一致性
- 動態建議系統，避免制式化建議內容
- 支援點擊卡片查看詳細資訊

#### `src/utils/scoreCalculations.js` - 分數計算邏輯工具
**主要功能：**
- 統一的分數計算方法
- 獎懲機制整合
- 等級評定邏輯
- 升級條件判斷

**設計特色：**
- 避免重複程式碼，統一計算邏輯
- 支援複雜的加分條件（工作完成量≥95%加5分、產品質量≥90%加3分等）

#### `src/config/scoringConfig.js` - 評分配置與計算公式
**主要功能：**
- 完整的9項指標計算公式配置
- 獎懲機制規則定義
- 五級評等標準（A/B/C/D/E）
- API端點與資料庫對應表
- 效能最佳化配置

**重要配置項目：**
```javascript
// 計算公式對應表
calculationFormulas: {
  workCompletion: "完成量 / 應交量 × 100",
  quality: "已完成工單數 / 總工單數 × 100",
  workHours: "單位時間完成數 / 平均值 × 100",
  attendance: "出勤日 / 應出勤日 × 100",
  machineStatus: "Running時間 / 總時間 × 100",
  maintenance: "100 - (Alarm時間 / 總時間 × 100)",
  // ...更多指標
}

// 獎懲機制規則
bonusPenaltyRules: {
  workCompletion: {
    bonuses: [
      { threshold: 100, points: 5, reason: "完美達成" },
      { threshold: 95, points: 2, reason: "超越目標" }
    ]
  }
  // ...各指標獎懲標準
}
```

### 📊 數據管理檔案

#### `src/mocks/mockApiResponses.js` - 開發階段主要數據來源
**⚠️ 開發階段重要性：**
- **目前系統主要依賴此檔案的數據**
- 包含`mockJSONResponse`和`mockXMLResponse`數據
- 員工等級分配在此檔案中定義

**數據結構：**
```javascript
mockJSONResponse: {
  employees: [
    {
      id: "EMP001",
      name: "張小明",
      metrics: {
        workCompletion: 100,    // 基礎百分比
        productQuality: 93,     // 基礎百分比
        // ...其他指標
      },
      yearlyData: {
        2024: [
          { month: "1月", completion: 95, quality: 90, ... },
          // ...12個月的數據
        ]
      }
    }
  ]
}
```

#### `src/models/employeeData.js` - 員工數據模型
**主要功能：**
- 員工基本資訊定義
- 數據結構標準化
- 與Mock數據同步更新

#### `src/services/api.js` - API服務層
**當前狀態：**
```javascript
// TODO: 串接真正API時需要註釋掉以下這行 mock 數據導入
import { mockJSONResponse, mockXMLResponse } from '../mocks/mockApiResponses';

// ===== MOCK 數據區塊開始 =====
// 開發階段使用Mock數據
// ===== MOCK 數據區塊結束 =====
```

## 🔧 數據內容修改指引

### 📝 開發階段數據修改

#### 主要修改檔案：`src/mocks/mockApiResponses.js`
**修改內容包括：**
1. **員工基礎分數調整**：
   ```javascript
   metrics: {
     workCompletion: 新的百分比值,
     productQuality: 新的百分比值,
     // ...其他8項指標
   }
   ```

2. **歷史趨勢數據修改**：
   ```javascript
   yearlyData: {
     2024: [
       { month: "1月", completion: 值, quality: 值, efficiency: 值 },
       // ...確保與當前月份一致
     ]
   }
   ```

3. **員工等級分配設定**：
   - 張小明：6A+2B+1C（調整為A級優秀員工）
   - 李小華：3A+4B+2C（B級良好員工）
   - 王大明：2A+2B+4C+1D（C級待改進員工）
   - 陳小芳：1A+2B+2C+3D+1E（D級需加強員工）
   - 林小強：0A+1B+2C+3D+3E（E級急需改進員工）

#### 同步修改檔案：`src/models/employeeData.js`
- 保持與Mock數據一致性
- 更新員工基本資訊

### 🎯 修改重點注意事項

1. **最終得分顯示**：數據卡片會自動套用獎懲機制，顯示最終得分
2. **歷史趨勢一致性**：確保前三個月數據與當前7月數值相符
3. **等級計算邏輯**：系統會根據9項指標自動計算員工等級
4. **改進建議個性化**：新的建議系統會根據指標類型和分數提供具體建議

## 🔌 後端API串接指引

### 📡 API端點對應表
串接真實API時需要修改的主要檔案：`src/services/api.js`

#### 必須實作的API端點：
```javascript
// API端點配置（src/config/scoringConfig.js中定義）
apiEndpoints: {
  workCompletion: "/api/production/completion",      // 工作完成量API
  quality: "/api/quality/metrics",                   // 產品質量API
  workHours: "/api/time/efficiency",                 // 工作時間效率API
  attendance: "/api/hr/attendance",                  // 差勤紀錄API
  machineStatus: "/api/equipment/status",            // 機台狀態API
  maintenance: "/api/equipment/maintenance",         // 維護數據API
  targetAchievement: "/api/targets/achievement",     // 目標達成率API
  kpi: "/api/analytics/kpi",                        // KPI綜合數據API
  efficiency: "/api/analytics/efficiency"           // 效率指標API
}
```

#### 資料庫表格對應關係：
```javascript
// 資料庫對應（src/config/scoringConfig.js中定義）
databaseTables: {
  workCompletion: ["purchase_order_items", "works_orders_processing"],
  quality: ["works_orders_processing", "quality_control"],
  workHours: ["works_orders_processing", "time_tracking"],
  attendance: ["works_orders_processing", "employee_attendance"],
  machineStatus: ["UrTable", "equipment_status"],
  maintenance: ["UrTable", "maintenance_logs"],
  targetAchievement: ["purchase_order_items", "production_targets"],
  kpi: ["綜合數據"]
}
```

#### 欄位對應表：
```javascript
// 重要欄位對應（src/config/scoringConfig.js中定義）
fieldMappings: {
  workCompletion: {
    completed: "produced_quantity",                    // 已完成數量
    target: "purchase_order_items.quantity",          // 目標數量
    employee: "works_orders_processing.employee_id"   // 員工ID
  },
  machineStatus: {
    runningTime: "SUM(UrTable.Interval WHERE Status='Running')",  // 運行時間
    totalTime: "SUM(UrTable.Interval)",                          // 總時間
    equipment: "UrTable.equipment_id"                            // 設備ID
  }
  // ...其他指標欄位對應
}
```

### 🔄 API串接步驟

#### 1. 修改`src/services/api.js`
```javascript
// 第一步：註釋掉Mock數據導入
// import { mockJSONResponse, mockXMLResponse } from '../mocks/mockApiResponses';

// 第二步：實作真實API呼叫
export const performanceAPI = {
  async getEmployeeData() {
    try {
      // 替換為真實API呼叫
      const response = await fetch('/api/employee/performance');
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
};
```

#### 2. 數據格式要求
API回傳的數據格式必須符合以下結構：
```javascript
{
  employees: [
    {
      id: "員工ID",
      name: "員工姓名",
      role: "職位",
      metrics: {
        workCompletion: 百分比值,      // 工作完成量
        productQuality: 百分比值,      // 產品質量
        workHoursEfficiency: 百分比值, // 工作時間效率
        attendance: 百分比值,          // 差勤紀錄
        machineOperationRate: 百分比值,// 機台稼動率
        maintenanceScore: 百分比值,    // 維護表現
        targetAchievement: 百分比值,   // 目標達成率
        kpiScore: 百分比值,           // KPI綜合評分
        efficiencyScore: 百分比值     // 效率指標
      },
      yearlyData: {
        2024: [
          {
            month: "1月",
            completion: 數值,
            quality: 數值,
            efficiency: 數值
          }
          // ...12個月數據
        ]
      }
    }
  ]
}
```

#### 3. 必要的API實作
- **員工績效數據API**：`GET /api/employee/performance`
- **歷史趨勢數據API**：`GET /api/employee/history/{employeeId}/{year}`
- **即時更新API**：`GET /api/employee/realtime/{employeeId}`

## 📊 數據卡片計算依據與得分資料表關聯

### 🧮 計算邏輯流程

#### 第一步：基礎百分比計算
每個數據卡片的基礎分數來源於以下計算公式：

```javascript
// 工作完成量
workCompletion = (完成量 / 應交量) × 100

// 產品質量（間接法）
productQuality = (已完成工單數 / 總工單數) × 100

// 工作時間效率
workHoursEfficiency = (單位時間完成數 / 平均值) × 100

// 差勤紀錄
attendance = (出勤日 / 應出勤日) × 100

// 機台稼動率
machineOperationRate = (Running時間 / 總時間) × 100

// 維護表現
maintenanceScore = 100 - (Alarm時間 / 總時間 × 100)

// 目標達成率
targetAchievement = (員工產出 / 工單需求) × 100

// KPI綜合評分
kpiScore = 各項指標加權平均

// 效率指標
efficiencyScore = (實際效率 / 標準效率) × 100
```

#### 第二步：獎懲機制套用
基礎百分比會根據`src/config/scoringConfig.js`中的獎懲規則進行調整：

```javascript
// 範例：工作完成量獎懲機制
bonusPenaltyRules: {
  workCompletion: {
    bonuses: [
      { threshold: 100, points: 5, reason: "完美達成" },    // 100%時+5分
      { threshold: 95, points: 2, reason: "超越目標" }      // 95%時+2分
    ],
    penalties: [
      { threshold: 60, points: -5, reason: "嚴重落後" }     // 60%以下-5分
    ]
  }
}
```

#### 第三步：最終得分計算
```javascript
// 在PerformanceDashboard.js中的實際計算
const breakdown = getScoreBreakdown(metric, data);
const value = breakdown.finalScore;  // 這是顯示在卡片上的最終分數

// breakdown結構：
{
  baseScore: 85,        // 基礎百分比分數
  bonusPoints: 2,       // 獎勵分數
  penaltyPoints: 0,     // 懲罰分數
  finalScore: 87,       // 最終顯示分數
  adjustmentReasons: ["超越目標 +2分"]
}
```

### 📋 得分資料表整合關聯

#### 等級對應表（直接映射）
```javascript
// src/config/scoringConfig.js - gradingStandards
gradeRanges: {
  A: { min: 90, max: 100, label: "優秀表現", color: "green" },
  B: { min: 80, max: 89, label: "良好表現", color: "blue" },
  C: { min: 70, max: 79, label: "待改進表現", color: "yellow" },
  D: { min: 60, max: 69, label: "需加強表現", color: "orange" },
  E: { min: 0, max: 59, label: "急需改進", color: "red" }
}
```

#### 積分計算表整合
系統採用**直接映射模式**：
- 百分比分數 = 積分分數（例：87% = 87分）
- 最終得分包含獎懲機制後的結果
- 等級判定基於最終得分，非基礎百分比

#### 數據卡片顯示邏輯
```javascript
// PerformanceCard元件中的顯示邏輯
const baseValue = metric.value(data);           // 基礎百分比
const breakdown = getScoreBreakdown(metric, data); // 獲取完整計算結果
const value = breakdown.finalScore;             // 最終得分（顯示在卡片上）

// 等級計算
const scoreData = convertPercentageToScore(value); // 基於最終得分計算等級
```

### 🎯 實際應用範例

以張小明的工作完成量為例：
1. **基礎計算**：完成量1000件/應交量1000件 × 100 = 100%
2. **獎懲套用**：100% ≥ 100%門檻，獲得「完美達成」+5分獎勵
3. **最終得分**：100 + 5 = 105分（系統會限制在100分內，故顯示100分）
4. **等級判定**：100分 → A級優秀表現
5. **卡片顯示**：100%（A級）

這個完整的計算流程確保了：
- 數據透明性：每個分數都有明確的計算依據
- 獎懲公平性：優異表現獲得應有的獎勵
- 系統一致性：所有指標都遵循相同的計算邏輯

## 🚀 部署與使用

### 環境需求
- Node.js 16.0+
- npm 8.0+
- 現代化瀏覽器支援

### 安裝步驟
```bash
# 1. 複製專案
git clone [repository-url]

# 2. 安裝依賴
npm install

# 3. 啟動開發環境
npm start

# 4. 建置生產版本
npm run build
```

### 設定說明
- 修改 `src/config/apiConfig.js` 設定API端點
- 調整 `src/config/scoringConfig.js` 客製化評分規則
- 編輯 `src/mocks/mockApiResponses.js` 測試數據

## 📝 開發注意事項

### ⚠️ 重要提醒
1. **數據一致性**：確保Mock數據與實際API回傳格式一致
2. **歷史趨勢**：歷史數據必須與當前月份數值保持邏輯一致性
3. **獎懲機制**：最終得分包含獎懲調整，需要向用戶說明計算邏輯
4. **等級分配**：員工等級基於9項指標的綜合表現，而非單一指標

### 🔧 故障排除
- 如數據顯示異常，請檢查`src/mocks/mockApiResponses.js`中的數據格式
- 如計算結果不符預期，請確認`src/config/scoringConfig.js`中的獎懲規則
- 如歷史趨勢圖不正確，請檢查年度數據是否包含所需月份

## 📈 版本紀錄與更新

### 最新更新 (2025.017.08)
- ✅ **歷史趨勢數據一致性修正**：完整支援9個指標的歷史趨勢圖
- ✅ **數據映射邏輯優化**：每個指標獨立正確映射到對應歷史數據
- ✅ **7月數據一致性保證**：歷史趨勢圖與數據卡片顯示完全一致
- ✅ **差異化趨勢呈現**：不同指標呈現合理的歷史變化差異

### 核心功能特色
- 🎯 **9項指標全面評估**：工作完成量、產品質量、工作時間效率等
- 📊 **智慧化獎懲機制**：基於表現自動調整分數
- 📈 **歷史趨勢分析**：支援多年度數據追蹤
- 🔄 **即時數據更新**：Mock環境下的即時響應
- 🎨 **現代化UI設計**：基於Tailwind CSS的響應式設計

## 🤝 技術支援與貢獻

### 技術棧詳情
- **前端框架**：React 18.3.1
- **樣式框架**：Tailwind CSS 3.4.14
- **圖表庫**：Recharts 2.15.1
- **圖標庫**：Lucide React 0.454.0
- **路由管理**：React Router DOM 6.27.0
- **HTTP請求**：Axios 1.7.9
- **日期處理**：date-fns 4.1.0

### 系統要求
- **Node.js**：16.0+ (建議使用 18.0+)
- **npm**：8.0+ (建議使用最新版本)
- **瀏覽器**：支援 ES6+ 的現代瀏覽器
- **記憶體**：建議 8GB+ (開發環境)

### 性能指標
- **首次載入時間**：< 3秒 (在正常網路環境下)
- **數據響應時間**：< 100ms (Mock數據環境)
- **圖表渲染時間**：< 500ms (9個指標圖表)
- **記憶體使用**：< 50MB (正常運行狀態)

### 專案規模統計
- **總程式碼行數**：約 4,000+ 行
- **核心組件數量**：3個主要組件
- **工具函數數量**：20+ 個實用函數
- **測試覆蓋範圍**：基礎測試已建立
- **配置檔案**：完整的開發和生產配置

## 📞 聯絡資訊

### 開發團隊
- **專案負責人**：[待填入]
- **技術架構師**：[待填入] 
- **前端開發**：[待填入]
- **系統整合**：[待填入]

### 問題回報
如遇到技術問題，請提供以下資訊：
1. 瀏覽器版本和作業系統
2. 錯誤訊息的完整截圖
3. 重現問題的具體步驟
4. 相關的console日誌訊息

### 文檔更新
本README文檔會隨著專案發展持續更新，請定期查看最新版本以獲得最準確的資訊。

---

**最後更新**：2025年7月8日  
**文檔版本**：v1.2  
**專案狀態**：開發階段 (Mock數據環境)  
**下一階段**：API串接準備中
