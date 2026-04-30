import { Router } from 'express'
import { UserAuthHandler } from '../../functions/user-auth.js'
import { WebAuthHandler } from '../../functions/web-auth.js'
import { authenticate } from '../middleware/auth.js'
import { strictRateLimit } from '../middleware/rate-limit.js'
import { AppError } from '../../lib/error-handler.js'

const router = Router()
const wechatHandler = new UserAuthHandler()
const webHandler = new WebAuthHandler()

// WeChat Mini Program login
router.post('/auth/wechat', async (req, res, next) => {
  try {
    const { code } = req.body
    if (!code || typeof code !== 'string') {
      throw new AppError('INVALID_REQUEST', 'code 不能为空')
    }

    const result = await wechatHandler.handleAuth({ code })

    if (!result.success || !result.data) {
      res.status(400).json(result)
      return
    }

    // Generate JWT token for WeChat user
    const token = webHandler.generateToken(result.data.openid, 'wechat')

    res.json({
      success: true,
      data: {
        token,
        userId: result.data.openid,
        isNewUser: result.data.isNewUser,
        user: result.data.user
      }
    })
  } catch (err) {
    next(err)
  }
})

// Web: Email registration
router.post('/auth/register', strictRateLimit, async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await webHandler.register({ email, password })
    res.json({
      success: true,
      data: result
    })
  } catch (err) {
    next(err)
  }
})

// Web: Email login
router.post('/auth/login', strictRateLimit, async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await webHandler.login({ email, password })
    res.json({
      success: true,
      data: result
    })
  } catch (err) {
    next(err)
  }
})

// Get current user info
router.get('/auth/me', authenticate, async (req, res, next) => {
  try {
    const result = await wechatHandler.getUserInfo(req.user!.userId)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

// Update grief stage
router.post('/auth/stage', authenticate, async (req, res, next) => {
  try {
    const { stage } = req.body
    const result = await wechatHandler.updateGriefStage({
      userId: req.user!.userId,
      stage
    })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
