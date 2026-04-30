/**
 * 平台无关的认证抽象层
 * 支持微信小程序登录和 Web 邮箱登录
 */

import { getApiBaseUrl, isWechatMP, isWeb } from './platform.js'

export interface AuthResult {
  userId: string
  token: string
  isNewUser: boolean
}

/**
 * 根据当前平台执行对应的登录流程
 */
export async function platformLogin(): Promise<AuthResult> {
  if (isWechatMP()) {
    return wechatLogin()
  }
  // Web 下不应调用此函数，应跳转到登录页
  throw new Error('Web platform should use email login page')
}

/**
 * 微信小程序登录
 */
async function wechatLogin(): Promise<AuthResult> {
  const loginRes = await uni.login({ provider: 'weixin' })
  const res = await uni.request({
    url: `${getApiBaseUrl()}/auth/wechat`,
    method: 'POST',
    data: { code: loginRes.code },
    header: { 'Content-Type': 'application/json' }
  }) as any

  if (res.data?.success) {
    const { token, userId, isNewUser } = res.data.data
    uni.setStorageSync('token', token)
    uni.setStorageSync('userId', userId)
    return { token, userId, isNewUser }
  }
  throw new Error(res.data?.error || '登录失败')
}

/**
 * Web 邮箱注册
 */
export async function webRegister(email: string, password: string): Promise<AuthResult> {
  const res = await uni.request({
    url: `${getApiBaseUrl()}/auth/register`,
    method: 'POST',
    data: { email, password },
    header: { 'Content-Type': 'application/json' }
  }) as any

  if (res.data?.success) {
    const { token, userId, isNewUser } = res.data.data
    uni.setStorageSync('token', token)
    uni.setStorageSync('userId', userId)
    return { token, userId, isNewUser }
  }
  throw new Error(res.data?.error || '注册失败')
}

/**
 * Web 邮箱登录
 */
export async function webLogin(email: string, password: string): Promise<AuthResult> {
  const res = await uni.request({
    url: `${getApiBaseUrl()}/auth/login`,
    method: 'POST',
    data: { email, password },
    header: { 'Content-Type': 'application/json' }
  }) as any

  if (res.data?.success) {
    const { token, userId, isNewUser } = res.data.data
    uni.setStorageSync('token', token)
    uni.setStorageSync('userId', userId)
    return { token, userId, isNewUser }
  }
  throw new Error(res.data?.error || '登录失败')
}

/**
 * 获取当前认证令牌
 */
export function getAuthToken(): string | null {
  try {
    return uni.getStorageSync('token') as string
  } catch {
    return null
  }
}

/**
 * 获取当前用户ID
 */
export function getCurrentUserId(): string | null {
  try {
    return uni.getStorageSync('userId') as string
  } catch {
    return null
  }
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  return !!getAuthToken()
}

/**
 * 退出登录
 */
export function logout(): void {
  uni.removeStorageSync('token')
  uni.removeStorageSync('userId')
}
