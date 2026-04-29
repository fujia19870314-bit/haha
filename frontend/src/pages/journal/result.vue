<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface JournalResult {
  aiResponse: { content: string }
  crisisDetected: boolean
  riskLevel: string
  hotlines?: string[]
}

const result = ref<JournalResult | null>(null)

function loadResult() {
  try {
    const stored = uni.getStorageSync('last_journal_result')
    if (stored) {
      result.value = JSON.parse(stored)
    }
  } catch {
    result.value = null
  }
}

function goHome() {
  uni.switchTab({ url: '/pages/home/index' })
}

function writeAgain() {
  uni.redirectTo({ url: '/pages/journal/write' })
}

onMounted(() => {
  loadResult()
})
</script>

<template>
  <view class="page" data-testid="result-page">
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <view class="nav-placeholder" />
        <text class="nav-title">回应</text>
        <view class="nav-placeholder" />
      </view>
    </view>

    <view class="container animate-fade-in-up">
      <!-- AI 回应卡片 -->
      <view class="response-card" data-testid="response-card">
        <view class="response-header">
          <text class="response-label">AI 回应</text>
        </view>
        <text v-if="result?.aiResponse?.content" class="response-text">{{ result.aiResponse.content }}</text>
        <text v-else class="response-text fallback">
          感谢你的分享。有时候，倾诉本身就是一种疗愈。
        </text>
      </view>

      <!-- 危机提示 -->
      <view
        v-if="result?.crisisDetected"
        class="crisis-notice"
        data-testid="crisis-notice"
      >
        <text class="crisis-title">你并不孤单</text>
        <text class="crisis-text">如果你正在经历困难，专业的心理援助热线可以为你提供支持。</text>
        <view class="hotline-list">
          <view
            v-for="(hotline, index) in result.hotlines"
            :key="index"
            class="hotline-item"
            @click="uni.makePhoneCall({ phoneNumber: hotline })"
          >
            <text class="hotline-number">{{ hotline }}</text>
          </view>
        </view>
      </view>

      <!-- 会话结束提示 -->
      <view class="session-end-notice" data-testid="session-end-notice">
        <view class="end-divider" />
        <text class="end-text">今天的会话结束了</text>
        <text class="end-subtext">明天再来，我会一直在这里</text>
        <view class="end-divider" />
      </view>

      <!-- 操作按钮 -->
      <view class="actions">
        <view
          class="btn btn-primary"
          data-testid="back-home-btn"
          @click="goHome"
        >
          <text>回到首页</text>
        </view>
        <view
          class="btn btn-secondary"
          data-testid="write-again-btn"
          @click="writeAgain"
        >
          <text>再写一篇</text>
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

.nav-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.nav-placeholder {
  min-width: 60px;
}

.container {
  padding: var(--space-lg) var(--space-md);
}

.response-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-xl);
}

.response-header {
  margin-bottom: var(--space-md);
}

.response-label {
  font-size: var(--text-xs);
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
}

.response-text {
  font-size: var(--text-base);
  line-height: 1.8;
  color: var(--color-text-primary);
}

.response-text.fallback {
  color: var(--color-text-secondary);
  font-style: italic;
}

.suggestions-section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--space-md);
  display: block;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.suggestion-item {
  display: flex;
  align-items: flex-start;
  gap: var(--space-md);
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-lg);
  border: 1px solid var(--color-border);
}

.suggestion-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: var(--color-accent-light);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-xs);
  font-weight: 600;
  flex-shrink: 0;
}

.suggestion-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  padding-top: 2px;
}

.session-end-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-sm);
  margin: var(--space-2xl) 0;
}

.end-divider {
  width: 40px;
  height: 1px;
  background-color: var(--color-border);
}

.end-text {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  font-family: var(--font-serif);
}

.end-subtext {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-bottom: var(--space-xl);
}
</style>
