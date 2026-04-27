// LLM 抽象层 - 类型定义

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  model?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  /**
   * 发送聊天请求
   */
  chat(request: LLMRequest): Promise<LLMResponse>;

  /**
   * 测试连接
   */
  ping(): Promise<boolean>;

  /**
   * 获取提供商名称
   */
  getName(): string;
}

// 危机检测结果
export interface CrisisDetectionResult {
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  detectedKeywords: string[];
  semanticScore: number; // 0-1，越高越危险
  hasCrisis: boolean;
}
