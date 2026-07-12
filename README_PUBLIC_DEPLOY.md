# 服务设计智慧工作台：公网测试部署说明

本版本面向“可发给学生公网试用”的课堂测试场景。学生通过网页注册、登录后进入工作台，使用项目流程与 AI 方法助手。大模型 API Key 只放在服务器环境变量中，不写入前端页面。

## 1. 必须配置

在服务器启动前设置：

```powershell
$env:ENABLE_USER_ACCOUNTS="true"
$env:APP_ACCESS_CODE="class-2026"
$env:DEEPSEEK_API_KEY="sk-xxxx"
$env:DEEPSEEK_MODEL="deepseek-chat"
$env:PORT="4174"
node server.mjs
```

其中：

- `ENABLE_USER_ACCOUNTS=true`：开启学生注册、登录。
- `APP_ACCESS_CODE`：教师应急入口，可保留；学生日常使用账号登录。
- `DEEPSEEK_API_KEY` 等模型密钥：只配置在服务器端，不发给学生。

学生访问地址示例：

```text
https://你的域名/
```

## 2. 可选模型环境变量

当前后端按 OpenAI 兼容接口调用 `/chat/completions`，支持下列服务商。实际模型名和接口域名可能随平台调整，建议以各平台控制台为准，并通过环境变量覆盖。

| 前端选项 | API Key | 模型名 | Base URL |
|---|---|---|---|
| ChatGPT / OpenAI | `OPENAI_API_KEY` | `OPENAI_MODEL` | `OPENAI_BASE_URL` |
| DeepSeek | `DEEPSEEK_API_KEY` | `DEEPSEEK_MODEL` | `DEEPSEEK_BASE_URL` |
| Kimi / Moonshot | `MOONSHOT_API_KEY` | `MOONSHOT_MODEL` | `MOONSHOT_BASE_URL` |
| 智谱清言 / GLM | `ZHIPU_API_KEY` | `ZHIPU_MODEL` | `ZHIPU_BASE_URL` |
| 豆包 / 火山方舟 | `DOUBAO_API_KEY` | `DOUBAO_MODEL` | `DOUBAO_BASE_URL` |
| 自定义接口 | `CUSTOM_LLM_API_KEY` | `CUSTOM_LLM_MODEL` | `CUSTOM_LLM_BASE_URL` |

## 3. 公网部署建议

1. 使用 HTTPS 域名访问，不建议让学生直接访问裸 IP 和 HTTP。
2. 用 Nginx、Caddy、宝塔面板或云平台反向代理到本机 `4174` 端口。
3. 公网部署必须设置 `ENABLE_USER_ACCOUNTS=true`；`APP_ACCESS_CODE` 可作为教师备用入口。
4. 不要把任何模型 API Key 写入 `index.html`、`src/app.js` 或学生可下载文件。
5. 课堂正式运行前，先用测试小组验证“登录、保存、导出、AI 生成”四个动作。

## 4. 学生使用流程

1. 打开教师提供的网址。
2. 首次使用选择“注册”，填写姓名、班级、邮箱、密码。
3. 后续选择“登录”，进入服务设计工作台。
4. 选择所在小组，填写项目主题、调研证据、需求与方案。
5. 在“AI 方法助手”选择已配置模型，输入任务说明，生成服务设计建议。
6. 通过“导出数据”保留小组阶段成果。

## 5. 获得公网网址的三种方式

| 方式 | 适用场景 | 操作要点 |
|---|---|---|
| Render / Railway 等 Node Web Service | 推荐，适合连续几周课堂测试 | 上传项目，启动命令 `node server.mjs`，设置环境变量 |
| 学校或云服务器 | 适合正式课程运行 | 安装 Node，部署本目录，用 Nginx/Caddy 配 HTTPS 域名 |
| Cloudflare Tunnel / ngrok | 临时演示 | 本机运行服务后开隧道，网址可能临时变化 |

推荐流程：

1. 将本目录作为一个 Node 项目上传到托管平台。
2. 设置启动命令：

```text
node server.mjs
```

3. 设置环境变量：

```text
ENABLE_USER_ACCOUNTS=true
APP_ACCESS_CODE=你的教师口令
DEEPSEEK_API_KEY=你的模型密钥
DEEPSEEK_MODEL=deepseek-chat
```

4. 平台生成 `https://...` 网址后，先自己注册一个学生账号测试。
5. 确认“注册、登录、保存项目、AI 生成建议、导出数据”均可用后，再发给学生。

## 6. 当前边界

这是课堂公网测试版，不是正式多租户平台。当前已支持学生注册登录，但课堂数据仍是共享状态，适合课堂演示、小组协同试用和教学验证。若要长期正式运行，应继续增加小组权限隔离、数据库备份、操作日志、管理员后台和 HTTPS 自动证书。
