# Render 部署操作说明

目标：把本项目部署成一个可公开访问的网址，学生可用学号注册、登录，并在网页内自主接入自己的大模型 API Key。

## 1. 已准备好的部署文件

本目录已经包含 Render 需要的文件：

- `package.json`：启动命令为 `npm start`
- `server.mjs`：Node 后端与网页服务
- `render.yaml`：Render Blueprint 配置
- `.gitignore`：避免上传本地课堂数据和密钥

## 2. 最推荐的部署方式

Render 需要从 GitHub/GitLab/Bitbucket 仓库读取代码。当前电脑没有检测到 Render CLI 或 GitHub CLI，因此需要您先完成一次网页登录授权。

操作步骤：

1. 打开 Render 官网并登录。
2. 新建 Blueprint 或 Web Service。
3. 连接一个 GitHub 仓库。
4. 将本目录内容上传到该仓库：

```text
C:/Users/zf/Documents/智慧课程建设/output/20260630_服务设计PWA原型_v01
```

5. 如果使用 Blueprint，Render 会读取 `render.yaml`。
6. 如果手动创建 Web Service，填写：

```text
Runtime: Node
Build Command: npm install
Start Command: npm start
```

## 3. 环境变量

必须设置：

```text
ENABLE_USER_ACCOUNTS=true
APP_ACCESS_CODE=教师备用口令
DATA_DIR=/var/data
```

不需要在 Render 里配置统一的大模型 API Key。学生在网页右侧“AI 方法助手”中填写个人 API Key，Key 默认只保存在学生自己的浏览器本地。

## 4. 持久化数据

`render.yaml` 已配置 1GB 持久化磁盘：

```text
mountPath: /var/data
```

账号数据和课堂数据会写入：

```text
/var/data/users.json
/var/data/classroom-state.json
```

注意：Render 的持久化磁盘通常不是免费资源。若选择免费实例且不挂磁盘，服务重启或重新部署后注册账号和课堂数据可能丢失。

## 5. 部署成功后的测试

Render 生成网址后，例如：

```text
https://service-design-studio.onrender.com
```

请按顺序测试：

1. 打开网址。
2. 点击“注册”。
3. 填写姓名、班级、学号、密码。学号需为 9 位数字，格式为 `21XX17XXX`。
4. 登录进入工作台。
5. 输入项目主题和调研证据。
6. 在“AI 方法助手”填写个人 API Key、模型名，点击“生成建议”。
7. 刷新页面后再次登录，确认数据仍在。

## 6. 我当前无法替您直接完成的部分

当前本机没有 Render CLI、GitHub CLI，也没有可用的 Render 账号令牌。创建公网网址必须通过 Render 账号完成。您可以选择：

1. 您网页登录 Render 并按上面步骤部署；
2. 您提供 Render API Key 和 GitHub 仓库地址，我再继续用命令行完成部署；
3. 您先创建一个空 GitHub 仓库并授权，我把项目整理后推送上去。
