# 部署到 Cloudflare Pages 指南

本文档详细介绍如何将股票行情系统部署到 Cloudflare Pages。

## 前提条件

1. 一个 GitHub 账号（用于代码托管）
2. 一个 Cloudflare 账号（免费注册：https://dash.cloudflare.com/sign-up）
3. 本地已安装 Git

## 项目架构

本项目已迁移到 Cloudflare Pages 架构：

```
├── src/              # 前端源码（TypeScript + Vite）
├── functions/        # Cloudflare Workers Functions
│   └── api/
│       ├── stocks.js # 股票API
│       └── health.js # 健康检查
├── public/           # 静态资源和配置
│   ├── _headers      # HTTP头配置
│   └── _redirects    # 重定向规则
└── wrangler.toml     # Wrangler配置（可选）
```

## 部署步骤

### 步骤 1：推送代码到 GitHub

#### 1.1 初始化 Git 仓库（如果还没有）

```bash
cd /workspace/projects

# 初始化 Git
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: migrate to Cloudflare Pages"
```

#### 1.2 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 创建新仓库，命名为 `stock-app`（或任意名称）
3. 不要初始化 README、.gitignore 或 LICENSE

#### 1.3 推送代码到 GitHub

```bash
# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/yourusername/stock-app.git

# 推送代码
git branch -M main
git push -u origin main
```

---

### 步骤 2：在 Cloudflare Pages 创建项目

#### 2.1 访问 Cloudflare Pages

1. 访问 https://dash.cloudflare.com
2. 登录你的 Cloudflare 账号
3. 在左侧菜单选择 **Workers & Pages**
4. 点击 **Create application**
5. 选择 **Pages** 标签
6. 点击 **Connect to Git**

#### 2.2 连接 GitHub 仓库

1. 点击 **Connect to Git**（如果第一次使用，需要授权 Cloudflare 访问 GitHub）
2. 选择你的 `stock-app` 仓库
3. 点击 **Begin setup**

#### 2.3 配置构建设置

Cloudflare Pages 会自动检测到 Vite 项目，配置如下：

```
Framework preset: Vite
Build command: pnpm build
Build output directory: dist
Root directory: (留空)
```

如果 Cloudflare 没有自动检测，手动填写：

```
Framework preset: Vite
Build command: pnpm build
Build output directory: dist
Root directory: /
```

#### 2.4 配置环境变量（可选）

在 **Environment variables** 部分，可以添加：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| API_KEY | 8d33d60f6d3cecb50617aeca9f73f6c8 | 聚合数据API密钥（可选，已在代码中硬编码） |

**注意**：当前 API Key 已经在 `functions/api/stocks.js` 中硬编码，无需配置环境变量。

#### 2.5 部署

1. 点击 **Save and Deploy**
2. 等待构建完成（1-3 分钟）
3. 部署成功后，你会获得一个访问地址：
   ```
   https://your-project.pages.dev
   ```

---

### 步骤 3：配置自定义域名（可选）

#### 3.1 绑定自己的域名

1. 在 Cloudflare Pages 项目页面，点击 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名，例如：`stocks.yourdomain.com`
4. 点击 **Activate domain**

#### 3.2 配置 DNS

如果域名不在 Cloudflare，需要添加 DNS 记录：

```
类型: CNAME
名称: stocks
值: your-project.pages.dev
```

---

## 本地开发

### 开发模式（仅前端）

```bash
# 启动 Vite 开发服务器
pnpm dev

# 访问 http://localhost:5000
```

**注意**：本地开发模式下，Workers Functions 不会运行。API 请求会失败。如需测试 API，需要部署到 Cloudflare Pages。

### 使用 Wrangler 本地测试（推荐）

#### 4.1 安装 Wrangler CLI

```bash
# 全局安装 Wrangler
pnpm add -g wrangler

# 或使用 npm
npm install -g wrangler
```

#### 4.2 登录 Cloudflare

```bash
wrangler login
```

这会打开浏览器，让你授权 Wrangler 访问你的 Cloudflare 账号。

#### 4.3 本地运行项目

```bash
# 在项目根目录运行
wrangler pages dev dist --functions=functions

# 指定端口
wrangler pages dev dist --functions=functions --port 5000
```

现在你可以访问 http://localhost:5000，并且 Workers Functions 也会正常运行！

---

## 部署后测试

### 测试前端

访问你的项目地址：
```
https://your-project.pages.dev
```

### 测试 API

#### 1. 健康检查

```bash
curl https://your-project.pages.dev/api/health
```

预期响应：
```json
{
  "status": "ok",
  "service": "Cloudflare Pages",
  "timestamp": "2024-04-07T06:54:22.000Z",
  "features": {
    "api": "enabled",
    "cdn": "global",
    "ssl": "automatic"
  }
}
```

#### 2. 股票数据

```bash
curl "https://your-project.pages.dev/api/stocks?market=sh&page=1"
```

预期响应：
```json
{
  "success": true,
  "data": [
    {
      "name": "贵州茅台",
      "code": "600000",
      "price": "1700.00",
      "changePercent": "2.35"
    }
  ],
  "total": 2307,
  "page": 1,
  "pageSize": 20,
  "source": "api"
}
```

---

## 配置文件说明

### `_headers` 文件

配置 HTTP 响应头，包括：
- 安全头（X-Frame-Options, X-Content-Type-Options 等）
- CORS 头（用于 API）
- 缓存头（用于静态资源和 API）

### `_redirects` 文件

配置 URL 重定向，主要是 SPA 路由回退到 index.html。

### `wrangler.toml` 文件

Wrangler CLI 配置文件，用于本地开发测试。

---

## 自动部署

Cloudflare Pages 支持自动部署：

### Git Push 自动部署

每次推送到 `main` 分支时，Cloudflare Pages 会自动：
1. 拉取最新代码
2. 运行 `pnpm build`
3. 部署到全球 CDN

### Pull Request 预览环境

每个 Pull Request 都会自动创建一个预览环境：
```
https://your-project.pages.dev/pr/123
```

### 分支部署

每个分支都会自动部署：
```
main 分支 → https://your-project.pages.dev
dev 分支  → https://dev.your-project.pages.dev
```

---

## 费用说明

### Cloudflare Pages 免费套餐

| 功能 | 限制 |
|------|------|
| 带宽 | 无限 |
| 存储 | 无限 |
| 构建 | 500 分钟/月 |
| Workers 请求 | 100,000 次/月 |
| 预览环境 | 无限 |

**总费用：0 元（永久免费）**

### 聚合数据 API 费用

| 套餐 | 价格 | 调用次数 |
|------|------|---------|
| 免费套餐 | 免费 | 每日 100 次 |
| 基础版 | 99 元/月 | 10,000 次 |
| 标准版 | 299 元/月 | 50,000 次 |

**建议**：如果是学习/演示，使用免费套餐足够。

---

## 常见问题

### Q1: 部署后 API 请求失败？

**A**：检查以下几点：
1. 确认 `functions/api/stocks.js` 文件存在
2. 检查聚合数据 API Key 是否正确
3. 查看部署日志，是否有构建错误

### Q2: 本地开发时 API 请求失败？

**A**：本地开发模式下，Workers Functions 不会运行。解决方法：
1. 使用 `wrangler pages dev dist --functions=functions` 运行
2. 或直接部署到 Cloudflare Pages 测试

### Q3: 如何更新 API Key？

**A**：编辑 `functions/api/stocks.js` 文件：
```javascript
const STOCK_API_CONFIG = {
  apiKey: 'your-new-api-key',
  // ...
};
```

然后提交并推送代码，Cloudflare Pages 会自动重新部署。

### Q4: 如何查看部署日志？

**A**：
1. 访问 Cloudflare Dashboard
2. 进入你的 Pages 项目
3. 点击 **Deployments**
4. 选择一个部署，点击 **View logs**

### Q5: 如何回滚到之前的版本？

**A**：
1. 访问 Cloudflare Pages 项目页面
2. 点击 **Deployments**
3. 找到要回滚的版本
4. 点击右侧的 **...** 菜单
5. 选择 **Rollback to this deployment**

### Q6: Workers 请求限制超过怎么办？

**A**：
1. 优化 API 调用（增加缓存、减少请求次数）
2. 升级到付费套餐（20 美元/月）
3. 考虑使用其他方案（如 Vercel + Railway）

---

## 性能优化建议

### 1. 启用缓存

在 `functions/api/stocks.js` 中添加缓存逻辑，减少 API 调用次数。

### 2. 增加 Page Size

减少分页次数，例如将每页数据从 20 条增加到 50 条。

### 3. 使用 CDN 缓存

`_headers` 文件已配置了 API 缓存：
```
/api/*
  Cache-Control: public, max-age=60, s-maxage=300
```

### 4. 压缩静态资源

Vite 默认会压缩 JS 和 CSS 文件。

---

## 项目结构对比

### 迁移前（Express + Vite）

```
├── server/           # Express 后端
│   ├── server.ts
│   ├── routes/
│   │   └── stocks.ts
│   └── vite.ts
├── src/              # 前端源码
└── .coze             # 部署配置
```

### 迁移后（Cloudflare Pages）

```
├── src/              # 前端源码
├── functions/        # Workers Functions
│   └── api/
│       ├── stocks.js
│       └── health.js
├── public/           # 静态资源和配置
│   ├── _headers
│   └── _redirects
└── wrangler.toml     # Wrangler 配置
```

---

## 总结

✅ **优点**：
- 完全免费（永久）
- 全球 CDN 加速
- 自动 HTTPS
- 自动部署
- Workers Functions 支持 API

⚠️ **限制**：
- Workers 请求限制（100,000 次/月）
- 构建时间限制（500 分钟/月）

🎯 **适合场景**：
- 学习和演示
- 个人项目
- 低流量应用
- 原型开发

---

## 参考链接

- [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/)
- [Workers Functions 文档](https://developers.cloudflare.com/pages/functions/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [聚合数据 API 文档](http://web.juhe.cn/finance/stock/shall)
