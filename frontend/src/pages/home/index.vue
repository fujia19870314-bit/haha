<script setup lang="ts">
import { ref, onMounted } from 'vue'
import NavBar from '../../components/NavBar.vue'

interface DailyPrompt {
  prompt: string
  theme: string
}

interface OnboardingData {
  relationship: string
  lossTime: string
  completedAt: string
}

const prompt = ref<DailyPrompt | null>(null)
const onboardingData = ref<OnboardingData | null>(null)
const showCrisisBanner = ref(true)
const loading = ref(true)

function getLossTimeLabel(value: string): string {
  const map: Record<string, string> = {
    within_1_month: '一个月内',
    '1_to_6_months': '1-6个月',
    '6_to_12_months': '6-12个月',
    '1_to_3_years': '1-3年',
    over_3_years: '3年以上'
  }
  return map[value] || ''
}

function calculateDays(): number {
  if (!onboardingData.value?.completedAt) return 0
  const start = new Date(onboardingData.value.completedAt)
  const now = new Date()
  return Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

async function fetchDailyPrompt() {
  try {
    const res = await uni.request({
      url: '/api/get-daily-prompt',
      method: 'GET'
    }) as any
    if (res.data?.success && res.data.data) {
      prompt.value = res.data.data
    }
  } catch {
    // fallback handled below
  } finally {
    loading.value = false
  }
}

function getDefaultPrompt(): string {
  return prompt.value?.prompt || '今天过得怎么样？想写什么都可以。'
}

function goToWrite() {
  uni.navigateTo({ url: '/pages/journal/write' })
}

function goToPayment() {
  uni.navigateTo({ url: '/pages/payment/index' })
}

function closeCrisisBanner() {
  showCrisisBanner.value = false
}

onMounted(() => {
  try {
    const stored = uni.getStorageSync('onboarding')
    if (stored) {
      onboardingData.value = stored as OnboardingData
    }
  } catch {
    // ignore
  }
  fetchDailyPrompt()
})
</script>

<template>
  <view class="page" data-testid="home-page">
    <NavBar title="今日" data-testid="nav-bar" />

    <view class="container animate-fade-in-up">
      <!-- 危机横幅 -->
      <view
        v-if="showCrisisBanner"
        class="crisis-banner-soft"
        data-testid="crisis-banner"
      >
        <view class="crisis-content">
          <text class="crisis-text">如果你感到难以承受，这里有人可以帮助你</text>
          <view class="crisis-actions">
            <text
              class="crisis-link"
              @click="uni.navigateTo({ url: '/pages/crisis/help' })"
            >我需要帮助</text>
            <text
              class="close-link"
              data-testid="close-crisis-banner"
              @click="closeCrisisBanner"
            >关闭</text>
          </view>
        </view>
      </view>

      <!-- 纪念日 Gentle Nudge -->
      <view class="memorial-nudge" data-testid="memorial-nudge">
        <text v-if="onboardingData" class="memorial-text">
          你与{{ onboardingData.relationship }}的故事，已经延续了{{ calculateDays() }}天
        </text>
        <text v-else class="memorial-text">
          欢迎来到哀伤日记，今天是一个新的开始
        </text>
      </view>

      <!-- 今日提示 -->
      <view class="prompt-card" data-testid="prompt-card">
        <view class="prompt-header">
          <text class="prompt-label">今日引导</text>
          <text v-if="prompt?.theme" class="prompt-theme">{{ prompt.theme }}</text>
        </view>
        <text class="prompt-text">{{ getDefaultPrompt() }}</text>
        <view class="prompt-divider" />
        <view class="write-cta" data-testid="write-btn" @click="goToWrite">
          <text class="write-cta-text">开始书写</text>
          <text class="write-cta-arrow">→</text>
        </view>
      </view>

      <!-- 订阅入口 -->
      <view class="subscription-section">
        <view
          class="subscription-link"
          data-testid="subscription-link"
          @click="goToPayment"
        >
          <text class="subscription-text">解锁完整体验</text>
          <text class="subscription-arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background-color: var(--color-bg);
}

.container {
  padding: var(--space-md);
}

.crisis-banner-soft {
  background-color: #FDF6F0;
  border-radius: var(--radius-md);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
  border: 1px solid #F0E6DC;
  animation: fadeInDown 0.4s var(--ease-out) both;
}

.crisis-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.crisis-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.crisis-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.crisis-link {
  font-size: var(--text-sm);
  color: var(--color-crisis);
  font-weight: 500;
}

.close-link {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  padding: var(--space-xs);
}

.memorial-nudge {
  margin-bottom: var(--space-xl);
  padding: var(--space-lg) 0;
  animation: fadeInUp 0.5s var(--ease-out) 0.1s both;
}

.memorial-text {
  font-size: var(--text-xl);
  font-family: var(--font-serif);
  color: var(--color-text-primary);
  line-height: 1.5;
}

.prompt-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-xl);
  animation: fadeInUp 0.5s var(--ease-out) 0.2s both;
}

.prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.prompt-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.prompt-theme {
  font-size: var(--text-xs);
  color: var(--color-accent);
  background-color: var(--color-accent-light);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
}

.prompt-text {
  font-size: var(--text-lg);
  font-family: var(--font-serif);
  color: var(--color-text-primary);
  line-height: 1.6;
  margin-bottom: var(--space-lg);
}

.prompt-divider {
  height: 1px;
  background-color: var(--color-border);
  margin-bottom: var(--space-md);
}

.write-cta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) 0;
}

.write-cta-text {
  font-size: var(--text-base);
  color: var(--color-accent);
  font-weight: 500;
}

.write-cta-arrow {
  font-size: var(--text-lg);
  color: var(--color-accent);
}

.subscription-section {
  margin-top: var(--space-xl);
  animation: fadeInUp 0.5s var(--ease-out) 0.3s both;
}

.subscription-link {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background-color: var(--color-surface-elevated);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
}

.subscription-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.subscription-arrow {
  font-size: var(--text-lg);
  color: var(--color-text-tertiary);
}
</style>
