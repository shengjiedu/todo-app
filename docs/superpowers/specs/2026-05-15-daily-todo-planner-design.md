# 每日待办规划器 — 设计文档

---

## 1. 项目概述

基于现有 `todo-app` 改造的每日待办规划系统。核心功能：

- **左侧时间轴**（6:00-24:00）直观展示任务时间分布
- **右侧任务列表** 管理待办，支持增删改查
- **人脑 Token 估算** — 用户手动输入每个任务的脑力消耗值
- **定时提醒** — 每天 22:00 推送"填明日待办"提醒到微信
- **自动重排** — 每天 08:00 自动将未完成任务顺延至次日并重新排序
- **WxPusher 推送** — 每日待办汇总推送到微信
- **手机实时填写** — 响应式设计 + Cloudflare Tunnel 内网穿透

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户端 (Client)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ 电脑浏览器    │  │ 手机浏览器    │  │ 微信 WxPusher    │  │
│  │ React SPA     │  │ PWA 响应式   │  │ 推送提醒卡片      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────┘  │
└─────────┼─────────────────┼─────────────────────────────────┘
          │                 │
          └────────┬────────┘
                   │ HTTP/REST
┌──────────────────┼──────────────────────────────────────────┐
│                  ▼                                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Express.js 后端 (Node.js)                │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │   │
│  │  │ /api/    │ │ /api/    │ │ /api/    │ │ /api/   │  │   │
│  │  │ tasks    │ │ schedule │ │ settings │ │ push    │  │   │
│  │  │ CRUD     │ │ 重排逻辑  │ │ 偏好配置  │ │ WxPusher│  │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └─────────┘  │   │
│  │                                                       │   │
│  │  ┌────────────────────────────────────────────────┐   │   │
│  │  │        定时任务引擎 (node-cron)                 │   │   │
│  │  │  • 22:00 → 推送"填明日待办"提醒                  │   │   │
│  │  │  • 08:00 → 重排任务 + 顺延未完成 + 推送日报      │   │   │
│  │  └────────────────────────────────────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                              │                               │
│                              ▼                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              SQLite 数据库 (本地文件)                 │   │
│  │  tasks │ schedules │ settings │ history               │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

---

## 3. 数据模型

### 3.1 Task 表

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT (UUID) | 主键 |
| `title` | TEXT | 任务名称，必填 |
| `description` | TEXT | 备注，可空 |
| `scheduledDate` | DATE | 安排日期 (YYYY-MM-DD) |
| `startTime` | TEXT | 开始时间 "HH:MM" |
| `endTime` | TEXT | 结束时间 "HH:MM"，可空 |
| `brainTokens` | INTEGER | 人脑 Token 消耗值，用户手动输入 |
| `intensity` | TEXT | 强度等级: `low` \| `medium` \| `high` \| `extreme`，由 Token 值自动映射 |
| `priority` | INTEGER | 优先级 1-5，默认 3 |
| `status` | TEXT | `pending` \| `completed` \| `cancelled` |
| `autoRollover` | BOOLEAN | 未完成时是否自动顺延，默认 true |
| `rolloverCount` | INTEGER | 已连续顺延天数，默认 0 |
| `createdAt` | DATETIME | 创建时间 |
| `updatedAt` | DATETIME | 更新时间 |

**intensity 映射规则：**
- 0-50 token → `low`（低强度，绿色）
- 51-150 token → `medium`（中强度，黄色）
- 151-300 token → `high`（高强度，紫色）
- 301+ token → `extreme`（极高强度，红色）

### 3.2 Settings 表（单条记录）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 固定为 1 |
| `dailyTokenBudget` | INTEGER | 每日 Token 预算上限，默认 1000 |
| `wxPusherUID` | TEXT | WxPusher UID，用于推送 |
| `wxPusherToken` | TEXT | WxPusher App Token |
| `remindTime` | TEXT | 晚间提醒时间，默认 "22:00" |
| `morningPushTime` | TEXT | 早间推送时间，默认 "08:00" |
| `createdAt` | DATETIME | |
| `updatedAt` | DATETIME | |

### 3.3 History 表（每日归档）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INTEGER | 自增主键 |
| `date` | DATE | 日期 |
| `totalTasks` | INTEGER | 当日总任务数 |
| `completedTasks` | INTEGER | 已完成数 |
| `rolledTasks` | INTEGER | 顺延到次日的任务数 |
| `totalTokens` | INTEGER | 当日总 Token 消耗 |
| `snapshot` | TEXT (JSON) | 当日任务快照 |

---

## 4. API 设计

### 4.1 Tasks

```
GET    /api/tasks?date=2026-05-15    # 获取某天的任务列表
POST   /api/tasks                    # 创建任务
PUT    /api/tasks/:id                # 更新任务（含完成状态）
DELETE /api/tasks/:id                # 删除任务
```

**POST /api/tasks 请求体：**
```json
{
  "title": "看钙钛矿论文日报",
  "description": "",
  "scheduledDate": "2026-05-15",
  "startTime": "08:00",
  "endTime": "09:00",
  "brainTokens": 50,
  "priority": 3,
  "autoRollover": true
}
```

### 4.2 Schedule（日程重排）

```
POST /api/schedule/rollover         # 手动触发重排（调试用）
GET  /api/schedule/today            # 获取今日安排（含统计）
```

### 4.3 Settings

```
GET  /api/settings                  # 获取用户配置
PUT  /api/settings                  # 更新配置
```

### 4.4 Push

```
POST /api/push/remind               # 手动发送晚间提醒
POST /api/push/daily-summary        # 手动发送每日汇总
```

---

## 5. 定时任务逻辑

### 5.1 22:00 晚间提醒

```
1. 查询 scheduledDate = 明天的任务
2. 计算总 Token 数和任务数
3. 调用 WxPusher 推送：
   - 无任务："📋 明天还没有安排任务哦，快来规划一下"
   - 有任务："📋 明日待办已就绪（4个任务，共 670 token）"
```

### 5.2 08:00 早间重排与推送

```
1. 查询 scheduledDate = 今天 且 status = pending 的任务
2. 遍历每个未完成任务：
   a. scheduledDate 改为明天
   b. rolloverCount += 1
   c. 若 rolloverCount >= 3，priority 设为 5（最高优先级）
3. 查询 scheduledDate = 明天的所有任务（含刚顺延的 + 原本就安排好的）
4. 按 priority 降序排序
5. 重新分配 startTime（6:00 起，按优先级均匀分布在 6:00-22:00）
6. 生成 History 记录（今日归档）
7. 调用 WxPusher 推送日报：
   "📅 5月15日待办（顺延2个/共4个）
    1. 看钙钛矿论文 08:00 🧠50
    2. 组会汇报准备 10:00 🧠120
    ...
    今日预算：670/1000 token"
```

---

## 6. 前端设计

### 6.1 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | DailyPlanner | 主页面（时间轴 + 任务列表） |
| `/history` | HistoryPage | 历史回顾（周视图） |
| `/settings` | SettingsPage | 设置（WxPusher、预算、提醒时间） |

### 6.2 组件树

```
App
├── BrowserRouter
│   ├── Layout
│   │   ├── Header (顶部标题 + 日期切换)
│   │   └── Outlet
│   │       ├── DailyPlanner (路径: /)
│   │       │   ├── DailyStats (顶部统计栏)
│   │       │   ├── MainContent (桌面端左右分栏 / 手机端 Tab 切换)
│   │       │   │   ├── TimeLinePanel (时间轴 6:00-24:00)
│   │       │   │   │   └── TimeBlock (每小时槽位)
│   │       │   │   └── TaskListPanel (任务列表)
│   │       │   │       ├── TaskCard (单个任务)
│   │       │   │       ├── TaskForm (添加/编辑表单 - Sheet/Modal)
│   │       │   │       └── TokenBudget (底部预算条)
│   │       │   └── MobileNav (手机底部 Tab 导航)
│   │       ├── HistoryPage (路径: /history)
│   │       │   └── WeekView (周视图)
│   │       └── SettingsPage (路径: /settings)
│   │           ├── WxPusherConfig
│   │           ├── NotificationPrefs
│   │           └── TokenBudgetLimit
```

### 6.3 响应式断点

| 断点 | 布局 | 说明 |
|------|------|------|
| `>= 1024px` | 左右分栏 | 左侧时间轴 280px + 右侧任务列表 flex:1 |
| `768px - 1023px` | 左右分栏（缩窄） | 时间轴 200px |
| `< 768px` | 单栏 + Tab | 底部 Tab 切换：时间轴 / 任务列表 / 设置 |

---

## 7. 技术栈

### 7.1 前端（复用现有）

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18 | UI 框架 |
| Vite | 5 | 构建工具 |
| Tailwind CSS | 3 | 样式 |
| react-router-dom | 6 | 路由 |
| dayjs | 1.x | 日期处理 |

### 7.2 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| Express.js | 4 | Web 框架 |
| better-sqlite3 | 9 | SQLite 同步驱动 |
| node-cron | 3 | 定时任务 |
| axios | 1 | HTTP 请求（WxPusher） |

### 7.3 部署

| 工具 | 用途 |
|------|------|
| Cloudflared | 内网穿透，让手机访问本地服务 |
| PM2（可选）| 进程守护，崩溃自动重启 |

---

## 8. 文件结构

```
todo-app/
├── backend/
│   ├── server.js              # 入口
│   ├── database.js            # SQLite 连接 & 初始化（自动建表）
│   ├── cronJobs.js            # 定时任务（22:00 提醒 + 08:00 重排推送）
│   ├── routes/
│   │   ├── tasks.js           # 任务 CRUD
│   │   ├── schedule.js        # 日程重排逻辑
│   │   └── settings.js        # 用户配置
│   ├── services/
│   │   └── wxPusher.js        # WxPusher 推送封装
│   └── todo.db                # SQLite 数据库（自动创建）
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx            # 路由入口
│   │   ├── main.jsx           # 渲染入口
│   │   ├── index.css          # 全局样式
│   │   ├── pages/
│   │   │   ├── DailyPlanner.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── DailyStats.jsx
│   │   │   ├── TimeLinePanel.jsx
│   │   │   ├── TimeBlock.jsx
│   │   │   ├── TaskListPanel.jsx
│   │   │   ├── TaskCard.jsx
│   │   │   ├── TaskForm.jsx
│   │   │   ├── TokenBudget.jsx
│   │   │   ├── MobileNav.jsx
│   │   │   └── WeekView.jsx
│   │   └── hooks/
│   │       ├── useTasks.js
│   │       └── useSettings.js
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── docs/
│   └── superpowers/
│       └── specs/
│           └── 2026-05-15-daily-todo-planner-design.md  # 本文档
│
├── start.bat                  # Windows 一键启动脚本
└── package.json               # 根目录（可选：concurrently 同时启动前后端）
```

---

## 9. 部署方案

### 9.1 开发环境启动

```bash
# 终端 1：启动后端
cd backend
npm install
node server.js
# → http://localhost:3001

# 终端 2：启动前端
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 9.2 手机访问（Cloudflare Tunnel）

```bash
# 下载 cloudflared.exe 后：
cloudflared.exe tunnel --url http://localhost:3000
# → 输出 https://xxxx.trycloudflare.com
# → 手机浏览器打开即可
```

### 9.3 生产环境（长期运行）

```bash
# 使用 PM2 守护进程
npm install -g pm2
pm2 start backend/server.js --name todo-api
pm2 startup
pm2 save
```

---

## 10. 边界情况处理

| 场景 | 处理策略 |
|------|---------|
| 顺延任务超过 3 天 | 自动提升 priority 为 5，并在推送中标注 🔥 |
| Token 预算超限 | 添加任务时前端警告（不阻止），推送中标注 ⚠️ |
| 电脑关机错过定时任务 | 开机后启动时检查：若已过 08:00 且未执行，立即补执行 |
| WxPusher 推送失败 | 重试 3 次，失败记录到日志，不阻断其他流程 |
| 同一天内手动修改多次 | 每次修改实时同步到数据库，定时任务读取最新状态 |
| 跨天添加任务 | scheduledDate 可选未来任意日期，不限于明天 |
| 手机端断网后填写 | 前端暂存到 localStorage，联网后自动同步 |

---

## 11. 演进路线（V1 → V2 → V3）

### V1（MVP）
- 时间轴 + 任务列表 + Token 估算
- 22:00 提醒 + 08:00 重排推送
- 手机响应式 + Cloudflare Tunnel

### V2（增强）
- 历史回顾页面（周视图统计图表）
- 任务模板（常用任务一键添加）
- 拖拽调整时间（交互优化）

### V3（高级）
- 多设备同步（WebSocket 实时推送）
- AI 辅助建议（基于历史数据推荐任务时长）
- 番茄钟集成（任务开始后可计时）
