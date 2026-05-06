'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'
import { getJournalHistory, getCurrentUserId, isLoggedIn } from '@/lib/api'

interface HistoryItem {
  id: string
  aiResponse: string
  emotionTag: string
  crisisDetected: boolean
  createdAt: string
}

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

export default function HistoryPage() {
  const [historyList, setHistoryList] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const loggedIn = isLoggedIn()

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    if (!loggedIn) {
      setLoading(false)
      return
    }

    try {
      const data = await getJournalHistory(getCurrentUserId() || '')
      setHistoryList(data)
    } catch {
      setHistoryList([])
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  function formatTime(dateStr: string): string {
    const date = new Date(dateStr)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl text-[#2C2420] font-medium"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            回顾
          </h1>
          <p className="text-[#6B6560] mt-1">
            {historyList.length > 0
              ? `共 ${historyList.length} 篇日记`
              : '记录你的每一次书写'}
          </p>
        </div>

        {/* Not Logged In */}
        {!loggedIn && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-[0_1px_4px_rgba(44,36,32,0.05)]">
            <div className="text-5xl mb-4">🔒</div>
            <h2 className="text-xl text-[#2C2420] mb-2">登录后查看历史</h2>
            <p className="text-[#6B6560] mb-6">登录账户后，你可以查看所有已保存的日记</p>
            <Link
              href="/login"
              className="inline-block px-8 py-3 bg-[#4A6352] text-white rounded-2xl font-medium hover:bg-[#3A4F40] transition-colors"
            >
              立即登录
            </Link>
          </div>
        )}

        {/* Empty State */}
        {loggedIn && !loading && historyList.length === 0 && (
          <div className="bg-white rounded-3xl p-12 text-center shadow-[0_1px_4px_rgba(44,36,32,0.05)]">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl text-[#2C2420] mb-2">这里还空空如也</h2>
            <p className="text-[#6B6560] mb-6">每一篇日记都是一次与自己对话的开始</p>
            <Link
              href="/write"
              className="inline-block px-8 py-3 bg-[#4A6352] text-white rounded-2xl font-medium hover:bg-[#3A4F40] transition-colors"
            >
              写下第一篇日记
            </Link>
          </div>
        )}

        {/* History List */}
        {loggedIn && historyList.length > 0 && (
          <div className="space-y-4">
            {historyList.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.05)] hover:shadow-md transition-shadow cursor-pointer"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[#2C2420] font-medium">
                      {formatDate(item.createdAt)}
                    </span>
                    <span className="text-xs text-[#9E9A93]">
                      {formatTime(item.createdAt)}
                    </span>
                  </div>
                  {item.emotionTag && (
                    <span
                      className="text-xs font-medium px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: (emotionColors[item.emotionTag] || '#4A6352') + '20',
                        color: emotionColors[item.emotionTag] || '#4A6352'
                      }}
                    >
                      {item.emotionTag}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#6B6560] leading-relaxed line-clamp-2">
                  {item.aiResponse.slice(0, 100)}...
                </p>
                {item.crisisDetected && (
                  <div className="mt-3 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#C45B4A]"></span>
                    <span className="text-xs text-[#C45B4A]">检测到情绪危机</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}
