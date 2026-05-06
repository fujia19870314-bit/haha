'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PageLayout from '@/components/PageLayout'

export default function ResultPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('last_journal_result')
    if (stored) {
      try {
        setResult(JSON.parse(stored))
      } catch {
        // ignore
      }
    }
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[#F2EFEA] rounded"></div>
            <div className="h-32 bg-[#F2EFEA] rounded"></div>
          </div>
        </div>
      </PageLayout>
    )
  }

  if (!result) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto text-center py-20">
          <p className="text-[#6B6560]">没有找到日记记录</p>
          <Link href="/write" className="text-[#4A6352] hover:underline mt-4 inline-block">
            去写一篇日记
          </Link>
        </div>
      </PageLayout>
    )
  }

  const isCrisis = result.crisisDetected || result.riskLevel === 'high' || result.riskLevel === 'critical'

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        {/* Crisis Alert */}
        {isCrisis && (
          <div className="bg-[#FCEAE8] border border-[#E8B8B8] rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="text-[#C45B4A] font-medium mb-2">检测到较高的情绪风险</h3>
                <p className="text-sm text-[#6B6560] mb-3">
                  我们注意到你可能正在经历一些困难的时刻。如果你需要帮助，请不要犹豫。
                </p>
                {result.hotlines && result.hotlines.length > 0 && (
                  <div className="space-y-1">
                    {result.hotlines.map((hotline: string, i: number) => (
                      <p key={i} className="text-sm text-[#C45B4A] font-medium">{hotline}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Response */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_1px_4px_rgba(44,36,32,0.05)] mb-8">
          <div className="flex items-center gap-2 mb-6">
            <span className="text-2xl">🌿</span>
            <span className="text-sm text-[#9E9A93]">AI 回应</span>
          </div>

          <div
            className="text-[#2C2420] leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {result.aiResponse?.content || result.journal?.aiResponse}
          </div>

          {result.emotionTag || result.journal?.emotionTag && (
            <div className="mt-6 flex items-center gap-2">
              <span className="text-xs text-[#9E9A93]">检测到的情绪：</span>
              <span className="text-xs text-[#4A6352] bg-[#E8EDE9] px-3 py-1 rounded-full">
                {result.emotionTag || result.journal?.emotionTag}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Link
            href="/write"
            className="flex-1 py-3.5 bg-[#4A6352] text-white text-center rounded-2xl font-medium hover:bg-[#3A4F40] transition-colors"
          >
            再写一篇
          </Link>
          <Link
            href="/history"
            className="flex-1 py-3.5 bg-white border border-[#EBE7E2] text-[#2C2420] text-center rounded-2xl font-medium hover:bg-[#FAF6F1] transition-colors"
          >
            查看历史
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}
