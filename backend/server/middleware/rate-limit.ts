import rateLimit from 'express-rate-limit'

export const rateLimitMiddleware = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip health checks and certain internal routes
    return req.path === '/health'
  },
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMITED'
    })
  }
})

export const strictRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5, // 5 requests per minute for sensitive endpoints
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后再试',
      code: 'RATE_LIMITED'
    })
  }
})
