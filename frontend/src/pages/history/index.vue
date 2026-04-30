<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getJournalHistory } from '../../services/api'
import { getCurrentUserId } from '../../services/auth'
import { isWeb } from '../../services/platform'

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
  '混乱': '#B89B5C',
  '温暖': '#D4A574',
  '焦虑': '#C9A959',
  '麻木': '#9B8B9B'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getMonth() + 1}月${date.getDate()}日`
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

async function loadHistory() {
  loading.value = true
  if (isWeb()) {
    try {
      historyList.value = await getJournalHistory(getCurrentUserId() || '')
    } catch {
      historyList.value = []
    }
  } else {
    try {
      const stored = uni.getStorageSync('journal_history')
      if (stored) {
        historyList.value = JSON.parse(stored)
      }
    } catch {
      historyList.value = []
    }
  }
  loading.value = false
}

function handleBack() {
  uni.navigateBack()
}

function viewDetail(item: HistoryItem) {
  // 将数据存入 storage，详情页读取
  const detail = {
    id: item.id,
    content: item.content || item.aiResponse.slice(0, 60) + '...',
    aiResponse: item.aiResponse,
    emotionTag: item.emotionTag,
    createdAt: item.createdAt,
    crisisDetected: item.crisisDetected || false
  }
  uni.setStorageSync('journal_detail_view', JSON.stringify(detail))
  uni.navigateTo({ url: '/pages/journal/detail' })
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

    <view class="container animate-fade-in-up">
      <!-- 空状态 -->
      <view v-if="!loading && historyList.length === 0" class="empty-state" data-testid="empty-state">
        <view class="empty-icon">📝</view>
        <text class="empty-text">这里还空空如也</text>
        <text class="empty-subtext">每一篇日记都是一次与自己对话的开始</text>
        <view class="empty-action" data-testid="write-first-btn" @click="uni.switchTab({ url: '/pages/journal/write' })">
          <text class="empty-action-text">写下第一篇日记</text>
        </view>
      </view>

      <!-- 历史列表 -->
      <view v-else class="history-list" data-testid="history-list">
        <view
          v-for="item in historyList"
          :key="item.id"
          class="history-item"
          :data-testid="`history-item-${item.id}`"
          @click="viewDetail(item)"
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
  height: 48px;
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
  letter-spacing: 0.5px;
  font-family: var(--font-serif);
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
  padding: var(--space-3xl) var(--space-lg);
  text-align: center;
  animation: fadeInUp 0.6s var(--ease-out) forwards;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: var(--space-lg);
  opacity: 0.6;
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
  margin-bottom: var(--space-xl);
  line-height: 1.6;
}

.empty-action {
  padding: var(--space-md) var(--space-xl);
  background: var(--color-primary);
  border-radius: var(--radius-pill);
  transition: all var(--duration-fast) var(--ease-out);
}

.empty-action:active {
  transform: scale(0.96);
  background: var(--color-primary-dark);
}

.empty-action-text {
  font-size: var(--text-base);
  color: var(--color-text-on-primary);
  font-weight: 500;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.history-item {
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-warm) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  transition: all var(--duration-fast);
  animation: fadeInUp 0.4s var(--ease-out) both;
}

.history-item:active {
  transform: scale(0.99);
  box-shadow: var(--shadow-md);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.date-badge {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.date-text {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  font-weight: 500;
}

.time-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.emotion-tag {
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-pill);
  font-size: var(--text-xs);
  font-weight: 500;
  border: 1px solid transparent;
}

.emotion-text {
  font-size: var(--text-xs);
}

.item-content {
  padding-top: var(--space-sm);
  border-top: 1px solid var(--color-border);
}

.preview-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  display: block;
  font-family: var(--font-serif);
}
</style>
