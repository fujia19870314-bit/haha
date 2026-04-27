import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CrisisBanner from '../../src/components/CrisisBanner.vue'

describe('CrisisBanner.vue', () => {
  it('当 level 为 high 时应显示高风险警告', () => {
    const wrapper = mount(CrisisBanner, {
      props: { level: 'high', message: '检测到高风险信号' }
    })
    expect(wrapper.text()).toContain('检测到高风险信号')
    expect(wrapper.find('.crisis-banner').classes()).toContain('level-high')
  })

  it('当 level 为 medium 时应显示中风险警告', () => {
    const wrapper = mount(CrisisBanner, {
      props: { level: 'medium', message: '检测到情绪波动' }
    })
    expect(wrapper.find('.crisis-banner').classes()).toContain('level-medium')
  })

  it('当 level 为 low 时不应渲染', () => {
    const wrapper = mount(CrisisBanner, {
      props: { level: 'low', message: '' }
    })
    expect(wrapper.find('.crisis-banner').exists()).toBe(false)
  })

  it('点击关闭按钮后应隐藏横幅', async () => {
    const wrapper = mount(CrisisBanner, {
      props: { level: 'high', message: '高风险' }
    })
    expect(wrapper.find('.crisis-banner').exists()).toBe(true)
    await wrapper.find('[data-testid="close-btn"]').trigger('click')
    expect(wrapper.find('.crisis-banner').exists()).toBe(false)
  })

  it('应包含跳转到危机帮助页的链接', () => {
    const wrapper = mount(CrisisBanner, {
      props: { level: 'high', message: '需要帮助' }
    })
    const link = wrapper.find('[data-testid="crisis-link"]')
    expect(link.exists()).toBe(true)
  })

  it('点击帮助链接应导航到危机帮助页', async () => {
    const wrapper = mount(CrisisBanner, {
      props: { level: 'critical', message: '紧急' }
    })
    await wrapper.find('[data-testid="crisis-link"]').trigger('click')
    expect(uni.navigateTo).toHaveBeenCalledWith({
      url: '/pages/crisis/help'
    })
  })

  it('应 emit close 事件当点击关闭', async () => {
    const wrapper = mount(CrisisBanner, {
      props: { level: 'high', message: '测试' }
    })
    await wrapper.find('[data-testid="close-btn"]').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
