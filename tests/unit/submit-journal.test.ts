// 提交日记云函数测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubmitJournalHandler } from '../../backend/functions/submit-journal';
import { db } from '../../backend/lib/database';
import { CrisisDetector } from '../../backend/lib/crisis-detector';

// 模拟 LLM 提供商
vi.mock('../../backend/lib/qwen-provider', () => ({
  QwenProvider: vi.fn().mockImplementation(() => ({
    chat: vi.fn().mockImplementation(async () => ({
      content: '我能感受到你现在的痛苦。这样的感受是正常的。',
      model: 'qwen-turbo',
      provider: 'qwen',
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150
      }
    }))
  }))
}));

// 模拟加密模块
vi.mock('../../backend/lib/encryption', () => ({
  encryptToString: vi.fn().mockImplementation((text: string) => `encrypted_${text}`),
  decryptFromString: vi.fn().mockImplementation((text: string) => text.replace('encrypted_', ''))
}));

describe('SubmitJournalHandler', () => {
  let handler: SubmitJournalHandler;

  beforeEach(async () => {
    db.clear();
    handler = new SubmitJournalHandler();

    // 预置用户
    await db.createUser({
      openid: 'test_openid',
      griefStage: 'acceptance',
      isPremium: false,
      trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
  });

  describe('submitJournal', () => {
    it('应该成功提交日记并获取 AI 回复', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const result = await handler.submitJournal({
        userId: user.id,
        content: '今天想你了。翻看照片的时候，眼泪又不争气地掉了下来。'
      });

      expect(result.success).toBe(true);
      expect(result.data?.journal).toBeDefined();
      expect(result.data?.journal.encryptedContent).toContain('encrypted_');
      expect(result.data?.aiResponse).toBeDefined();
      expect(result.data?.aiResponse.content).toContain('痛苦');
    });

    it('应该检测危机内容并返回风险等级', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const result = await handler.submitJournal({
        userId: user.id,
        content: '我真的不想活了，想死，死了算了，死了更好'
      });

      expect(result.success).toBe(true);
      expect(result.data?.crisisDetected).toBe(true);
      expect(result.data?.riskLevel).toBe('critical');
      // 高风险内容应该返回不同的 AI 回复
      expect(result.data?.aiResponse.content).toContain('担心');
    });

    it('应该加密存储日记内容', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const result = await handler.submitJournal({
        userId: user.id,
        content: '这是需要加密的日记内容'
      });

      expect(result.success).toBe(true);
      expect(result.data?.journal.encryptedContent).toBeDefined();
      expect(result.data?.journal.encryptedContent).toContain('encrypted_');
    });

    it('应该为空内容返回错误', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const result = await handler.submitJournal({
        userId: user.id,
        content: ''
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('内容');
    });

    it('应该拒绝不存在的用户', async () => {
      const result = await handler.submitJournal({
        userId: 'non_existent_user',
        content: '测试内容'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('用户不存在');
    });

    it('应该正确处理超长内容', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const longContent = '想你了'.repeat(1000);

      const result = await handler.submitJournal({
        userId: user.id,
        content: longContent
      });

      expect(result.success).toBe(true);
      expect(result.data?.journal.encryptedContent).toContain('encrypted_');
    });

    it('危机内容应返回危机热线信息', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const result = await handler.submitJournal({
        userId: user.id,
        content: '我准备自杀了，已经买了安眠药'
      });

      expect(result.success).toBe(true);
      expect(result.data?.crisisDetected).toBe(true);
      expect(result.data?.riskLevel).toBe('critical');
      expect(result.data?.hotlines).toBeDefined();
      expect(result.data?.hotlines.length).toBeGreaterThan(0);
    });
  });

  describe('journal history', () => {
    it('应该能获取用户的日记历史', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      // 创建多篇日记
      for (let i = 0; i < 3; i++) {
        await handler.submitJournal({
          userId: user.id,
          content: `日记内容 ${i + 1}`
        });
      }

      const result = await handler.getJournalHistory(user.id);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(3);
    });

    it('应该限制返回的日记数量', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      // 创建超过限制的日记
      for (let i = 0; i < 25; i++) {
        await handler.submitJournal({
          userId: user.id,
          content: `日记内容 ${i + 1}`
        });
      }

      const result = await handler.getJournalHistory(user.id);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBeLessThanOrEqual(20);
    });
  });
});
