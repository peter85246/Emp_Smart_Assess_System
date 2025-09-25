const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');

const app = express();
const PORT = 3000;

// 啟用 CORS
app.use(cors());

// 啟用 gzip 壓縮
app.use(compression());

// 設定靜態檔案目錄
app.use(express.static(__dirname, {
    maxAge: '1h' // 快取靜態資源1小時
}));

// 處理 SPA 路由
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 錯誤處理
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send('Server error occurred');
});

// 啟動服務器
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    ┌──────────────────────────────────────────────────┐
    │                                                  │
    │   前端服務已啟動！                               │
    │                                                  │
    │   - 本地訪問: http://localhost:${PORT}           │
    │   - 後端API: http://localhost:5001/api          │
    │                                                  │
    └──────────────────────────────────────────────────┘
    `);
});