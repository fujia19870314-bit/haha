// 用户认证云函数测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserAuthHandler } from '../../backend/functions/user-auth';
import { db } from '../../backend/lib/database';

// 模拟微信 API - 需要 mock 导出的单例
vi.mock('../../backend/lib/wechat-api', () => {
  const mockCode2Session = vi.fn().mockImplementation(async (code: string) => {
    if (code === 'valid_code') {
      return {
        openid: 'test_openid_123',
        session_key: 'test_session_key',
        unionid: 'test_unionid_123'
      };
    }
    if (code === 'existing_user_code') {
      return {
        openid: 'existing_openid',
        session_key: 'session_key'
      };
    }
    throw new Error('Invalid code');
  });

  return {
    WechatAPI: vi.fn().mockImplementation(() => ({
      code2Session: mockCode2Session
    })),
    wechatAPI: {
      code2Session: mockCode2Session
    }
  };
});

describe('UserAuthHandler', () => {
  let handler: UserAuthHandler;

  beforeEach(() => {
    db.clear();
    handler = new UserAuthHandler();
  });

  describe('code2Session', () => {
    it('应该成功处理新用户认证并创建用户', async () => {
      const result = await handler.handleAuth({
        code: 'valid_code'
      });

      expect(result.success).toBe(true);
      expect(result.data?.openid).toBe('test_openid_123');
      expect(result.data?.isNewUser).toBe(true);
      expect(result.data?.user).toBeDefined();
      expect(result.data?.user.isPremium).toBe(false);
      // 验证 7 天免费试用
      const trialEndsAt = new Date(result.data?.user.trialEndsAt);
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      expect(trialEndsAt.getTime()).toBeGreaterThan(now.getTime());
      expect(trialEndsAt.getTime()).toBeLessThanOrEqual(sevenDaysLater.getTime());
    });

    it('应该成功处理已存在用户认证', async () => {
      // 先创建一个已存在的用户
      await db.createUser({
        openid: 'existing_openid',
        griefStage: 'depression',
        isPremium: false,
        trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      });

      const result = await handler.handleAuth({
        code: 'existing_user_code'
      });

      expect(result.success).toBe(true);
      expect(result.data?.openid).toBe('existing_openid');
      expect(result.data?.isNewUser).toBe(false);
    });

    it('应该对无效 code 返回错误', async () => {
      const result = await handler.handleAuth({
        code: 'invalid_code'
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该拒绝空 code', async () => {
      const result = await handler.handleAuth({
        code: ''
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('code');
    });

    it('新用户默认哀伤阶段应该为 acceptance', async () => {
      const result = await handler.handleAuth({
        code: 'valid_code'
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.griefStage).toBe('acceptance');
    });
  });

  describe('updateGriefStage', () => {
    it('应该成功更新用户的哀伤阶段', async () => {
      // 先创建用户
      const authResult = await handler.handleAuth({
        code: 'valid_code'
      });
      const userId = authResult.data?.user.id;

      const result = await handler.updateGriefStage({
        userId,
        stage: 'anger'
      });

      expect(result.success).toBe(true);
      expect(result.data?.griefStage).toBe('anger');

      // 验证数据库中确实更新了
      const user = await db.getUserById(userId);
      expect(user?.griefStage).toBe('anger');
    });

    it('应该拒绝无效的哀伤阶段', async () => {
      const authResult = await handler.handleAuth({
        code: 'valid_code'
      });
      const userId = authResult.data?.user.id;

      const result = await handler.updateGriefStage({
        userId,
        stage: 'invalid_stage' as any
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('stage');
    });

    it('应该拒绝不存在的用户', async () => {
      const result = await handler.updateGriefStage({
        userId: 'non_existent_user',
        stage: 'anger'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('用户不存在');
    });
  });

  describe('trial status', () => {
    it('应该正确识别用户是否在试用期内', async () => {
      const result = await handler.handleAuth({
        code: 'valid_code'
      });

      expect(result.success).toBe(true);
      expect(result.data?.user.trialEndsAt).toBeDefined();
    });
  });

  describe('getUserInfo', () => {
    it('应该能获取用户信息', async () => {
      const authResult = await handler.handleAuth({
        code: 'valid_code'
      });
      const userId = authResult.data?.user.id;

      const result = await handler.getUserInfo(userId);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe(userId);
      expect(result.data?.openid).toBe('test_openid_123');
    });

    it('不存在的用户应该返回错误', async () => {
      const result = await handler.getUserInfo('non_existent_user');

      expect(result.success).toBe(false);
      expect(result.error).toContain('用户不存在');
    });
  });

  describe('hasPremiumAccess', () => {
    it('付费用户应该返回 true', () => {
      const result = handler.hasPremiumAccess({
        id: '1',
        openid: 'test',
        griefStage: 'acceptance',
        isPremium: true,
        trialEndsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 已过期的试用
      } as any);

      expect(result).toBe(true);
    });

    it('试用期内用户应该返回 true', () => {
      const result = handler.hasPremiumAccess({
        id: '1',
        openid: 'test',
        griefStage: 'acceptance',
        isPremium: false,
        trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 还有3天试用
      } as any);

      expect(result).toBe(true);
    });

    it('试用期已过且非付费用户应该返回 false', () => {
      const result = handler.hasPremiumAccess({
        id: '1',
        openid: 'test',
        griefStage: 'acceptance',
        isPremium: false,
        trialEndsAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 已过期的试用
      } as any);

      expect(result).toBe(false);
    });
  });
});
