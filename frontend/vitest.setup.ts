import { config, enableAutoUnmount } from '@vue/test-utils'
import { afterEach, vi } from 'vitest'

// 全局 mock uni 对象
declare global {
  interface Window {
    uni: any
  }
  var uni: any
}

const mockUni = {
  request: vi.fn(),
  login: vi.fn(),
  getUserProfile: vi.fn(),
  showToast: vi.fn(),
  showModal: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  switchTab: vi.fn(),
  navigateBack: vi.fn(),
  getStorageSync: vi.fn(),
  setStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  getSystemInfoSync: vi.fn(() => ({
    windowWidth: 375,
    windowHeight: 812,
    statusBarHeight: 44,
    platform: 'ios'
  })),
  requestPayment: vi.fn(),
  createInnerAudioContext: vi.fn(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    destroy: vi.fn()
  })),
  makePhoneCall: vi.fn()
}

// @ts-ignore
global.uni = mockUni
globalThis.uni = mockUni

// 配置 vue-test-utils 全局属性
config.global.mocks = {
  uni: mockUni
}

// 自动卸载已挂载组件
enableAutoUnmount(afterEach)

// 清理每个测试后的 mock
afterEach(() => {
  vi.clearAllMocks()
})
