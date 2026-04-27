// 微信 API 模块测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WechatAPI } from '../../backend/lib/wechat-api';

describe('WechatAPI', () => {
  let api: WechatAPI;

  beforeEach(() => {
    api = new WechatAPI('test_app_id', 'test_app_secret');
    global.fetch = vi.fn();
  });

  describe('code2Session', () => {
    it('应该成功换取 session', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          openid: 'test_openid',
          session_key: 'test_session_key',
          unionid: 'test_unionid'
        })
      });

      const result = await api.code2Session('valid_code');

      expect(result.openid).toBe('test_openid');
      expect(result.session_key).toBe('test_session_key');
      expect(result.unionid).toBe('test_unionid');
    });

    it('应该处理没有 unionid 的情况', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          openid: 'test_openid',
          session_key: 'test_session_key'
        })
      });

      const result = await api.code2Session('valid_code');

      expect(result.openid).toBe('test_openid');
      expect(result.session_key).toBe('test_session_key');
      expect(result.unionid).toBeUndefined();
    });

    it('空 code 应该抛出错误', async () => {
      await expect(api.code2Session('')).rejects.toThrow('code is required');
    });

    it('API 返回错误应该抛出异常', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          errcode: 40029,
          errmsg: 'invalid code'
        })
      });

      await expect(api.code2Session('invalid_code')).rejects.toThrow('invalid code');
    });

    it('网络错误应该抛出异常', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      });

      await expect(api.code2Session('test_code')).rejects.toThrow('500');
    });

    it('应该使用正确的 URL 调用 API', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          openid: 'test_openid',
          session_key: 'test_session_key'
        })
      });

      await api.code2Session('test_code');

      const callUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(callUrl).toContain('api.weixin.qq.com');
      expect(callUrl).toContain('test_app_id');
      expect(callUrl).toContain('test_app_secret');
      expect(callUrl).toContain('test_code');
    });
  });

  describe('generateOrderNo', () => {
    it('应该生成有效的订单号', () => {
      const orderNo = api.generateOrderNo();
      expect(orderNo).toBeDefined();
      expect(orderNo.length).toBeGreaterThan(10);
      expect(orderNo.startsWith('MD')).toBe(true);
    });

    it('每次生成的订单号应该不同', () => {
      const orderNo1 = api.generateOrderNo();
      const orderNo2 = api.generateOrderNo();
      expect(orderNo1).not.toBe(orderNo2);
    });
  });

  describe('verifyPaymentCallback', () => {
    it('空数据应返回 false', () => {
      const result = api.verifyPaymentCallback({}, 'test_key');
      expect(result).toBe(false);
    });

    it('正确签名应返回 true', () => {
      const data = { appid: 'wx123', mch_id: '123', nonce_str: 'abc', result_code: 'SUCCESS' };
      const crypto = require('crypto');
      const sortedKeys = Object.keys(data).sort();
      const stringA = sortedKeys.map(k => `${k}=${data[k]}`).join('&');
      const stringSignTemp = `${stringA}&key=test_key`;
      const sign = crypto.createHmac('sha256', 'test_key').update(stringSignTemp).digest('hex').toUpperCase();
      const result = api.verifyPaymentCallback({ ...data, sign }, 'test_key');
      expect(result).toBe(true);
    });

    it('错误签名应返回 false', () => {
      const data = { appid: 'wx123', sign: 'WRONG_SIGN' };
      const result = api.verifyPaymentCallback(data, 'test_key');
      expect(result).toBe(false);
    });
  });
});
