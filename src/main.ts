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
  API_BASE_URL: 'https://route.showapi.com/131-63', // 聚合数据股票API（示例URL，实际使用时需要确认）
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
  try {
    const response = await fetch(
      `${CONFIG.API_BASE_URL}?showapi_appid=${CONFIG.API_KEY}&showapi_sign=${CONFIG.API_KEY}&market=${market}&page=${page}&pageSize=${CONFIG.PAGE_SIZE}`
    );
    const data = await response.json();
    console.log('API 响应:', data);
    if (data.data && data.data.length > 0) {
      return data;
    }
    // 如果 API 返回空数据，使用模拟数据
    throw new Error('API 返回空数据');
  } catch (error) {
    console.error('API 请求失败:', error);
    // 模拟数据（用于演示）
    return {
      data: generateMockStocks(market, page),
      total: 100,
    };
  }
}

// 生成模拟数据（仅用于演示）
function generateMockStocks(market: string, page: number): StockData[] {
  const stocks: StockData[] = [];
  const marketPrefixes: Record<string, string> = {
    sh: '600',
    sz: '000',
    hk: 'HK',
    us: 'US',
  };

  const marketNames: Record<string, string> = {
    sh: '上海',
    sz: '深圳',
    hk: '香港',
    us: '美国',
  };

  console.log('生成模拟数据:', { market, page });

  for (let i = 0; i < CONFIG.PAGE_SIZE; i++) {
    const index = (page - 1) * CONFIG.PAGE_SIZE + i + 1;
    const prefix = marketPrefixes[market] || '';
    const code = prefix + String(index).padStart(6, '0');
    const change = (Math.random() * 20 - 10).toFixed(2);
    const price = (10 + Math.random() * 100).toFixed(2);

    const stock: StockData = {
      name: `${marketNames[market] || ''}股票${index}`,
      code,
      price,
      changePercent: change,
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

  console.log('渲染 HTML 长度:', {
    navbar: navbarHtml.length,
    stockList: stockListHtml.length,
    loadMore: loadMoreHtml.length,
  });

  appElement.innerHTML = `
    ${loadingHtml}
    <div class="min-h-screen bg-gray-50 dark:bg-black">
      ${navbarHtml}
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
  (window as Window & { switchMarket: (marketId: string) => void }).switchMarket = switchMarket;

  // 加载初始数据
  loadData(false);
}
