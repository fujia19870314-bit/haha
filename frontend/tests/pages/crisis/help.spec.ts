import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CrisisHelpPage from '../../../src/pages/crisis/help.vue'

describe('pages/crisis/help.vue', () => {
  it('应渲染危机帮助页面', () => {
    const wrapper = mount(CrisisHelpPage)
    expect(wrapper.find('[data-testid="crisis-help-page"]').exists()).toBe(true)
  })

  it('应显示温馨提示语', () => {
    const wrapper = mount(CrisisHelpPage)
    expect(wrapper.text()).toContain('你并不孤单')
  })

  it('应显示热线列表', () => {
    const wrapper = mount(CrisisHelpPage)
    expect(wrapper.find('[data-testid="hotline-list"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid^="hotline-"]').length).toBeGreaterThan(0)
  })

  it('每条热线应显示名称和电话号码', () => {
    const wrapper = mount(CrisisHelpPage)
    const hotlines = wrapper.findAll('[data-testid^="hotline-"]')
    expect(hotlines.length).toBeGreaterThan(0)
    hotlines.forEach(hotline => {
      expect(hotline.text()).toContain('小时')
    })
  })

  it('点击热线应触发拨打电话', async () => {
    const wrapper = mount(CrisisHelpPage)
    const firstHotline = wrapper.find('[data-testid="hotline-0"]')
    await firstHotline.trigger('click')
    expect(uni.makePhoneCall).toHaveBeenCalled()
  })

  it('应包含返回按钮', () => {
    const wrapper = mount(CrisisHelpPage)
    expect(wrapper.find('[data-testid="back-btn"]').exists()).toBe(true)
  })

  it('点击返回按钮应返回上一页', async () => {
    const wrapper = mount(CrisisHelpPage)
    await wrapper.find('[data-testid="back-btn"]').trigger('click')
    expect(uni.navigateBack).toHaveBeenCalled()
  })

  it('应显示紧急求助提示', () => {
    const wrapper = mount(CrisisHelpPage)
    expect(wrapper.text()).toContain('紧急')
  })

  it('应显示每个热线的服务时间', () => {
    const wrapper = mount(CrisisHelpPage)
    const hotlines = wrapper.findAll('[data-testid^="hotline-"]')
    hotlines.forEach(hotline => {
      expect(hotline.text()).toContain('小时')
    })
  })
})
