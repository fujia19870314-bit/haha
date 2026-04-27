<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface HistoryItem {
  id: string
  aiResponse: string
  emotionTag: string
  createdAt: string
}

const historyList = ref<HistoryItem[]>([])
const loading = ref(false)

const emotionColors: Record<string, string> = {
  '悲伤': '#4A7C9B',
  '愤怒': '#B85C5C',
  '内疚': '#7A7A7A',
  '思念': '#8B7B8B',
  '平静': '#5A8B6A',
  '混乱': '#B89B5C'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function loadHistory() {
  loading.value = true
  try {
    const stored = uni.getStorageSync('journal_history')
    if (stored) {
      historyList.value = JSON.parse(stored)
    }
  } catch {
    historyList.value = []
  }
  loading.value = false
}

function handleBack() {
  uni.navigateBack()
}

onMounted(() => {
  loadHistory()
})
</script>

<template>
  <view class="page" data-testid="history-page">
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <text class="back-btn" data-testid="back-btn" @click="handleBack">← 返回</text>
        <text class="nav-title">回顾</text>
        <view class="nav-placeholder" />
      </view>
    </view>

    <view class="container">
      <!-- 空状态 -->
      <view v-if="!loading && historyList.length === 0" class="empty-state" data-testid="empty-state">
        <text class="empty-text">还没有日记</text>
        <text class="empty-subtext">开始书写你的第一篇日记吧</text>
      </view>

      <!-- 历史列表 -->
      <view v-else class="history-list" data-testid="history-list">
        <view
          v-for="item in historyList"
          :key="item.id"
          class="history-item"
          :data-testid="`history-item-${item.id}`"
        >
          <view class="item-header">
            <view class="date-badge">
              <text class="date-text">{{ formatDate(item.createdAt) }}</text>
              <text class="time-text">{{ formatTime(item.createdAt) }}</text>
            </view>
            <view
              v-if="item.emotionTag"
              class="emotion-tag"
              :style="{ backgroundColor: emotionColors[item.emotionTag] + '20', color: emotionColors[item.emotionTag] }"
            >
              <text class="emotion-text">{{ item.emotionTag }}</text>
            </view>
          </view>

          <view class="item-content">
            <text class="preview-text">{{ item.aiResponse.slice(0, 60) }}...</text>
          </view>
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

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-3xl) 0;
  gap: var(--space-sm);
}

.empty-text {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
}

.empty-subtext {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.history-item {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.date-badge {
  display: flex;
  gap: var(--space-sm);
  align-items: center;
}

.date-text {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.time-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.emotion-tag {
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.emotion-text {
  font-weight: 500;
}

.item-content {
  margin-top: var(--space-sm);
}

.preview-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
}
</style>
