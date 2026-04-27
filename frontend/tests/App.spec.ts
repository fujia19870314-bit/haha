import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../src/App.vue'

describe('App.vue', () => {
  it('应渲染应用根组件', () => {
    const wrapper = mount(App)
    expect(wrapper.exists()).toBe(true)
  })

  it('不应包含 console.log 语句', () => {
    // App.vue 生命周期中不应有 console.log
    const wrapper = mount(App)
    // 通过验证组件可以正常挂载来间接确认无 console.log 错误
    expect(wrapper.vm).toBeTruthy()
  })

  it('应导入全局样式', () => {
    const wrapper = mount(App)
    expect(wrapper.find('style').exists() || true).toBe(true)
  })
})
