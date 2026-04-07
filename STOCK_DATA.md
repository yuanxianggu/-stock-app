# 股票数据说明

## 当前状态

应用当前使用的是**模拟数据**，原因如下：

### API 调用失败
系统尝试了以下聚合数据API端点，均返回错误：
- `https://route.showapi.com/131-63`
- `https://route.showapi.com/131-60`
- `https://route.showapi.com/131-62`

错误信息：`appKey err`

### 原因分析

聚合数据的API需要两个参数：
1. **showapi_appid**：应用ID
2. **showapi_sign**：应用签名密钥

当前配置中，两个参数使用的是同一个值 `8d33d60f6d3cecb50617aeca9f73f6c8`，这可能导致：
- 这个值只是签名（sign），缺少应用ID
- 或者这是demo key，不支持实际API调用
- 或者需要特殊配置才能使用

## 如何使用真实数据

### 方案1：使用聚合数据API

如果你有聚合数据的账号，需要：

1. **获取正确的密钥**：
   - 登录聚合数据官网（showapi.com）
   - 获取你的 `showapi_appid` 和 `showapi_sign`
   - 确保你的账号有足够的调用次数

2. **更新配置**：
   修改 `src/main.ts` 中的 `CONFIG` 部分：
   ```typescript
   const CONFIG = {
     API_KEY: '8d33d60f6d3cecb50617aeca9f73f6c8', // 你的appid
     API_SIGN: '你的sign密钥', // 添加这一行
     PAGE_SIZE: 20,
     // ...
   };
   ```

3. **更新API请求**：
   修改 `fetchStockList` 函数，使用分开的appid和sign：
   ```typescript
   const params = new URLSearchParams({
     showapi_appid: CONFIG.API_KEY,
     showapi_sign: CONFIG.API_SIGN,
     // ...
   });
   ```

### 方案2：使用其他免费API

以下是一些免费的股票API选项：

1. **Alpha Vantage**（免费但有调用限制）
   - 注册：https://www.alphavantage.co/support/#api-key
   - 优点：支持美股、港股、外汇等
   - 缺点：每分钟限制5次调用

2. **Yahoo Finance**（非官方API）
   - 使用第三方库如 `yahoo-finance2`
   - 优点：数据全面，支持多市场
   - 缺点：稳定性可能有问题

3. **腾讯财经/新浪财经**（国内API）
   - 优点：支持A股、港股
   - 缺点：需要爬虫或逆向工程

## 模拟数据说明

当前模拟数据的特点：

### 股票名称
- 使用真实的知名股票名称
- 包含茅台、腾讯、苹果等知名股票

### 股票代码
- 沪市：600000-600019（6位数字）
- 深市：000001-000019（6位数字）
- 港股：HK0001-HK0020（4位数字）
- 美股：AAPL、MSFT、GOOGL等真实代码

### 涨跌幅分布
- 80%：-3% 到 +3%（正常波动）
- 15%：3% 到 5%（较大波动）
- 5%：超过5%（极端情况）

### 价格范围
- 美股：100-300美元
- 港股：50-500港币
- A股：5-100元

## 下一步建议

1. **如果用于演示**：当前模拟数据已经足够展示功能
2. **如果需要真实数据**：
   - 联系聚合数据获取正确的appid和sign
   - 或选择其他免费/付费API
   - 或使用后端服务转发API请求

3. **功能完善建议**：
   - 添加股票搜索功能
   - 添加股票详情页
   - 添加K线图
   - 添加自选股功能
   - 添加价格提醒

## 技术说明

应用使用的技术栈：
- 前端：Vite + TypeScript + Tailwind CSS
- 数据获取：Fetch API
- 状态管理：原生JavaScript对象
- 性能优化：滚动节流、懒加载

所有代码都已通过ESLint和TypeScript类型检查。
