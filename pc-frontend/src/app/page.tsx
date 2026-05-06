'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import { getDailyPrompt, isLoggedIn, getCurrentUserId } from '@/lib/api'

export default function Home() {
  const [prompt, setPrompt] = useState<{ prompt: string; theme: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCrisisBanner, setShowCrisisBanner] = useState(true)
  const [daysCount, setDaysCount] = useState(0)
  const loggedIn = isLoggedIn()

  useEffect(() => {
    // Load onboarding data from localStorage
    const stored = localStorage.getItem('onboarding')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.completedAt) {
          const start = new Date(data.completedAt)
          const now = new Date()
          setDaysCount(Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
        }
      } catch {
        // ignore
      }
    }

    fetchDailyPrompt()
  }, [])

  async function fetchDailyPrompt() {
    try {
      const data = await getDailyPrompt()
      setPrompt(data)
    } catch {
      setPrompt({ prompt: '今天过得怎么样？想写什么都可以。', theme: '日常' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        {/* Crisis Banner */}
        {showCrisisBanner && (
          <div className="bg-[#FDF6F0] border border-[#F0E6DC] rounded-2xl p-5 mb-8 animate-fade-in-down">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#6B6560]">
                如果你感到难以承受，这里有人可以帮助你
              </p>
              <div className="flex items-center gap-4">
                <Link href="/crisis"
                  className="text-sm text-[#C45B4A] font-medium hover:underline"
                >
                  我需要帮助
                </Link>
                <button
                  onClick={() => setShowCrisisBanner(false)}
                  className="text-xs text-[#9E9A93] hover:text-[#6B6560]"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Memorial Nudge */}
        <div className="mb-10 py-6">
          <h1
            className="text-2xl sm:text-3xl text-[#2C2420] leading-relaxed"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {daysCount > 0 ? (
              <>
                你与逝去之人的故事，已经延续了<span className="text-[#4A6352]">{daysCount}</span>天
              </>
            ) : (
              '欢迎来到哀伤日记，今天是一个新的开始'
            )}
          </h1>
        </div>

        {/* Today's Prompt */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_1px_4px_rgba(44,36,32,0.05)] mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-[#9E9A93] uppercase tracking-wider">今日引导</span>
            {prompt?.theme && (
              <span className="text-xs text-[#4A6352] bg-[#E8EDE9] px-3 py-1 rounded-full">
                {prompt.theme}
              </span>
            )}
          </div>

          {loading ? (
            <div className="h-8 bg-[#F2EFEA] rounded animate-pulse"></div>
          ) : (
            <p
              className="text-lg sm:text-xl text-[#2C2420] leading-relaxed mb-6"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {prompt?.prompt || '今天过得怎么样？想写什么都可以。'}
            </p>
          )}

          <div className="h-px bg-[#EBE7E2] mb-4"></div>

          <Link
            href="/write"
            className="flex items-center justify-between group py-2"
          >
            <span className="text-[#4A6352] font-medium group-hover:text-[#3A4F40] transition-colors">
              开始书写
            </span>
            <span className="text-[#4A6352] text-lg group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {/* Features Grid */}
        {!loggedIn && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/login"
              className="bg-[#FFFCF8] border border-[#EBE7E2] rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">🔐</div>
              <h3 className="text-[#2C2420] font-medium mb-1">登录账户</h3>
              <p className="text-sm text-[#6B6560]">保存你的日记，随时随地回顾</p>
            </Link>
            <Link href="/write"
              className="bg-[#FFFCF8] border border-[#EBE7E2] rounded-2xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="text-2xl mb-2">✍️</div>
              <h3 className="text-[#2C2420] font-medium mb-1">匿名书写</h3>
              <p className="text-sm text-[#6B6560]">无需登录，立即开始你的第一篇日记</p>
            </Link>
          </div>
        )}
      </div>
    </PageLayout>
  )
}
