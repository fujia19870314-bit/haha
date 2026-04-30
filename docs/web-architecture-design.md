# 哀伤日记 - 网页版架构设计

> 模式：双平台并行（微信小程序 + Web）
> 生成日期：2026-04-30
> 版本：v0.2.0-web

---

## 1. 执行摘要

将现有的 uni-app 微信小程序扩展为双平台应用（小程序 + H5 网页版）。

**关键洞察**：uni-app 原生支持 H5 构建，前端 90% 代码无需修改。真正的迁移工作量集中在后端（云函数 → HTTP API）和认证体系（微信登录 → 双平台认证）。

**工作量预估**：human ~2周 / CC+gstack ~1.5h

---

## 2. 当前状态分析

```
CURRENT ARCHITECTURE
--------------------
Frontend (uni-app Vue3)
  ├── 12 pages, all using uni.* APIs
  ├── Storage: uni.getStorageSync (local)
  ├── HTTP: uni.request → /api/*
  └── Auth: NOT IMPLEMENTED (userId is empty/local)

Backend (TypeScript "cloud functions")
  ├── 6 handler classes (not actually tied to any cloud provider)
  ├── Database: InMemoryDatabase (Map-based)
  ├── Auth: WeChat code2Session (openid-based)
  └── Payment: WeChat Pay mock
```

**好消息**：
- 前端没有直接调用 `wx.*` API，全部通过 `uni.*` 封装
- 后端 handler 是纯 TypeScript 类，与云函数平台解耦
- `uni.request` / `uni.getStorageSync` / `uni.navigateTo` 在 H5 模式下自动适配

**待解决问题**：
- 后端无 HTTP 服务器层
- 数据库是内存存储，重启即丢
- 认证体系未完成（MVP 中 userId 为空）
- 支付只有微信支付，无网页支付方案

---

## 3. 目标架构（双平台）

```
DUAL-PLATFORM ARCHITECTURE
--------------------------

                    ┌─────────────────┐
                    │   User Browser  │
                    │   (H5 Web App)  │
                    └────────┬────────┘
                             │ HTTPS
                    ┌────────▼────────┐
                    │  CDN / Static   │
                    │   (uni-app H5)  │
                    └────────┬────────┘
                             │ API Calls
┌─────────────────┐ ┌────────▼────────┐
│  WeChat Client  │ │   API Server    │
│ (Mini Program)  │ │  (Node.js/Express)
└────────┬────────┘ └────────┬────────┘
         │                   │
         │ wx.login          │ JWT Auth
         │ wx.requestPayment │
         │                   │
┌────────▼───────────────────▼────────┐
│         Shared Backend Layer         │
│  ┌─────────────┐  ┌─────────────┐   │
│  │  JWT Auth   │  │ WeChat Auth │   │
│  │ Middleware  │  │  Handler    │   │
│  └──────┬──────┘  └──────┬──────┘   │
│         └────────┬────────┘          │
│                  ▼                   │
│  ┌─────────────────────────────────┐ │
│  │      Business Handlers          │ │
│  │  SubmitJournal | DailyPrompt    │ │
│  │  UserAuth      | GeneratePDF    │ │
│  │  WechatPay     | GetResources   │ │
│  └────────────────┬────────────────┘ │
│                   │                  │
│                   ▼                  │
│  ┌─────────────────────────────────┐ │
│  │      Database (PostgreSQL)      │ │
│  │  users | journals | orders      │ │
│  │  prompts | crisis_logs          │ │
│  └─────────────────────────────────┘ │
└──────────────────────────────────────┘
```

---

## 4. 前端适配策略

### 4.1 构建配置

uni-app 支持多平台构建，只需修改构建命令：

```json
// frontend/package.json
{
  "scripts": {
    "dev:mp-weixin": "uni -p mp-weixin",
    "build:mp-weixin": "uni build -p mp-weixin && node scripts/fix-es5.js",
    "dev:h5": "uni -p h5",
    "build:h5": "uni build -p h5",
    "test": "vitest run"
  }
}
```

### 4.2 平台检测与 API 基地址

```typescript
// frontend/src/services/platform.ts
export function getPlatform(): 'mp-weixin' | 'h5' | 'app' {
  const info = uni.getSystemInfoSync()
  return info.uniPlatform as 'mp-weixin' | 'h5' | 'app'
}

export function isWechatMP(): boolean {
  return getPlatform() === 'mp-weixin'
}

export function isWeb(): boolean {
  return getPlatform() === 'h5'
}

// 环境感知 API 基地址
export function getApiBaseUrl(): string {
  if (isWechatMP()) {
    // 微信小程序继续使用相对路径（云函数托管）
    return '/api'
  }
  // H5 指向独立 API 服务器
  return import.meta.env.VITE_API_BASE_URL || 'https://api.mourning-diary.com'
}
```

### 4.3 认证抽象层

```typescript
// frontend/src/services/auth.ts
export interface AuthResult {
  userId: string
  token: string
  isNewUser: boolean
}

// 平台无关的认证接口
export async function platformLogin(): Promise<AuthResult> {
  if (isWechatMP()) {
    return wechatLogin()
  }
  // Web 下不应调用此函数，应跳转到登录页
  throw new Error('Web platform should use email login')
}

// 微信小程序登录
async function wechatLogin(): Promise<AuthResult> {
  const loginRes = await uni.login({ provider: 'weixin' })
  const res = await uni.request({
    url: `${getApiBaseUrl()}/auth/wechat`,
    method: 'POST',
    data: { code: loginRes.code }
  }) as any

  if (res.data?.success) {
    const { userId, token } = res.data.data
    uni.setStorageSync('token', token)
    uni.setStorageSync('userId', userId)
    return { userId, token, isNewUser: res.data.data.isNewUser }
  }
  throw new Error(res.data?.error || '登录失败')
}

// 获取当前认证令牌
export function getAuthToken(): string | null {
  try {
    return uni.getStorageSync('token') as string
  } catch {
    return null
  }
}

// 获取当前用户ID
export function getCurrentUserId(): string | null {
  try {
    return uni.getStorageSync('userId') as string
  } catch {
    return null
  }
}
```

### 4.4 HTTP 请求拦截器（统一注入 Token）

```typescript
// frontend/src/services/http.ts
import { getApiBaseUrl, getAuthToken } from './platform'

export async function request<T>(
  url: string,
  method: 'GET' | 'POST',
  data?: unknown
): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await uni.request({
    url: `${getApiBaseUrl()}${url}`,
    method,
    data,
    header: headers
  }) as any

  const body = res.data
  if (!body.success) {
    if (body.code === 'UNAUTHORIZED') {
      // 清除本地认证状态，跳转到登录页
      uni.removeStorageSync('token')
      uni.removeStorageSync('userId')
      if (isWeb()) {
        uni.navigateTo({ url: '/pages/login/index' })
      }
    }
    throw new Error(body.error || '请求失败')
  }
  return body.data
}
```

### 4.5 前端需修改清单

| 文件 | 修改内容 | 优先级 |
|------|---------|--------|
| `frontend/src/services/api.ts` | 使用新的 `http.ts`，注入 token | P0 |
| `frontend/src/services/auth.ts` | 新增平台认证抽象 | P0 |
| `frontend/src/services/platform.ts` | 新增平台检测 | P0 |
| `frontend/src/pages/login/index.vue` | 新增 Web 登录页（邮箱+密码） | P0 |
| `frontend/src/pages/payment/index.vue` | H5 下使用支付宝/Stripe 替代微信支付 | P1 |
| `frontend/src/App.vue` | 启动时检查认证状态 | P0 |
| `frontend/src/manifest.json` | 添加 H5 配置 | P0 |

---

## 5. 后端 API 提取

### 5.1 新增 HTTP 服务器层

```
backend/
├── server/                 # 新增：HTTP 服务器层
│   ├── index.ts            # Express/Fastify 入口
│   ├── middleware/
│   │   ├── cors.ts         # CORS（仅 H5 需要）
│   │   ├── auth.ts         # JWT 验证中间件
│   │   └── error-handler.ts # 全局错误处理
│   └── routes/
│       ├── auth.routes.ts
│       ├── journal.routes.ts
│       ├── payment.routes.ts
│       └── resources.routes.ts
├── functions/              # 保留原有 handler
├── lib/                    # 保留原有业务逻辑
└── types/                  # 保留原有类型
```

### 5.2 路由映射设计

```typescript
// backend/server/routes/journal.routes.ts
import { Router } from 'express'
import { SubmitJournalHandler } from '../../functions/submit-journal'
import { authenticate } from '../middleware/auth'

const router = Router()
const handler = new SubmitJournalHandler()

// 提交日记 - 需要认证
router.post('/submit-journal', authenticate, async (req, res) => {
  const result = await handler.submitJournal({
    userId: req.user!.userId,  // 从 JWT 中提取
    content: req.body.content,
    mood: req.body.mood
  })
  res.json(result)
})

// 获取日记历史 - 需要认证
router.get('/journal-history', authenticate, async (req, res) => {
  const result = await handler.getJournalHistory(req.user!.userId)
  res.json(result)
})

export default router
```

### 5.3 JWT 认证中间件

```typescript
// backend/server/middleware/auth.ts
import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AppError } from '../../lib/error-handler'

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

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: '请先登录',
      code: 'UNAUTHORIZED'
    })
  }

  const token = authHeader.slice(7)
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET not configured')

    const decoded = jwt.verify(token, secret) as AuthUser
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({
      success: false,
      error: '登录已过期，请重新登录',
      code: 'UNAUTHORIZED'
    })
  }
}
```

---

## 6. 认证策略详解

### 6.1 双平台认证流程

```
WECHAT MINI PROGRAM LOGIN          WEB LOGIN (Email/Password)
-------------------------          --------------------------

[wx.login] get code                [Login Form]
     │                                   │
     ▼                                   ▼
POST /auth/wechat                  POST /auth/email
  { code }                           { email, password }
     │                                   │
     ▼                                   ▼
code2Session API                   bcrypt.compare()
  (openid)                           (passwordHash)
     │                                   │
     ▼                                   ▼
find/create user                   find user
  by openid                          by email
     │                                   │
     └──────────┬────────────────────────┘
                ▼
        generate JWT token
        { userId, platform }
                │
                ▼
        return { token, userId }
                │
                ▼
        frontend stores token
        in localStorage
```

### 6.2 用户表 Schema 更新

```typescript
// backend/types/database.ts (新增字段)
interface User {
  id: string
  // 微信用户字段（可为空）
  openid?: string
  unionid?: string
  // Web 用户字段（可为空）
  email?: string
  passwordHash?: string
  // 通用字段
  griefStage: GriefStage
  isPremium: boolean
  trialEndsAt: Date
  createdAt: Date
  updatedAt: Date
}
```

**设计原则**：同一个 `users` 表服务双平台。微信用户没有 email/password，Web 用户没有 openid。两者互斥但共存。

### 6.3 Web 注册/登录 API

```typescript
// backend/functions/web-auth.ts
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db } from '../lib/database'
import { AppError } from '../lib/error-handler'

export class WebAuthHandler {
  async register(request: { email: string; password: string }) {
    // 验证邮箱格式
    if (!request.email?.includes('@')) {
      throw new AppError('INVALID_REQUEST', '邮箱格式不正确')
    }
    if (!request.password || request.password.length < 6) {
      throw new AppError('INVALID_REQUEST', '密码至少6位')
    }

    // 检查邮箱是否已存在
    const existing = await db.getUserByEmail(request.email)
    if (existing) {
      throw new AppError('INVALID_REQUEST', '邮箱已被注册')
    }

    // 创建用户
    const passwordHash = await bcrypt.hash(request.password, 10)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    const user = await db.createUser({
      email: request.email,
      passwordHash,
      griefStage: 'acceptance',
      isPremium: false,
      trialEndsAt
    })

    const token = this.generateToken(user.id, 'web')
    return { token, userId: user.id, isNewUser: true }
  }

  async login(request: { email: string; password: string }) {
    const user = await db.getUserByEmail(request.email)
    if (!user || !user.passwordHash) {
      throw new AppError('UNAUTHORIZED', '邮箱或密码错误')
    }

    const valid = await bcrypt.compare(request.password, user.passwordHash)
    if (!valid) {
      throw new AppError('UNAUTHORIZED', '邮箱或密码错误')
    }

    const token = this.generateToken(user.id, 'web')
    return { token, userId: user.id, isNewUser: false }
  }

  private generateToken(userId: string, platform: 'wechat' | 'web'): string {
    const secret = process.env.JWT_SECRET
    if (!secret) throw new Error('JWT_SECRET not configured')
    return jwt.sign({ userId, platform }, secret, { expiresIn: '7d' })
  }
}
```

---

## 7. 数据库迁移策略

### 7.1 从 InMemoryDatabase 到 PostgreSQL

当前 `InMemoryDatabase` 已实现完整的 Repository 接口。迁移策略：

1. **保持接口不变**：`db.createUser()`, `db.getUserById()` 等接口签名不变
2. **替换实现**：新建 `PostgreSQLDatabase` 类实现相同接口
3. **切换注入**：通过环境变量切换实现

```typescript
// backend/lib/database.ts
import { InMemoryDatabase } from './database-memory'
import { PostgreSQLDatabase } from './database-postgres'

const usePostgres = process.env.DATABASE_URL !== undefined

export const db = usePostgres
  ? new PostgreSQLDatabase(process.env.DATABASE_URL!)
  : new InMemoryDatabase()
```

### 7.2 新增数据库方法

```typescript
// backend/lib/database.ts (接口扩展)
interface Database {
  // 已有方法...

  // Web 认证所需新方法
  getUserByEmail(email: string): Promise<User | null>

  // 用户密码更新
  updatePassword(userId: string, passwordHash: string): Promise<User | null>
}
```

---

## 8. 支付策略（双平台）

| 平台 | 支付方式 | 实现方案 |
|------|---------|---------|
| 微信小程序 | 微信支付 | 保持现有 `wechat-pay.ts`，调起 `wx.requestPayment` |
| Web | 支付宝网页支付 | 接入支付宝电脑网站支付 SDK |
| Web | Stripe (国际) | Stripe Checkout / Elements |

**支付抽象层**：

```typescript
// backend/types/payment.ts
export interface PaymentProvider {
  createOrder(request: CreateOrderRequest): Promise<PaymentOrder>
  verifyCallback(payload: unknown): Promise<{ orderNo: string; status: 'success' | 'fail' }>
}

// backend/lib/payment-factory.ts
export function getPaymentProvider(platform: 'wechat' | 'alipay' | 'stripe'): PaymentProvider {
  switch (platform) {
    case 'wechat': return new WechatPaymentProvider()
    case 'alipay': return new AlipayPaymentProvider()
    case 'stripe': return new StripePaymentProvider()
  }
}
```

---

## 9. 安全架构

### 9.1 CORS 策略（H5 必需）

```typescript
// backend/server/middleware/cors.ts
import cors from 'cors'

export const corsMiddleware = cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://mourning-diary.com',
    'https://www.mourning-diary.com',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400
})
```

### 9.2 安全加固清单

- [ ] HTTPS only（生产环境强制 TLS 1.3）
- [ ] JWT Secret 最小 256-bit，定期轮换
- [ ] 密码 bcrypt 哈希（cost factor 10+）
- [ ] Rate limiting：登录 5 次/分钟，API 100 次/分钟
- [ ] SQL 注入防护：使用参数化查询（pg 驱动自动处理）
- [ ] XSS 防护：AI 响应继续走 `filterAIResponse`
- [ ] 敏感操作日志：支付、登录、日记提交全量审计

---

## 10. 实现阶段

### Phase 1：后端 API 化（第 1 周）

**目标**：让 Web 前端能调通后端 API

1. **Day 1-2：服务器骨架**
   - 安装 Express + TypeScript 依赖
   - 创建 `backend/server/index.ts`
   - 配置 CORS、Helmet、Rate Limiting
   - 全局错误处理中间件

2. **Day 3-4：路由迁移**
   - 将所有 `backend/functions/*.ts` 映射到 Express routes
   - 统一响应格式 `{ success, data, error, code }`
   - 保持原有 handler 类不变（零业务逻辑改动）

3. **Day 5：认证系统**
   - JWT 签发与验证
   - Web 注册/登录 API (`/auth/register`, `/auth/login`)
   - 微信登录适配为 JWT (`/auth/wechat`)

### Phase 2：前端适配（第 1-2 周）

1. **Day 1-2：平台抽象**
   - 创建 `services/platform.ts`
   - 创建 `services/auth.ts`
   - 重构 `services/api.ts` 注入 token

2. **Day 3：H5 构建**
   - 配置 `manifest.json` H5 参数
   - 验证 `npm run dev:h5` 能正常编译
   - 修复 H5 下的样式问题（如有）

3. **Day 4：登录页**
   - 新增 `pages/login/index.vue`
   - 邮箱输入、密码输入、注册/登录切换
   - H5 下自动跳转登录页

4. **Day 5：联调测试**
   - H5 前端 ↔ API 服务器端到端测试
   - 核心流程：注册 → 登录 → 写日记 → 看历史

### Phase 3：数据持久化（第 2 周）

1. **PostgreSQL 接入**
   - 安装 `pg` 驱动
   - 实现 `PostgreSQLDatabase` 类
   - 数据迁移脚本

2. **环境配置**
   - 生产环境 Docker Compose（API + PostgreSQL）
   - 环境变量管理（`JWT_SECRET`, `DATABASE_URL`, `QWEN_API_KEY`）

### Phase 4：支付与部署（第 2-3 周）

1. **Web 支付接入**
   - 支付宝网页支付（国内）
   - 或 Stripe（国际）

2. **部署**
   - API 服务器：Vercel / Railway / 阿里云 ECS
   - H5 前端：CDN 静态托管
   - 域名 + HTTPS 证书

---

## 11. 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| uni-app H5 某些 API 行为不一致 | 中 | 中 | 全面测试 `uni.*` API 在 H5 下的表现，准备 polyfill |
| JWT Secret 泄露 | 低 | 高 | 使用环境变量，定期轮换，设置短过期时间（7天） |
| 数据库迁移丢失测试数据 | 中 | 低 | InMemoryDatabase 保留为测试模式，生产强制 PostgreSQL |
| 双平台用户数据冲突 | 低 | 高 | 用户表设计确保 openid/email 唯一索引，禁止重复绑定 |
| Web 支付合规问题 | 中 | 高 | 国内需 ICP 备案 + 支付宝企业资质；建议 MVP 阶段先跳过支付 |

---

## 12. 文件变更清单

### 新增文件

```
frontend/src/
  services/platform.ts
  services/auth.ts
  services/http.ts
  pages/login/index.vue          # Web 登录页

backend/server/
  index.ts                       # Express 入口
  middleware/
    cors.ts
    auth.ts
    rate-limit.ts
    error-handler.ts
  routes/
    auth.routes.ts
    journal.routes.ts
    payment.routes.ts
    resources.routes.ts
    prompt.routes.ts
    pdf.routes.ts

backend/lib/
  database-postgres.ts           # PostgreSQL 实现
  payment-factory.ts
  payment-alipay.ts
  payment-stripe.ts

backend/functions/
  web-auth.ts                    # Web 注册/登录
```

### 修改文件

```
frontend/package.json            # 添加 H5 scripts
frontend/src/manifest.json       # 添加 H5 配置
frontend/src/services/api.ts     # 使用 http.ts，注入 token
frontend/src/App.vue             # 启动时认证检查
frontend/vite.config.ts          # H5 构建配置（如需要）

backend/package.json             # 添加 Express, JWT, bcrypt, pg 依赖
backend/lib/database.ts          # 导出切换逻辑
backend/lib/error-handler.ts     # 兼容 Express 错误格式（如需要）
backend/functions/user-auth.ts   # 适配 JWT 返回格式
```

---

## 13. 长期演进方向

- **PWA 化**：添加 service worker，支持离线写日记、本地缓存
- **SSR/SSG**：对首页和日记详情做预渲染，优化 SEO
- **桌面端**：使用 Tauri 或 Electron 打包桌面应用（共用 H5 代码）
- **国际化**：Web 天然适合多语言，后续可扩展 i18n
- **AI 升级**：Web 端支持 SSE 流式输出，让 AI 回应逐字显示
