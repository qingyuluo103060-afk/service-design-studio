# 服务设计智慧工作台部署说明

本文件适用于局域网课堂试用。公网测试部署请优先阅读 `README_PUBLIC_DEPLOY.md`，并设置课堂访问口令与服务器端模型 API Key。

## 1. 推荐启动方式

在本目录右键打开 PowerShell，运行：

```powershell
.\start-classroom.ps1
```

窗口会显示两个地址：

- 教师本机访问地址：`http://127.0.0.1:4174/`
- 学生局域网访问地址：形如 `http://192.168.x.x:4174/`

请保持 PowerShell 窗口打开。关闭窗口后，学生无法继续访问。

## 2. 手动启动方式

```powershell
node server.mjs
```

默认端口为 `4174`。如需换端口：

```powershell
$env:PORT=8080
node server.mjs
```

## 3. 发给学生测试

教师电脑和学生设备需处于同一局域网。把 `start-classroom.ps1` 显示的“学生局域网访问”地址发给学生即可。

如果 Windows 防火墙提示是否允许 Node.js 网络访问，请允许“专用网络”。

## 4. 数据保存

后端会把课堂数据保存到：

```text
data/classroom-state.json
```

通过服务器访问时，学生和教师共享这份数据。前端仍保留浏览器本地保存作为网络异常时的兜底。

## 5. 备份与恢复

- 页面顶部“导出数据”可下载 JSON 备份。
- 页面顶部“导入数据”可恢复 JSON 备份。
- 也可以直接备份 `data/classroom-state.json`。

## 6. 重置数据

停止服务后删除：

```text
data/classroom-state.json
```

再次启动时会生成默认课堂示例数据。

## 7. 验证命令

```powershell
node tests/app-core.test.mjs
node tests/server.test.mjs
node tests/public-api.test.mjs
node tests/account-auth.test.mjs
node --check src/app.js
node --check server.mjs
```
