import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ResourcesPage from '../../../src/pages/resources/index.vue'

describe('pages/resources/index.vue', () => {
  beforeEach(() => {
    vi.mocked(uni.request).mockReset()
  })

  it('应渲染页面基本结构', () => {
    const wrapper = mount(ResourcesPage)
    expect(wrapper.find('[data-testid="resources-page"]').exists()).toBe(true)
  })

  it('应显示危机横幅', () => {
    const wrapper = mount(ResourcesPage)
    expect(wrapper.find('[data-testid="crisis-banner"]').exists()).toBe(true)
  })

  it('应显示城市筛选器', () => {
    const wrapper = mount(ResourcesPage)
    expect(wrapper.find('[data-testid="city-filter"]').exists()).toBe(true)
  })

  it('加载后应显示咨询师列表', async () => {
    vi.mocked(uni.request).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          therapists: [
            {
              id: 't1',
              name: '张医生',
              title: '心理咨询师',
              city: '北京',
              specialties: ['哀伤辅导'],
              phone: '13800138000',
              isVerified: true
            }
          ],
          hotlines: ['400-161-9995']
        }
      }
    } as any)

    const wrapper = mount(ResourcesPage)
    await flushPromises()
    await nextTick()

    expect(wrapper.find('[data-testid="therapist-list"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="therapist-t1"]').exists()).toBe(true)
  })

  it('咨询师卡片应显示完整信息', async () => {
    vi.mocked(uni.request).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          therapists: [
            {
              id: 't1',
              name: '张医生',
              title: '资深心理咨询师',
              city: '北京',
              specialties: ['哀伤辅导', '创伤治疗'],
              phone: '13800138000',
              isVerified: true
            }
          ],
          hotlines: []
        }
      }
    } as any)

    const wrapper = mount(ResourcesPage)
    await flushPromises()
    await nextTick()

    expect(wrapper.text()).toContain('张医生')
    expect(wrapper.text()).toContain('资深心理咨询师')
    expect(wrapper.text()).toContain('北京')
    expect(wrapper.text()).toContain('哀伤辅导')
    expect(wrapper.text()).toContain('已认证')
    expect(wrapper.text()).toContain('13800138000')
  })

  it('API 失败时应显示错误信息', async () => {
    vi.mocked(uni.request).mockResolvedValueOnce({
      data: { success: false, error: '服务暂不可用' }
    } as any)

    const wrapper = mount(ResourcesPage)
    await flushPromises()
    await nextTick()

    expect(wrapper.text()).toContain('服务暂不可用')
  })

  it('点击返回按钮应调用 navigateBack', async () => {
    const wrapper = mount(ResourcesPage)
    await wrapper.find('[data-testid="back-btn"]').trigger('click')
    expect(uni.navigateBack).toHaveBeenCalled()
  })
})
