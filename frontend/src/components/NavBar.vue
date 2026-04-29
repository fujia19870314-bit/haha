<script setup lang="ts">
interface Props {
  title?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: ''
})

function goToCrisis() {
  uni.navigateTo({ url: '/pages/crisis/help' })
}
</script>

<template>
  <view class="nav-bar safe-area-top">
    <view class="nav-content">
      <text class="nav-title">{{ props.title }}</text>
      <view
        class="crisis-btn"
        data-testid="crisis-btn"
        @click="goToCrisis"
      >
        <text class="crisis-text">帮助</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
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

.nav-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-serif);
  letter-spacing: 0.5px;
}

.crisis-btn {
  background: linear-gradient(135deg, var(--color-crisis-soft) 0%, var(--color-crisis-light) 100%);
  border-radius: var(--radius-pill);
  padding: 5px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--duration-fast) var(--ease-out);
  border: 1px solid var(--color-crisis-light);
}

.crisis-btn:active {
  transform: scale(0.95);
  background: var(--color-crisis-light);
  box-shadow: 0 0 12px rgba(196, 120, 110, 0.2);
}

.crisis-text {
  font-size: var(--text-xs);
  color: var(--color-crisis);
  font-weight: 500;
  letter-spacing: 0.5px;
}
</style>
