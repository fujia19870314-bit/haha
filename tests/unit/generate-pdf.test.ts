// PDF 生成云函数测试

import { describe, it, expect, beforeEach } from 'vitest';
import { GeneratePdfHandler } from '../../backend/functions/generate-pdf';
import { db } from '../../backend/lib/database';

describe('GeneratePdfHandler', () => {
  let handler: GeneratePdfHandler;

  beforeEach(() => {
    db.clear();
    handler = new GeneratePdfHandler();
  });

  describe('generatePdf', () => {
    it('无日记时应返回错误', async () => {
      const user = await db.createUser({
        openid: 'test_openid',
        griefStage: 'acceptance',
        isPremium: false,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const result = await handler.generatePdf({ userId: user.id });

      expect(result.success).toBe(false);
      expect(result.error).toContain('暂无日记');
    });

    it('有日记时应返回下载链接', async () => {
      const user = await db.createUser({
        openid: 'test_openid',
        griefStage: 'acceptance',
        isPremium: false,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // 创建测试日记
      await db.createJournal({
        userId: user.id,
        encryptedContent: 'encrypted_test',
        aiResponse: 'AI 回应',
        emotionTag: '悲伤',
        crisisDetected: false,
        crisisRiskLevel: 'low'
      });

      const result = await handler.generatePdf({ userId: user.id });

      expect(result.success).toBe(true);
      expect(result.data?.downloadUrl).toBeDefined();
      expect(result.data?.fileName).toContain('.pdf');
      expect(result.data?.pageCount).toBeGreaterThan(0);
      expect(result.data?.generatedAt).toBeDefined();
    });

    it('空 userId 应返回错误', async () => {
      const result = await handler.generatePdf({ userId: '' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('userId');
    });

    it('不存在的用户应返回错误', async () => {
      const result = await handler.generatePdf({ userId: 'non_existent' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('用户不存在');
    });

    it('多页日记应正确计算页数', async () => {
      const user = await db.createUser({
        openid: 'test_openid',
        griefStage: 'acceptance',
        isPremium: false,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // 创建 5 篇日记
      for (let i = 0; i < 5; i++) {
        await db.createJournal({
          userId: user.id,
          encryptedContent: `encrypted_${i}`,
          aiResponse: `AI 回应 ${i}`,
          emotionTag: '悲伤',
          crisisDetected: false,
          crisisRiskLevel: 'low'
        });
      }

      const result = await handler.generatePdf({ userId: user.id });

      expect(result.success).toBe(true);
      expect(result.data?.pageCount).toBeGreaterThanOrEqual(1);
    });
  });
});
