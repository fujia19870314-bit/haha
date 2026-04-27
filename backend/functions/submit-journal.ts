// 提交日记云函数

import type { ApiResponse, JournalEntry } from '../types/database';
import { db } from '../lib/database';
import { CrisisDetector } from '../lib/crisis-detector';
import { encryptToString } from '../lib/encryption';
import { getSystemPrompt, PromptTemplate } from '../lib/system-prompt';
import { QwenProvider } from '../lib/qwen-provider';

export interface SubmitJournalRequest {
  userId: string;
  content: string;
}

export interface JournalResponse {
  journal: JournalEntry;
  aiResponse: {
    content: string;
    model: string;
    provider: string;
  };
  crisisDetected: boolean;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  hotlines?: string[];
}

export class SubmitJournalHandler {
  private crisisDetector: CrisisDetector;
  private llmProvider: QwenProvider;

  constructor() {
    this.crisisDetector = new CrisisDetector();
    const apiKey = process.env.QWEN_API_KEY;
    if (!apiKey) {
      throw new Error('QWEN_API_KEY is required');
    }
    this.llmProvider = new QwenProvider({ apiKey });
  }

  /**
   * 提交日记主逻辑
   * 1. 危机检测
   * 2. 调用 AI
   * 3. 加密存储
   */
  async submitJournal(
    request: SubmitJournalRequest
  ): Promise<ApiResponse<JournalResponse>> {
    try {
      // 验证输入
      if (!request.content || request.content.trim() === '') {
        return {
          success: false,
          error: '日记内容不能为空'
        };
      }

      if (!request.userId) {
        return {
          success: false,
          error: 'userId 不能为空'
        };
      }

      // 检查用户是否存在
      const user = await db.getUserById(request.userId);
      if (!user) {
        return {
          success: false,
          error: '用户不存在'
        };
      }

      // 步骤 1：危机检测
      const crisisResult = await this.crisisDetector.detect(request.content);

      // 步骤 2：调用 AI 获取回复
      const aiResponse = await this.getAIResponse(
        request.content,
        crisisResult.riskLevel
      );

      // 步骤 3：加密存储
      const encryptionKey = process.env.ENCRYPTION_KEY;
      if (!encryptionKey) {
        throw new Error('ENCRYPTION_KEY is required');
      }
      const encryptedContent = encryptToString(request.content, encryptionKey);

      // 创建日记记录（仅存储加密内容，不存明文）
      const journal = await db.createJournal({
        userId: request.userId,
        encryptedContent,
        aiResponse: aiResponse.content,
        emotionTag: '', // 可以从 AI 回复中提取或后续分析
        crisisDetected: crisisResult.hasCrisis,
        crisisRiskLevel: crisisResult.riskLevel
      });

      // 准备响应
      const response: JournalResponse = {
        journal,
        aiResponse: {
          content: aiResponse.content,
          model: aiResponse.model,
          provider: aiResponse.provider
        },
        crisisDetected: crisisResult.hasCrisis,
        riskLevel: crisisResult.riskLevel
      };

      // 如果检测到危机，返回热线信息
      if (crisisResult.hasCrisis) {
        response.hotlines = this.crisisDetector.getHotlines();
      }

      return {
        success: true,
        data: response
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '提交日记失败'
      };
    }
  }

  /**
   * 获取 AI 回复
   */
  private async getAIResponse(
    content: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<{ content: string; model: string; provider: string }> {
    try {
      // 危机情况下使用特殊的 AI 回复
      if (riskLevel === 'high' || riskLevel === 'critical') {
        return {
          content: '听起来你现在非常痛苦，我很担心你。这样的想法一定让你承受了很大的压力。' +
            '你不是一个人，有很多人愿意帮助你。' +
            '如果你愿意，可以拨打心理援助热线寻求专业的支持。',
          model: 'crisis-response',
          provider: 'system'
        };
      }

      // 正常情况调用 LLM
      const systemPrompt = getSystemPrompt(PromptTemplate.DIARY_RESPONSE);
      const response = await this.llmProvider.chat({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content }
        ],
        temperature: 0.7,
        maxTokens: 500
      });

      return {
        content: response.content,
        model: response.model,
        provider: response.provider
      };
    } catch (error) {
      // LLM 调用失败时返回兜底回复
      return {
        content: '谢谢你愿意分享这些。你的感受很重要。',
        model: 'fallback',
        provider: 'system'
      };
    }
  }

  /**
   * 获取用户日记历史
   */
  async getJournalHistory(
    userId: string,
    limit = 20
  ): Promise<ApiResponse<JournalEntry[]>> {
    try {
      if (!userId) {
        return {
          success: false,
          error: 'userId 不能为空'
        };
      }

      const journals = await db.getJournalsByUserId(userId, limit);

      return {
        success: true,
        data: journals
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取日记历史失败'
      };
    }
  }
}

// 默认导出用于云函数
const handler = new SubmitJournalHandler();
export default handler;
