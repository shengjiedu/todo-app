# Vercel + Supabase 部署指南

## 架构

```
用户浏览器 → Vercel (React 前端 + API Functions) → Supabase (PostgreSQL) → WxPusher
```

---

## Step 1: 注册 Supabase

1. 访问 https://supabase.com
2. 用 GitHub 账号注册/登录
3. **不需要信用卡**，免费套餐直接可用

---

## Step 2: 创建项目

1. 点击 **New Project**
2. **Organization**: 默认
3. **Project Name**: `todo-planner`
4. **Database Password**: 设置一个强密码（记下来！）
5. **Region**: `East Asia (Singapore)`（离你最近）
6. 点击 **Create new project**

等待 1-2 分钟初始化完成。

---

## Step 3: 获取连接信息

项目创建后，点击左侧 **Project Settings** → **API**：

复制以下三个值：
- **Project URL**: `https://xxxxxx.supabase.co`
- **anon public**: `eyJhbG...`（客户端用）
- **service_role secret**: `eyJhbG...`（服务端用，**不要泄露**）

再点击 **Database** → **Connection string** → **URI**：
- 复制 `postgresql://postgres:...` 这串连接字符串

---

## Step 4: 创建数据库表

点击左侧 **SQL Editor** → **New query**，粘贴以下 SQL：

```sql
-- 任务表
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  brain_tokens INTEGER NOT NULL DEFAULT 0,
  intensity TEXT NOT NULL DEFAULT 'low',
  priority INTEGER NOT NULL DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending',
  auto_rollover BOOLEAN NOT NULL DEFAULT true,
  rollover_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 设置表
CREATE TABLE settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  daily_token_budget INTEGER NOT NULL DEFAULT 1000,
  wx_pusher_uid TEXT,
  wx_pusher_token TEXT,
  remind_time TEXT NOT NULL DEFAULT '22:00',
  morning_push_time TEXT NOT NULL DEFAULT '08:00',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认设置
INSERT INTO settings (id, daily_token_budget, remind_time, morning_push_time)
VALUES (1, 1000, '22:00', '08:00')
ON CONFLICT (id) DO NOTHING;

-- 历史表
CREATE TABLE history (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  rolled_tasks INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  snapshot JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

点击 **Run**，等待执行完成。

---

## Step 5: 部署到 Vercel

### 5.1 安装 Vercel CLI

```bash
npm install -g vercel
```

### 5.2 设置环境变量

在 Vercel 控制台（网页版）：

1. 导入 GitHub 仓库 `shengjiedu/todo-app`
2. 进入项目 → **Settings** → **Environment Variables**
3. 添加以下变量：

| 名称 | 值 | 环境 |
|------|------|------|
| `SUPABASE_URL` | `https://你的项目ID.supabase.co` | Production |
| `SUPABASE_SERVICE_ROLE_KEY` | `你的 service_role key` | Production |

### 5.3 部署

```bash
cd C:\Users\20183\todo-app
vercel --prod
```

等待部署完成，获得域名如 `https://todo-app-xxxxx.vercel.app`。

---

## Step 6: 配置定时任务（EasyCron）

Vercel 免费计划不支持 Cron，我们用 **EasyCron**（免费）：

1. 注册 https://www.easycron.com（免费）
2. 创建两个定时任务：

| 名称 | URL | Cron | 方法 |
|------|-----|------|------|
| 晚间提醒 | `https://你的域名/api/push/remind` | `0 22 * * *` | POST |
| 早间推送 | `https://你的域名/api/push/daily` | `0 8 * * *` | POST |

---

## 费用说明

| 服务 | 免费额度 | 是否够用 |
|------|---------|---------|
| Vercel | 100GB 流量/月，Serverless Function 10s 超时 | ✅ 个人够用 |
| Supabase | 500MB 数据库，无限 API 请求 | ✅ 个人够用 |
| EasyCron | 每天最多调用限制 | ✅ 2次/天够用 |

**总费用：0 元/月**

---

## 本地开发

```bash
cd C:\Users\20183\todo-app

# 1. 设置本地环境变量（PowerShell）
$env:SUPABASE_URL = "https://你的项目ID.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "你的 service_role key"

# 2. 启动前端
cd frontend
npm run dev
```

本地 API 需要另外启动（Vercel CLI）：
```bash
vercel dev
```

---

## 常见问题

### Q: Supabase 连接不上？
A: 检查 `SUPABASE_URL` 和 `SUPABASE_SERVICE_ROLE_KEY` 是否正确。注意 service_role key 不是 anon key。

### Q: Vercel Function 超时？
A: Hobby 计划 10 秒超时。如果 rollover 任务数据量大，可能需要分批处理或升级到 Pro。

### Q: 数据安全？
A: Supabase 的 Row Level Security (RLS) 默认关闭。生产环境建议开启 RLS 并配置策略。

### Q: 如何备份数据？
A: Supabase 控制台 → Database → Backups，可以手动创建备份或设置自动备份。
