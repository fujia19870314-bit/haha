const BASE_URL = '/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface DailyPrompt {
  prompt: string
  theme: string
}

interface JournalSubmission {
  userId: string
  mood: string
  content: string
}

interface JournalResponse {
  journal: {
    id: string
    encryptedContent: string
    aiResponse: string
    emotionTag: string
    crisisDetected: boolean
    crisisRiskLevel: 'low' | 'medium' | 'high' | 'critical'
    createdAt: string
  }
  aiResponse: {
    content: string
    model: string
    provider: string
  }
  crisisDetected: boolean
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  hotlines?: string[]
}

interface PayOrderResponse {
  prepayId: string
  paySign: string
  timeStamp: string
  nonceStr: string
  package: string
  signType: string
}

interface JournalHistoryItem {
  id: string
  aiResponse: string
  emotionTag: string
  crisisDetected: boolean
  createdAt: string
}

interface TherapistItem {
  id: string
  name: string
  title: string
  city: string
  specialties: string[]
  phone?: string
  platformUrl?: string
  isVerified: boolean
}

interface ResourcesResponse {
  therapists: TherapistItem[]
  hotlines: string[]
  fallbackMessage?: string
}

interface PdfExportResponse {
  downloadUrl: string
  fileName: string
  pageCount: number
  generatedAt: string
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return '请求失败'
}

async function request<T>(
  url: string,
  method: 'GET' | 'POST',
  data?: unknown
): Promise<T> {
  const res = await uni.request({
    url: `${BASE_URL}${url}`,
    method,
    data,
    header: { 'Content-Type': 'application/json' }
  }) as any

  const body: ApiResponse<T> = res.data

  if (!body.success) {
    throw new Error(body.error || '请求失败')
  }

  if (body.data === undefined) {
    throw new Error('响应数据为空')
  }

  return body.data
}

export async function getDailyPrompt(): Promise<DailyPrompt> {
  return request<DailyPrompt>('/get-daily-prompt', 'GET')
}

export async function submitJournal(
  payload: JournalSubmission
): Promise<JournalResponse> {
  if (!payload.mood || payload.mood.trim().length === 0) {
    throw new Error('请先选择情绪')
  }
  if (!payload.content || payload.content.trim().length === 0) {
    throw new Error('请填写内容')
  }
  return request<JournalResponse>('/submit-journal', 'POST', payload)
}

export async function createWechatPayOrder(
  amount: number
): Promise<PayOrderResponse> {
  if (!amount || amount <= 0) {
    throw new Error('金额无效')
  }
  return request<PayOrderResponse>('/wechat-pay', 'POST', { amount })
}

export async function getJournalHistory(userId: string): Promise<JournalHistoryItem[]> {
  if (!userId) {
    throw new Error('userId 不能为空')
  }
  return request<JournalHistoryItem[]>(`/journal-history?userId=${userId}`, 'GET')
}

export async function getResources(city?: string): Promise<ResourcesResponse> {
  const url = city ? `/get-resources?city=${encodeURIComponent(city)}` : '/get-resources'
  return request<ResourcesResponse>(url, 'GET')
}

export async function generatePdf(userId: string): Promise<PdfExportResponse> {
  if (!userId) {
    throw new Error('userId 不能为空')
  }
  return request<PdfExportResponse>('/generate-pdf', 'POST', { userId })
}
