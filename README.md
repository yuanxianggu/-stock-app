# 全球股票行情系统

这是一个基于 Cloudflare Pages + TypeScript + Tailwind CSS 的股票行情应用，支持多市场实时行情查询。

**核心特性：**
- 🚀 前端：Vite + TypeScript + Tailwind CSS
- ⚡️ 后端：Cloudflare Workers Functions（边缘计算）
- 🌍 部署：Cloudflare Pages（全球 CDN 加速）
- 💰 费用：完全免费（永久）
- 📱 适配：完美支持移动端
- 🎨 样式：亮色/暗色主题自动切换

## 快速开始

### 本地开发

#### 方式 1：纯前端开发（仅 UI）

```bash
# 启动 Vite 开发服务器
pnpm dev

# 访问 http://localhost:5000
```

**注意**：此模式下 Workers Functions 不会运行，API 请求会失败。

#### 方式 2：完整开发（包含 Workers Functions）

```bash
# 1. 安装 Wrangler CLI
pnpm add -g wrangler

# 2. 登录 Cloudflare
wrangler login

# 3. 启动本地服务器（包含 Workers Functions）
wrangler pages dev dist --functions=functions --port 5000
```

现在可以访问 http://localhost:5000，API 也会正常工作！

### 部署到 Cloudflare Pages

详细部署指南请查看 [DEPLOY_TO_CLOUDFLARE.md](./DEPLOY_TO_CLOUDFLARE.md)

**快速部署步骤**：

1. 推送代码到 GitHub
2. 访问 https://dash.cloudflare.com
3. 创建 Pages 项目，连接 GitHub 仓库
4. 点击部署（自动识别 Vite 项目）
5. 获得访问地址：`https://your-project.pages.dev`

## 项目结构

```
├── src/                   # 前端源码目录
│   ├── main.ts           # 主逻辑（股票列表、无限滚动）
│   ├── index.ts          # 应用入口
│   └── index.css         # 全局样式（包含 Tailwind 指令）
├── functions/            # Cloudflare Workers Functions
│   └── api/
│       ├── stocks.js     # 股票数据 API（聚合数据）
│       └── health.js     # 健康检查 API
├── public/               # 静态资源和配置
│   ├── _headers          # HTTP 响应头配置
│   └── _redirects        # URL 重定向规则
├── index.html            # HTML 入口文件
├── vite.config.ts        # Vite 配置
├── wrangler.toml         # Wrangler 配置（本地开发）
├── tailwind.config.js    # Tailwind CSS 配置
└── tsconfig.json         # TypeScript 配置
```

**目录说明：**

- **`src/`** - 前端应用代码
  - `main.ts` - 核心业务逻辑（股票列表、市场切换、无限滚动）
  - `index.ts` - 应用初始化

- **`functions/`** - Cloudflare Workers Functions
  - `stocks.js` - 股票数据 API，调用聚合数据获取真实行情
  - `health.js` - 健康检查端点

- **`public/`** - Cloudflare Pages 配置
  - `_headers` - 自定义 HTTP 响应头（安全头、CORS、缓存）
  - `_redirects` - URL 重定向规则（SPA 路由回退）

**工作原理：**

- **本地开发** (`wrangler pages dev`)：
  - Wrangler 启动本地服务器
  - 前端使用 Vite 构建结果
  - Workers Functions 本地运行
  - 支持 API 调用

- **生产环境** (Cloudflare Pages)：
  - `pnpm build` 构建前端 → `dist/` 目录
  - Workers Functions 自动部署到 Cloudflare 全球网络
  - 静态资源通过 CDN 加速
  - API 运行在边缘节点（全球 300+ 节点）

## 核心开发规范

### 1. Workers Functions 开发

**添加新的 API 端点**

在 `functions/api/` 目录下创建新的 `.js` 文件：

```javascript
// functions/api/hello.js
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const name = url.searchParams.get('name') || 'World';

  return new Response(JSON.stringify({
    message: `Hello, ${name}!`,
    timestamp: new Date().toISOString(),
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

**访问 API**

访问路径会自动映射：
- `functions/api/hello.js` → `/api/hello`
- `functions/api/stocks.js` → `/api/stocks`

**前端调用 API**

```typescript
async function sayHello(name: string) {
  const response = await fetch(`/api/hello?name=${name}`);
  const data = await response.json();
  console.log(data);
}
```

**Workers Functions 最佳实践**

- ✅ 使用 `export async function onRequest(context)` 导出处理函数
- ✅ 添加 CORS 头：`'Access-Control-Allow-Origin': '*'`
- ✅ 使用 `fetch` API 进行外部请求（支持）
- ✅ 返回 `new Response()` 对象
- ✅ 设置正确的 `Content-Type` 头

### 2. 样式开发

**使用 Tailwind CSS**

本项目使用 Tailwind CSS 进行样式开发，支持亮色/暗色模式自动切换。

```typescript
// 使用 Tailwind 工具类
app.innerHTML = `
  <div class="flex items-center justify-center min-h-screen bg-white dark:bg-black">
    <h1 class="text-4xl font-bold text-black dark:text-white">
      Hello World
    </h1>
  </div>
`;
```

**主题变量**

主题变量定义在 `src/index.css` 中，支持自动适配系统主题：

```css
:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}
```

**常用 Tailwind 类名**

- 布局：`flex`, `grid`, `container`, `mx-auto`
- 间距：`p-4`, `m-4`, `gap-4`, `space-x-4`
- 颜色：`bg-white`, `text-black`, `dark:bg-black`, `dark:text-white`
- 排版：`text-lg`, `font-bold`, `leading-8`, `tracking-tight`
- 响应式：`sm:`, `md:`, `lg:`, `xl:`

### 2. 依赖管理

**必须使用 pnpm 管理依赖**

```bash
# ✅ 安装依赖
pnpm install

# ✅ 添加新依赖
pnpm add package-name

# ✅ 添加开发依赖
pnpm add -D package-name

# ❌ 禁止使用 npm 或 yarn
# npm install  # 错误！
# yarn add     # 错误！
```

项目已配置 `preinstall` 脚本，使用其他包管理器会报错。

### 3. TypeScript 开发

**类型安全**

充分利用 TypeScript 的类型系统，确保代码质量：

```typescript
// 定义接口
interface User {
  id: number;
  name: string;
  email: string;
}

// 使用类型
function createUser(data: User): void {
  console.log(`Creating user: ${data.name}`);
}

// DOM 操作类型推断
const button = document.querySelector<HTMLButtonElement>('#my-button');
if (button) {
  button.addEventListener('click', () => {
    console.log('Button clicked');
  });
}
```

**避免 any 类型**

尽量避免使用 `any`，使用 `unknown` 或具体类型：

```typescript
// ❌ 不推荐
function process(data: any) { }

// ✅ 推荐
function process(data: unknown) {
  if (typeof data === 'string') {
    console.log(data.toUpperCase());
  }
}
```

## 常见开发场景

### 添加新页面

本项目是单页应用（SPA），如需多页面：

1. 在 `src/` 下创建新的 `.ts` 文件
2. 在 `vite.config.ts` 中配置多入口
3. 创建对应的 `.html` 文件

### DOM 操作

```typescript
// 获取元素
const app = document.getElementById('app');
const button = document.querySelector<HTMLButtonElement>('.my-button');

// 动态创建元素
const div = document.createElement('div');
div.className = 'flex items-center gap-4';
div.textContent = 'Hello World';
app?.appendChild(div);

// 事件监听
button?.addEventListener('click', (e) => {
  console.log('Clicked', e);
});
```

### 数据获取

```typescript
// Fetch API
async function fetchData() {
  try {
    const response = await fetch('https://api.example.com/data');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
}

// 使用数据
fetchData().then(data => {
  console.log(data);
});
```

### 环境变量

在 `.env` 文件中定义环境变量（需以 `VITE_` 开头）：

```bash
VITE_API_URL=https://api.example.com
```

在代码中使用：

```typescript
const apiUrl = import.meta.env.VITE_API_URL;
console.log(apiUrl); // https://api.example.com
```

## 技术栈

**前端：**
- **构建工具**: Vite 7.x
- **语言**: TypeScript 5.x
- **样式**: Tailwind CSS 3.x

**后端（Workers Functions）：**
- **运行时**: Cloudflare Workers（V8 Isolates）
- **API**: 原生 Fetch API（支持）
- **框架**: 无框架（纯 JavaScript）

**部署：**
- **平台**: Cloudflare Pages
- **CDN**: Cloudflare 全球网络（300+ 节点）
- **SSL**: 自动 Let's Encrypt
- **费用**: 永久免费

**数据源：**
- **股票行情**: 聚合数据 API（Juhe.cn）

**工具：**
- **包管理器**: pnpm 9+
- **开发工具**: Wrangler CLI
- **类型检查**: TypeScript

## 参考文档

**前端：**
- [Vite 官方文档](https://cn.vitejs.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/zh/docs/)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

**Cloudflare：**
- [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/)
- [Workers Functions 文档](https://developers.cloudflare.com/pages/functions/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)

**数据源：**
- [聚合数据 API 文档](http://web.juhe.cn/finance/stock/shall)

## 重要提示

1. **必须使用 pnpm** 作为包管理器
2. **使用 TypeScript** 进行类型安全开发，避免使用 `any`
3. **使用 Tailwind CSS** 进行样式开发，支持响应式和暗色模式
4. **Workers Functions 必须导出 `onRequest` 函数**
5. **API 路由以 `/api` 开头**，避免与前端路由冲突
6. **部署到 Cloudflare Pages**，享受全球 CDN 加速和免费服务
7. **本地开发推荐使用 `wrangler pages dev`**，可以测试 Workers Functions

## 费用说明

| 项目 | 费用 | 说明 |
|------|------|------|
| Cloudflare Pages | **0 元**（永久免费） | 无限带宽、无限存储 |
| Workers Functions | **0 元**（100,000 次/月） | 超出后按 0.5 美元/100万次计费 |
| 聚合数据 API | **0-999 元/月** | 根据套餐而定 |

**总费用：0 元（学习/演示）至 999 元/月（商业）**

## 常见问题

**Q: 如何修改股票数据源？**

A: 编辑 `functions/api/stocks.js` 文件，修改 `STOCK_API_CONFIG` 配置。

**Q: Workers Functions 请求限制超出怎么办？**

A:
1. 优化 API 调用（增加缓存、减少请求次数）
2. 升级到 Cloudflare Pages 付费套餐（20 美元/月）
3. 考虑使用其他方案（如 Vercel + Railway）

**Q: 如何添加数据库？**

A: 推荐使用 Supabase（免费）：

```bash
# 安装 Supabase 客户端
pnpm add @supabase/supabase-js

# 在 Workers Functions 中使用
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);
```
