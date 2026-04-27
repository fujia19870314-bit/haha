import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import WritePage from '../../../src/pages/journal/write.vue'

describe('pages/journal/write.vue', () => {
  it('应渲染写作页面基本结构', () => {
    const wrapper = mount(WritePage)
    expect(wrapper.find('[data-testid="write-page"]').exists()).toBe(true)
  })

  it('应显示情绪标签选择器', () => {
    const wrapper = mount(WritePage)
    expect(wrapper.find('[data-testid="mood-selector"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid^="mood-tag-"]').length).toBe(9)
  })

  it('9种情绪标签应正确显示', () => {
    const wrapper = mount(WritePage)
    const moods = ['悲伤', '愤怒', '内疚', '思念', '平静', '混乱', '温暖', '焦虑', '麻木']
    moods.forEach(mood => {
      expect(wrapper.text()).toContain(mood)
    })
  })

  it('点击情绪标签应选中该情绪', async () => {
    const wrapper = mount(WritePage)
    await wrapper.find('[data-testid="mood-tag-悲伤"]').trigger('click')
    await nextTick()
    expect(wrapper.find('[data-testid="mood-tag-悲伤"]').classes()).toContain('selected')
  })

  it('应包含文本输入区域', () => {
    const wrapper = mount(WritePage)
    expect(wrapper.find('[data-testid="journal-textarea"]').exists()).toBe(true)
  })

  it('应显示字数统计', async () => {
    const wrapper = mount(WritePage)
    const textarea = wrapper.find('[data-testid="journal-textarea"]')
    await textarea.setValue('今天心情很复杂')
    await nextTick()
    expect(wrapper.text()).toContain('7')
  })

  it('未选择情绪时应阻止提交', async () => {
    const wrapper = mount(WritePage)
    await wrapper.find('[data-testid="journal-textarea"]').setValue('一些内容')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    expect(uni.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('情绪') })
    )
  })

  it('未输入内容时应阻止提交', async () => {
    const wrapper = mount(WritePage)
    await wrapper.find('[data-testid="mood-tag-悲伤"]').trigger('click')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    expect(uni.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: '请写下你的感受' })
    )
  })

  it('提交时应显示加载状态', async () => {
    vi.mocked(uni.request).mockImplementation(() => new Promise(() => {}))

    const wrapper = mount(WritePage)
    await wrapper.find('[data-testid="mood-tag-悲伤"]').trigger('click')
    await wrapper.find('[data-testid="journal-textarea"]').setValue('今天很难过')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await nextTick()
    expect(uni.showLoading).toHaveBeenCalled()
  })

  it('提交成功后应导航到结果页', async () => {
    vi.mocked(uni.request).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          response: '我理解你的感受',
          suggestions: ['深呼吸', '散步']
        }
      }
    } as any)

    const wrapper = mount(WritePage)
    await wrapper.find('[data-testid="mood-tag-悲伤"]').trigger('click')
    await wrapper.find('[data-testid="journal-textarea"]').setValue('今天很难过')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(uni.hideLoading).toHaveBeenCalled()
    expect(uni.navigateTo).toHaveBeenCalledWith({
      url: expect.stringContaining('/pages/journal/result')
    })
  })

  it('提交失败时应显示错误提示', async () => {
    vi.mocked(uni.request).mockRejectedValueOnce(new Error('network'))

    const wrapper = mount(WritePage)
    await wrapper.find('[data-testid="mood-tag-悲伤"]').trigger('click')
    await wrapper.find('[data-testid="journal-textarea"]').setValue('今天很难过')
    await wrapper.find('[data-testid="submit-btn"]').trigger('click')
    await flushPromises()

    expect(uni.hideLoading).toHaveBeenCalled()
    expect(uni.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'none' })
    )
  })

  it('内容过长时应限制在2000字', async () => {
    const wrapper = mount(WritePage)
    const textarea = wrapper.find('[data-testid="journal-textarea"]')
    await textarea.setValue('a'.repeat(2500))
    expect((textarea.element as HTMLTextAreaElement).value.length).toBeLessThanOrEqual(2000)
  })

  it('应包含返回按钮', () => {
    const wrapper = mount(WritePage)
    expect(wrapper.find('[data-testid="back-btn"]').exists()).toBe(true)
  })

  it('点击返回按钮应返回上一页', async () => {
    const wrapper = mount(WritePage)
    await wrapper.find('[data-testid="back-btn"]').trigger('click')
    expect(uni.navigateBack).toHaveBeenCalled()
  })
})
