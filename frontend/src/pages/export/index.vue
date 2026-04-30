<script setup lang="ts">
import { ref } from 'vue'
import { generatePdf } from '../../services/api'
import { getCurrentUserId } from '../../services/auth'

const generating = ref(false)
const result = ref<{
  downloadUrl: string
  fileName: string
  pageCount: number
  generatedAt: string
} | null>(null)
const error = ref('')

async function handleGenerate() {
  const userId = getCurrentUserId()
  if (!userId) {
    error.value = '请先登录'
    return
  }

  generating.value = true
  error.value = ''
  result.value = null

  try {
    const data = await generatePdf(userId)
    result.value = data
  } catch (err) {
    error.value = err instanceof Error ? err.message : '生成失败'
  } finally {
    generating.value = false
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`
}

function handleBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page" data-testid="export-page">
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <text class="back-btn" data-testid="back-btn" @click="handleBack">返回</text>
        <text class="nav-title">导出纪念册</text>
        <view class="nav-placeholder" />
      </view>
    </view>

    <view class="container">
      <!-- Intro -->
      <view class="intro-card" data-testid="intro-card">
        <text class="intro-title">将你的日记整理成册</text>
        <text class="intro-desc">
          我们会将你的日记、情绪记录和 AI 回应整理成一本精美的 PDF 纪念册，方便你保存和回顾。
        </text>
      </view>

      <!-- Preview -->
      <view class="preview-section" data-testid="preview-section">
        <text class="section-title">纪念册包含</text>
        <view class="feature-list">
          <view class="feature-item">
            <text class="feature-icon">&#x1F4C5;</text>
            <text class="feature-text">按时间排序的日记回顾</text>
          </view>
          <view class="feature-item">
            <text class="feature-icon">&#x1F4CA;</text>
            <text class="feature-text">情绪变化可视化</text>
          </view>
          <view class="feature-item">
            <text class="feature-icon">&#x1F4AD;</text>
            <text class="feature-text">AI 的每一句回应</text>
          </view>
        </view>
      </view>

      <!-- Generate button -->
      <view class="action-section">
        <button
          class="generate-btn"
          :class="{ 'generating': generating }"
          :disabled="generating"
          data-testid="generate-btn"
          @click="handleGenerate"
        >
          <text v-if="generating">生成中...</text>
          <text v-else>生成 PDF 纪念册</text>
        </button>

        <text v-if="error" class="error-text" data-testid="error-msg">{{ error }}</text>
      </view>

      <!-- Result -->
      <view v-if="result" class="result-card" data-testid="result-card">
        <text class="result-title">生成成功</text>
        <view class="result-info">
          <text class="result-label">文件名</text>
          <text class="result-value">{{ result.fileName }}</text>
        </view>
        <view class="result-info">
          <text class="result-label">页数</text>
          <text class="result-value">{{ result.pageCount }} 页</text>
        </view>
        <view class="result-info">
          <text class="result-label">生成时间</text>
          <text class="result-value">{{ formatDate(result.generatedAt) }}</text>
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

.intro-card {
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-warm) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.intro-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: var(--space-sm);
  font-family: var(--font-serif);
}

.intro-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  display: block;
}

.preview-section {
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-warm) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.section-title {
  font-size: var(--text-md);
  font-weight: 500;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: var(--space-md);
  font-family: var(--font-serif);
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.feature-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-icon {
  font-size: var(--text-lg);
}

.feature-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.action-section {
  margin-bottom: var(--space-lg);
}

.generate-btn {
  width: 100%;
  padding: var(--space-md);
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  color: var(--color-text-on-primary);
  border-radius: var(--radius-pill);
  font-size: var(--text-md);
  font-weight: 500;
  border: none;
  box-shadow: 0 4px 16px rgba(201, 168, 124, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15);
  transition: all var(--duration-fast);
  position: relative;
  overflow: hidden;
}

.generate-btn.generating {
  opacity: 0.6;
}

.generate-btn::after {
  border: none;
  content: none;
}

.error-text {
  font-size: var(--text-sm);
  color: var(--color-danger);
  text-align: center;
  margin-top: var(--space-sm);
  display: block;
}

.result-card {
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-warm) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.result-title {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text-primary);
  display: block;
  margin-bottom: var(--space-md);
  font-family: var(--font-serif);
}

.result-info {
  display: flex;
  justify-content: space-between;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.result-info:last-child {
  border-bottom: none;
}

.result-label {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.result-value {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  font-weight: 500;
}
</style>
