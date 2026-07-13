// 测试端点 —— 验证 API 路由是否正常工作
export default async function handler(req) {
  return new Response(JSON.stringify({
    ok: true,
    message: 'API 正常工作！',
    env: {
      hasKVUrl: !!process.env.KV_REST_API_URL,
      hasKVToken: !!process.env.KV_REST_API_TOKEN,
      hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      hasJwtSecret: !!process.env.JWT_SECRET,
    }
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}