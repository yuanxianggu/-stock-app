import { Router } from 'express';
import axios from 'axios';

const router = Router();

// 股票API配置
const STOCK_API_CONFIG = {
  // 聚合数据需要两个参数：appid 和 sign
  appid: process.env.STOCK_API_APPID || '8d33d60f6d3cecb50617aeca9f73f6c8',
  sign: process.env.STOCK_API_SIGN || '8d33d60f6d3cecb50617aeca9f73f6c8',
  endpoints: [
    'https://route.showapi.com/131-63', // 股票行情
    'https://route.showapi.com/131-60', // 实时行情
    'https://route.showapi.com/131-62', // 历史行情
  ],
};

// 真实股票名称库
const STOCK_NAMES: Record<string, string[]> = {
  sh: [
    '贵州茅台', '中国平安', '招商银行', '浦发银行', '上汽集团',
    '工商银行', '农业银行', '中国银行', '建设银行', '交通银行',
    '兴业银行', '民生银行', '华夏银行', '中信银行', '光大银行',
    '中国石油', '中国石化', '长江电力', '中国神华', '中国联通',
    '中国移动', '中国电信', '紫金矿业', '宝钢股份', '中国铝业',
  ],
  sz: [
    '宁德时代', '比亚迪', '五粮液', '格力电器', '美的集团',
    '万科A', '平安银行', '京东方A', '立讯精密', '牧原股份',
    '海康威视', '迈瑞医疗', '爱尔眼科', '长春高新', '东方财富',
    '智飞生物', '药明康德', '汇川技术', '阳光电源', '三花智控',
    '宁德时代', '天齐锂业', '赣锋锂业', '亿纬锂能', '恩捷股份',
  ],
  hk: [
    '腾讯控股', '阿里巴巴', '美团点评', '小米集团', '中国移动',
    '建设银行', '工商银行', '中国平安', '招商银行', '中国银行',
    '友邦保险', '香港交易所', '长江实业', '新鸿基地产', '恒基地产',
    '中石油', '中石化', '中国移动', '中国电信', '联通',
    '药明生物', '百济神州', '信达生物', '君实生物', '康希诺',
  ],
  us: [
    '苹果', '微软', '亚马逊', '谷歌', '特斯拉',
    'Meta', '英伟达', '台积电', '伯克希尔', '强生',
    'Visa', '摩根大通', '宝洁', '联合健康', '诺和诺德',
    '礼来', '阿斯麦', '博通', '腾讯', '阿里巴巴',
    '台积电', '三星电子', '丰田汽车', '强生', '宝洁',
  ],
};

// 美股真实代码
const US_STOCK_CODES = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM',
  'V', 'PG', 'JNJ', 'WMT', 'XOM', 'CVX', 'KO', 'PEP', 'COST',
  'AVGO', 'CSCO', 'ADBE', 'CRM', 'NFLX', 'INTC', 'AMD', 'ORCL',
];

// 生成模拟数据
function generateMockStocks(market: string, page: number, pageSize: number) {
  const stocks = [];
  const names = STOCK_NAMES[market] || STOCK_NAMES.sh;

  for (let i = 0; i < pageSize; i++) {
    const index = (page - 1) * pageSize + i;
    let code: string;

    if (market === 'us') {
      const codeIndex = index % US_STOCK_CODES.length;
      code = US_STOCK_CODES[codeIndex];
    } else if (market === 'hk') {
      code = `HK${String(index + 1).padStart(4, '0')}`;
    } else {
      const prefix = market === 'sh' ? '600' : '000';
      code = `${prefix}${String(index).padStart(6 - prefix.length, '0')}`;
    }

    const rand = Math.random();
    let changePercent: number;
    if (rand < 0.05) {
      changePercent = (Math.random() > 0.5 ? 5.01 : -5.01) * (0.5 + Math.random() * 1.5);
    } else if (rand < 0.2) {
      changePercent = (Math.random() * 2 - 1) * (3 + Math.random() * 2);
    } else {
      changePercent = (Math.random() * 6 - 3);
    }

    let price: number;
    if (market === 'us') {
      price = 100 + Math.random() * 200;
    } else if (market === 'hk') {
      price = 50 + Math.random() * 450;
    } else {
      price = 5 + Math.random() * 95;
    }

    const name = names[index % names.length];

    stocks.push({
      name,
      code,
      price: price.toFixed(2),
      changePercent: changePercent.toFixed(2),
    });
  }

  return stocks;
}

// 股票行情API
router.get('/api/stocks', async (req, res) => {
  try {
    const { market = 'sh', page = 1, pageSize = 20 } = req.query;

    console.log('股票API请求:', { market, page, pageSize });

    // 尝试调用真实API
    for (const endpoint of STOCK_API_CONFIG.endpoints) {
      try {
        console.log(`尝试API端点: ${endpoint}`);
        console.log(`使用 appid: ${STOCK_API_CONFIG.appid.substring(0, 8)}...`);
        console.log(`使用 sign: ${STOCK_API_CONFIG.sign.substring(0, 8)}...`);

        const params = new URLSearchParams({
          showapi_appid: STOCK_API_CONFIG.appid,
          showapi_sign: STOCK_API_CONFIG.sign,
          market: String(market),
          page: String(page),
          num: String(pageSize),
        });

        const url = `${endpoint}?${params.toString()}`;
        console.log('请求URL:', url);

        const response = await axios.get(url, { timeout: 5000 });

        const data = response.data;
        console.log('API响应状态:', data.showapi_res_code);
        console.log('API响应错误:', data.showapi_res_error);

        if (data.showapi_res_code === 0 && data.showapi_res_body) {
          const body = data.showapi_res_body;
          const stockList = body.list || body.data || [];

          if (stockList.length > 0) {
            const stocks = stockList.map((item: any) => ({
              name: item.name || item.stockName || '未知',
              code: item.code || item.stockCode || item.symbol || '',
              price: String(item.current || item.price || item.now || '0.00'),
              changePercent: String(item.changePercent || item.change || item.updown || '0.00'),
            }));

            console.log('成功获取真实数据:', stocks.length);

            return res.json({
              success: true,
              data: stocks,
              total: body.total || stockList.length,
              page: parseInt(String(page)),
              pageSize: parseInt(String(pageSize)),
              source: 'api',
            });
          } else {
            console.log('API返回数据为空');
          }
        }
      } catch (error) {
        console.error(`API端点 ${endpoint} 失败:`, error);
        if (axios.isAxiosError(error)) {
          console.error('错误详情:', error.response?.data);
        }
        continue;
      }
    }

    // 如果所有API都失败，使用模拟数据
    console.warn('所有API端点都失败，使用模拟数据');
    const mockData = generateMockStocks(String(market), parseInt(String(page)), parseInt(String(pageSize)));

    res.json({
      success: true,
      data: mockData,
      total: 100,
      page: parseInt(String(page)),
      pageSize: parseInt(String(pageSize)),
      source: 'mock',
    });
  } catch (error) {
    console.error('股票API错误:', error);
    res.status(500).json({
      success: false,
      error: '获取股票数据失败',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 健康检查
router.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.COZE_PROJECT_ENV,
    timestamp: new Date().toISOString(),
    apis: {
      stock: {
        appid: STOCK_API_CONFIG.appid ? `configured (${STOCK_API_CONFIG.appid.substring(0, 8)}...)` : 'not configured',
        sign: STOCK_API_CONFIG.sign ? `configured (${STOCK_API_CONFIG.sign.substring(0, 8)}...)` : 'not configured',
        endpoints: STOCK_API_CONFIG.endpoints.length,
      },
    },
  });
});

export default router;
