<script setup lang="ts">
interface Hotline {
  name: string
  number: string
  hours: string
  description: string
}

const hotlines: Hotline[] = [
  {
    name: '全国心理援助热线',
    number: '400-161-9995',
    hours: '24小时',
    description: '专业心理咨询与危机干预'
  },
  {
    name: '北京心理危机研究与干预中心',
    number: '010-82951332',
    hours: '24小时',
    description: '危机干预与心理援助'
  },
  {
    name: '上海心理热线',
    number: '021-12320',
    hours: '24小时',
    description: '心理健康咨询'
  },
  {
    name: '生命热线',
    number: '400-821-1215',
    hours: '24小时',
    description: '情感支持与倾听'
  }
]

function callHotline(number: string) {
  if (uni.makePhoneCall) {
    uni.makePhoneCall({ phoneNumber: number })
  }
}

function handleBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page" data-testid="crisis-help-page">
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <text class="back-btn" data-testid="back-btn" @click="handleBack">← 返回</text>
        <text class="nav-title">危机帮助</text>
        <view class="nav-placeholder" />
      </view>
    </view>

    <view class="container">
      <!-- 温馨提示 -->
      <view class="comfort-section">
        <text class="comfort-title">你并不孤单</text>
        <text class="comfort-text">
          有时候痛苦会让人感到孤立无援。但请相信，总有人愿意倾听、愿意陪伴。如果你正处于紧急情况，请立即拨打下方热线。
        </text>
      </view>

      <!-- 紧急提示 -->
      <view class="emergency-notice">
        <text class="emergency-text">紧急情况请拨打 110 或 120</text>
      </view>

      <!-- 热线列表 -->
      <view class="hotlines-section">
        <text class="section-title">心理援助热线</text>
        <view class="hotline-list" data-testid="hotline-list">
          <view
            v-for="(hotline, index) in hotlines"
            :key="index"
            class="hotline-card"
            :data-testid="`hotline-${index}`"
            @click="callHotline(hotline.number)"
          >
            <view class="hotline-main">
              <text class="hotline-name">{{ hotline.name }}</text>
              <view class="hotline-meta">
                <text class="hotline-number">{{ hotline.number }}</text>
                <text class="hotline-hours">{{ hotline.hours }}</text>
              </view>
            </view>
            <text class="hotline-desc">{{ hotline.description }}</text>
            <text class="call-hint">点击拨打 →</text>
          </view>
        </view>
      </view>

      <!-- 底部提示 -->
      <view class="footer-notice">
        <text class="footer-text">
          这些热线由专业心理咨询师接听，所有对话严格保密。
        </text>
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

.comfort-section {
  margin-bottom: var(--space-xl);
  text-align: center;
  padding: var(--space-xl) var(--space-md);
}

.comfort-title {
  font-size: var(--text-2xl);
  font-family: var(--font-serif);
  color: var(--color-text-primary);
  display: block;
  margin-bottom: var(--space-md);
  letter-spacing: 0.5px;
}

.comfort-text {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.7;
  display: block;
  font-family: var(--font-serif);
}

.emergency-notice {
  background: linear-gradient(135deg, var(--color-crisis-light) 0%, rgba(196, 120, 110, 0.05) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-xl);
  text-align: center;
  border: 1px solid rgba(196, 120, 110, 0.15);
  box-shadow: 0 4px 16px rgba(196, 120, 110, 0.06);
}

.emergency-text {
  font-size: var(--text-sm);
  color: var(--color-crisis);
  font-weight: 500;
  letter-spacing: 0.5px;
}

.hotlines-section {
  margin-bottom: var(--space-xl);
}

.section-title {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--space-md);
  display: block;
  letter-spacing: 0.5px;
}

.hotline-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.hotline-card {
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-warm) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border);
  transition: all var(--duration-fast);
}

.hotline-card:active {
  background: linear-gradient(135deg, var(--color-crisis-soft) 0%, rgba(196, 120, 110, 0.03) 100%);
  border-color: rgba(196, 120, 110, 0.12);
}

.hotline-main {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: var(--space-sm);
}

.hotline-name {
  font-size: var(--text-base);
  font-weight: 500;
  color: var(--color-text-primary);
}

.hotline-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-xs);
}

.hotline-number {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-gold);
}

.hotline-hours {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.hotline-desc {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
  display: block;
}

.call-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-align: right;
  display: block;
}

.footer-notice {
  padding: var(--space-lg) var(--space-md);
  text-align: center;
}

.footer-text {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: 1.5;
}
</style>
