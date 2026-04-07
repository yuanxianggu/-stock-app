// Cloudflare Pages Function for Health Check
// 提供服务健康状态检查

export async function onRequest(context) {
  return new Response(JSON.stringify({
    status: 'ok',
    service: 'Cloudflare Pages',
    timestamp: new Date().toISOString(),
    features: {
      api: 'enabled',
      cdn: 'global',
      ssl: 'automatic',
    },
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
