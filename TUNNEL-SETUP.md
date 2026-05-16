# Cloudflare 永久隧道配置指南

## 架构

```
手机/任意设备 → Cloudflare 边缘节点 → 你的电脑 localhost:3000
                    ↑
             固定域名: https://todo-app.xxx.workers.dev
```

---

## Step 1: 登录 Cloudflare（只需一次）

在 PowerShell 中运行：

```powershell
cd C:\Users\20183
.\cloudflared.exe tunnel login
```

这会弹出浏览器，让你登录 Cloudflare 账号并授权。

登录完成后，会在 `C:\Users\20183\.cloudflared\` 目录下生成一个证书文件。

---

## Step 2: 创建永久隧道

```powershell
cd C:\Users\20183
.\cloudflared.exe tunnel create todo-app
```

输出示例：
```
Tunnel credentials written to C:\Users\20183\.cloudflared\abcd1234-5678-90ef.json
Tunnel ID: abcd1234-5678-90ef-ghij-klmnopqrstuv
```

**记下 Tunnel ID**（上面那串 UUID）。

---

## Step 3: 创建配置文件

创建 `C:\Users\20183\.cloudflared\config.yml`：

```yaml
tunnel: 你的-Tunnel-ID

credentials-file: C:\Users\20183\.cloudflared\你的-Tunnel-ID.json

ingress:
  - hostname: todo-app.你的用户名.workers.dev
    service: http://localhost:3000
  - service: http_status:404
```

**需要替换的内容：**
- `你的-Tunnel-ID` → Step 2 得到的 UUID
- `你的-Tunnel-ID.json` → Step 2 生成的证书文件名
- `todo-app.你的用户名.workers.dev` → 你想要的域名

---

## Step 4: 绑定域名

```powershell
cd C:\Users\20183
.\cloudflared.exe tunnel route dns todo-app todo-app.你的用户名.workers.dev
```

例如：
```powershell
.\cloudflared.exe tunnel route dns todo-app todo-app.shengjie.workers.dev
```

---

## Step 5: 测试运行

先确保你的应用已启动（`start.bat` 或 `npm run dev`），然后：

```powershell
cd C:\Users\20183
.\cloudflared.exe tunnel run todo-app
```

看到类似输出即成功：
```
INF Connected to Cloudflare edge
INF Registered tunnel connection
```

现在用手机浏览器访问你的域名测试！

---

## Step 6: 设为 Windows 开机自启（关键！）

### 方式 A：创建 Windows 服务（推荐）

以**管理员身份**运行 PowerShell：

```powershell
cd C:\Users\20183
.\cloudflared.exe service install
.\cloudflared.exe service start
```

### 方式 B：创建计划任务

如果方式 A 失败，用 Windows 计划任务：

1. 按 `Win + R`，输入 `taskschd.msc`
2. 右侧点击 **创建基本任务**
3. 名称：`Cloudflare Tunnel`
4. 触发器：**当计算机启动时**
5. 操作：**启动程序**
6. 程序路径：`C:\Users\20183\cloudflared.exe`
7. 参数：`tunnel run todo-app`
8. 勾选 **使用最高权限运行**
9. 完成

---

## Step 7: 设置应用开机自启

同时要把你的 todo-app 设为开机启动：

1. 按 `Win + R`，输入 `shell:startup`
2. 这会打开启动文件夹
3. 把 `C:\Users\20183\todo-app\start.bat` 的快捷方式拖进去

或者更简单：在任务计划程序里再创建一个任务：
- 名称：`Todo App`
- 触发器：**当计算机启动时**
- 操作：**启动程序**
- 程序：`C:\Users\20183\todo-app\start.bat`
- 起始于：`C:\Users\20183\todo-app`

---

## 完成后开机流程

电脑开机后自动：
1. 启动后端（localhost:3001）
2. 启动前端（localhost:3000）
3. 启动 Cloudflare 隧道

然后手机访问 `https://todo-app.xxx.workers.dev` 即可使用！

---

## 常用命令

```powershell
# 查看隧道状态
.\cloudflared.exe tunnel info todo-app

# 列出所有隧道
.\cloudflared.exe tunnel list

# 停止隧道
.\cloudflared.exe tunnel cleanup todo-app

# 删除隧道
.\cloudflared.exe tunnel delete todo-app

# 查看日志（如果是 Windows 服务）
Get-WinEvent -FilterHashtable @{LogName='Application'; ProviderName='cloudflared'}
```
