import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ExportPage from '../../../src/pages/export/index.vue'

describe('pages/export/index.vue', () => {
  beforeEach(() => {
    vi.mocked(uni.getStorageSync).mockReturnValue(null)
    vi.mocked(uni.request).mockReset()
  })

  it('应渲染页面基本结构', () => {
    const wrapper = mount(ExportPage)
    expect(wrapper.find('[data-testid="export-page"]').exists()).toBe(true)
  })

  it('应显示介绍卡片', () => {
    const wrapper = mount(ExportPage)
    expect(wrapper.find('[data-testid="intro-card"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('将你的日记整理成册')
  })

  it('应显示预览功能区', () => {
    const wrapper = mount(ExportPage)
    expect(wrapper.find('[data-testid="preview-section"]').exists()).toBe(true)
  })

  it('应显示生成按钮', () => {
    const wrapper = mount(ExportPage)
    expect(wrapper.find('[data-testid="generate-btn"]').exists()).toBe(true)
  })

  it('未登录时点击生成应显示错误', async () => {
    const wrapper = mount(ExportPage)
    await flushPromises()
    await wrapper.find('[data-testid="generate-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="error-msg"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('登录')
  })

  it('生成成功后应显示结果卡片', async () => {
    vi.mocked(uni.getStorageSync).mockReturnValue(JSON.stringify({ userId: 'test_user' }))
    vi.mocked(uni.request).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          downloadUrl: '/download/test.pdf',
          fileName: '纪念册_test_1234567890.pdf',
          pageCount: 5,
          generatedAt: '2024-01-15T10:30:00Z'
        }
      }
    } as any)

    const wrapper = mount(ExportPage)
    await flushPromises()
    await wrapper.find('[data-testid="generate-btn"]').trigger('click')
    await flushPromises()
    await nextTick()

    expect(wrapper.find('[data-testid="result-card"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('纪念册_test')
    expect(wrapper.text()).toContain('5 页')
  })

  it('生成失败时应显示错误信息', async () => {
    vi.mocked(uni.getStorageSync).mockReturnValue(JSON.stringify({ userId: 'test_user' }))
    vi.mocked(uni.request).mockResolvedValueOnce({
      data: { success: false, error: '暂无日记可导出' }
    } as any)

    const wrapper = mount(ExportPage)
    await flushPromises()
    await wrapper.find('[data-testid="generate-btn"]').trigger('click')
    await flushPromises()
    await nextTick()

    expect(wrapper.find('[data-testid="error-msg"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('暂无日记')
  })

  it('点击返回按钮应调用 navigateBack', async () => {
    const wrapper = mount(ExportPage)
    await wrapper.find('[data-testid="back-btn"]').trigger('click')
    expect(uni.navigateBack).toHaveBeenCalled()
  })
})
