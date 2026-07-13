// 测试端点 —— 验证 API 路由是否正常工作
module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    ok: true,
    message: 'API 正常工作！',
    env: {
      hasKVUrl: !!process.env.KV_REST_API_URL,
      hasKVToken: !!process.env.KV_REST_API_TOKEN,
      hasUpstashUrl: !!process.env.UPSTASH_REDIS_REST_URL,
      hasUpstashToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
      hasJwtSecret: !!process.env.JWT_SECRET,
    }
  });
};
