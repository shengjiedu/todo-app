const AV = require('leancloud-storage');
const express = require('express');
const cors = require('cors');
const leanengine = require('leanengine');

// 初始化 LeanCloud
AV.init({
  appId: process.env.LEANCLOUD_APP_ID || 'your-app-id',
  appKey: process.env.LEANCLOUD_APP_KEY || 'your-app-key',
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY || 'your-master-key',
  serverURL: process.env.LEANCLOUD_API_SERVER || 'https://your-api-server.com'
});

// 开启 masterKey 权限
AV.Cloud.useMasterKey();

const app = express();

// CORS
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.workers.dev')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(leanengine.express());
app.use(express.json());

// 加载云函数
require('./cloud');

// API 路由
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/settings', require('./routes/settings'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 云函数路由（LeanCloud 自动处理 /1.1/functions 路径）

const PORT = parseInt(process.env.LEANCLOUD_APP_PORT || process.env.PORT || 3000, 10);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
