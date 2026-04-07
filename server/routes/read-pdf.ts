import { Router } from 'express';
import { FetchClient, Config } from 'coze-coding-dev-sdk';
import { HeaderUtils } from 'coze-coding-dev-sdk';

const router = Router();

// PDF文件URL列表
const PDF_URLS = {
  sh_list: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E8%82%A1%E7%A5%A8%E6%95%B0%E6%8D%AE-%E6%B2%AA%E8%82%A1%E5%88%97%E8%A1%A8.pdf&nonce=d4cadce6-9c58-462e-8141-4a618590f34b&project_id=7625855160513953844&sign=4da1a90854e13f04745319b31756d344c68a69ad5ccbc7f49b6327ad96e6deb6',
  sh_detail: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E8%82%A1%E7%A5%A8%E6%95%B0%E6%8D%AE-%E6%B2%AA%E6%B7%B1%E8%82%A1%E5%B8%82.pdf&nonce=eb027256-9690-462c-ae59-804e663e090d&project_id=7625855160513953844&sign=8fa5e3aa3305c5116016b04be974d599d9165fafe044fb4ab42a71e25ba08cba',
  us_detail: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E8%82%A1%E7%A5%A8%E6%95%B0%E6%8D%AE-%E7%BE%8E%E5%9B%BD%E8%82%A1%E5%B8%82.pdf&nonce=0ab18cf3-558b-4dde-8d26-d7c0e67499db&project_id=7625855160513953844&sign=3f3093d1ff0fcca60127f1aa9ff47f8f7546cde3c8155cf9156fd4f5d9ffded1',
  us_list: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E8%82%A1%E7%A5%A8%E6%95%B0%E6%8D%AE-%E7%BE%8E%E5%9B%BD%E8%82%A1%E5%B8%82%E5%88%97%E8%A1%A8.pdf&nonce=e3230434-ce83-4f75-885b-08151673efbc&project_id=7625855160513953844&sign=1dffad5e6331f2be55a1337905c8fa9d16b3d84056292655c1b63cd1b5f1c8fe',
  sz_list: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E8%82%A1%E7%A5%A8%E6%95%B0%E6%8D%AE-%E6%B7%B1%E5%9C%B3%E8%82%A1%E5%B8%82%E5%88%97%E8%A1%A8.pdf&nonce=65a87ed4-bd3f-44e6-a3d5-1ab4681c58ff&project_id=7625855160513953844&sign=f054f00f444accd498046ff6d0a5c5c3b1e345baba29ced5ce28d2a0ab0e3f89',
  hk_detail: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E8%82%A1%E7%A5%A8%E6%95%B0%E6%8D%AE-%E9%A6%99%E6%B8%AF%E8%82%A1%E5%B8%82.pdf&nonce=cc50a701-73d8-4901-a122-61b443b952b7&project_id=7625855160513953844&sign=6fdb61d0368312d92a9fcfe5a45cbed322813135752fa8d0a6d09be46a23e95f',
  hk_list: 'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F%E8%82%A1%E7%A5%A8%E6%95%B0%E6%8D%AE-%E9%A6%99%E6%B8%AF%E8%82%A1%E5%B8%82%E5%88%97%E8%A1%A8.pdf&nonce=54bddd43-b5ad-44af-80cf-a373397742b7&project_id=7625855160513953844&sign=948ad0271f1c9c341fea5122e36e2d60eca3fbc0a174c420ffcc8c137117b70c',
};

// 读取PDF文件内容
router.get('/api/read-pdf', async (req: any, res: any) => {
  try {
    const { market } = req.query;

    console.log('读取PDF文档:', { market });

    // 根据市场选择对应的PDF
    let pdfUrl: string | undefined;
    if (market === 'sh') {
      pdfUrl = PDF_URLS.sh_list;
    } else if (market === 'sz') {
      pdfUrl = PDF_URLS.sz_list;
    } else if (market === 'us') {
      pdfUrl = PDF_URLS.us_list;
    } else if (market === 'hk') {
      pdfUrl = PDF_URLS.hk_list;
    }

    if (!pdfUrl) {
      return res.status(400).json({
        success: false,
        error: 'Invalid market parameter',
      });
    }

    // 使用coze-coding-dev-sdk读取PDF
    const config = new Config();
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers as Record<string, string>);
    const client = new FetchClient(config, customHeaders);

    console.log('正在获取PDF内容...');
    const response = await client.fetch(pdfUrl);

    if (response.status_code !== 0) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch PDF',
        message: response.status_message,
      });
    }

    // 提取文本内容
    const textContent = response.content
      .filter(item => item.type === 'text')
      .map(item => item.text)
      .join('\n');

    console.log('PDF读取成功，内容长度:', textContent.length);
    console.log('PDF标题:', response.title);

    res.json({
      success: true,
      title: response.title,
      content: textContent,
      fileType: response.filetype,
      docId: response.doc_id,
    });
  } catch (error) {
    console.error('读取PDF失败:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to read PDF',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
