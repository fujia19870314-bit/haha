const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export interface DailyPrompt {
  prompt: string
  theme: string
}

export interface JournalSubmission {
  userId: string
  mood: string
  content: string
}

export interface JournalResponse {
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

export interface JournalHistoryItem {
  id: string
  aiResponse: string
  emotionTag: string
  crisisDetected: boolean
  createdAt: string
}

export interface AuthResponse {
  token: string
  userId: string
}

async function httpRequest<T>(
  url: string,
  method: 'GET' | 'POST' = 'GET',
  data?: unknown
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined
  })

  const body: ApiResponse<T> = await res.json()

  if (!body.success) {
    if (body.code === 'UNAUTHORIZED') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token')
        localStorage.removeItem('userId')
        window.location.href = '/login'
      }
    }
    throw new Error(body.error || '请求失败')
  }

  if (body.data === undefined) {
    throw new Error('响应数据为空')
  }

  return body.data
}

export async function getDailyPrompt(): Promise<DailyPrompt> {
  return httpRequest<DailyPrompt>('/get-daily-prompt', 'GET')
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
  return httpRequest<JournalResponse>('/submit-journal', 'POST', payload)
}

export async function getJournalHistory(userId: string): Promise<JournalHistoryItem[]> {
  if (!userId) {
    throw new Error('userId 不能为空')
  }
  return httpRequest<JournalHistoryItem[]>(`/journal-history?userId=${userId}`, 'GET')
}

export async function webLogin(email: string, password: string): Promise<AuthResponse> {
  const result = await httpRequest<AuthResponse>('/web-auth/login', 'POST', { email, password })
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', result.token)
    localStorage.setItem('userId', result.userId)
  }
  return result
}

export async function webRegister(email: string, password: string): Promise<AuthResponse> {
  const result = await httpRequest<AuthResponse>('/web-auth/register', 'POST', { email, password })
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', result.token)
    localStorage.setItem('userId', result.userId)
  }
  return result
}

export function getAuthToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token')
  }
  return null
}

export function getCurrentUserId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId')
  }
  return null
}

export function isLoggedIn(): boolean {
  return !!getAuthToken()
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    window.location.href = '/login'
  }
}
