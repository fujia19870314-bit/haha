import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getDailyPrompt,
  submitJournal,
  createWechatPayOrder,
  getJournalHistory,
  getResources,
  generatePdf
} from '../../src/services/api'

describe('services/api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getDailyPrompt', () => {
    it('应调用 uni.request 并返回提示数据', async () => {
      vi.mocked(uni.request).mockResolvedValueOnce({
        data: {
          success: true,
          data: { prompt: '今天想对TA说些什么？', theme: '思念' }
        }
      } as any)

      const result = await getDailyPrompt()
      expect(uni.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('get-daily-prompt'),
          method: 'GET'
        })
      )
      expect(result).toEqual({ prompt: '今天想对TA说些什么？', theme: '思念' })
    })

    it('API 返回失败时应抛出错误', async () => {
      vi.mocked(uni.request).mockResolvedValueOnce({
        data: { success: false, error: '服务异常' }
      } as any)

      await expect(getDailyPrompt()).rejects.toThrow('服务异常')
    })

    it('网络异常时应抛出错误', async () => {
      vi.mocked(uni.request).mockRejectedValueOnce(new Error('network'))

      await expect(getDailyPrompt()).rejects.toThrow()
    })
  })

  describe('submitJournal', () => {
    it('应调用 uni.request 并返回 AI 回应', async () => {
      vi.mocked(uni.request).mockResolvedValueOnce({
        data: {
          success: true,
          data: { response: '我理解你', suggestions: ['深呼吸'] }
        }
      } as any)

      const result = await submitJournal({
        userId: 'test',
        mood: '悲伤',
        content: '今天很难过'
      })

      expect(uni.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('submit-journal'),
          method: 'POST',
          data: { userId: 'test', mood: '悲伤', content: '今天很难过' }
        })
      )
      expect(result).toEqual({ response: '我理解你', suggestions: ['深呼吸'] })
    })

    it('内容为空时应抛出验证错误', async () => {
      await expect(submitJournal({ userId: 'test', mood: '悲伤', content: '' })).rejects.toThrow('内容')
    })

    it('情绪为空时应抛出验证错误', async () => {
      await expect(submitJournal({ userId: 'test', mood: '', content: '内容' })).rejects.toThrow('情绪')
    })
  })

  describe('createWechatPayOrder', () => {
    it('应调用 uni.request 并返回支付参数', async () => {
      vi.mocked(uni.request).mockResolvedValueOnce({
        data: {
          success: true,
          data: { prepayId: 'xxx', paySign: 'sign' }
        }
      } as any)

      const result = await createWechatPayOrder(19.9)
      expect(uni.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('wechat-pay'),
          method: 'POST',
          data: { amount: 19.9 }
        })
      )
      expect(result).toEqual({ prepayId: 'xxx', paySign: 'sign' })
    })

    it('金额无效时应抛出验证错误', async () => {
      await expect(createWechatPayOrder(0)).rejects.toThrow('金额')
      await expect(createWechatPayOrder(-1)).rejects.toThrow('金额')
    })

    it('API 返回失败时应抛出错误', async () => {
      vi.mocked(uni.request).mockResolvedValueOnce({
        data: { success: false, error: '创建订单失败' }
      } as any)

      await expect(createWechatPayOrder(19.9)).rejects.toThrow('创建订单失败')
    })
  })

  describe('getJournalHistory', () => {
    it('应调用 uni.request 并返回历史记录', async () => {
      vi.mocked(uni.request).mockResolvedValueOnce({
        data: {
          success: true,
          data: [
            { id: '1', aiResponse: '回应1', emotionTag: '悲伤', createdAt: '2024-01-01' }
          ]
        }
      } as any)

      const result = await getJournalHistory('user_123')
      expect(uni.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('journal-history?userId=user_123'),
          method: 'GET'
        })
      )
      expect(result.length).toBe(1)
      expect(result[0].emotionTag).toBe('悲伤')
    })

    it('空 userId 应抛出验证错误', async () => {
      await expect(getJournalHistory('')).rejects.toThrow('userId')
    })

    it('API 失败时应抛出错误', async () => {
      vi.mocked(uni.request).mockResolvedValueOnce({
        data: { success: false, error: '查询失败' }
      } as any)

      await expect(getJournalHistory('user_123')).rejects.toThrow('查询失败')
    })
  })

  describe('getResources', () => {
    it('应返回咨询师和热线列表', async () => {
      vi.mocked(uni.request).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            therapists: [{ id: 't1', name: '张医生', title: '咨询师', city: '北京', specialties: ['哀伤辅导'], isVerified: true }],
            hotlines: ['400-161-9995']
          }
        }
      } as any)

      const result = await getResources()
      expect(result.therapists.length).toBeGreaterThan(0)
      expect(result.hotlines.length).toBeGreaterThan(0)
    })

    it('按城市筛选应传递 city 参数', async () => {
      vi.mocked(uni.request).mockResolvedValueOnce({
        data: {
          success: true,
          data: { therapists: [], hotlines: [] }
        }
      } as any)

      await getResources('上海')
      expect(uni.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('city=%E4%B8%8A%E6%B5%B7')
        })
      )
    })
  })

  describe('generatePdf', () => {
    it('应调用 uni.request 并返回下载信息', async () => {
      vi.mocked(uni.request).mockResolvedValueOnce({
        data: {
          success: true,
          data: {
            downloadUrl: '/download/test.pdf',
            fileName: '纪念册_test.pdf',
            pageCount: 3,
            generatedAt: '2024-01-01'
          }
        }
      } as any)

      const result = await generatePdf('user_123')
      expect(uni.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining('generate-pdf'),
          method: 'POST',
          data: { userId: 'user_123' }
        })
      )
      expect(result.fileName).toContain('.pdf')
      expect(result.pageCount).toBe(3)
    })

    it('空 userId 应抛出验证错误', async () => {
      await expect(generatePdf('')).rejects.toThrow('userId')
    })

    it('API 失败时应抛出错误', async () => {
      vi.mocked(uni.request).mockResolvedValueOnce({
        data: { success: false, error: '暂无日记' }
      } as any)

      await expect(generatePdf('user_123')).rejects.toThrow('暂无日记')
    })
  })
})
