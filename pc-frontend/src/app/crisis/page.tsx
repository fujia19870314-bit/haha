'use client'

import Link from 'next/link'
import PageLayout from '@/components/PageLayout'

const hotlines = [
  { name: '北京心理危机研究与干预中心', phone: '010-82951332' },
  { name: '上海市精神卫生中心', phone: '021-12320' },
  { name: '广东省心理援助热线', phone: '020-81899120' },
  { name: '全国24小时心理援助热线', phone: '400-161-9995' },
]

const resources = [
  {
    title: '如果你现在有伤害自己的想法',
    content: '请不要一个人承受。请立即拨打上面的热线电话，或者联系你信任的人。你的生命很珍贵，有人愿意倾听你、陪伴你。'
  },
  {
    title: '关于哀伤',
    content: '失去挚爱是人生中最痛苦的经历之一。感到悲伤、愤怒、内疚、甚至麻木都是正常的反应。每个人走过哀伤的路都不同，没有"正确"的方式。'
  },
  {
    title: '什么时候需要专业帮助',
    content: '如果你发现自己持续数周无法入睡、无法进食、无法工作或学习，或者有伤害自己的想法，请寻求专业的心理帮助。这不是软弱，而是对自己的关爱。'
  }
]

export default function CrisisPage() {
  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto animate-fade-in-up">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-[#6B6560] hover:text-[#2C2420] transition-colors mb-4"
          >
            <span>←</span>
            <span>返回</span>
          </Link>
          <h1
            className="text-2xl text-[#2C2420] font-medium"
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            危机帮助资源
          </h1>
          <p className="text-[#6B6560] mt-1">你不必独自面对，有人愿意帮助你</p>
        </div>

        {/* Hotlines */}
        <div className="bg-[#FCEAE8] border border-[#E8B8B8] rounded-2xl p-6 mb-6">
          <h2 className="text-[#C45B4A] font-medium mb-4 flex items-center gap-2">
            <span>📞</span>
            紧急求助热线
          </h2>
          <div className="space-y-3">
            {hotlines.map((hotline) => (
              <div
                key={hotline.phone}
                className="flex items-center justify-between bg-white rounded-xl p-4"
              >
                <div>
                  <p className="text-sm text-[#2C2420] font-medium">{hotline.name}</p>
                </div>
                <a
                  href={`tel:${hotline.phone}`}
                  className="text-[#C45B4A] font-medium hover:underline"
                >
                  {hotline.phone}
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="space-y-4">
          {resources.map((resource) => (
            <div
              key={resource.title}
              className="bg-white rounded-2xl p-6 shadow-[0_1px_4px_rgba(44,36,32,0.05)]"
            >
              <h3 className="text-[#2C2420] font-medium mb-2">{resource.title}</h3>
              <p className="text-sm text-[#6B6560] leading-relaxed">{resource.content}</p>
            </div>
          ))}
        </div>
      </div>
    </PageLayout>
  )
}
