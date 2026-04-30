// 获取每日反思提示云函数

import type { ApiResponse, PromptTemplate, GriefStage } from '../types/database.js';
import { db } from '../lib/database.js';

export interface GetDailyPromptRequest {
  userId: string;
  isAnniversary?: boolean;
  anniversaryDate?: string;
  forceStage?: GriefStage;
}

export class DailyPromptHandler {
  /**
   * 获取每日反思提示
   */
  async getDailyPrompt(
    request: GetDailyPromptRequest
  ): Promise<ApiResponse<PromptTemplate>> {
    try {
      // 验证输入
      if (!request.userId || request.userId.trim() === '') {
        return {
          success: false,
          error: 'userId 不能为空'
        };
      }

      // 获取用户信息
      const user = await db.getUserById(request.userId);
      if (!user) {
        return {
          success: false,
          error: '用户不存在'
        };
      }

      // 确定使用的哀伤阶段
      const targetStage = request.forceStage || user.griefStage;
      const isAnniversary = request.isAnniversary || false;

      // 获取对应阶段的提示词
      let prompts = await db.getPromptsByStage(targetStage, isAnniversary);

      // 降级策略：如果当前阶段没有提示词，尝试使用 acceptance 阶段
      if (prompts.length === 0 && targetStage !== 'acceptance') {
        prompts = await db.getPromptsByStage('acceptance', isAnniversary);
      }

      // 如果还是没有，使用默认提示词
      if (prompts.length === 0) {
        return {
          success: true,
          data: {
            id: 'default',
            stage: targetStage,
            content: this.getDefaultPrompt(targetStage, isAnniversary),
            isAnniversary,
            createdAt: new Date()
          }
        };
      }

      // 随机选择一个提示词
      const selectedPrompt = this.selectRandomPrompt(prompts);

      return {
        success: true,
        data: selectedPrompt
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取每日提示失败'
      };
    }
  }

  /**
   * 获取指定阶段的所有提示词
   */
  async getAllPrompts(
    stage: GriefStage,
    isAnniversary = false
  ): Promise<ApiResponse<PromptTemplate[]>> {
    try {
      const prompts = await db.getPromptsByStage(stage, isAnniversary);

      return {
        success: true,
        data: prompts
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取提示词列表失败'
      };
    }
  }

  /**
   * 随机选择提示词
   */
  selectRandomPrompt(prompts: PromptTemplate[]): PromptTemplate {
    if (prompts.length === 0) {
      throw new Error('No prompts available');
    }

    const randomIndex = Math.floor(Math.random() * prompts.length);
    return prompts[randomIndex];
  }

  /**
   * 获取默认提示词
   */
  private getDefaultPrompt(stage: GriefStage, isAnniversary: boolean): string {
    if (isAnniversary) {
      return '今天是特别的日子。你想对他/她说些什么？';
    }

    const defaultPrompts: Record<GriefStage, string> = {
      denial: '今天有什么让你想起他/她的事情吗？',
      anger: '今天有什么情绪想要表达吗？',
      bargaining: '如果还有一次机会，你会想做什么？',
      depression: '可以和我说说你心里的感受吗？',
      acceptance: '今天想起他/她的时候，有什么温暖的回忆吗？'
    };

    return defaultPrompts[stage] || defaultPrompts.acceptance;
  }
}

// 默认导出用于云函数
const handler = new DailyPromptHandler();
export default handler;
