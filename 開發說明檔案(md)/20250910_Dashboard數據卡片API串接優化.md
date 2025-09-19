# 員工智慧考核系統 API 串接優化說明文件

## 修改日期：2025/09/10

### 一、API 端點修正

#### 1. 員工列表獲取
```javascript
// 修改前
${REPORT_API.BASE_URL}${REPORT_API.ENDPOINTS.employees}

// 修改後
${REPORT_API.BASE_URL}/AREditior/GetAllUserinfoByFilter
```

#### 2. 請求頭規範
```javascript
headers: {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
}
```

#### 3. 請求參數格式
```javascript
{
  Keyword: "",
  Year: selectedYear.toString(),
  Month: selectedMonth.toString().padStart(2, '0')
}
```

### 二、數據結構優化

#### 1. 員工資料結構
```javascript
{
  id: userId.toString(),          // 員工ID
  name: emp.user_Name,           // 員工姓名
  department: emp.department_Name || '未指定部門',  // 部門
  role: emp.role_name || '一般員工',  // 職位
  grade: 'A',                    // 績效等級
  displayName: `${name} (${department} - ${role})`  // 顯示名稱
}
```

#### 2. KPI 指標數據結構
```javascript
{
  completion_Rate: monthMetrics.completion_Rate,    // 工作完成率
  yield_Percent: monthMetrics.yield_Percent,        // 產品質量
  total_Hours: monthMetrics.total_Hours,            // 工作時數
  machine_Run_Hours: monthMetrics.machine_Run_Hours, // 機台運行時數
  maintenance_Count: monthMetrics.maintenance_Count, // 維護次數
  otd_Rate: monthMetrics.otd_Rate,                  // 目標達成率
  kpi_Percent: monthMetrics.kpi_Percent,            // KPI百分比
  units_Per_Hour: monthMetrics.units_Per_Hour,      // 每小時產量
  attendance: null                                  // 差勤紀錄（待後端實作）
}
```

### 三、錯誤處理機制

#### 1. API 回應驗證
```javascript
if (!data || !data.result || !Array.isArray(data.result)) {
  console.error('API回應格式錯誤:', data);
  throw new Error('API回應格式錯誤');
}
```

#### 2. 數據完整性檢查
```javascript
if (!emp || !emp.user_Id || !emp.user_Name) {
  return null;
}
```

#### 3. 預設值處理
```javascript
{
  department: emp.department_Name || '未指定部門',
  role: emp.role_name || '一般員工',
  machines_used: monthMetrics.machines_Used || 0,
  items_contributed: monthMetrics.items_Contributed || 0
}
```

### 四、日誌輸出優化

#### 1. API 調用日誌
```javascript
console.log('正在獲取員工列表...');
console.log('API回傳的員工數據:', data.result);
console.log('處理後的員工列表:', uniqueEmployees);
```

#### 2. 數據處理日誌
```javascript
console.log('查找員工數據:', {
  employeeId,
  targetDate: `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}T00:00:00`,
  foundData: employeeData
});
```

### 五、後端 API 回應格式

#### 1. 員工列表 API
```javascript
{
  "token": null,
  "code": "0000",
  "message": "完全成功",
  "result": [
    {
      "user_id": number,
      "user_name": string,
      "department_Name": string,
      "role_name": string,
      "process_Ids": string,
      "process_Names": string,
      "processIdArray": string[],
      "processNameArray": string[]
    }
  ]
}
```

#### 2. KPI 數據 API
```javascript
{
  "code": "0000",
  "message": "完全成功",
  "result": [
    {
      "work_Day": string,          // 格式: "YYYY-MM-DDT00:00:00"
      "user_Id": number,
      "user_Name": string,
      "completion_Rate": number,    // 完成率
      "yield_Percent": number,      // 良率百分比
      "total_Hours": number,        // 總工時
      "machine_Run_Hours": number,  // 機台運行時數
      "maintenance_Count": number,  // 維護次數
      "otd_Rate": number,          // 準時交付率
      "kpi_Percent": number        // KPI百分比
    }
  ]
}
```

### 六、待優化項目

1. 差勤紀錄（attendance）數據需要後端提供
2. 部門（department）資訊需要補充
3. 員工等級計算邏輯需要與後端確認
4. 歷史數據查詢功能待實作
5. 錯誤重試機制待實作

### 七、注意事項

1. API 回應中的時間格式統一使用 ISO 格式
2. 數值型資料需進行 null 檢查
3. 員工資料需要定期更新機制
4. 權限控制待實作
5. 資料快取機制待評估

### 八、後續規劃

1. 實作 WebSocket 即時更新機制
2. 添加數據導出功能
3. 優化載入效能
4. 添加數據分析圖表
5. 實作批量處理功能

