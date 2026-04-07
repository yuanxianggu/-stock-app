// 类型定义
interface StockData {
  name: string;
  code: string;
  price: string;
  changePercent: string;
}

interface ApiResponse {
  data: StockData[];
  total?: number;
}

// 配置
const CONFIG = {
  API_KEY: '8d33d60f6d3cecb50617aeca9f73f6c8',
  PAGE_SIZE: 20,
  // 聚合数据股票API - 尝试多个可能的端点
  API_ENDPOINTS: [
    'https://route.showapi.com/131-63', // 股票行情
    'https://route.showapi.com/131-60', // 实时行情
    'https://route.showapi.com/131-62', // 历史行情
  ],
};

// 市场配置
const MARKETS = [
  { id: 'sh', name: '沪市' },
  { id: 'sz', name: '深市' },
  { id: 'hk', name: '港股' },
  { id: 'us', name: '美股' },
];

// 应用状态
interface AppState {
  currentMarket: string;
  stockList: StockData[];
  currentPage: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
}

const state: AppState = {
  currentMarket: 'sh',
  stockList: [],
  currentPage: 1,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
};

// DOM 元素
let appElement: HTMLElement | null = null;

// 工具函数：节流
function throttle<T extends (...args: unknown[]) => unknown>(func: T, delay: number): T {
  let lastCall = 0;
  return ((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      return func(...args);
    }
  }) as T;
}

// 工具函数：获取颜色类名
function getColorClass(changePercent: string): string {
  const num = parseFloat(changePercent);
  if (isNaN(num)) return 'text-neutral';
  if (num > 0) return 'text-up';
  if (num < 0) return 'text-down';
  return 'text-neutral';
}

// API 请求
async function fetchStockList(market: string, page: number): Promise<ApiResponse> {
  console.log('请求 API:', { market, page });

  // 尝试所有可能的API端点
  for (const endpoint of CONFIG.API_ENDPOINTS) {
    try {
      // 构建请求参数
      const params = new URLSearchParams({
        showapi_appid: CONFIG.API_KEY,
        showapi_sign: CONFIG.API_KEY,
        market: market,
        page: String(page),
        num: String(CONFIG.PAGE_SIZE),
      });

      const url = `${endpoint}?${params.toString()}`;
      console.log('尝试API:', endpoint);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('API 响应:', data);

      // 检查响应格式
      if (data.showapi_res_code === 0 && data.showapi_res_body) {
        const body = data.showapi_res_body;
        const stockList = body.list || body.data || [];

        if (stockList.length > 0) {
          // 转换数据格式
          const stocks = stockList.map((item: Record<string, string | number>) => ({
            name: (item.name || item.stockName || '未知') as string,
            code: (item.code || item.stockCode || item.symbol || '') as string,
            price: String(item.current || item.price || item.now || '0.00'),
            changePercent: String(item.changePercent || item.change || item.updown || '0.00'),
          }));

          console.log('成功获取真实数据:', stocks.length);
          return {
            data: stocks,
            total: body.total || stockList.length,
          };
        }
      }
    } catch (error) {
      console.error(`API 端点 ${endpoint} 请求失败:`, error);
      continue;
    }
  }

  console.warn('所有API端点都失败，使用模拟数据');
  return {
    data: generateMockStocks(market, page),
    total: 100,
  };
}

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

// 真实股票代码库（前缀）
const STOCK_CODES: Record<string, { prefix: string, start: number }> = {
  sh: { prefix: '600', start: 0 },
  sz: { prefix: '000', start: 0 },
  hk: { prefix: 'HK', start: 1 },
  us: { prefix: '', start: 0 }, // 美股用字母代码
};

// 真实美股代码
const US_STOCK_CODES = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'JPM',
  'V', 'PG', 'JNJ', 'WMT', 'XOM', 'CVX', 'KO', 'PEP', 'COST',
  'AVGO', 'CSCO', 'ADBE', 'CRM', 'NFLX', 'INTC', 'AMD', 'ORCL',
];

// 生成模拟数据（仅用于演示）
function generateMockStocks(market: string, page: number): StockData[] {
  const stocks: StockData[] = [];
  const names = STOCK_NAMES[market] || STOCK_NAMES.sh;
  const namesLength = names.length;

  console.log('生成模拟数据:', { market, page });

  for (let i = 0; i < CONFIG.PAGE_SIZE; i++) {
    const index = (page - 1) * CONFIG.PAGE_SIZE + i;
    let code: string;

    // 根据市场生成不同的股票代码
    if (market === 'us') {
      // 美股使用真实代码
      const codeIndex = index % US_STOCK_CODES.length;
      code = US_STOCK_CODES[codeIndex];
    } else if (market === 'hk') {
      // 港股：HK0001, HK0002...
      const codeIndex = index + STOCK_CODES.hk.start;
      code = `${STOCK_CODES.hk.prefix}${String(codeIndex).padStart(4, '0')}`;
    } else {
      // 沪市/深市：600000, 600001... 或 000001, 000002...
      const codeIndex = index + STOCK_CODES[market].start;
      code = `${STOCK_CODES[market].prefix}${String(codeIndex).padStart(6 - STOCK_CODES[market].prefix.length, '0')}`;
    }

    // 生成更合理的涨跌幅（大部分在 -5% 到 +5% 之间，少数极端情况）
    const rand = Math.random();
    let changePercent: number;
    if (rand < 0.05) {
      // 5%的概率涨跌幅超过5%
      changePercent = (Math.random() > 0.5 ? 5.01 : -5.01) * (0.5 + Math.random() * 1.5);
    } else if (rand < 0.2) {
      // 15%的概率涨跌幅在3%-5%之间
      changePercent = (Math.random() * 2 - 1) * (3 + Math.random() * 2);
    } else {
      // 80%的概率涨跌幅在-3%到+3%之间
      changePercent = (Math.random() * 6 - 3);
    }

    // 根据市场调整价格范围
    let price: number;
    if (market === 'us') {
      // 美股价格较高（100-300美元）
      price = 100 + Math.random() * 200;
    } else if (market === 'hk') {
      // 港股价格中等（50-500港币）
      price = 50 + Math.random() * 450;
    } else {
      // A股价格较低（5-100元）
      price = 5 + Math.random() * 95;
    }

    // 循环使用真实股票名称
    const nameIndex = index % namesLength;
    const stockName = names[nameIndex];

    const stock: StockData = {
      name: stockName,
      code,
      price: price.toFixed(2),
      changePercent: changePercent.toFixed(2),
    };
    stocks.push(stock);
  }

  console.log('生成的模拟数据:', stocks.length);
  return stocks;
}

// 渲染导航栏
function renderNavbar(): string {
  return `
    <div class="sticky top-0 z-50 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
      <div class="flex items-center overflow-x-auto">
        ${MARKETS.map(market => `
          <button
            onclick="window.switchMarket('${market.id}')"
            class="flex-1 min-w-0 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              state.currentMarket === market.id
                ? 'text-blue-500 dark:text-blue-400 border-b-2 border-blue-500 dark:border-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }"
          >
            ${market.name}
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

// 渲染加载状态
function renderLoading(): string {
  return `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-black">
      <div class="flex flex-col items-center gap-3">
        <div class="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400">加载中...</p>
      </div>
    </div>
  `;
}

// 渲染股票列表项
function renderStockItem(stock: StockData): string {
  const colorClass = getColorClass(stock.changePercent);
  const sign = parseFloat(stock.changePercent) > 0 ? '+' : '';

  return `
    <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
      <div class="flex-1 min-w-0 pr-4">
        <div class="flex items-center gap-2">
          <span class="text-base font-semibold text-gray-900 dark:text-gray-100">${stock.name}</span>
        </div>
        <span class="text-xs text-gray-500 dark:text-gray-400">${stock.code}</span>
      </div>
      <div class="flex flex-col items-end gap-1 min-w-0">
        <div class="text-base font-medium ${colorClass}">${stock.price}</div>
        <div class="text-xs ${colorClass}">${sign}${stock.changePercent}%</div>
      </div>
    </div>
  `;
}

// 渲染加载更多状态
function renderLoadMore(): string {
  if (!state.hasMore && state.stockList.length > 0) {
    return `
      <div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        到底啦
      </div>
    `;
  }

  if (state.isLoadingMore) {
    return `
      <div class="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        正在加载更多...
      </div>
    `;
  }

  return '';
}

// 渲染骨架屏
function renderSkeleton(): string {
  let skeletonHtml = '';
  for (let i = 0; i < CONFIG.PAGE_SIZE; i++) {
    skeletonHtml += `
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
        <div class="flex-1 pr-4">
          <div class="h-5 w-24 skeleton rounded mb-2"></div>
          <div class="h-4 w-16 skeleton rounded"></div>
        </div>
        <div class="flex flex-col items-end gap-1">
          <div class="h-5 w-16 skeleton rounded mb-1"></div>
          <div class="h-4 w-12 skeleton rounded"></div>
        </div>
      </div>
    `;
  }
  return skeletonHtml;
}

// 渲染主应用
function renderApp(): void {
  if (!appElement) return;

  console.log('开始渲染应用:', {
    isLoading: state.isLoading,
    isLoadingMore: state.isLoadingMore,
    stockListLength: state.stockList.length,
    hasMore: state.hasMore,
  });

  const navbarHtml = renderNavbar();
  const loadingHtml = state.isLoading ? renderLoading() : '';
  const stockListHtml = state.stockList.length > 0
    ? state.stockList.map(stock => renderStockItem(stock)).join('')
    : '';
  const skeletonHtml = state.isLoading ? renderSkeleton() : '';
  const loadMoreHtml = renderLoadMore();

  // 数据来源提示
  const dataSourceNotice = `
    <div class="mx-4 mt-4 mb-2 px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-300">
      ⚠️ 当前显示为模拟数据，真实API需要有效的聚合数据账号
    </div>
  `;

  console.log('渲染 HTML 长度:', {
    navbar: navbarHtml.length,
    stockList: stockListHtml.length,
    loadMore: loadMoreHtml.length,
  });

  appElement.innerHTML = `
    ${loadingHtml}
    <div class="min-h-screen bg-gray-50 dark:bg-black">
      ${navbarHtml}
      ${dataSourceNotice}
      <div class="stock-list">
        ${state.isLoading ? skeletonHtml : stockListHtml}
      </div>
      ${loadMoreHtml}
    </div>
  `;

  // 重新绑定滚动事件
  if (!state.isLoading && state.stockList.length > 0) {
    bindScrollEvent();
  }

  console.log('渲染完成');
}

// 加载数据
async function loadData(isLoadMore = false): Promise<void> {
  if (state.isLoading || state.isLoadingMore) return;

  if (isLoadMore) {
    if (!state.hasMore) return;
    state.isLoadingMore = true;
  } else {
    state.isLoading = true;
  }

  console.log('加载数据:', { isLoadMore, market: state.currentMarket, page: state.currentPage });
  renderApp();

  try {
    const response = await fetchStockList(state.currentMarket, state.currentPage);
    const newStocks = response.data || [];

    console.log('获取到数据:', newStocks.length);

    if (isLoadMore) {
      state.stockList = [...state.stockList, ...newStocks];
    } else {
      state.stockList = newStocks;
    }

    // 判断是否还有更多数据
    if (newStocks.length < CONFIG.PAGE_SIZE) {
      state.hasMore = false;
    } else {
      state.hasMore = true;
      state.currentPage++;
    }
  } catch (error) {
    console.error('加载数据失败:', error);
  } finally {
    state.isLoading = false;
    state.isLoadingMore = false;
    console.log('渲染状态:', { stockList: state.stockList.length, isLoading: state.isLoading });
    renderApp();
  }
}

// 切换市场
function switchMarket(marketId: string): void {
  if (state.currentMarket === marketId) return;

  state.currentMarket = marketId;
  state.currentPage = 1;
  state.hasMore = true;
  state.stockList = [];
  loadData(false);
}

// 绑定滚动事件（使用节流）
const handleScroll = throttle(() => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  // 当滚动到距离底部 100px 时加载更多
  if (scrollTop + windowHeight >= documentHeight - 100) {
    loadData(true);
  }
}, 300);

function bindScrollEvent(): void {
  window.removeEventListener('scroll', handleScroll);
  window.addEventListener('scroll', handleScroll);
}

// 初始化应用
export function initApp(): void {
  appElement = document.getElementById('app');

  if (!appElement) {
    console.error('App element not found');
    return;
  }

  // 将全局函数暴露给 window
  (window as unknown as Window & { switchMarket: (marketId: string) => void }).switchMarket = switchMarket;

  // 加载初始数据
  loadData(false);
}
