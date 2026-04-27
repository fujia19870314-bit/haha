import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SettingsPage from '../../../src/pages/settings/index.vue'

describe('pages/settings/index.vue', () => {
  beforeEach(() => {
    vi.mocked(uni.getStorageSync).mockReturnValue(null)
  })

  it('应渲染页面基本结构', () => {
    const wrapper = mount(SettingsPage)
    expect(wrapper.find('[data-testid="settings-page"]').exists()).toBe(true)
  })

  it('应显示白噪音播放器', () => {
    const wrapper = mount(SettingsPage)
    expect(wrapper.find('[data-testid="white-noise-player"]').exists()).toBe(true)
  })

  it('应显示四种白噪音类型', () => {
    const wrapper = mount(SettingsPage)
    expect(wrapper.find('[data-testid="noise-rain"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="noise-wind"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="noise-ocean"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="noise-forest"]').exists()).toBe(true)
  })

  it('应显示播放按钮', () => {
    const wrapper = mount(SettingsPage)
    expect(wrapper.find('[data-testid="play-btn"]').exists()).toBe(true)
  })

  it('点击播放按钮应切换播放状态', async () => {
    const wrapper = mount(SettingsPage)
    expect(wrapper.find('[data-testid="play-btn"]').text()).toContain('播放')
    await wrapper.find('[data-testid="play-btn"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="play-btn"]').text()).toContain('停止')
  })

  it('应显示设置菜单列表', () => {
    const wrapper = mount(SettingsPage)
    expect(wrapper.find('[data-testid="settings-menu"]').exists()).toBe(true)
  })

  it('应包含各个功能入口', () => {
    const wrapper = mount(SettingsPage)
    expect(wrapper.find('[data-testid="menu-history"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="menu-calendar"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="menu-export"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="menu-resources"]').exists()).toBe(true)
  })

  it('点击菜单项应导航到对应页面', async () => {
    const wrapper = mount(SettingsPage)
    await wrapper.find('[data-testid="menu-history"]').trigger('click')
    expect(uni.navigateTo).toHaveBeenCalledWith({
      url: '/pages/history/index'
    })
  })

  it('应显示版本信息', () => {
    const wrapper = mount(SettingsPage)
    expect(wrapper.text()).toContain('哀思日记 v1.0')
  })

  it('选择不同白噪音类型应生效', async () => {
    const wrapper = mount(SettingsPage)
    await wrapper.find('[data-testid="noise-ocean"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="noise-ocean"]').classes()).toContain('active')
  })
})
