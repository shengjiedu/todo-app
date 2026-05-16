# LeanCloud 部署指南

## 架构

```
手机/电脑 → Vercel (React 前端) → LeanCloud (Node.js 后端 + 数据存储) → WxPusher
```

---

## 准备工作

### 1. 注册 LeanCloud

1. 访问 https://leancloud.cn
2. 用邮箱注册账号
3. 完成实名认证（国内平台需要）

### 2. 创建应用

1. 控制台 → **创建应用**
2. **应用名称**: `todo-planner`
3. **应用类型**: 选择最符合的（如"工具"）
4. 点击 **创建**

创建后会得到：
- **App ID**: `xxxxxxxxxxxxx-xxxxx`
- **App Key**: `xxxxxxxxxxxxxxxxx`
- **Master Key**: `xxxxxxxxxxxxxxxxx`

**记下这三个值**，下一步需要。

---

## 后端部署（LeanCloud 云引擎）

### 方式一：命令行部署（推荐）

#### 1. 安装 LeanCloud CLI

```bash
npm install -g leancloud-cli
```

#### 2. 登录

```bash
lean login
```

按提示输入邮箱和密码。

#### 3. 关联应用

```bash
cd C:\Users\20183\todo-app\backend
lean switch
```

选择你创建的 `todo-planner` 应用。

#### 4. 设置环境变量

```bash
lean env set LEANCLOUD_APP_ID 你的AppID
lean env set LEANCLOUD_APP_KEY 你的AppKey
lean env set LEANCLOUD_APP_MASTER_KEY 你的MasterKey
```

#### 5. 部署

```bash
lean deploy
```

等待部署完成，LeanCloud 会分配一个域名：
```
https://todo-planner.leanapp.cn
```

#### 6. 验证

浏览器访问：
```
https://todo-planner.leanapp.cn/api/health
```

应返回：`{"status":"ok","time":"..."}`

---

### 方式二：Git 部署

1. 在 LeanCloud 控制台 → 云引擎 → 部署 → Git 部署
2. 关联 GitHub 仓库
3. 选择分支（main）
4. 点击 **部署**

---

## 配置定时任务（关键！）

LeanCloud 控制台 → 云引擎 → 定时任务：

1. **新建定时任务**
   - **任务名称**: `晚间提醒`
   - **云函数**: `dailyRemind`
   - **Cron 表达式**: `0 22 * * *`
   - **环境**: `production`
   - 点击 **保存**

2. **再新建一个**
   - **任务名称**: `早间重排`
   - **云函数**: `dailyRollover`
   - **Cron 表达式**: `0 8 * * *`
   - **环境**: `production`
   - 点击 **保存**

> Cron 表达式说明：`0 22 * * *` = 每天 22:00 执行

---

## 前端部署（Vercel）

### 1. 修改 API 地址

编辑 `frontend/.env.production`：

```
VITE_API_URL=https://todo-planner.leanapp.cn/api
```

（替换为你的真实 LeanCloud 域名）

### 2. 提交代码

```bash
cd C:\Users\20183\todo-app
git add .
git commit -m "chore: switch to LeanCloud backend"
git push
```

### 3. 部署到 Vercel

```bash
cd frontend
npx vercel --prod
```

---

## 配置 CORS（重要！）

LeanCloud 控制台 → 云引擎 → 设置 → 环境变量：

添加：
- `VERCEL_URL` = `https://your-frontend.vercel.app`

然后重新部署后端：
```bash
cd backend
lean deploy
```

---

## 数据存储说明

LeanCloud 的数据存储是**文档数据库**（类似 MongoDB），第一次使用时会自动创建 Class（表）：

- `Task` — 任务数据
- `Settings` — 用户配置
- `History` — 每日归档

不需要手动建表，代码首次读写时会自动创建。

---

## 费用说明

LeanCloud **开发版**（免费）：
- 每天 30,000 API 请求
- 每天 3 GB 文件存储
- 1 GB 数据库空间
- 云引擎每天运行 18 小时（会休眠）

对于个人待办应用完全够用。如果担心休眠，可以：
- 用 UptimeRobot 每 5 分钟 ping 一次 `/api/health`
- 或升级到标准版（约 30元/月）

---

## 常用命令

```bash
# 查看日志
lean logs

# 查看云函数列表
lean cloud

# 本地调试
lean up

# 更新部署
lean deploy

# 查看环境变量
lean env

# 设置环境变量
lean env set KEY VALUE
```

---

## 故障排查

### Q: 部署失败，提示 "找不到模块"
A: 确保 `backend/package.json` 中已包含所有依赖，删除 `node_modules` 后重新 `npm install`

### Q: 云函数不执行
A: 检查定时任务的 Cron 表达式是否正确，以及云函数名是否匹配（`dailyRemind` / `dailyRollover`）

### Q: 数据查询慢
A: LeanCloud 开发版有请求限制，确保没有频繁的全表扫描。可以在控制台 → 存储 → 索引 中添加索引

### Q: 应用休眠了怎么办
A: 用 UptimeRobot 定时 ping，或升级到标准版
