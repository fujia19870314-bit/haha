// 微信支付处理云函数测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WechatPayHandler } from '../../backend/functions/wechat-pay';
import { db } from '../../backend/lib/database';
import { wechatAPI } from '../../backend/lib/wechat-api';

// 模拟微信 API
vi.mock('../../backend/lib/wechat-api', async () => {
  const actual = await vi.importActual('../../backend/lib/wechat-api');
  return {
    ...actual,
    wechatAPI: {
      ...actual.wechatAPI,
      generateOrderNo: vi.fn().mockReturnValue('MD202401011234567890'),
      verifyPaymentCallback: vi.fn().mockReturnValue(true)
    }
  };
});

describe('WechatPayHandler', () => {
  let handler: WechatPayHandler;

  beforeEach(async () => {
    db.clear();
    handler = new WechatPayHandler();

    // 预置用户
    await db.createUser({
      openid: 'test_openid',
      griefStage: 'acceptance',
      isPremium: false,
      trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 还有3天试用期
    });
  });

  describe('createOrder', () => {
    it('应该成功创建支付订单', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const result = await handler.createOrder({
        userId: user.id,
        amount: 99
      });

      expect(result.success).toBe(true);
      expect(result.data?.orderNo).toBeDefined();
      expect(result.data?.amount).toBe(99);
      expect(result.data?.status).toBe('pending');
    });

    it('应该为有效金额创建订单', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const result = await handler.createOrder({
        userId: user.id,
        amount: 199
      });

      expect(result.success).toBe(true);
      expect(result.data?.amount).toBe(199);
    });

    it('应该拒绝无效金额（0 或负数）', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const result = await handler.createOrder({
        userId: user.id,
        amount: 0
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('金额');
    });

    it('应该拒绝不存在的用户', async () => {
      const result = await handler.createOrder({
        userId: 'non_existent_user',
        amount: 99
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('用户不存在');
    });

    it('订单号应该是唯一的', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      // 修改 mock 使其返回不同的值
      let orderCounter = 0;
      vi.spyOn(wechatAPI, 'generateOrderNo').mockImplementation(() => {
        orderCounter++;
        return `MD20240101123456789${orderCounter}`;
      });

      const order1 = await handler.createOrder({
        userId: user.id,
        amount: 99
      });

      const order2 = await handler.createOrder({
        userId: user.id,
        amount: 199
      });

      expect(order1.data?.orderNo).not.toBe(order2.data?.orderNo);
    });
  });

  describe('handlePaymentCallback', () => {
    it('应该成功处理支付回调并更新用户状态', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      // 先创建订单
      const orderResult = await handler.createOrder({
        userId: user.id,
        amount: 99
      });
      const orderNo = orderResult.data?.orderNo;

      // 模拟支付回调
      const result = await handler.handlePaymentCallback({
        orderNo: orderNo!,
        status: 'success',
        transactionId: 'wx_transaction_123',
        paidAt: new Date().toISOString()
      });

      expect(result.success).toBe(true);

      // 验证订单状态已更新
      const updatedOrder = await db.getOrderByOrderNo(orderNo!);
      expect(updatedOrder?.status).toBe('paid');
      expect(updatedOrder?.paidAt).toBeDefined();

      // 验证用户付费状态已更新
      const updatedUser = await db.getUserById(user.id);
      expect(updatedUser?.isPremium).toBe(true);
    });

    it('应该拒绝无效的支付回调', async () => {
      const result = await handler.handlePaymentCallback({
        orderNo: 'non_existent_order',
        status: 'success',
        transactionId: 'wx_transaction_123'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('订单不存在');
    });

    it('应该处理支付失败的情况', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      // 先创建订单
      const orderResult = await handler.createOrder({
        userId: user.id,
        amount: 99
      });
      const orderNo = orderResult.data?.orderNo;

      // 模拟支付失败回调
      const result = await handler.handlePaymentCallback({
        orderNo: orderNo!,
        status: 'fail',
        errorMessage: '支付超时'
      });

      expect(result.success).toBe(true);

      // 验证订单状态为失败
      const updatedOrder = await db.getOrderByOrderNo(orderNo!);
      expect(updatedOrder?.status).toBe('failed');

      // 用户不应被标记为付费
      const updatedUser = await db.getUserById(user.id);
      expect(updatedUser?.isPremium).toBe(false);
    });

    it('应该拒绝重复处理已支付的订单', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const orderResult = await handler.createOrder({
        userId: user.id,
        amount: 99
      });
      const orderNo = orderResult.data?.orderNo;

      // 第一次支付成功
      await handler.handlePaymentCallback({
        orderNo: orderNo!,
        status: 'success',
        transactionId: 'wx_transaction_123'
      });

      // 第二次尝试支付
      const result = await handler.handlePaymentCallback({
        orderNo: orderNo!,
        status: 'success',
        transactionId: 'wx_transaction_456'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('已支付');
    });
  });

  describe('getOrderStatus', () => {
    it('应该能查询订单状态', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const orderResult = await handler.createOrder({
        userId: user.id,
        amount: 99
      });
      const orderNo = orderResult.data?.orderNo;

      const result = await handler.getOrderStatus(orderNo!);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('pending');
      expect(result.data?.amount).toBe(99);
    });

    it('不存在的订单应该返回错误', async () => {
      const result = await handler.getOrderStatus('non_existent_order');

      expect(result.success).toBe(false);
      expect(result.error).toContain('订单不存在');
    });

    it('空订单号应该返回错误', async () => {
      const result = await handler.getOrderStatus('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('订单号不能为空');
    });
  });

  describe('getUserOrders', () => {
    it('应该能获取用户订单历史', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const result = await handler.getUserOrders(user.id);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('空 userId 应该返回错误', async () => {
      const result = await handler.getUserOrders('');

      expect(result.success).toBe(false);
      expect(result.error).toContain('userId');
    });
  });

  describe('handlePaymentCallback edge cases', () => {
    it('空订单号应该返回错误', async () => {
      const result = await handler.handlePaymentCallback({
        orderNo: '',
        status: 'success'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('订单号不能为空');
    });

    it('已退款的订单不应该重复处理', async () => {
      const user = await db.getUserByOpenid('test_openid');
      if (!user) throw new Error('User not found');

      const orderResult = await handler.createOrder({
        userId: user.id,
        amount: 99
      });
      const orderNo = orderResult.data?.orderNo;

      // 手动将订单设为退款状态
      const order = await db.getOrderByOrderNo(orderNo!);
      await db.updateOrder(order!.id, { status: 'refunded' });

      const result = await handler.handlePaymentCallback({
        orderNo: orderNo!,
        status: 'success'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('退款');
    });
  });
});
