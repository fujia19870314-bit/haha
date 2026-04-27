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
  height: 44px;
}

.nav-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  font-family: var(--font-serif);
}

.crisis-btn {
  background-color: var(--color-crisis-light);
  border-radius: var(--radius-sm);
  padding: 4px 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.crisis-text {
  font-size: var(--text-xs);
  color: var(--color-crisis);
  font-weight: 500;
}
</style>
