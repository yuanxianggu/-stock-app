# 服务端架构说明

## 项目架构

本项目采用 **Express + Vite** 的前后端一体化架构，服务端和前端运行在同一进程中。

```
项目结构
├── server/              # 服务端代码
│   ├── server.ts        # Express 服务入口
│   ├── vite.ts          # Vite 中间件集成
│   └── routes/          # API 路由
│       ├── index.ts     # 主路由（聚合所有子路由）
│       └── stocks.ts    # 股票API路由
├── src/                 # 前端代码
├── .env                 # 环境变量配置
└── .coze                # 部署配置
```

## 服务端核心文件

### 1. server/server.ts - 服务入口

**职责**：
- 创建 Express 应用
- 配置中间件（JSON解析、日志、错误处理）
- 集成 Vite 开发服务器
- 监听 5000 端口

**关键代码**：
```typescript
const app = express();
const server = createServer(app);

// 添加中间件
app.use(express.json());
app.use(router); // 注册API路由

// 集成 Vite
await setupVite(app);

// 监听端口
server.listen(5000);
```

### 2. server/routes/stocks.ts - 股票API

**职责**：
- 提供股票行情数据接口
- 尝试调用多个聚合数据API端点
- 失败时降级到模拟数据
- 数据格式转换

**API端点**：
- `GET /api/stocks` - 获取股票列表

**请求参数**：
- `market`: 市场代码（sh/sz/hk/us）
- `page`: 页码（从1开始）
- `pageSize`: 每页数量（默认20）

**响应格式**：
```json
{
  "success": true,
  "data": [
    {
      "name": "贵州茅台",
      "code": "600000",
      "price": "6.86",
      "changePercent": "-3.07"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "source": "mock"
}
```

### 3. server/routes/index.ts - 主路由

**职责**：
- 聚合所有子路由
- 提供通用API接口

**注册的路由**：
- `/api/stocks` - 股票API
- `/api/health` - 健康检查
- `/api/hello` - 测试接口

## 环境变量配置

### .env 文件

```bash
# 股票API密钥
STOCK_API_KEY=8d33d60f6d3cecb50617aeca9f73f6c8
```

### 使用环境变量

```typescript
const apiKey = process.env.STOCK_API_KEY || '默认值';
```

## 开发与部署

### 开发模式

```bash
# 启动开发服务器（支持热更新）
pnpm dev

# 或使用 coze CLI
coze dev
```

**特点**：
- 支持 Vite HMR（热模块替换）
- 自动重载前端代码
- 后端代码修改需要重启

### 生产模式

```bash
# 构建项目
pnpm build

# 启动生产服务器
pnpm start
```

**特点**：
- 前端代码已编译打包
- 性能优化
- 只提供静态文件服务

## 如何创建新的API路由

### 步骤1：创建路由文件

在 `server/routes/` 目录下创建新文件，例如 `users.ts`：

```typescript
import { Router } from 'express';

const router = Router();

// GET 请求
router.get('/api/users', (req, res) => {
  res.json({
    users: [
      { id: 1, name: '张三' },
      { id: 2, name: '李四' },
    ],
  });
});

// POST 请求
router.post('/api/users', (req, res) => {
  const { name } = req.body;
  res.json({
    success: true,
    user: { id: Date.now(), name },
  });
});

export default router;
```

### 步骤2：注册路由

在 `server/routes/index.ts` 中导入并注册：

```typescript
import { Router } from 'express';
import stockRouter from './stocks';
import userRouter from './users'; // 导入新路由

const router = Router();

// 注册路由
router.use(stockRouter);
router.use(userRouter); // 注册新路由

export default router;
```

### 步骤3：重启服务

```bash
# 如果服务正在运行，先停止
# 然后重新启动
pnpm dev
```

### 步骤4：测试API

```bash
# 测试 GET 请求
curl http://localhost:5000/api/users

# 测试 POST 请求
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"王五"}'
```

## 前端如何调用后端API

### 方式1：使用 fetch

```typescript
// GET 请求
const response = await fetch('/api/stocks?market=sh&page=1');
const data = await response.json();

// POST 请求
const response = await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ name: '王五' }),
});
const data = await response.json();
```

### 方式2：使用 axios

```bash
# 安装 axios
pnpm add axios
```

```typescript
import axios from 'axios';

// GET 请求
const { data } = await axios.get('/api/stocks', {
  params: { market: 'sh', page: 1 },
});

// POST 请求
const { data } = await axios.post('/api/users', {
  name: '王五',
});
```

## 数据降级策略

后端API实现了智能降级策略：

1. **优先尝试真实API**
   - 尝试多个聚合数据端点
   - 超时时间：5秒

2. **降级到模拟数据**
   - 如果所有API都失败
   - 自动生成合理的模拟数据
   - 保证前端永远有数据展示

3. **数据源标记**
   - 响应中包含 `source` 字段
   - `api`：真实数据
   - `mock`：模拟数据

## 性能优化

### 1. 请求日志

开发模式下自动记录请求耗时：

```
GET /api/stocks - 220ms
```

### 2. 错误处理

全局错误处理中间件：

```typescript
app.use((err: Error, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});
```

### 3. 超时控制

API请求设置5秒超时：

```typescript
const response = await axios.get(url, { timeout: 5000 });
```

## 常见问题

### Q1: 修改后端代码后如何生效？

**A**: 需要重启服务：

```bash
# 停止服务
Ctrl + C

# 重新启动
pnpm dev
```

### Q2: 如何调试后端代码？

**A**: 使用 console.log 输出调试信息：

```typescript
console.log('股票API请求:', { market, page });
```

查看日志：
```bash
tail -f /app/work/logs/bypass/app.log
```

### Q3: 端口被占用怎么办？

**A**: 查找并停止占用端口的进程：

```bash
# 查找进程
ss -lptn 'sport = :5000'

# 停止进程
kill <PID>
```

### Q4: 如何添加数据库支持？

**A**: 可以添加 MongoDB、PostgreSQL 等数据库：

1. 安装数据库驱动
2. 配置数据库连接
3. 在路由中使用数据库操作

## 安全建议

1. **环境变量管理**
   - 不要在代码中硬编码密钥
   - 使用 `.env` 文件存储敏感信息
   - 生产环境使用环境变量

2. **输入验证**
   - 验证所有请求参数
   - 防止SQL注入、XSS攻击

3. **错误处理**
   - 不要返回详细的错误信息给客户端
   - 记录服务器端错误日志

4. **API限流**
   - 添加速率限制中间件
   - 防止恶意请求

## 总结

本项目采用 Express + Vite 的一体化架构，具有以下优势：

✅ 简单易用，无需单独配置前端和后端服务器
✅ 开发体验好，支持热更新
✅ 部署简单，一个命令即可启动
✅ 扩展性强，易于添加新的API路由

对于需要更多后端功能（如数据库、认证等）的项目，可以考虑将前后端分离，但当前架构对于中小型项目已经足够。
