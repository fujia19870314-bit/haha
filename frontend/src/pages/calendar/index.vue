<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface CalendarDay {
  date: number
  fullDate: string
  emotionTag: string | null
  hasJournal: boolean
  isToday: boolean
  isCurrentMonth: boolean
}

interface JournalEntry {
  id: string
  aiResponse: string
  emotionTag: string
  createdAt: string
}

const currentYear = ref(new Date().getFullYear())
const currentMonth = ref(new Date().getMonth())
const journalMap = ref<Map<string, JournalEntry>>(new Map())
const loading = ref(false)

const monthNames = [
  '一月', '二月', '三月', '四月', '五月', '六月',
  '七月', '八月', '九月', '十月', '十一月', '十二月'
]

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

const emotionLabels: Record<string, string> = {
  '悲伤': '悲',
  '愤怒': '怒',
  '内疚': '疚',
  '思念': '念',
  '平静': '静',
  '混乱': '乱',
  '温暖': '暖',
  '焦虑': '焦',
  '麻木': '木'
}

const calendarTitle = computed(() => {
  return `${currentYear.value}年 ${monthNames[currentMonth.value]}`
})

const weekDays = ['日', '一', '二', '三', '四', '五', '六']

const calendarDays = computed(() => {
  const days: CalendarDay[] = []
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startPadding = firstDay.getDay()

  // Previous month padding
  const prevMonthLastDay = new Date(currentYear.value, currentMonth.value, 0).getDate()
  for (let i = startPadding - 1; i >= 0; i--) {
    const date = prevMonthLastDay - i
    const fullDate = formatDateKey(new Date(currentYear.value, currentMonth.value - 1, date))
    days.push({
      date,
      fullDate,
      emotionTag: null,
      hasJournal: false,
      isToday: false,
      isCurrentMonth: false
    })
  }

  // Current month
  const today = new Date()
  for (let date = 1; date <= lastDay.getDate(); date++) {
    const fullDate = formatDateKey(new Date(currentYear.value, currentMonth.value, date))
    const entry = journalMap.value.get(fullDate)
    days.push({
      date,
      fullDate,
      emotionTag: entry?.emotionTag || null,
      hasJournal: !!entry,
      isToday: isSameDate(new Date(currentYear.value, currentMonth.value, date), today),
      isCurrentMonth: true
    })
  }

  // Next month padding
  const remainingCells = 42 - days.length
  for (let date = 1; date <= remainingCells; date++) {
    const fullDate = formatDateKey(new Date(currentYear.value, currentMonth.value + 1, date))
    days.push({
      date,
      fullDate,
      emotionTag: null,
      hasJournal: false,
      isToday: false,
      isCurrentMonth: false
    })
  }

  return days
})

const emotionStats = computed(() => {
  const stats: Record<string, number> = {}
  journalMap.value.forEach((entry) => {
    if (entry.emotionTag) {
      stats[entry.emotionTag] = (stats[entry.emotionTag] || 0) + 1
    }
  })
  return Object.entries(stats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
})

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function isSameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}

function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}

function loadJournals() {
  loading.value = true
  try {
    const stored = uni.getStorageSync('journal_history')
    if (stored) {
      const list: JournalEntry[] = JSON.parse(stored)
      const map = new Map<string, JournalEntry>()
      list.forEach((item) => {
        const key = item.createdAt.slice(0, 10)
        // Keep the latest entry for each day
        if (!map.has(key)) {
          map.set(key, item)
        }
      })
      journalMap.value = map
    }
  } catch {
    journalMap.value = new Map()
  }
  loading.value = false
}

function handleBack() {
  uni.navigateBack()
}

onMounted(() => {
  loadJournals()
})
</script>

<template>
  <view class="page" data-testid="calendar-page">
    <view class="nav-bar safe-area-top">
      <view class="nav-content">
        <text class="back-btn" data-testid="back-btn" @click="handleBack">返回</text>
        <text class="nav-title">情绪日历</text>
        <view class="nav-placeholder" />
      </view>
    </view>

    <view class="container">
      <!-- Month selector -->
      <view class="month-selector" data-testid="month-selector">
        <text class="arrow" @click="prevMonth">&#x3C;</text>
        <text class="month-title" data-testid="calendar-title">{{ calendarTitle }}</text>
        <text class="arrow" @click="nextMonth">&#x3E;</text>
      </view>

      <!-- Week headers -->
      <view class="week-header">
        <text
          v-for="day in weekDays"
          :key="day"
          class="week-day"
        >{{ day }}</text>
      </view>

      <!-- Calendar grid -->
      <view class="calendar-grid" data-testid="calendar-grid">
        <view
          v-for="(day, index) in calendarDays"
          :key="index"
          class="calendar-cell"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'has-journal': day.hasJournal
          }"
          :data-testid="day.isCurrentMonth ? `calendar-day-${day.date}` : undefined"
        >
          <text class="day-number">{{ day.date }}</text>
          <view
            v-if="day.emotionTag"
            class="emotion-dot"
            :style="{ backgroundColor: emotionColors[day.emotionTag] }"
            :data-testid="`emotion-dot-${day.date}`"
          />
        </view>
      </view>

      <!-- Emotion legend -->
      <view class="legend" data-testid="emotion-legend">
        <view
          v-for="(color, emotion) in emotionColors"
          :key="emotion"
          class="legend-item"
        >
          <view class="legend-dot" :style="{ backgroundColor: color }" />
          <text class="legend-text">{{ emotion }}</text>
        </view>
      </view>

      <!-- Monthly stats -->
      <view v-if="emotionStats.length === 0" class="empty-stats">
        <text class="empty-stats-text">本月还没有日记记录</text>
        <text class="empty-stats-sub">坚持记录，你会发现情绪的变化轨迹</text>
      </view>

      <view v-else class="stats-section" data-testid="monthly-stats">
        <text class="stats-title">本月主要情绪</text>
        <view class="stats-list">
          <view
            v-for="[emotion, count] in emotionStats"
            :key="emotion"
            class="stat-item"
          >
            <view
              class="stat-bar"
              :style="{ backgroundColor: emotionColors[emotion] + '30', borderColor: emotionColors[emotion] }"
            >
              <text class="stat-label">{{ emotionLabels[emotion] || emotion }}</text>
              <text class="stat-count">{{ count }}天</text>
            </view>
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

.month-selector {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-lg);
  margin-bottom: var(--space-lg);
}

.arrow {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
  padding: var(--space-sm);
  transition: color var(--duration-fast);
}

.arrow:active {
  color: var(--color-primary);
}

.month-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--color-text-primary);
  min-width: 140px;
  text-align: center;
  font-family: var(--font-serif);
  letter-spacing: 0.5px;
}

.week-header {
  display: flex;
  justify-content: space-around;
  margin-bottom: var(--space-sm);
}

.week-day {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  width: 36px;
  text-align: center;
  font-weight: 500;
}

.calendar-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-warm) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-md) var(--space-sm);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.calendar-cell {
  width: 14.28%;
  height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: var(--radius-md);
  transition: background var(--duration-fast);
}

.calendar-cell:active {
  background: var(--color-primary-soft);
}

.day-number {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

.calendar-cell.other-month .day-number {
  color: var(--color-text-tertiary);
}

.calendar-cell.today .day-number {
  color: var(--color-gold);
  font-weight: 600;
}

.emotion-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-top: 2px;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.1);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-top: var(--space-lg);
  padding: var(--space-md);
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-warm) 100%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(255, 255, 255, 0.1);
}

.legend-text {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.stats-section {
  margin-top: var(--space-lg);
  padding: var(--space-lg);
  background: linear-gradient(135deg, var(--color-surface) 0%, var(--color-surface-warm) 100%);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: var(--shadow-sm);
}

.stats-title {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--space-md);
  letter-spacing: 0.5px;
}

.stats-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  border-left: 3px solid;
  background: linear-gradient(135deg, var(--color-surface-warm) 0%, rgba(255, 255, 255, 0.02) 100%);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-primary);
  font-weight: 500;
}

.stat-count {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
}

.empty-stats {
  text-align: center;
  padding: var(--space-2xl) var(--space-lg);
  animation: fadeInUp 0.5s var(--ease-out) forwards;
}

.empty-stats-text {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: var(--space-sm);
  font-family: var(--font-serif);
}

.empty-stats-sub {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  display: block;
}
</style>
