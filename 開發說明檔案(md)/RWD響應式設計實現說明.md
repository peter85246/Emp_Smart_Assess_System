# 潤鼓員工智慧評估系統 - RWD 響應式設計實現說明

> **文件版本：** v1.0
> **更新日期：** 2025-11-10
> **適用版本：** v1.1.14+

---

## 📋 目錄

1. [設計概述](#1-設計概述)
2. [設計原則](#2-設計原則)
3. [斷點設計](#3-斷點設計)
4. [修改檔案清單](#4-修改檔案清單)
5. [關鍵技術實現](#5-關鍵技術實現)
6. [iOS 特殊優化](#6-ios-特殊優化)
7. [測試指南](#7-測試指南)
8. [常見問題](#8-常見問題)

---

## 1. 設計概述

### 問題背景
系統原本僅針對桌面版設計，在移動設備上存在以下問題：
- ❌ 表格無法橫向滾動
- ❌ 按鈕過小，觸控困難
- ❌ 圖片預覽按鈕被遮擋
- ❌ 表單項目溢出容器
- ❌ iOS 下拉選單超出畫面

### 設計成果
✅ 所有頁面在手機/平板/桌面完美顯示
✅ 表格支援橫向平滑滾動
✅ 按鈕符合 iOS 觸控標準 (44x44px)
✅ 圖片預覽功能完整可用
✅ 表單自動適應螢幕寬度

---

## 2. 設計原則

### 2.1 Mobile-First 方法

```css
/* 基礎樣式 - 手機版 (預設) */
.container { padding: 0.75rem; }

/* 平板版 (sm: 640px+) */
@media (min-width: 640px) {
  .container { padding: 1rem; }
}

/* 桌面版 (lg: 1024px+) */
@media (min-width: 1024px) {
  .container { padding: 1.5rem; }
}
```

### 2.2 Tailwind 響應式前綴

```jsx
// 手機版：單欄 | 平板版：雙欄 | 桌面版：四欄
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
```

### 2.3 觸控友善設計

- **最小觸控區域：** 44x44px (iOS 標準)
- **按鈕間距：** 最少 8px
- **文字大小：** 最少 16px (防止 iOS 自動縮放)

---

## 3. 斷點設計

### Tailwind CSS 斷點

| 斷點 | 最小寬度 | 設備類型 | 前綴 |
|------|---------|---------|------|
| xs | 0px | 手機直向 | (預設) |
| sm | 640px | 手機橫向/小平板 | `sm:` |
| md | 768px | 平板直向 | `md:` |
| lg | 1024px | 平板橫向/筆電 | `lg:` |
| xl | 1280px | 桌面螢幕 | `xl:` |

### 測試設備

| 設備 | 解析度 | 測試重點 |
|------|--------|---------|
| iPhone 12 Pro | 390x844 | 觸控、滾動、表單 |
| iPhone 14 Pro Max | 430x932 | 同上 |
| iPad | 810x1080 | 佈局、表格 |
| Desktop | 1920x1080 | 完整功能 |

---

## 4. 修改檔案清單

### 4.1 全局樣式

**`src/index.css`** (Lines 125-386)

#### 關鍵修改：

**1. 防止水平溢出**
```css
@media (max-width: 768px) {
  html, body {
    overflow-x: hidden;
    width: 100%;
  }
}
```

**2. 表格響應式**
```css
@media (max-width: 768px) {
  .ant-table-wrapper {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch; /* iOS 平滑滾動 */
  }
  .ant-table {
    min-width: 1200px; /* 啟動橫向滾動 */
  }
}
```

**3. iOS 表單優化**
```css
@media (max-width: 768px) {
  input, textarea, select {
    font-size: 16px !important; /* 防止自動縮放 */
  }

  select {
    -webkit-appearance: menulist; /* 原生選擇器 */
    max-height: 44px;
  }
}
```

**4. 觸控標準**
```css
@media (max-width: 768px) {
  button, .ant-btn {
    min-height: 44px;
    min-width: 44px;
  }
}
```

---

### 4.2 工作日誌管理 (管理選單)

**`src/components/worklog/WorkLogBrowse.js`**

#### 關鍵修改：

**1. 篩選區域響應式**
```jsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={6}>
    <Input placeholder="搜尋..." />
  </Col>
  <Col xs={24} sm={12} md={6}>
    <Select placeholder="選擇員工" />
  </Col>
  {/* ... */}
</Row>
```

**2. 表格橫向滾動**
```jsx
<div style={{
  width: '100%',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch'
}}>
  <Table
    columns={columns}
    dataSource={worklogList}
    scroll={{ x: 'max-content' }}
    style={{ minWidth: '1200px' }}
  />
</div>
```

**3. Modal 響應式**
```jsx
<Modal
  width="95%"
  style={{ maxWidth: '800px', top: '5vh' }}
  styles={{
    body: {
      padding: '12px 16px',
      maxHeight: '80vh',
      overflowY: 'auto'
    }
  }}
>
  <Row gutter={[16, 16]}>
    <Col xs={24} sm={12}>
      {/* 內容 */}
    </Col>
  </Row>
</Modal>
```

---

### 4.3 工作日誌填寫 (功能選單)

**`src/components/PointsManagement/EmployeePanel/WorkLogEntry.js`**

#### 關鍵修改：

**1. 搜尋和篩選**
```jsx
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <input
    className="w-full px-3 py-2.5 sm:py-2 text-base"
    placeholder="搜索工作日誌..."
  />
  <select className="w-full sm:w-auto py-2.5 sm:py-2 text-base">
    <option value="">全部分類</option>
  </select>
</div>
```

**2. 工作日誌卡片**
```jsx
<div className="bg-slate-800/50 rounded-lg p-4 sm:p-6">
  <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
    <div className="flex-1 w-full sm:w-auto">
      <h3 className="text-base sm:text-lg break-words">
        {log.title}
      </h3>
      <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
        {/* 標籤 */}
      </div>
    </div>
    <div className="flex gap-2 w-full sm:w-auto justify-end">
      <button className="px-3 sm:px-4 py-2">編輯</button>
    </div>
  </div>
</div>
```

---

### 4.4 積分表單填寫 (功能選單)

**`src/components/PointsManagement/EmployeePanel/InteractivePointsForm.js`**

#### 關鍵修改：

**1. 分類選擇**
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
  {Object.entries(categories).map(([key, data]) => (
    <button
      className="p-4 rounded-lg border-2"
      onClick={() => setActiveCategory(key)}
    >
      <div className="text-xl">{icon}</div>
      <div className="text-sm sm:text-base">{data.name}</div>
    </button>
  ))}
</div>
```

**2. 表單項目列表**
```jsx
<div className="grid grid-cols-1 gap-3 sm:gap-4">
  {Object.entries(items).map(([key, item]) => (
    <div className="p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between gap-2">
        <h4 className="text-sm sm:text-base break-words">
          {item.name}
        </h4>
        <span className="text-lg sm:text-xl text-green-400">
          +{item.points}
        </span>
      </div>
    </div>
  ))}
</div>
```

**3. 檔案上傳優化**
```jsx
<div className="flex items-center w-full overflow-hidden">
  <input
    type="file"
    className="w-full text-xs sm:text-sm truncate"
    multiple
  />
</div>
{selectedFiles.map((file, index) => (
  <div className="flex items-center justify-between gap-2 p-2">
    <span className="text-slate-200 truncate flex-1 min-w-0">
      {file.name}
    </span>
    <button className="flex-shrink-0 p-1" onClick={() => removeFile(index)}>
      <X className="h-4 w-4" />
    </button>
  </div>
))}
```

---

### 4.5 圖片預覽 Modal

**`src/components/PointsManagement/shared/ImagePreviewModal.js`**

#### 關鍵修改：

**1. 標題欄響應式**
```jsx
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 gap-3">
  <div className="text-sm sm:text-base truncate">
    {fileName || '圖片預覽'}
  </div>
  <div className="flex items-center justify-end flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
    {/* 按鈕 */}
  </div>
</div>
```

**2. 觸控優化按鈕**
```jsx
<button
  onClick={handleZoomOut}
  className="p-2.5 sm:p-2
             min-w-[44px] min-h-[44px]
             sm:min-w-0 sm:min-h-0
             flex items-center justify-center"
  title="縮小 (-)"
>
  <ZoomOut className="h-5 w-5 sm:h-4 sm:w-4" />
</button>
```

**設計說明：**
- 手機版：按鈕 44x44px，圖示 20px
- 桌面版：按鈕自動大小，圖示 16px
- 使用 `flex-wrap` 確保按鈕過多時自動換行

**3. 快捷鍵提示**
```jsx
{/* 只在桌面版顯示 */}
<div className="hidden md:block absolute top-4 right-4">
  <p>⌨️ ESC 關閉</p>
</div>
```

---

### 4.6 其他組件

**`src/components/PointsManagement/EmployeePanel/PersonalScoreView.js`**
```jsx
<div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
    <h2 className="text-xl sm:text-2xl lg:text-3xl">我的績效</h2>
  </div>
</div>
```

**`src/components/PointsManagement/AdminPanel/AdminPanel.js`**
```jsx
<div className="flex flex-col lg:flex-row">
  <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r p-4 sm:p-6">
    {/* 側邊欄 */}
  </div>
  <div className="flex-1 p-4 sm:p-6">
    {/* 主內容 */}
  </div>
</div>
```

---

## 5. 關鍵技術實現

### 5.1 表格橫向滾動

```jsx
// 完整解決方案
<div style={{
  width: '100%',
  overflowX: 'auto',
  WebkitOverflowScrolling: 'touch',  // iOS 平滑滾動
  marginBottom: '16px'
}}>
  <Table
    columns={columns}
    dataSource={dataSource}
    scroll={{ x: 'max-content' }}  // Ant Design 滾動
    style={{ minWidth: '1200px' }}  // 最小寬度
  />
</div>
```

### 5.2 Modal 響應式

```jsx
<Modal
  visible={isOpen}
  onCancel={onClose}
  width="95%"  // 手機版佔滿
  style={{ maxWidth: '800px', top: '5vh' }}
  styles={{
    body: {
      padding: '12px 16px',
      maxHeight: '80vh',
      overflowY: 'auto'
    }
  }}
>
  <div style={{ maxWidth: '100%', overflowX: 'hidden' }}>
    {/* 內容 */}
  </div>
</Modal>
```

### 5.3 觸控優化

```jsx
// Tailwind 方式
<button className="
  px-3 sm:px-4
  py-2.5 sm:py-2
  text-sm sm:text-base
  min-h-[44px]
  rounded-lg
">
  提交
</button>

// CSS 方式
@media (max-width: 768px) {
  button {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### 5.4 Flexbox 響應式

```jsx
// 垂直→橫向
<div className="flex flex-col sm:flex-row gap-3">

// 對齊切換
<div className="flex flex-col sm:flex-row items-start sm:items-center">

// 寬度切換
<button className="w-full sm:w-auto">
```

### 5.5 Grid 響應式

```jsx
// 1-2-4 欄佈局
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

// 強制單欄 (手機版)
<div className="grid grid-cols-1 gap-3">
```

### 5.6 文字處理

```jsx
// 單行截斷
<p className="truncate">長文字...</p>

// 多行截斷 (3行)
<p className="line-clamp-3">長文字...</p>

// 自動換行
<p className="break-words">長文字...</p>
```

---

## 6. iOS 特殊優化

### 6.1 下拉選單溢出

**問題：** 自訂樣式的 `<select>` 在 iOS 上會超出螢幕

**解決：**
```css
/* src/index.css */
@media (max-width: 768px) {
  select {
    -webkit-appearance: menulist;
    -moz-appearance: menulist;
    appearance: menulist;
    max-height: 44px;
    font-size: 16px;
  }
}
```

```jsx
// JSX 中不要設置 appearance
<select className="w-full">
  {/* 讓 CSS 控制 */}
</select>
```

### 6.2 防止自動縮放

**問題：** iOS 會對小於 16px 的輸入框自動縮放頁面

**解決：**
```css
@media (max-width: 768px) {
  input, textarea, select {
    font-size: 16px !important;
  }
}
```

```jsx
<input className="text-base" /> {/* 16px */}
```

### 6.3 平滑滾動

```css
@media (max-width: 768px) {
  * {
    -webkit-overflow-scrolling: touch;
  }
}
```

---

## 7. 測試指南

### 7.1 測試方法

**方法 1: Chrome DevTools**
```
F12 > 切換設備模式 (Ctrl+Shift+M)
選擇: iPhone 12 Pro / iPhone 14 Pro Max / iPad
```

**方法 2: 實際設備**
```bash
# 1. 查看電腦 IP
ipconfig  # Windows
ifconfig  # Mac/Linux

# 2. 啟動開發伺服器
npm start

# 3. 手機瀏覽器訪問
http://192.168.1.xxx:3001
```

### 7.2 測試檢查清單

**基礎**
- [ ] 沒有橫向滾動條
- [ ] 內容不溢出螢幕

**表格**
- [ ] 可以橫向滾動
- [ ] 滾動平滑 (iOS)
- [ ] 操作按鈕可點擊

**表單**
- [ ] 下拉選單不溢出 (iOS)
- [ ] 輸入框不會自動縮放
- [ ] 檔案名稱不溢出

**Modal**
- [ ] 寬度適中
- [ ] 所有按鈕可見
- [ ] 按鈕易於點擊 (44x44px)

**觸控**
- [ ] 按鈕至少 44x44px
- [ ] 按鈕間距至少 8px
- [ ] 無誤觸

---

## 8. 常見問題

### Q1: 表格無法橫向滾動

**檢查：**
```jsx
// 1. 是否有滾動容器
<div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>

// 2. 表格是否有最小寬度
<Table scroll={{ x: 'max-content' }} style={{ minWidth: '1200px' }} />
```

### Q2: 內容橫向溢出

**解決：**
```css
@media (max-width: 768px) {
  html, body {
    overflow-x: hidden;
    max-width: 100vw;
  }
}
```

### Q3: 按鈕點擊區域太小

**解決：**
```jsx
<button className="min-w-[44px] min-h-[44px] p-2.5">
```

### Q4: 輸入框獲得焦點時頁面縮放

**解決：**
```jsx
<input className="text-base" /> {/* 確保 16px */}
```

### Q5: Modal 在手機上太寬

**解決：**
```jsx
<Modal width="95%" style={{ maxWidth: '800px' }}>
```

### Q6: iOS 下拉選單超出螢幕

**解決：**
```css
select {
  -webkit-appearance: menulist;
}
```

---

## 附錄：Tailwind 響應式速查

### 常用類別

```jsx
// 佈局
flex-col sm:flex-row              // 垂直→橫向
grid-cols-1 sm:grid-cols-2        // 1欄→2欄
hidden sm:block                   // 手機隱藏

// 間距
p-3 sm:p-4 lg:p-6                 // 內距
gap-2 sm:gap-4                    // 間距

// 文字
text-sm sm:text-base lg:text-lg   // 大小
text-left sm:text-center          // 對齊

// 尺寸
w-full sm:w-auto                  // 寬度
h-auto sm:h-64                    // 高度
```

### 斷點前綴

| 前綴 | 最小寬度 |
|------|---------|
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |

---

**文件結束**

> 💡 **提示：** 新增功能時，請參考本文檔確保響應式設計的一致性。
