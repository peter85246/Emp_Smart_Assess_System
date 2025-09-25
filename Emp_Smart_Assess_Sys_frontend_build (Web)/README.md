# 績效評估系統執行說明

## 系統需求
- Windows 10 或更新版本
- PostgreSQL 資料庫 (需預先安裝並設定)
- Node.js (用於執行前端服務)

## 資料庫設定
請確保 PostgreSQL 資料庫已正確設定：
- 主機：127.0.0.1
- 端口：5432
- 資料庫名稱：PointsManagementDB
- 使用者名稱：postgres
- 密碼：paw123456

## 啟動說明

### 方法一：一鍵啟動（推薦）
1. 執行 `start_all.bat`
2. 系統會自動啟動後端和前端服務
3. 等待瀏覽器自動開啟

### 方法二：分別啟動
1. 執行 `start_backend.bat` 啟動後端服務
2. 執行 `start_frontend.bat` 啟動前端服務

## 訪問地址
- 前端網址：http://localhost:3000
- 後端 API 文檔：http://localhost:5001/swagger
- 後端服務：https://localhost:7001/api

## 注意事項
1. 請確保資料庫服務已經啟動
2. 請確保所需端口（3000、5001、7001）未被其他程式佔用
3. 如遇到問題，請檢查資料庫連接設定是否正確

