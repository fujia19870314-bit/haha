<script setup lang="ts">
interface Props {
  level: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
}>()

import { ref } from 'vue'

const isVisible = ref(true)

function handleClose() {
  isVisible.value = false
  emit('close')
}

function goToCrisis() {
  uni.navigateTo({ url: '/pages/crisis/help' })
}
</script>

<template>
  <view
    v-if="isVisible && level !== 'low'"
    class="crisis-banner"
    :class="`level-${level}`"
    data-testid="crisis-banner"
  >
    <view class="banner-content">
      <text class="banner-message">{{ message }}</text>
      <view class="banner-actions">
        <text
          class="crisis-link"
          data-testid="crisis-link"
          @click="goToCrisis"
        >我需要帮助</text>
        <text
          class="close-btn"
          data-testid="close-btn"
          @click="handleClose"
        >关闭</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.crisis-banner {
  padding: var(--space-md);
  border-radius: var(--radius-md);
  margin: var(--space-md);
}

.level-medium {
  background-color: #FFF8E1;
  border: 1px solid #FFE082;
}

.level-high {
  background-color: var(--color-crisis-light);
  border: 1px solid #F5B7B1;
}

.level-critical {
  background-color: #FCEAE8;
  border: 1px solid var(--color-crisis);
}

.banner-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.banner-message {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  line-height: 1.5;
}

.banner-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.crisis-link {
  font-size: var(--text-sm);
  color: var(--color-crisis);
  font-weight: 600;
  text-decoration: underline;
}

.close-btn {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  padding: var(--space-xs) var(--space-sm);
}
</style>
