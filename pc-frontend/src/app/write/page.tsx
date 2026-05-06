'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PageLayout from '@/components/PageLayout'
import { submitJournal, getCurrentUserId } from '@/lib/api'

const moodTags = [
  { name: '悲伤', color: '#4A7C9B', bgColor: '#E8F1F8', borderColor: '#B8D4E8' },
  { name: '愤怒', color: '#B85C5C', bgColor: '#F8E8E8', borderColor: '#E8B8B8' },
  { name: '内疚', color: '#7A7A7A', bgColor: '#F0F0F0', borderColor: '#D0D0D0' },
  { name: '思念', color: '#8B7B8B', bgColor: '#F0ECF0', borderColor: '#D8D0D8' },
  { name: '平静', color: '#5A8B6A', bgColor: '#E8F0EC', borderColor: '#B8D8C8' },
  { name: '混乱', color: '#B89B5C', bgColor: '#F8F0E0', borderColor: '#E8D8B0' },
  { name: '温暖', color: '#D4A574', bgColor: '#F8F0E8', borderColor: '#E8D8C0' },
  { name: '焦虑', color: '#C9A959', bgColor: '#F8F4E0', borderColor: '#E8DCB0' },
  { name: '麻木', color: '#9B8B9B', bgColor: '#F0ECF0', borderColor: '#D8D0D8' }
]

export default function WritePage() {
  const router = useRouter()
  const [selectedMood, setSelectedMood] = useState('')
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const maxLength = 2000

  const charCount = content.length

  async function handleSubmit() {
    if (!selectedMood) {
      setError('请先选择一种情绪')
      return
    }
    if (!content.trim()) {
      setError('请写下你的感受')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      const result = await submitJournal({
        userId: getCurrentUserId() || 'anonymous',
        mood: selectedMood,
        content: content.trim()
      })

      // Store result and redirect
      localStorage.setItem('last_journal_result', JSON.stringify(result))
      router.push('/result')
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
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
            写日记
          </h1>
          <p className="text-[#6B6560] mt-1">记录此刻的心情与思考</p>
        </div>

        {/* Mood Selection */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_1px_4px_rgba(44,36,32,0.05)] mb-6">
          <h2 className="text-[#2C2420] font-medium mb-4">此刻的感受</h2>
          <div className="flex flex-wrap gap-3">
            {moodTags.map((tag) => (
              <button
                key={tag.name}
                onClick={() => {
                  setSelectedMood(tag.name)
                  setError('')
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-150 border-2 ${
                  selectedMood === tag.name
                    ? 'border-current'
                    : 'border-[#EBE7E2] hover:border-[#D4D0CB]'
                }`}
                style={{
                  color: tag.color,
                  backgroundColor: selectedMood === tag.name ? tag.bgColor : 'white',
                  borderColor: selectedMood === tag.name ? tag.borderColor : undefined
                }}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </div>

        {/* Writing Area */}
        <div className="bg-white rounded-3xl p-8 shadow-[0_1px_4px_rgba(44,36,32,0.05)] mb-6">
          <h2 className="text-[#2C2420] font-medium mb-4">写下想说的话</h2>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value.slice(0, maxLength))
              setError('')
            }}
            placeholder="这里很安全，想写什么都可以..."
            className="w-full min-h-[240px] p-4 bg-[#FAF6F1] border border-[#EBE7E2] rounded-2xl text-[#2C2420] text-base leading-relaxed resize-y focus:border-[#4A6352] transition-colors"
            style={{ fontFamily: 'var(--font-serif)' }}
          />
          <div className="flex justify-end mt-3">
            <span className={`text-xs ${charCount > 1800 ? 'text-[#C45B4A]' : 'text-[#9E9A93]'}`}>
              {charCount} / {maxLength}
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-[#FCEAE8] rounded-xl p-4 mb-6 animate-fade-in-down">
            <p className="text-sm text-[#C45B4A]">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`w-full py-4 rounded-2xl text-white font-medium text-base transition-all duration-150 ${
            isSubmitting
              ? 'bg-[#4A6352]/60 cursor-not-allowed'
              : 'bg-[#4A6352] hover:bg-[#3A4F40] active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? '正在回应...' : '完成书写'}
        </button>
      </div>
    </PageLayout>
  )
}
