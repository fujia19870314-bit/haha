// PDF 纪念册导出云函数

import type { ApiResponse, JournalEntry } from '../types/database';
import { db } from '../lib/database';

export interface GeneratePdfRequest {
  userId: string;
}

export interface GeneratePdfResponse {
  downloadUrl: string;
  fileName: string;
  pageCount: number;
  generatedAt: string;
}

export class GeneratePdfHandler {
  /**
   * 生成 PDF 纪念册
   * MVP 阶段：同步生成，返回模拟下载链接
   * 生产环境：应改为异步队列（SCF 异步触发）
   */
  async generatePdf(request: GeneratePdfRequest): Promise<ApiResponse<GeneratePdfResponse>> {
    try {
      // 验证输入
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

      // 获取用户日记历史
      const journals = await db.getJournalsByUserId(request.userId, 100);

      if (journals.length === 0) {
        return {
          success: false,
          error: '暂无日记可导出'
        };
      }

      // MVP 阶段：模拟 PDF 生成
      // 生产环境应调用真实的 PDF 生成服务
      const fileName = `纪念册_${user.openid.slice(0, 8)}_${Date.now()}.pdf`;
      const pageCount = Math.max(1, Math.ceil(journals.length / 2));

      // 模拟异步生成后的下载链接
      const downloadUrl = `/download/pdf?token=${this.generateToken(request.userId)}`;

      return {
        success: true,
        data: {
          downloadUrl,
          fileName,
          pageCount,
          generatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '生成 PDF 失败'
      };
    }
  }

  private generateToken(userId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${userId.slice(0, 8)}_${timestamp}_${random}`;
  }
}

// 默认导出用于云函数
const handler = new GeneratePdfHandler();
export default handler;
