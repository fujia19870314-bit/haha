import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import HomePage from '../../../src/pages/home/index.vue'

describe('pages/home/index.vue', () => {
  it('应渲染页面基本结构', () => {
    const wrapper = mount(HomePage)
    expect(wrapper.find('[data-testid="home-page"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="nav-bar"]').exists()).toBe(true)
  })

  it('应显示今日提示卡片', () => {
    const wrapper = mount(HomePage)
    expect(wrapper.find('[data-testid="prompt-card"]').exists()).toBe(true)
  })

  it('应显示纪念日 gentle nudge', () => {
    const wrapper = mount(HomePage)
    expect(wrapper.find('[data-testid="memorial-nudge"]').exists()).toBe(true)
  })

  it('应包含危机横幅', () => {
    const wrapper = mount(HomePage)
    expect(wrapper.find('[data-testid="crisis-banner"]').exists()).toBe(true)
  })

  it('点击关闭按钮应隐藏危机横幅', async () => {
    const wrapper = mount(HomePage)
    expect(wrapper.find('[data-testid="crisis-banner"]').exists()).toBe(true)
    await wrapper.find('[data-testid="close-crisis-banner"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="crisis-banner"]').exists()).toBe(false)
  })

  it('应包含写日记入口按钮', () => {
    const wrapper = mount(HomePage)
    expect(wrapper.find('[data-testid="write-btn"]').exists()).toBe(true)
  })

  it('点击写日记按钮应导航到写作页', async () => {
    const wrapper = mount(HomePage)
    await wrapper.find('[data-testid="write-btn"]').trigger('click')
    expect(uni.navigateTo).toHaveBeenCalledWith({
      url: '/pages/journal/write'
    })
  })

  it('加载时应调用 API 获取今日提示', async () => {
    mount(HomePage)
    await flushPromises()
    expect(uni.request).toHaveBeenCalled()
  })

  it('API 返回今日提示后应显示提示内容', async () => {
    vi.mocked(uni.request).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          prompt: '今天想对TA说些什么？',
          theme: '思念'
        }
      }
    } as any)

    const wrapper = mount(HomePage)
    await flushPromises()
    await nextTick()
    expect(wrapper.text()).toContain('今天想对TA说些什么？')
  })

  it('API 失败时应显示默认提示', async () => {
    vi.mocked(uni.request).mockRejectedValueOnce(new Error('network error'))

    const wrapper = mount(HomePage)
    await flushPromises()
    await nextTick()
    expect(wrapper.text()).toContain('今天过得怎么样')
  })

  it('应显示订阅状态入口', () => {
    const wrapper = mount(HomePage)
    expect(wrapper.find('[data-testid="subscription-link"]').exists()).toBe(true)
  })

  it('点击订阅入口应导航到支付页', async () => {
    const wrapper = mount(HomePage)
    await wrapper.find('[data-testid="subscription-link"]').trigger('click')
    expect(uni.navigateTo).toHaveBeenCalledWith({
      url: '/pages/payment/index'
    })
  })

  it('应根据 onboarding 数据计算纪念日天数', async () => {
    const mockDate = new Date('2024-01-01').toISOString()
    vi.mocked(uni.getStorageSync).mockReturnValueOnce({
      relationship: '父亲',
      lossTime: '1_to_3_years',
      completedAt: mockDate
    })

    const wrapper = mount(HomePage)
    await flushPromises()
    expect(wrapper.text()).toContain('父亲')
  })
})
