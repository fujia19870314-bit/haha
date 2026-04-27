import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import OnboardingPage from '../../../src/pages/onboarding/index.vue'

describe('pages/onboarding/index.vue', () => {
  it('应渲染第一步：与逝者关系输入', () => {
    const wrapper = mount(OnboardingPage)
    expect(wrapper.text()).toContain('与逝者的关系')
    expect(wrapper.find('[data-testid="relationship-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="next-btn"]').exists()).toBe(true)
  })

  it('第一步未输入时应阻止下一步并提示', async () => {
    const wrapper = mount(OnboardingPage)
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    expect(uni.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('填写') })
    )
    expect(wrapper.text()).toContain('与逝者的关系')
  })

  it('输入关系后应进入第二步：失去时间', async () => {
    const wrapper = mount(OnboardingPage)
    const input = wrapper.find('[data-testid="relationship-input"]')
    await input.setValue('父亲')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('什么时候失去的')
  })

  it('第二步应显示时间选项', async () => {
    const wrapper = mount(OnboardingPage)
    await wrapper.find('[data-testid="relationship-input"]').setValue('父亲')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="time-options"]').exists()).toBe(true)
  })

  it('第二步未选择时应阻止下一步', async () => {
    const wrapper = mount(OnboardingPage)
    await wrapper.find('[data-testid="relationship-input"]').setValue('父亲')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    expect(uni.showToast).toHaveBeenCalled()
  })

  it('选择时间后应进入第三步：支持水平', async () => {
    const wrapper = mount(OnboardingPage)
    await wrapper.find('[data-testid="relationship-input"]').setValue('父亲')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-testid="time-option-1"]').trigger('click')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('需要怎样的支持')
  })

  it('第三步应显示支持水平选项', async () => {
    const wrapper = mount(OnboardingPage)
    await wrapper.find('[data-testid="relationship-input"]').setValue('父亲')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-testid="time-option-1"]').trigger('click')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="support-options"]').exists()).toBe(true)
  })

  it('第三步未选择时应阻止完成', async () => {
    const wrapper = mount(OnboardingPage)
    await wrapper.find('[data-testid="relationship-input"]').setValue('父亲')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-testid="time-option-1"]').trigger('click')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-testid="complete-btn"]').trigger('click')
    expect(uni.showToast).toHaveBeenCalled()
  })

  it('完成引导后应保存数据并跳转到首页', async () => {
    const wrapper = mount(OnboardingPage)
    await wrapper.find('[data-testid="relationship-input"]').setValue('父亲')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-testid="time-option-1"]').trigger('click')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-testid="support-option-1"]').trigger('click')
    await wrapper.find('[data-testid="complete-btn"]').trigger('click')
    await nextTick()

    expect(uni.setStorageSync).toHaveBeenCalledWith(
      'onboarding',
      expect.objectContaining({
        relationship: '父亲',
        lossTime: expect.any(String),
        supportLevel: expect.any(String)
      })
    )
    expect(uni.switchTab).toHaveBeenCalledWith({ url: '/pages/home/index' })
  })

  it('应显示进度指示器', () => {
    const wrapper = mount(OnboardingPage)
    expect(wrapper.find('[data-testid="progress-indicator"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('1')
    expect(wrapper.text()).toContain('3')
  })

  it('支持水平输入应限制长度不超过50字', async () => {
    const wrapper = mount(OnboardingPage)
    const input = wrapper.find('[data-testid="relationship-input"]')
    await input.setValue('a'.repeat(100))
    expect((input.element as HTMLInputElement).value.length).toBeLessThanOrEqual(50)
  })

  it('点击上一步应返回前一个问题', async () => {
    const wrapper = mount(OnboardingPage)
    await wrapper.find('[data-testid="relationship-input"]').setValue('母亲')
    await wrapper.find('[data-testid="next-btn"]').trigger('click')
    await nextTick()
    await wrapper.find('[data-testid="back-btn"]').trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('与逝者的关系')
    expect(wrapper.find('[data-testid="relationship-input"]').element).toBeTruthy()
  })

  it('应包含跳过引导的选项', () => {
    const wrapper = mount(OnboardingPage)
    expect(wrapper.find('[data-testid="skip-btn"]').exists()).toBe(true)
  })

  it('点击跳过应直接跳转到首页', async () => {
    const wrapper = mount(OnboardingPage)
    await wrapper.find('[data-testid="skip-btn"]').trigger('click')
    expect(uni.switchTab).toHaveBeenCalledWith({ url: '/pages/home/index' })
  })
})
