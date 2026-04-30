/**
 * HTTP 请求封装
 * 统一注入认证令牌、错误处理、平台适配
 */

import { getApiBaseUrl, isWeb } from './platform.js'
import { getAuthToken } from './auth.js'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export async function httpRequest<T>(
  url: string,
  method: 'GET' | 'POST' = 'GET',
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

  const body: ApiResponse<T> = res.data

  if (!body.success) {
    // 认证过期，清除状态并跳转
    if (body.code === 'UNAUTHORIZED') {
      uni.removeStorageSync('token')
      uni.removeStorageSync('userId')
      if (isWeb()) {
        uni.navigateTo({ url: '/pages/login/index' })
      }
    }
    throw new Error(body.error || '请求失败')
  }

  if (body.data === undefined) {
    throw new Error('响应数据为空')
  }

  return body.data
}
