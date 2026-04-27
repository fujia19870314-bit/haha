import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import HistoryPage from '../../../src/pages/history/index.vue'

describe('pages/history/index.vue', () => {
  beforeEach(() => {
    vi.mocked(uni.getStorageSync).mockReturnValue(null)
  })

  it('应渲染页面基本结构', () => {
    const wrapper = mount(HistoryPage)
    expect(wrapper.find('[data-testid="history-page"]').exists()).toBe(true)
  })

  it('应显示返回按钮和标题', () => {
    const wrapper = mount(HistoryPage)
    expect(wrapper.find('[data-testid="back-btn"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('回顾')
  })

  it('无历史记录时应显示空状态', () => {
    const wrapper = mount(HistoryPage)
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('还没有日记')
  })

  it('有历史记录时应显示列表', async () => {
    const mockHistory = [
      { id: '1', aiResponse: '这是一个测试回应', emotionTag: '悲伤', createdAt: '2024-01-15T10:30:00Z' }
    ]
    vi.mocked(uni.getStorageSync).mockReturnValue(JSON.stringify(mockHistory))
    const wrapper = mount(HistoryPage)
    await flushPromises()
    expect(wrapper.find('[data-testid="history-list"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="history-item-1"]').exists()).toBe(true)
  })

  it('应正确格式化日期和时间', async () => {
    const mockHistory = [
      { id: '1', aiResponse: '测试', emotionTag: '悲伤', createdAt: '2024-03-15T02:30:00Z' }
    ]
    vi.mocked(uni.getStorageSync).mockReturnValue(JSON.stringify(mockHistory))
    const wrapper = mount(HistoryPage)
    await flushPromises()
    expect(wrapper.text()).toContain('3月15日')
    expect(wrapper.text()).toContain('10:30')
  })

  it('应显示情绪标签和颜色', async () => {
    const mockHistory = [
      { id: '1', aiResponse: '测试', emotionTag: '悲伤', createdAt: '2024-01-15T10:30:00Z' }
    ]
    vi.mocked(uni.getStorageSync).mockReturnValue(JSON.stringify(mockHistory))
    const wrapper = mount(HistoryPage)
    await flushPromises()
    expect(wrapper.text()).toContain('悲伤')
  })

  it('应显示 AI 回应预览（前60字符）', async () => {
    const longResponse = '这是一段很长的回应内容，用于测试预览截断功能是否正确工作'
    const mockHistory = [
      { id: '1', aiResponse: longResponse, emotionTag: '悲伤', createdAt: '2024-01-15T10:30:00Z' }
    ]
    vi.mocked(uni.getStorageSync).mockReturnValue(JSON.stringify(mockHistory))
    const wrapper = mount(HistoryPage)
    await flushPromises()
    expect(wrapper.text()).toContain('...')
  })

  it('点击返回按钮应调用 navigateBack', async () => {
    const wrapper = mount(HistoryPage)
    await wrapper.find('[data-testid="back-btn"]').trigger('click')
    expect(uni.navigateBack).toHaveBeenCalled()
  })
})
