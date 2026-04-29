<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface JournalDetail {
  id: string
  content: string
  aiResponse: string
  emotionTag: string
  createdAt: string
  crisisDetected: boolean
}

const journal = ref<JournalDetail | null>(null)
const loading = ref(true)

const emotionColors: Record<string, string> = {
  '悲伤': '#4A7C9B',
  '愤怒': '#B85C5C',
  '内疚': '#7A7A7A',
  '思念': '#8B7B8B',
  '平静': '#5A8B6A',
  '混乱': '#B89B5C',
  '温暖': '#D4A574',
  '焦虑': '#C9A959',
  '麻木': '#9B8B9B'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function loadJournal() {
  loading.value = true
  try {
    // 从 storage 获取详情数据
    const stored = uni.getStorageSync('journal_detail_view')
    if (stored) {
      journal.value = JSON.parse(stored)
      // 清除 storage，避免重复读取
      uni.removeStorageSync('journal_detail_view')
    }
  } catch {
    journal.value = null
  }
  loading.value = false
}

function handleBack() {
  uni.navigateBack()
}

onMounted(() => {
  loadJournal()
})
</script>

<template>
  <view class="page" data-testid="journal-detail-page">
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <text class="back-btn" data-testid="back-btn" @click="handleBack">← 返回</text>
        <text class="nav-title">日记详情</text>
        <view class="nav-placeholder" />
      </view>
    </view>

    <view class="container">
      <!-- 加载中 -->
      <view v-if="loading" class="loading-state">
        <view class="skeleton skeleton-title" />
        <view class="skeleton skeleton-line" />
        <view class="skeleton skeleton-line short" />
      </view>

      <!-- 空状态 -->
      <view v-else-if="!journal" class="empty-state">
        <text class="empty-text">日记找不到了</text>
        <text class="empty-subtext">可能已被删除或数据过期</text>
      </view>

      <!-- 日记内容 -->
      <view v-else class="journal-content">
        <!-- 头部信息 -->
        <view class="journal-header">
          <view class="date-section">
            <text class="date-text">{{ formatDate(journal.createdAt) }}</text>
            <text class="time-text">{{ formatTime(journal.createdAt) }}</text>
          </view>
          <view
            v-if="journal.emotionTag"
            class="emotion-badge"
            :style="{ backgroundColor: emotionColors[journal.emotionTag] + '20', color: emotionColors[journal.emotionTag] }"
          >
            <text class="emotion-text">{{ journal.emotionTag }}</text>
          </view>
        </view>

        <!-- 日记正文 -->
        <view class="content-card">
          <text class="content-text">{{ journal.content }}</text>
        </view>

        <!-- AI 回应 -->
        <view class="response-section">
          <view class="response-header">
            <view class="response-label-line" />
            <text class="response-label">AI 回应</text>
            <view class="response-label-line" />
          </view>
          <view class="response-card">
            <text class="response-text">{{ journal.aiResponse }}</text>
          </view>
        </view>

        <!-- 危机提示 -->
        <view v-if="journal.crisisDetected" class="crisis-reminder">
          <text class="crisis-icon">⚠️</text>
          <text class="crisis-text">
            当时检测到你可能处于困难状态。如果你现在仍然感到痛苦，请记住：你并不孤单，专业帮助一直都在。
          </text>
          <text class="crisis-link" @click="uni.navigateTo({ url: '/pages/crisis/help' })">
            查看援助热线 →
          </text>
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
  padding: var(--space-lg) var(--space-md);
}

/* 骨架屏 */
.skeleton {
  background: linear-gradient(90deg, var(--color-surface-muted) 25%, var(--color-border-light) 50%, var(--color-surface-muted) 75%);
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.skeleton-title {
  height: 24px;
  width: 60%;
  margin-bottom: var(--space-lg);
}

.skeleton-line {
  height: 16px;
  width: 100%;
  margin-bottom: var(--space-md);
}

.skeleton-line.short {
  width: 40%;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl) var(--space-lg);
  text-align: center;
}

.empty-text {
  font-size: var(--text-xl);
  color: var(--color-text-primary);
  font-weight: 600;
  margin-bottom: var(--space-sm);
  font-family: var(--font-serif);
}

.empty-subtext {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

/* 日记头部 */
.journal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.date-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.date-text {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-serif);
}

.time-text {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.emotion-badge {
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: 500;
}

.emotion-text {
  font-size: var(--text-sm);
}

/* 日记正文 */
.content-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-xl);
}

.content-text {
  font-size: var(--text-base);
  color: var(--color-text-primary);
  line-height: 1.8;
  display: block;
}

/* AI 回应 */
.response-section {
  margin-bottom: var(--space-xl);
}

.response-header {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.response-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 2px;
  font-weight: 500;
  white-space: nowrap;
}

.response-label-line {
  flex: 1;
  height: 1px;
  background-color: var(--color-border);
}

.response-card {
  background: linear-gradient(135deg, var(--color-primary-light) 0%, var(--color-surface-warm) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  border: 1px solid var(--color-primary-soft);
}

.response-text {
  font-size: var(--text-base);
  color: var(--color-text-primary);
  line-height: 1.8;
  display: block;
}

/* 危机提醒 */
.crisis-reminder {
  background: linear-gradient(135deg, var(--color-crisis-soft) 0%, var(--color-crisis-light) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  margin-top: var(--space-xl);
  text-align: center;
  border: 1px solid rgba(196, 91, 74, 0.15);
}

.crisis-icon {
  font-size: var(--text-xl);
  display: block;
  margin-bottom: var(--space-sm);
}

.crisis-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  display: block;
  margin-bottom: var(--space-md);
}

.crisis-link {
  font-size: var(--text-sm);
  color: var(--color-crisis);
  font-weight: 500;
}
</style>
