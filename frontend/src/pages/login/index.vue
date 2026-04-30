<script setup lang="ts">
import { ref } from 'vue'
import { webLogin, webRegister } from '../../services/auth.js'
import { isWeb } from '../../services/platform.js'

const isLoginMode = ref(true)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const errorMsg = ref('')

// Web 平台才显示此页面
if (!isWeb()) {
  uni.switchTab({ url: '/pages/home/index' })
}

function toggleMode() {
  isLoginMode.value = !isLoginMode.value
  errorMsg.value = ''
}

function validate(): boolean {
  if (!email.value.trim()) {
    errorMsg.value = '请输入邮箱'
    return false
  }
  if (!email.value.includes('@')) {
    errorMsg.value = '邮箱格式不正确'
    return false
  }
  if (!password.value || password.value.length < 6) {
    errorMsg.value = '密码至少6位'
    return false
  }
  if (!isLoginMode.value && password.value !== confirmPassword.value) {
    errorMsg.value = '两次密码不一致'
    return false
  }
  errorMsg.value = ''
  return true
}

async function handleSubmit() {
  if (!validate()) return
  loading.value = true

  try {
    if (isLoginMode.value) {
      await webLogin(email.value.trim(), password.value)
    } else {
      await webRegister(email.value.trim(), password.value)
    }
    uni.switchTab({ url: '/pages/home/index' })
  } catch (err: any) {
    errorMsg.value = err.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}

function goBack() {
  uni.navigateBack()
}
</script>

<template>
  <view class="page">
    <view class="container">
      <!-- 返回按钮 -->
      <view class="back-btn" @click="goBack">
        <text class="back-arrow">←</text>
        <text class="back-text">返回</text>
      </view>

      <!-- 标题区 -->
      <view class="header">
        <text class="title">{{ isLoginMode ? '欢迎回来' : '创建账户' }}</text>
        <text class="subtitle">
          {{ isLoginMode ? '登录以继续你的书写旅程' : '注册开始记录你的故事' }}
        </text>
      </view>

      <!-- 表单 -->
      <view class="form-card">
        <view class="input-group">
          <text class="input-label">邮箱</text>
          <input
            v-model="email"
            class="input"
            type="text"
            placeholder="your@email.com"
            placeholder-class="input-placeholder"
          />
        </view>

        <view class="input-group">
          <text class="input-label">密码</text>
          <input
            v-model="password"
            class="input"
            type="password"
            placeholder="至少6位"
            placeholder-class="input-placeholder"
          />
        </view>

        <view v-if="!isLoginMode" class="input-group">
          <text class="input-label">确认密码</text>
          <input
            v-model="confirmPassword"
            class="input"
            type="password"
            placeholder="再次输入密码"
            placeholder-class="input-placeholder"
          />
        </view>

        <!-- 错误提示 -->
        <view v-if="errorMsg" class="error-banner">
          <text class="error-text">{{ errorMsg }}</text>
        </view>

        <!-- 提交按钮 -->
        <view
          class="submit-btn"
          :class="{ disabled: loading }"
          @click="handleSubmit"
        >
          <text v-if="!loading" class="submit-text">
            {{ isLoginMode ? '登录' : '注册' }}
          </text>
          <text v-else class="submit-text">处理中...</text>
        </view>
      </view>

      <!-- 切换模式 -->
      <view class="toggle-section">
        <text class="toggle-text">
          {{ isLoginMode ? '还没有账户？' : '已有账户？' }}
        </text>
        <text class="toggle-link" @click="toggleMode">
          {{ isLoginMode ? '立即注册' : '直接登录' }}
        </text>
      </view>

      <!-- 底部提示 -->
      <view class="footer">
        <text class="footer-text">你的隐私对我们很重要，数据将安全存储</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background-color: var(--color-bg);
}

.container {
  padding: var(--space-xl);
  max-width: 480px;
  margin: 0 auto;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-md) 0;
  margin-bottom: var(--space-lg);
}

.back-arrow {
  font-size: var(--text-lg);
  color: var(--color-text-secondary);
}

.back-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.header {
  margin-bottom: var(--space-2xl);
}

.title {
  font-size: var(--text-2xl);
  font-family: var(--font-serif);
  color: var(--color-text-primary);
  display: block;
  margin-bottom: var(--space-sm);
}

.subtitle {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  display: block;
}

.form-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
  margin-bottom: var(--space-xl);
}

.input-group {
  margin-bottom: var(--space-lg);
}

.input-group:last-of-type {
  margin-bottom: var(--space-md);
}

.input-label {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  display: block;
  margin-bottom: var(--space-sm);
}

.input {
  width: 100%;
  height: 48px;
  padding: 0 var(--space-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  background: var(--color-surface-warm);
  box-sizing: border-box;
}

.input:focus {
  border-color: var(--color-border-focus);
  outline: none;
}

.input-placeholder {
  color: var(--color-text-muted);
}

.error-banner {
  background: var(--color-crisis-light);
  border-radius: var(--radius-sm);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-lg);
}

.error-text {
  font-size: var(--text-sm);
  color: var(--color-crisis);
}

.submit-btn {
  width: 100%;
  height: 48px;
  background: var(--color-primary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity var(--duration-fast);
}

.submit-btn.disabled {
  opacity: 0.6;
}

.submit-text {
  font-size: var(--text-base);
  color: var(--color-text-on-primary);
  font-weight: 500;
}

.toggle-section {
  text-align: center;
  margin-bottom: var(--space-2xl);
}

.toggle-text {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.toggle-link {
  font-size: var(--text-sm);
  color: var(--color-primary);
  font-weight: 500;
  margin-left: var(--space-xs);
}

.footer {
  text-align: center;
  padding-bottom: var(--space-xl);
}

.footer-text {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
</style>
