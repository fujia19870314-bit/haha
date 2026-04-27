import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import PaymentPage from '../../../src/pages/payment/index.vue'

describe('pages/payment/index.vue', () => {
  it('应渲染支付页面', () => {
    const wrapper = mount(PaymentPage)
    expect(wrapper.find('[data-testid="payment-page"]').exists()).toBe(true)
  })

  it('应显示订阅计划信息', () => {
    const wrapper = mount(PaymentPage)
    expect(wrapper.text()).toContain('完整版')
  })

  it('应显示价格', () => {
    const wrapper = mount(PaymentPage)
    expect(wrapper.text()).toContain('¥')
  })

  it('应显示权益列表', () => {
    const wrapper = mount(PaymentPage)
    expect(wrapper.find('[data-testid="benefits-list"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid^="benefit-"]').length).toBeGreaterThan(0)
  })

  it('应包含微信支付按钮', () => {
    const wrapper = mount(PaymentPage)
    expect(wrapper.find('[data-testid="pay-btn"]').exists()).toBe(true)
  })

  it('点击支付应调用微信支付 API', async () => {
    vi.mocked(uni.request).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          timeStamp: '1234567890',
          nonceStr: 'abc',
          package: 'prepay_id=xxx',
          signType: 'RSA',
          paySign: 'sign'
        }
      }
    } as any)
    vi.mocked(uni.requestPayment).mockResolvedValueOnce({} as any)

    const wrapper = mount(PaymentPage)
    await wrapper.find('[data-testid="pay-btn"]').trigger('click')
    await flushPromises()

    expect(uni.requestPayment).toHaveBeenCalled()
  })

  it('支付成功后应提示成功', async () => {
    vi.mocked(uni.request).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          timeStamp: '1234567890',
          nonceStr: 'abc',
          package: 'prepay_id=xxx',
          signType: 'RSA',
          paySign: 'sign'
        }
      }
    } as any)
    vi.mocked(uni.requestPayment).mockResolvedValueOnce({} as any)

    const wrapper = mount(PaymentPage)
    await wrapper.find('[data-testid="pay-btn"]').trigger('click')
    await flushPromises()

    expect(uni.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: expect.stringContaining('成功') })
    )
  })

  it('支付失败时应提示失败', async () => {
    vi.mocked(uni.request).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          timeStamp: '1234567890',
          nonceStr: 'abc',
          package: 'prepay_id=xxx',
          signType: 'RSA',
          paySign: 'sign'
        }
      }
    } as any)
    vi.mocked(uni.requestPayment).mockRejectedValueOnce(new Error('cancel'))

    const wrapper = mount(PaymentPage)
    await wrapper.find('[data-testid="pay-btn"]').trigger('click')
    await flushPromises()

    expect(uni.showToast).toHaveBeenCalledWith(
      expect.objectContaining({ icon: 'none' })
    )
  })

  it('应包含返回按钮', () => {
    const wrapper = mount(PaymentPage)
    expect(wrapper.find('[data-testid="back-btn"]').exists()).toBe(true)
  })

  it('点击返回按钮应返回上一页', async () => {
    const wrapper = mount(PaymentPage)
    await wrapper.find('[data-testid="back-btn"]').trigger('click')
    expect(uni.navigateBack).toHaveBeenCalled()
  })

  it('应显示服务条款提示', () => {
    const wrapper = mount(PaymentPage)
    expect(wrapper.text()).toContain('订阅')
  })
})
