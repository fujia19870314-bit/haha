/**
 * 平台检测与 API 基地址
 * 支持微信小程序、H5、App 等多平台
 */

export type Platform = 'mp-weixin' | 'h5' | 'app' | 'unknown'

export function getPlatform(): Platform {
  try {
    const info = uni.getSystemInfoSync()
    return (info.uniPlatform as Platform) || 'unknown'
  } catch {
    return 'unknown'
  }
}

export function isWechatMP(): boolean {
  return getPlatform() === 'mp-weixin'
}

export function isWeb(): boolean {
  return getPlatform() === 'h5'
}

export function isApp(): boolean {
  return getPlatform() === 'app'
}

// 环境感知 API 基地址
export function getApiBaseUrl(): string {
  if (isWechatMP()) {
    // 微信小程序继续使用相对路径（云函数托管）
    return '/api'
  }
  // H5 指向独立 API 服务器
  // @ts-ignore - import.meta.env is available in Vite
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'
}
