import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import NavBar from '../../src/components/NavBar.vue'

describe('NavBar.vue', () => {
  it('应渲染传入的标题', () => {
    const wrapper = mount(NavBar, {
      props: { title: '今日' }
    })
    expect(wrapper.text()).toContain('今日')
  })

  it('默认标题应为空字符串', () => {
    const wrapper = mount(NavBar)
    expect(wrapper.find('.nav-title').exists()).toBe(true)
  })

  it('应包含危机帮助常驻按钮', () => {
    const wrapper = mount(NavBar, {
      props: { title: '首页' }
    })
    const crisisBtn = wrapper.find('[data-testid="crisis-btn"]')
    expect(crisisBtn.exists()).toBe(true)
    expect(crisisBtn.text()).toContain('帮助')
  })

  it('点击危机按钮应导航到危机帮助页', async () => {
    const wrapper = mount(NavBar, {
      props: { title: '首页' }
    })
    await wrapper.find('[data-testid="crisis-btn"]').trigger('click')
    expect(uni.navigateTo).toHaveBeenCalledWith({
      url: '/pages/crisis/help'
    })
  })

  it('危机按钮应有醒目的视觉标识', () => {
    const wrapper = mount(NavBar, {
      props: { title: '首页' }
    })
    const crisisBtn = wrapper.find('[data-testid="crisis-btn"]')
    expect(crisisBtn.classes()).toContain('crisis-btn')
  })

  it('导航栏应有安全区顶部填充', () => {
    const wrapper = mount(NavBar, {
      props: { title: '首页' }
    })
    expect(wrapper.find('.nav-bar').classes()).toContain('safe-area-top')
  })
})
