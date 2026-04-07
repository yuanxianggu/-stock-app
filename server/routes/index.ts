import { Router } from 'express';
import stockRouter from './stocks';

const router = Router();

// 股票API路由
router.use(stockRouter);

// API 路由示例
router.get('/api/hello', (req, res) => {
  res.json({
    message: 'Hello from Express + Vite!',
    timestamp: new Date().toISOString(),
  });
});

router.post('/api/data', (req, res) => {
  const requestData = req.body;
  res.json({
    success: true,
    data: requestData,
    receivedAt: new Date().toISOString(),
  });
});

export default router;
