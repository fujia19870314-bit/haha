import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ResultPage from '../../../src/pages/journal/result.vue'

describe('pages/journal/result.vue', () => {
  it('应渲染结果页面基本结构', () => {
    const wrapper = mount(ResultPage)
    expect(wrapper.find('[data-testid="result-page"]').exists()).toBe(true)
  })

  it('应显示 AI 回应内容', async () => {
    const wrapper = mount(ResultPage)
    await wrapper.setData({
      result: {
        aiResponse: { content: '我理解你现在的感受，失去亲人确实很痛苦。' },
        crisisDetected: false,
        riskLevel: 'low'
      }
    })
    await nextTick()
    expect(wrapper.text()).toContain('我理解你现在的感受')
  })

  it('危机情况下应显示热线提示', async () => {
    const wrapper = mount(ResultPage)
    await wrapper.setData({
      result: {
        aiResponse: { content: '你并不孤单。' },
        crisisDetected: true,
        riskLevel: 'high',
        hotlines: ['400-161-9995']
      }
    })
    await nextTick()
    expect(wrapper.find('[data-testid="crisis-notice"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('你并不孤单')
    expect(wrapper.text()).toContain('400-161-9995')
  })

  it('非危机情况下不应显示危机提示', async () => {
    const wrapper = mount(ResultPage)
    await wrapper.setData({
      result: {
        aiResponse: { content: '今天辛苦了。' },
        crisisDetected: false,
        riskLevel: 'low'
      }
    })
    await nextTick()
    expect(wrapper.find('[data-testid="crisis-notice"]').exists()).toBe(false)
  })

  it('应明确显示"今天的会话结束了"', () => {
    const wrapper = mount(ResultPage)
    expect(wrapper.find('[data-testid="session-end-notice"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('今天的会话结束了')
  })

  it('应包含返回首页按钮', () => {
    const wrapper = mount(ResultPage)
    expect(wrapper.find('[data-testid="back-home-btn"]').exists()).toBe(true)
  })

  it('点击返回首页按钮应导航到首页', async () => {
    const wrapper = mount(ResultPage)
    await wrapper.find('[data-testid="back-home-btn"]').trigger('click')
    expect(uni.switchTab).toHaveBeenCalledWith({ url: '/pages/home/index' })
  })

  it('应包含再写一篇按钮', () => {
    const wrapper = mount(ResultPage)
    expect(wrapper.find('[data-testid="write-again-btn"]').exists()).toBe(true)
  })

  it('点击再写一篇应导航到写作页', async () => {
    const wrapper = mount(ResultPage)
    await wrapper.find('[data-testid="write-again-btn"]').trigger('click')
    expect(uni.redirectTo).toHaveBeenCalledWith({ url: '/pages/journal/write' })
  })

  it('无数据时应显示 fallback 文本', async () => {
    const wrapper = mount(ResultPage)
    await wrapper.setData({ result: null })
    await nextTick()
    expect(wrapper.text()).toContain('感谢你的分享')
  })

  it('应显示回应卡片', async () => {
    const wrapper = mount(ResultPage)
    await wrapper.setData({
      result: {
        aiResponse: { content: '测试回应' },
        crisisDetected: false,
        riskLevel: 'low'
      }
    })
    await nextTick()
    expect(wrapper.find('[data-testid="response-card"]').exists()).toBe(true)
  })
})
