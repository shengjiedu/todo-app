# 部署指南：Vercel + Render

## 架构

```
用户浏览器 → Vercel (React 前端) → Render (Express 后端) → SQLite + WxPusher
```

---

## Step 1: 部署后端到 Render

### 1.1 注册 Render
- 访问 https://render.com
- 用 GitHub 账号注册/登录

### 1.2 创建 Web Service
1. Dashboard → **New +** → **Web Service**
2. 连接你的 GitHub 仓库（`todo-app`）
3. 配置：
   - **Name**: `todo-api`（或你喜欢的名字）
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Free

4. 点击 **Create Web Service**

### 1.3 获取后端域名
部署完成后，Render 会分配一个域名：
```
https://todo-api-xxxx.onrender.com
```

复制这个地址，下一步需要用到。

### 1.4 设置环境变量（可选）
Render Dashboard → 你的服务 → Environment：
- 添加 `VERCEL_URL`，值为你的 Vercel 域名（部署前端后回填）

> ⚠️ Render 免费套餐会休眠（15 分钟无请求后睡眠）。建议用 UptimeRobot 每 5 分钟 ping 一次 `/api/health` 保持唤醒。

---

## Step 2: 部署前端到 Vercel

### 2.1 修改 API 地址
编辑 `frontend/.env.production`：
```
VITE_API_URL=https://你的-Render-域名.onrender.com/api
```

### 2.2 提交代码
```bash
git add .
git commit -m "chore: configure for cloud deployment"
git push
```

### 2.3 部署到 Vercel

**方式 A：Vercel CLI**
```bash
cd frontend
npm i -g vercel
vercel --prod
```
按提示选择项目，设置：
- **Root Directory**: `./`（当前 frontend 目录）
- **Framework Preset**: Vite

**方式 B：Vercel 网页**
1. 访问 https://vercel.com
2. **Add New Project** → 导入 GitHub 仓库
3. **Framework Preset**: Vite
4. **Root Directory**: `frontend`
5. 点击 **Deploy**

### 2.4 获取前端域名
部署完成后，Vercel 会分配一个域名：
```
https://todo-planner-xxxx.vercel.app
```

---

## Step 3: 配置 CORS（关键！）

### 3.1 更新 Render 环境变量
Render Dashboard → 你的服务 → Environment：
- 添加 `VERCEL_URL`，值为你的 Vercel 域名（如 `https://todo-planner-xxxx.vercel.app`）

### 3.2 重新部署后端
Render 会自动重新部署（或手动点击 **Manual Deploy**）

---

## Step 4: 验证

### 4.1 测试前端
打开 Vercel 域名，验证：
- [ ] 页面正常加载
- [ ] 能添加/查看任务
- [ ] 设置页面能保存配置

### 4.2 测试后端 API
```bash
curl https://你的-Render-域名.onrender.com/api/health
```
应返回：`{"status":"ok","time":"..."}`

### 4.3 测试 WxPusher
1. 在设置页面填入你的 WxPusher UID 和 App Token
2. 添加一个明天的任务
3. 手动触发测试（或使用定时任务等待）

---

## 常见问题

### Q: Render 免费套餐休眠了怎么办？
A: 注册 [uptimerobot.com](https://uptimerobot.com)，添加监控：
- URL: `https://你的-Render-域名.onrender.com/api/health`
- 每 5 分钟检查一次

### Q: 如何更新部署？
A: 修改代码后 `git push`，Render 和 Vercel 都会自动重新部署。

### Q: 可以绑定自己的域名吗？
A: 可以。Vercel 和 Render 都支持自定义域名，在各自 Dashboard 的 Settings → Domains 中配置。

### Q: 数据会丢失吗？
A: Render 免费套餐偶尔会有维护重启，SQLite 数据通常不会丢失（Render 提供持久化磁盘）。但如果想更保险，建议定期备份或升级到付费计划。
