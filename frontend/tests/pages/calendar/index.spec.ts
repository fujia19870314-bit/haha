import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import CalendarPage from '../../../src/pages/calendar/index.vue'

describe('pages/calendar/index.vue', () => {
  beforeEach(() => {
    vi.mocked(uni.getStorageSync).mockReturnValue(null)
  })

  it('应渲染页面基本结构', () => {
    const wrapper = mount(CalendarPage)
    expect(wrapper.find('[data-testid="calendar-page"]').exists()).toBe(true)
  })

  it('应显示月份导航和标题', () => {
    const wrapper = mount(CalendarPage)
    expect(wrapper.find('[data-testid="month-selector"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="calendar-title"]').exists()).toBe(true)
  })

  it('应渲染日历网格', () => {
    const wrapper = mount(CalendarPage)
    expect(wrapper.find('[data-testid="calendar-grid"]').exists()).toBe(true)
  })

  it('应显示情绪图例', () => {
    const wrapper = mount(CalendarPage)
    expect(wrapper.find('[data-testid="emotion-legend"]').exists()).toBe(true)
  })

  it('有日记时应显示情绪标记', async () => {
    const today = new Date()
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-15T10:30:00Z`
    const mockHistory = [
      { id: '1', aiResponse: '测试', emotionTag: '悲伤', createdAt: iso }
    ]
    vi.mocked(uni.getStorageSync).mockReturnValue(JSON.stringify(mockHistory))
    const wrapper = mount(CalendarPage)
    await flushPromises()
    expect(wrapper.find('[data-testid="emotion-dot-15"]').exists()).toBe(true)
  })

  it('点击返回按钮应调用 navigateBack', async () => {
    const wrapper = mount(CalendarPage)
    await wrapper.find('[data-testid="back-btn"]').trigger('click')
    expect(uni.navigateBack).toHaveBeenCalled()
  })

  it('应显示本月主要情绪统计', async () => {
    const mockHistory = [
      { id: '1', aiResponse: '测试1', emotionTag: '悲伤', createdAt: new Date().toISOString() },
      { id: '2', aiResponse: '测试2', emotionTag: '悲伤', createdAt: new Date().toISOString() },
      { id: '3', aiResponse: '测试3', emotionTag: '平静', createdAt: new Date().toISOString() }
    ]
    vi.mocked(uni.getStorageSync).mockReturnValue(JSON.stringify(mockHistory))
    const wrapper = mount(CalendarPage)
    await flushPromises()
    expect(wrapper.find('[data-testid="monthly-stats"]').exists()).toBe(true)
  })

  it('存储异常时不应崩溃', () => {
    vi.mocked(uni.getStorageSync).mockImplementation(() => { throw new Error('storage error') })
    expect(() => mount(CalendarPage)).not.toThrow()
  })
})
