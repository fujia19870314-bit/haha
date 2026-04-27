<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const whiteNoisePlaying = ref(false)
const whiteNoiseType = ref('rain')
const timer = ref<number | null>(null)
const elapsed = ref(0)

const noiseTypes = [
  { id: 'rain', name: '雨声', icon: '&#x2614;' },
  { id: 'wind', name: '风声', icon: '&#x1F343;' },
  { id: 'ocean', name: '海浪', icon: '&#x1F30A;' },
  { id: 'forest', name: '森林', icon: '&#x1F332;' }
]

const menuItems = [
  { label: '查看历史', path: '/pages/history/index', testid: 'menu-history' },
  { label: '情绪日历', path: '/pages/calendar/index', testid: 'menu-calendar' },
  { label: '导出纪念册', path: '/pages/export/index', testid: 'menu-export' },
  { label: '专业支持', path: '/pages/resources/index', testid: 'menu-resources' }
]

function toggleWhiteNoise() {
  if (whiteNoisePlaying.value) {
    stopWhiteNoise()
  } else {
    startWhiteNoise()
  }
}

function startWhiteNoise() {
  whiteNoisePlaying.value = true
  timer.value = setInterval(() => {
    elapsed.value++
  }, 1000) as unknown as number
  // MVP: simulate audio with vibration on mobile
  uni.vibrateShort?.({})
}

function stopWhiteNoise() {
  whiteNoisePlaying.value = false
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
  elapsed.value = 0
}

function selectNoiseType(type: string) {
  whiteNoiseType.value = type
  if (whiteNoisePlaying.value) {
    // Restart with new type
    stopWhiteNoise()
    startWhiteNoise()
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0')
  const s = (seconds % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function navigateTo(path: string) {
  uni.navigateTo({ url: path })
}

onUnmounted(() => {
  if (timer.value) {
    clearInterval(timer.value)
  }
})

onMounted(() => {
  // Load saved preference
  try {
    const saved = uni.getStorageSync('white_noise_pref')
    if (saved) {
      whiteNoiseType.value = saved
    }
  } catch {
    // ignore
  }
})
</script>

<template>
  <view class="page" data-testid="settings-page">
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <view class="nav-placeholder" />
        <text class="nav-title">更多</text>
        <view class="nav-placeholder" />
      </view>
    </view>

    <view class="container">
      <!-- White noise player -->
      <view class="player-card" data-testid="white-noise-player">
        <view class="player-header">
          <text class="player-title">白噪音陪伴</text>
          <text v-if="whiteNoisePlaying" class="player-timer">{{ formatTime(elapsed) }}</text>
        </view>

        <view class="noise-types">
          <view
            v-for="noise in noiseTypes"
            :key="noise.id"
            class="noise-item"
            :class="{ 'active': whiteNoiseType === noise.id }"
            :data-testid="`noise-${noise.id}`"
            @click="selectNoiseType(noise.id)"
          >
            <text class="noise-icon">{{ noise.icon }}</text>
            <text class="noise-name">{{ noise.name }}</text>
          </view>
        </view>

        <button
          class="play-btn"
          :class="{ 'playing': whiteNoisePlaying }"
          data-testid="play-btn"
          @click="toggleWhiteNoise"
        >
          <text>{{ whiteNoisePlaying ? '停止' : '播放' }}</text>
        </button>
      </view>

      <!-- Menu list -->
      <view class="menu-list" data-testid="settings-menu">
        <view
          v-for="item in menuItems"
          :key="item.label"
          class="menu-item"
          :data-testid="item.testid"
          @click="navigateTo(item.path)"
        >
          <text class="menu-label">{{ item.label }}</text>
          <text class="menu-arrow">&#x3E;</text>
        </view>
      </view>

      <!-- About -->
      <view class="about-section">
        <text class="about-text">哀思日记 v1.0</text>
        <text class="about-desc">温柔陪伴你的疗愈之旅</text>
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

.player-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-lg);
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
}

.player-title {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.player-timer {
  font-size: var(--text-sm);
  color: var(--color-primary);
  font-family: monospace;
}

.noise-types {
  display: flex;
  justify-content: space-around;
  margin-bottom: var(--space-lg);
}

.noise-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  opacity: 0.6;
}

.noise-item.active {
  opacity: 1;
  background: var(--color-primary-bg);
}

.noise-icon {
  font-size: var(--text-xl);
}

.noise-name {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.play-btn {
  width: 100%;
  padding: var(--space-md);
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius-md);
  font-size: var(--text-md);
  font-weight: 500;
  border: none;
}

.play-btn.playing {
  background: var(--color-danger);
}

.play-btn::after {
  border: none;
}

.menu-list {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: var(--space-lg);
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1px solid var(--color-border);
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-label {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.menu-arrow {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.about-section {
  text-align: center;
  padding: var(--space-xl) 0;
}

.about-text {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  display: block;
  margin-bottom: var(--space-xs);
}

.about-desc {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  display: block;
}
</style>
