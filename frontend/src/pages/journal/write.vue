<script setup lang="ts">
import { ref, computed } from 'vue'
import { submitJournal } from '../../services/api'

interface MoodTag {
  name: string
  color: string
  bgColor: string
  borderColor: string
}

const moodTags: MoodTag[] = [
  { name: '悲伤', color: '#4A7C9B', bgColor: '#E8F1F8', borderColor: '#B8D4E8' },
  { name: '愤怒', color: '#B85C5C', bgColor: '#F8E8E8', borderColor: '#E8B8B8' },
  { name: '内疚', color: '#7A7A7A', bgColor: '#F0F0F0', borderColor: '#D0D0D0' },
  { name: '思念', color: '#8B7B8B', bgColor: '#F0ECF0', borderColor: '#D8D0D8' },
  { name: '平静', color: '#5A8B6A', bgColor: '#E8F0EC', borderColor: '#B8D8C8' },
  { name: '混乱', color: '#B89B5C', bgColor: '#F8F0E0', borderColor: '#E8D8B0' },
  { name: '温暖', color: '#D4A574', bgColor: '#F8F0E8', borderColor: '#E8D8C0' },
  { name: '焦虑', color: '#C9A959', bgColor: '#F8F4E0', borderColor: '#E8DCB0' },
  { name: '麻木', color: '#9B8B9B', bgColor: '#F0ECF0', borderColor: '#D8D0D8' }
]

const selectedMood = ref('')
const content = ref('')
const isSubmitting = ref(false)

const charCount = computed(() => content.value.length)
const maxLength = 2000

function selectMood(mood: string) {
  selectedMood.value = mood
}

function handleInput() {
  if (content.value.length > maxLength) {
    content.value = content.value.slice(0, maxLength)
  }
}

async function handleSubmit() {
  if (!selectedMood.value) {
    uni.showToast({ title: '请先选择一种情绪', icon: 'none' })
    return
  }
  if (!content.value.trim()) {
    uni.showToast({ title: '请写下你的感受', icon: 'none' })
    return
  }

  isSubmitting.value = true
  uni.showLoading({ title: '正在回应...' })

  try {
    const result = await submitJournal({
      userId: '', // 从 storage 获取
      mood: selectedMood.value,
      content: content.value.trim()
    })

    uni.hideLoading()
    isSubmitting.value = false

    // 使用 storage 传递结果，避免 URL 长度限制和隐私泄露
    uni.setStorageSync('last_journal_result', JSON.stringify(result))
    uni.navigateTo({ url: '/pages/journal/result' })
  } catch (error) {
    uni.hideLoading()
    isSubmitting.value = false
    uni.showToast({
      title: error instanceof Error ? error.message : '提交失败，请重试',
      icon: 'none'
    })
  }
}

function handleBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page" data-testid="write-page">
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <text class="back-btn" data-testid="back-btn" @click="handleBack">← 返回</text>
        <text class="nav-title">写日记</text>
        <view class="nav-placeholder" />
      </view>
    </view>

    <view class="container animate-fade-in-up">
      <!-- 情绪选择 -->
      <view class="section">
        <text class="section-title">此刻的感受</text>
        <view class="mood-selector" data-testid="mood-selector">
          <view
            v-for="tag in moodTags"
            :key="tag.name"
            class="mood-tag"
            :class="{ selected: selectedMood === tag.name }"
            :style="{
              color: tag.color,
              backgroundColor: selectedMood === tag.name ? tag.bgColor : 'var(--color-surface)',
              borderColor: selectedMood === tag.name ? tag.borderColor : 'var(--color-border)'
            }"
            :data-testid="`mood-tag-${tag.name}`"
            @click="selectMood(tag.name)"
          >
            <text class="mood-tag-text">{{ tag.name }}</text>
          </view>
        </view>
      </view>

      <!-- 写作区域 -->
      <view class="section">
        <text class="section-title">写下想说的话</text>
        <textarea
          v-model="content"
          class="journal-textarea"
          placeholder="这里很安全，想写什么都可以..."
          maxlength="2000"
          data-testid="journal-textarea"
          @input="handleInput"
        >
        </textarea>
        <view class="char-counter">
          <text class="counter-text" :class="{ nearLimit: charCount > 1800 }">{{ charCount }} / {{ maxLength }}</text>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <view
          class="btn btn-primary submit-btn"
          :class="{ disabled: isSubmitting }"
          data-testid="submit-btn"
          @click="handleSubmit"
        >
          <text class="submit-text">{{ isSubmitting ? '提交中...' : '完成书写' }}</text>
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

.section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--space-md);
  display: block;
}

.mood-selector {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.mood-tag {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-lg);
  border: 2px solid var(--color-border);
  transition: all var(--duration-fast) var(--ease-out);
}

.mood-tag.selected {
  border-width: 2px;
  font-weight: 500;
}

.mood-tag-text {
  font-size: var(--text-sm);
}

.journal-textarea {
  width: 100%;
  min-height: 200px;
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  font-size: var(--text-base);
  line-height: 1.8;
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.char-counter {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-sm);
}

.counter-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.counter-text.nearLimit {
  color: var(--color-crisis);
}

.submit-section {
  margin-top: var(--space-xl);
  padding-bottom: var(--space-xl);
}

.submit-btn {
  width: 100%;
}

.submit-btn.disabled {
  opacity: 0.6;
}

.submit-text {
  font-size: var(--text-base);
  font-weight: 500;
  color: #FFFFFF;
}
</style>
