import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthUser {
  userId: string
  platform: 'wechat' | 'web'
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: '请先登录',
      code: 'UNAUTHORIZED'
    })
    return
  }

  const token = authHeader.slice(7)
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET not configured')
    }

    const decoded = jwt.verify(token, secret) as AuthUser
    req.user = decoded
    next()
  } catch {
    res.status(401).json({
      success: false,
      error: '登录已过期，请重新登录',
      code: 'UNAUTHORIZED'
    })
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    try {
      const secret = process.env.JWT_SECRET
      if (secret) {
        const decoded = jwt.verify(token, secret) as AuthUser
        req.user = decoded
      }
    } catch {
      // Invalid token, continue without user
    }
  }
  next()
}
