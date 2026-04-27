// 咨询师目录云函数测试

import { describe, it, expect, beforeEach } from 'vitest';
import { GetResourcesHandler } from '../../backend/functions/get-resources';
import { db } from '../../backend/lib/database';

describe('GetResourcesHandler', () => {
  let handler: GetResourcesHandler;

  beforeEach(async () => {
    db.clear();
    handler = new GetResourcesHandler();
  });

  describe('getResources', () => {
    it('应该返回所有咨询师和热线', async () => {
      const result = await handler.getResources({});

      expect(result.success).toBe(true);
      expect(result.data?.therapists.length).toBeGreaterThan(0);
      expect(result.data?.hotlines.length).toBeGreaterThan(0);
      expect(result.data?.hotlines[0]).toContain('400-161-9995');
    });

    it('按城市筛选应返回对应城市的咨询师', async () => {
      const result = await handler.getResources({ city: '北京' });

      expect(result.success).toBe(true);
      expect(result.data?.therapists.length).toBeGreaterThan(0);
      expect(result.data?.therapists.every(t => t.city === '北京')).toBe(true);
    });

    it('无匹配城市时应返回 fallback 消息和所有咨询师', async () => {
      const result = await handler.getResources({ city: '不存在城市' });

      expect(result.success).toBe(true);
      expect(result.data?.fallbackMessage).toContain('暂无');
      expect(result.data?.therapists.length).toBeGreaterThan(0);
    });

    it('所有咨询师应有完整信息', async () => {
      const result = await handler.getResources({});

      expect(result.success).toBe(true);
      for (const therapist of result.data?.therapists || []) {
        expect(therapist.name).toBeDefined();
        expect(therapist.title).toBeDefined();
        expect(therapist.city).toBeDefined();
        expect(therapist.specialties.length).toBeGreaterThan(0);
        expect(therapist.isVerified).toBe(true);
      }
    });

    it('重复调用不应重复初始化数据', async () => {
      await handler.getResources({});
      const result2 = await handler.getResources({});

      expect(result2.success).toBe(true);
      // 应该还是 5 个初始咨询师，不会变成 10 个
      expect(result2.data?.therapists.length).toBe(5);
    });
  });
});
