<script setup lang="ts">
import { ref, computed } from 'vue'

const step = ref(1)
const relationship = ref('')
const lossTime = ref('')
const supportLevel = ref('')

const totalSteps = 3

const lossTimeOptions = [
  { value: 'within_1_month', label: '一个月内' },
  { value: '1_to_6_months', label: '1-6个月' },
  { value: '6_to_12_months', label: '6-12个月' },
  { value: '1_to_3_years', label: '1-3年' },
  { value: 'over_3_years', label: '3年以上' }
]

const supportOptions = [
  { value: 'just_listen', label: '只想倾诉' },
  { value: 'guidance', label: '需要引导' },
  { value: 'professional', label: '专业帮助' },
  { value: 'not_sure', label: '还不确定' }
]

const canProceed = computed(() => {
  if (step.value === 1) return relationship.value.trim().length > 0
  if (step.value === 2) return lossTime.value.length > 0
  if (step.value === 3) return supportLevel.value.length > 0
  return false
})

function validateInput() {
  if (relationship.value.length > 50) {
    relationship.value = relationship.value.slice(0, 50)
  }
}

function handleNext() {
  if (!canProceed.value) {
    uni.showToast({ title: '请先完成填写', icon: 'none' })
    return
  }
  if (step.value < totalSteps) {
    step.value++
  }
}

function handleBack() {
  if (step.value > 1) {
    step.value--
  }
}

function handleComplete() {
  if (!canProceed.value) {
    uni.showToast({ title: '请先完成填写', icon: 'none' })
    return
  }
  const data = {
    relationship: relationship.value.trim(),
    lossTime: lossTime.value,
    supportLevel: supportLevel.value,
    completedAt: new Date().toISOString()
  }
  uni.setStorageSync('onboarding', data)
  uni.switchTab({ url: '/pages/home/index' })
}

function handleSkip() {
  uni.switchTab({ url: '/pages/home/index' })
}
</script>

<template>
  <view class="container safe-area-top">
    <view class="header">
      <view class="progress-bar" data-testid="progress-indicator">
        <view
          v-for="s in totalSteps"
          :key="s"
          class="progress-dot"
          :class="{ active: s === step, completed: s < step }"
        >
          {{ s }}
        </view>
      </view>
      <text class="skip-link" data-testid="skip-btn" @click="handleSkip">跳过</text>
    </view>

    <!-- Step 1: Relationship -->
    <view v-if="step === 1" class="step-content">
      <text class="question-title">与逝者的关系</text>
      <text class="question-subtitle">可以简单描述，比如"父亲"、"挚友"、"奶奶"</text>
      <input
        v-model="relationship"
        class="text-input"
        type="text"
        placeholder="请输入..."
        maxlength="50"
        data-testid="relationship-input"
        @input="validateInput"
      >
    </view>

    <!-- Step 2: Loss Time -->
    <view v-if="step === 2" class="step-content">
      <text class="question-title">什么时候失去的</text>
      <text class="question-subtitle">这有助于我们更好地理解你的处境</text>
      <view class="options-list" data-testid="time-options">
        <view
          v-for="option in lossTimeOptions"
          :key="option.value"
          class="option-item"
          :class="{ selected: lossTime === option.value }"
          :data-testid="`time-option-${lossTimeOptions.indexOf(option) + 1}`"
          @click="lossTime = option.value"
        >
          <text class="option-text">{{ option.label }}</text>
        </view>
      </view>
    </view>

    <!-- Step 3: Support Level -->
    <view v-if="step === 3" class="step-content">
      <text class="question-title">需要怎样的支持</text>
      <text class="question-subtitle">选择最符合你当前状态的选项</text>
      <view class="options-list" data-testid="support-options">
        <view
          v-for="option in supportOptions"
          :key="option.value"
          class="option-item"
          :class="{ selected: supportLevel === option.value }"
          :data-testid="`support-option-${supportOptions.indexOf(option) + 1}`"
          @click="supportLevel = option.value"
        >
          <text class="option-text">{{ option.label }}</text>
        </view>
      </view>
    </view>

    <view class="actions">
      <view
        v-if="step > 1"
        class="btn btn-secondary"
        data-testid="back-btn"
        @click="handleBack"
      >
        <text>上一步</text>
      </view>
      <view
        v-if="step < totalSteps"
        class="btn btn-primary"
        data-testid="next-btn"
        @click="handleNext"
      >
        <text>下一步</text>
      </view>
      <view
        v-if="step === totalSteps"
        class="btn btn-primary"
        data-testid="complete-btn"
        @click="handleComplete"
      >
        <text>完成</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: var(--space-lg);
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-2xl);
}

.progress-bar {
  display: flex;
  gap: var(--space-sm);
}

.progress-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-sm);
  background-color: var(--color-border);
  color: var(--color-text-tertiary);
  transition: all var(--duration-normal) var(--ease-out);
}

.progress-dot.active {
  background-color: var(--color-accent);
  color: #FFFFFF;
}

.progress-dot.completed {
  background-color: var(--color-accent-light);
  color: var(--color-accent);
}

.skip-link {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  padding: var(--space-xs) var(--space-sm);
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.question-title {
  font-size: var(--text-2xl);
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-serif);
  margin-bottom: var(--space-sm);
}

.question-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xl);
}

.text-input {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-md);
  font-size: var(--text-base);
  border: 1px solid var(--color-border);
  color: var(--color-text-primary);
}

.text-input:focus {
  border-color: var(--color-accent);
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.option-item {
  background-color: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-md) var(--space-lg);
  border: 2px solid var(--color-border);
  transition: all var(--duration-fast) var(--ease-out);
}

.option-item.selected {
  border-color: var(--color-accent);
  background-color: var(--color-accent-light);
}

.option-item:active {
  opacity: 0.8;
}

.option-text {
  font-size: var(--text-base);
  color: var(--color-text-primary);
}

.actions {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-xl);
  padding-bottom: var(--space-xl);
}

.actions .btn {
  flex: 1;
}
</style>
