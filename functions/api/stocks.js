// Cloudflare Pages Function for Stocks API
// 处理股票行情请求，调用聚合数据API

// 聚合数据API配置
const STOCK_API_CONFIG = {
  apiKey: '8d33d60f6d3cecb50617aeca9f73f6c8',
  endpoints: {
    sh: 'http://web.juhe.cn/finance/stock/shall',
    sz: 'http://web.juhe.cn/finance/stock/szall',
    us: 'http://web.juhe.cn/finance/stock/usaall',
    hk: 'http://web.juhe.cn/finance/stock/hkall',
  },
};

// 真实股票名称库
const STOCK_NAMES = {
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
function generateMockStocks(market, page, pageSize) {
  const stocks = [];
  const names = STOCK_NAMES[market] || STOCK_NAMES.sh;

  for (let i = 0; i < pageSize; i++) {
    const index = (page - 1) * pageSize + i;
    let code;

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
    let changePercent;
    if (rand < 0.05) {
      changePercent = (Math.random() > 0.5 ? 5.01 : -5.01) * (0.5 + Math.random() * 1.5);
    } else if (rand < 0.2) {
      changePercent = (Math.random() * 2 - 1) * (3 + Math.random() * 2);
    } else {
      changePercent = (Math.random() * 6 - 3);
    }

    let price;
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

// 股票行情API处理函数
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const market = url.searchParams.get('market') || 'sh';
  const page = url.searchParams.get('page') || '1';
  const pageSize = url.searchParams.get('pageSize') || '20';

  console.log('股票API请求:', { market, page, pageSize });

  try {
    // 调用聚合数据真实API
    const apiUrl = STOCK_API_CONFIG.endpoints[market];
    if (!apiUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid market parameter',
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      console.log(`调用聚合数据API: ${apiUrl}`);

      // 构建请求参数
      const params = new URLSearchParams({
        key: STOCK_API_CONFIG.apiKey,
        page: page,
      });

      // 沪市和深市支持stock参数（a表示A股，b表示B股）
      if (market === 'sh' || market === 'sz') {
        params.append('stock', 'a');
      }

      const requestUrl = `${apiUrl}?${params.toString()}`;
      console.log('请求URL:', requestUrl);

      const response = await fetch(requestUrl, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();
      console.log('API响应状态:', data.error_code);
      console.log('API响应原因:', data.reason);

      if (data.error_code === 0 && data.result) {
        const result = data.result;
        const stockList = result.data || [];

        if (stockList.length > 0) {
          // 根据不同市场的返回格式转换数据
          const stocks = stockList.map((item) => {
            // 沪市/深市格式
            if (market === 'sh' || market === 'sz') {
              return {
                name: item.name,
                code: item.code || item.symbol,
                price: item.trade,
                changePercent: item.changepercent,
              };
            }
            // 美股格式
            if (market === 'us') {
              return {
                name: item.cname,
                code: item.symbol,
                price: item.price,
                changePercent: item.chg,
              };
            }
            // 港股格式
            if (market === 'hk') {
              return {
                name: item.name,
                code: item.symbol,
                price: item.lasttrade,
                changePercent: item.changepercent,
              };
            }
            return null;
          }).filter(Boolean);

          console.log('成功获取真实数据:', stocks.length);

          return new Response(JSON.stringify({
            success: true,
            data: stocks,
            total: parseInt(result.totalCount || '0'),
            page: parseInt(result.page || page),
            pageSize: parseInt(result.num || pageSize),
            source: 'api',
          }), {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } else {
        console.log('API返回错误或无数据:', data.reason);
      }
    } catch (error) {
      console.error('聚合数据API请求失败:', error);
    }

    // 如果所有API都失败，使用模拟数据
    console.warn('所有API端点都失败，使用模拟数据');
    const mockData = generateMockStocks(market, parseInt(page), parseInt(pageSize));

    return new Response(JSON.stringify({
      success: true,
      data: mockData,
      total: 100,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      source: 'mock',
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('股票API错误:', error);
    return new Response(JSON.stringify({
      success: false,
      error: '获取股票数据失败',
      message: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
