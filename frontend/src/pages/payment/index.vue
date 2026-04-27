<script setup lang="ts">
import { ref } from 'vue'

interface Benefit {
  icon: string
  text: string
}

const benefits: Benefit[] = [
  { icon: '∞', text: '无限次日记书写' },
  { icon: '✦', text: 'AI 深度回应与引导' },
  { icon: '◎', text: '情绪趋势分析' },
  { icon: '✉', text: '纪念日专属关怀' }
]

const price = ref(19.9)
const isPaying = ref(false)

async function handlePay() {
  if (isPaying.value) return
  isPaying.value = true
  uni.showLoading({ title: '请求支付...' })

  try {
    const orderRes = await uni.request({
      url: '/api/wechat-pay',
      method: 'POST',
      data: { amount: price.value }
    }) as any

    uni.hideLoading()

    if (!orderRes.data?.success || !orderRes.data?.data) {
      uni.showToast({ title: '创建订单失败', icon: 'none' })
      isPaying.value = false
      return
    }

    const payParams = orderRes.data.data
    await uni.requestPayment({
      provider: 'wxpay',
      ...payParams
    })

    uni.showToast({ title: '支付成功', icon: 'success' })
    uni.setStorageSync('subscription', { active: true, paidAt: new Date().toISOString() })
  } catch {
    uni.hideLoading()
    uni.showToast({ title: '支付未完成', icon: 'none' })
  } finally {
    isPaying.value = false
  }
}

function handleBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page" data-testid="payment-page">
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <text class="back-btn" data-testid="back-btn" @click="handleBack">← 返回</text>
        <text class="nav-title">订阅</text>
        <view class="nav-placeholder" />
      </view>
    </view>

    <view class="container">
      <!-- 计划卡片 -->
      <view class="plan-card">
        <view class="plan-header">
          <text class="plan-badge">完整版</text>
        </view>
        <view class="price-section">
          <text class="price-symbol">¥</text>
          <text class="price-value">{{ price }}</text>
          <text class="price-period">/月</text>
        </view>
        <text class="plan-desc">解锁全部功能，持续陪伴你的疗愈之路</text>
      </view>

      <!-- 权益列表 -->
      <view class="benefits-section">
        <text class="section-title">订阅权益</text>
        <view class="benefits-list" data-testid="benefits-list">
          <view
            v-for="(benefit, index) in benefits"
            :key="index"
            class="benefit-item"
            :data-testid="`benefit-${index}`"
          >
            <text class="benefit-icon">{{ benefit.icon }}</text>
            <text class="benefit-text">{{ benefit.text }}</text>
          </view>
        </view>
      </view>

      <!-- 支付按钮 -->
      <view class="pay-section">
        <view
          class="btn btn-primary pay-btn"
          :class="{ disabled: isPaying }"
          data-testid="pay-btn"
          @click="handlePay"
        >
          <text class="pay-btn-text">{{ isPaying ? '处理中...' : `确认支付 ¥${price}` }}</text>
        </view>
        <text class="terms-text">订阅自动续期，可随时在设置中取消</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background-color: var(--color-bg);
}

.nav-bar {
  background-color: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px var(--space-md);
  height: 44px;
}

.back-btn {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  min-width: 60px;
}

.nav-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.nav-placeholder {
  min-width: 60px;
}

.container {
  padding: var(--space-xl) var(--space-md);
}

.plan-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-xl);
  text-align: center;
}

.plan-header {
  margin-bottom: var(--space-md);
}

.plan-badge {
  font-size: var(--text-xs);
  color: var(--color-accent);
  background-color: var(--color-accent-light);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.price-section {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
}

.price-symbol {
  font-size: var(--text-lg);
  color: var(--color-text-primary);
  font-weight: 500;
}

.price-value {
  font-size: var(--text-2xl);
  color: var(--color-text-primary);
  font-weight: 700;
}

.price-period {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.plan-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.benefits-section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--space-md);
  display: block;
}

.benefits-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.benefit-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--color-border);
}

.benefit-icon {
  font-size: var(--text-lg);
  color: var(--color-accent);
  width: 28px;
  text-align: center;
}

.benefit-text {
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.pay-section {
  padding-bottom: var(--space-xl);
}

.pay-btn {
  width: 100%;
  margin-bottom: var(--space-md);
}

.pay-btn.disabled {
  opacity: 0.6;
}

.pay-btn-text {
  font-size: var(--text-base);
  font-weight: 500;
  color: #FFFFFF;
}

.terms-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-align: center;
  display: block;
}
</style>
