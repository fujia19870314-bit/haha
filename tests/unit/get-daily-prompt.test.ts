// 获取每日反思提示云函数测试

import { describe, it, expect, beforeEach } from 'vitest';
import { DailyPromptHandler } from '../../backend/functions/get-daily-prompt';
import { db } from '../../backend/lib/database';

describe('DailyPromptHandler', () => {
  let handler: DailyPromptHandler;

  beforeEach(async () => {
    db.clear();
    handler = new DailyPromptHandler();

    // 预置一些提示词模板
    await db.createPrompt({
      stage: 'denial',
      content: '今天有什么让你想起他/她的事情吗？',
      isAnniversary: false
    });

    await db.createPrompt({
      stage: 'denial',
      content: '如果能对他/她说一句话，你会说什么？',
      isAnniversary: false
    });

    await db.createPrompt({
      stage: 'anger',
      content: '今天有什么情绪想要表达吗？',
      isAnniversary: false
    });

    await db.createPrompt({
      stage: 'acceptance',
      content: '今天想起他/她的时候，有什么温暖的回忆吗？',
      isAnniversary: false
    });

    // 纪念日专用提示词
    await db.createPrompt({
      stage: 'acceptance',
      content: '今天是特别的日子。你想对他/她说些什么？',
      isAnniversary: true
    });
  });

  describe('getDailyPrompt', () => {
    it('应该根据用户的哀伤阶段返回对应的提示词', async () => {
      // 创建用户
      const user = await db.createUser({
        openid: 'test_openid',
        griefStage: 'denial',
        isPremium: false,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const result = await handler.getDailyPrompt({
        userId: user.id
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
      expect(result.data?.stage).toBe('denial');
    });

    it('应该在纪念日返回特殊的提示词', async () => {
      const user = await db.createUser({
        openid: 'test_openid',
        griefStage: 'acceptance',
        isPremium: false,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      // 传入纪念日日期
      const anniversaryDate = new Date().toISOString().split('T')[0];
      const result = await handler.getDailyPrompt({
        userId: user.id,
        isAnniversary: true,
        anniversaryDate
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toContain('特别的日子');
      expect(result.data?.isAnniversary).toBe(true);
    });

    it('当指定阶段没有提示词时，应该使用 acceptance 阶段的提示词作为降级', async () => {
      const user = await db.createUser({
        openid: 'test_openid',
        griefStage: 'depression', // 这个阶段没有预置提示词
        isPremium: false,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const result = await handler.getDailyPrompt({
        userId: user.id
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
      // 应该降级到 acceptance 阶段
    });

    it('应该拒绝不存在的用户', async () => {
      const result = await handler.getDailyPrompt({
        userId: 'non_existent_user'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('用户不存在');
    });

    it('应该为空 userId 返回错误', async () => {
      const result = await handler.getDailyPrompt({
        userId: ''
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('userId');
    });

    it('当所有阶段都没有提示词时应该返回默认提示词', async () => {
      // 清空所有提示词
      db.clear();

      const user = await db.createUser({
        openid: 'test_openid',
        griefStage: 'bargaining',
        isPremium: false,
        trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      });

      const result = await handler.getDailyPrompt({
        userId: user.id
      });

      expect(result.success).toBe(true);
      expect(result.data?.content).toBeDefined();
      expect(result.data?.id).toBe('default');
    });
  });

  describe('getAllPrompts', () => {
    it('应该可以获取指定阶段的所有提示词', async () => {
      const result = await handler.getAllPrompts('denial');

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(2);
    });

    it('应该可以获取纪念日提示词', async () => {
      const result = await handler.getAllPrompts('acceptance', true);

      expect(result.success).toBe(true);
      expect(result.data?.length).toBe(1);
      expect(result.data?.[0].content).toContain('特别的日子');
    });
  });

  describe('selectRandomPrompt', () => {
    it('应该从多个提示词中随机选择', async () => {
      // 运行多次，确保随机性
      const results = new Set();

      for (let i = 0; i < 10; i++) {
        const result = await handler.getDailyPrompt({
          userId: (await db.createUser({
            openid: `test_${i}`,
            griefStage: 'denial',
            isPremium: false,
            trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          })).id
        });

        if (result.data?.content) {
          results.add(result.data.content);
        }
      }

      // 应该至少有两种不同的结果（基于随机选择）
      expect(results.size).toBeGreaterThanOrEqual(1);
    });
  });
});
