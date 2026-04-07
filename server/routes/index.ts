import { Router } from 'express';
import stockRouter from './stocks';
import readPdfRouter from './read-pdf';

const router = Router();

// 股票API路由
router.use(stockRouter);

// PDF读取路由
router.use(readPdfRouter);

// API 路由示例
router.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Express + Vite!',
    timestamp: new Date().toISOString(),
  });
});

export default router;
