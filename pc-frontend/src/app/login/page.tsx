'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { webLogin, webRegister } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function validate(): boolean {
    if (!email.trim()) {
      setError('请输入邮箱')
      return false
    }
    if (!email.includes('@')) {
      setError('邮箱格式不正确')
      return false
    }
    if (!password || password.length < 6) {
      setError('密码至少6位')
      return false
    }
    if (!isLoginMode && password !== confirmPassword) {
      setError('两次密码不一致')
      return false
    }
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setError('')
    setLoading(true)

    try {
      if (isLoginMode) {
        await webLogin(email.trim(), password)
      } else {
        await webRegister(email.trim(), password)
      }
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F0EB] flex items-center justify-center px-6">
      <div className="w-full max-w-md animate-fade-in-up">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-[#6B6560] hover:text-[#2C2420] transition-colors mb-8"
        >
          <span>←</span>
          <span>返回</span>
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h1
            className="text-3xl text-[#2C2420] mb-2"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {isLoginMode ? '欢迎回来' : '创建账户'}
          </h1>
          <p className="text-[#6B6560]">
            {isLoginMode ? '登录以继续你的书写旅程' : '注册开始记录你的故事'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl p-8 shadow-[0_1px_4px_rgba(44,36,32,0.05)]">
            {/* Email */}
            <div className="mb-5">
              <label className="block text-sm text-[#6B6560] mb-2">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setError('')
                }}
                placeholder="your@email.com"
                className="w-full h-12 px-4 bg-[#FAF6F1] border border-[#EBE7E2] rounded-xl text-[#2C2420] text-base placeholder-[#B5ADA5] focus:border-[#4A6352] transition-colors"
              />
            </div>

            {/* Password */}
            <div className="mb-5">
              <label className="block text-sm text-[#6B6560] mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                placeholder="至少6位"
                className="w-full h-12 px-4 bg-[#FAF6F1] border border-[#EBE7E2] rounded-xl text-[#2C2420] text-base placeholder-[#B5ADA5] focus:border-[#4A6352] transition-colors"
              />
            </div>

            {/* Confirm Password */}
            {!isLoginMode && (
              <div className="mb-5">
                <label className="block text-sm text-[#6B6560] mb-2">确认密码</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    setError('')
                  }}
                  placeholder="再次输入密码"
                  className="w-full h-12 px-4 bg-[#FAF6F1] border border-[#EBE7E2] rounded-xl text-[#2C2420] text-base placeholder-[#B5ADA5] focus:border-[#4A6352] transition-colors"
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-[#FCEAE8] rounded-xl p-3 mb-5">
                <p className="text-sm text-[#C45B4A]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 rounded-xl text-white font-medium transition-all duration-150 ${
                loading
                  ? 'bg-[#4A6352]/60 cursor-not-allowed'
                  : 'bg-[#4A6352] hover:bg-[#3A4F40] active:scale-[0.98]'
              }`}
            >
              {loading ? '处理中...' : isLoginMode ? '登录' : '注册'}
            </button>
          </div>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6">
          <span className="text-sm text-[#6B6560]">
            {isLoginMode ? '还没有账户？' : '已有账户？'}
          </span>
          <button
            onClick={() => {
              setIsLoginMode(!isLoginMode)
              setError('')
            }}
            className="text-sm text-[#4A6352] font-medium ml-1 hover:underline"
          >
            {isLoginMode ? '立即注册' : '直接登录'}
          </button>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[#B5ADA5] mt-10">
          你的隐私对我们很重要，数据将安全存储
        </p>
      </div>
    </div>
  )
}
