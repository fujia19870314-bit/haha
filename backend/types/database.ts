// 数据库类型定义

export interface User {
  id: string;
  // 微信用户字段
  openid?: string;
  unionid?: string;
  nickname?: string;
  avatar?: string;
  // Web 用户字段
  email?: string;
  passwordHash?: string;
  // 通用字段
  griefStage: GriefStage;
  isPremium: boolean;
  trialEndsAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type GriefStage = 'denial' | 'anger' | 'bargaining' | 'depression' | 'acceptance';

export interface JournalEntry {
  id: string;
  userId: string;
  encryptedContent: string;
  aiResponse: string;
  emotionTag: string;
  crisisDetected: boolean;
  crisisRiskLevel: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  updatedAt: Date;
}

export interface PromptTemplate {
  id: string;
  stage: GriefStage;
  content: string;
  isAnniversary: boolean;
  createdAt: Date;
}

export interface PaymentOrder {
  id: string;
  userId: string;
  orderNo: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  prepayId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Therapist {
  id: string;
  name: string;
  title: string;
  city: string;
  specialties: string[];
  phone?: string;
  platformUrl?: string;
  isVerified: boolean;
  createdAt: Date;
}

// API 响应格式
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 云函数事件类型
export interface CloudFunctionEvent {
  headers: Record<string, string>;
  body: string;
  queryStringParameters: Record<string, string>;
  requestContext: {
    http: {
      method: string;
      path: string;
    };
  };
}
