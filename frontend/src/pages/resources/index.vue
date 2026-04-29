<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getResources } from '../../services/api'

interface Therapist {
  id: string
  name: string
  title: string
  city: string
  specialties: string[]
  phone?: string
  platformUrl?: string
  isVerified: boolean
}

const therapists = ref<Therapist[]>([])
const hotlines = ref<string[]>([])
const loading = ref(false)
const error = ref('')
const selectedCity = ref('')
const cities = ['全部', '北京', '上海', '广州', '深圳']

async function loadResources() {
  loading.value = true
  error.value = ''
  try {
    const city = selectedCity.value === '全部' ? undefined : selectedCity.value
    const data = await getResources(city)
    therapists.value = data.therapists
    hotlines.value = data.hotlines
  } catch (err) {
    error.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function selectCity(city: string) {
  selectedCity.value = city
  loadResources()
}

function makeCall(phone: string) {
  uni.makePhoneCall({ phoneNumber: phone })
}

function handleBack() {
  uni.navigateBack()
}

onMounted(() => {
  selectedCity.value = '全部'
  loadResources()
})
</script>

<template>
  <view class="page" data-testid="resources-page">
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <text class="back-btn" data-testid="back-btn" @click="handleBack">返回</text>
        <text class="nav-title">专业支持</text>
        <view class="nav-placeholder" />
      </view>
    </view>

    <view class="container">
      <!-- Crisis banner -->
      <view class="crisis-banner" data-testid="crisis-banner">
        <text class="crisis-title">如果你正处于危机中</text>
        <text class="crisis-desc">以下热线 24 小时有人接听</text>
        <view class="hotline-list">
          <view
            v-for="hotline in hotlines"
            :key="hotline"
            class="hotline-item"
            @click="makeCall(hotline)"
          >
            <text class="hotline-number">{{ hotline }}</text>
            <text class="call-icon">&#x260E;</text>
          </view>
        </view>
      </view>

      <!-- City filter -->
      <view class="city-filter" data-testid="city-filter">
        <text
          v-for="city in cities"
          :key="city"
          class="city-chip"
          :class="{ 'active': selectedCity === city }"
          @click="selectCity(city)"
        >{{ city }}</text>
      </view>

      <!-- Therapist list -->
      <view v-if="loading" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>

      <view v-else-if="error" class="error-state">
        <text class="error-text">{{ error }}</text>
      </view>

      <view v-else class="therapist-list" data-testid="therapist-list">
        <view
          v-for="t in therapists"
          :key="t.id"
          class="therapist-card"
          :data-testid="`therapist-${t.id}`"
        >
          <view class="therapist-header">
            <view class="name-section">
              <text class="therapist-name">{{ t.name }}</text>
              <text v-if="t.isVerified" class="verified-badge">已认证</text>
            </view>
            <text class="therapist-city">{{ t.city }}</text>
          </view>

          <text class="therapist-title">{{ t.title }}</text>

          <view class="specialties">
            <text
              v-for="s in t.specialties"
              :key="s"
              class="specialty-tag"
            >{{ s }}</text>
          </view>

          <view v-if="t.phone" class="contact-section">
            <text class="contact-label">预约电话</text>
            <text class="contact-phone" @click="makeCall(t.phone)">{{ t.phone }}</text>
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

.crisis-banner {
  background: linear-gradient(135deg, var(--color-danger) 0%, #B85C5C 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  margin-bottom: var(--space-lg);
}

.crisis-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: #fff;
  display: block;
  margin-bottom: var(--space-xs);
}

.crisis-desc {
  font-size: var(--text-sm);
  color: rgba(255,255,255,0.8);
  display: block;
  margin-bottom: var(--space-md);
}

.hotline-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.hotline-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255,255,255,0.15);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
}

.hotline-number {
  font-size: var(--text-md);
  font-weight: 600;
  color: #fff;
}

.call-icon {
  font-size: var(--text-lg);
  color: #fff;
}

.city-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}

.city-chip {
  padding: 6px 14px;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

.city-chip.active {
  background: var(--color-primary);
  color: #fff;
  border-color: var(--color-primary);
}

.loading-state,
.error-state {
  text-align: center;
  padding: var(--space-3xl) 0;
}

.loading-text,
.error-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.error-text {
  color: var(--color-danger);
}

.therapist-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.therapist-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.therapist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}

.name-section {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.therapist-name {
  font-size: var(--text-md);
  font-weight: 600;
  color: var(--color-text-primary);
}

.verified-badge {
  font-size: var(--text-xs);
  color: var(--color-primary);
  background: var(--color-primary-light);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
}

.therapist-city {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.therapist-title {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: var(--space-md);
}

.specialties {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-bottom: var(--space-md);
}

.specialty-tag {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  background: var(--color-bg);
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

.contact-section {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.contact-label {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.contact-phone {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-primary);
}
</style>
