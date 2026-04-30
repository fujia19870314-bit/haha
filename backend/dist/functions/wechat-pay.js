// 微信支付处理云函数
import { db } from '../lib/database.js';
import { wechatAPI } from '../lib/wechat-api.js';
export class WechatPayHandler {
    /**
     * 创建支付订单
     */
    async createOrder(request) {
        try {
            // 验证输入
            if (!request.userId) {
                return {
                    success: false,
                    error: 'userId 不能为空'
                };
            }
            if (!request.amount || request.amount <= 0) {
                return {
                    success: false,
                    error: '金额必须大于 0'
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
            // 生成订单号
            const orderNo = wechatAPI.generateOrderNo();
            // 创建订单
            const order = await db.createOrder({
                userId: request.userId,
                orderNo,
                amount: request.amount,
                status: 'pending'
            });
            return {
                success: true,
                data: order
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '创建订单失败'
            };
        }
    }
    /**
     * 处理支付回调
     */
    async handlePaymentCallback(request) {
        try {
            // 验证输入
            if (!request.orderNo) {
                return {
                    success: false,
                    error: '订单号不能为空'
                };
            }
            // 查找订单
            const order = await db.getOrderByOrderNo(request.orderNo);
            if (!order) {
                return {
                    success: false,
                    error: '订单不存在'
                };
            }
            // 检查订单是否已处理
            if (order.status === 'paid') {
                return {
                    success: false,
                    error: '订单已支付，无需重复处理'
                };
            }
            if (order.status === 'refunded') {
                return {
                    success: false,
                    error: '订单已退款，无法处理'
                };
            }
            // 根据回调状态处理
            if (request.status === 'success') {
                // 更新订单为已支付
                await db.updateOrder(order.id, {
                    status: 'paid',
                    paidAt: new Date(request.paidAt || Date.now())
                });
                // 更新用户为付费用户
                await db.updateUser(order.userId, {
                    isPremium: true
                });
                return {
                    success: true,
                    data: {
                        message: '支付成功，用户已升级为付费用户'
                    }
                };
            }
            else {
                // 支付失败
                await db.updateOrder(order.id, {
                    status: 'failed'
                });
                return {
                    success: true,
                    data: {
                        message: request.errorMessage || '支付失败'
                    }
                };
            }
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '处理支付回调失败'
            };
        }
    }
    /**
     * 查询订单状态
     */
    async getOrderStatus(orderNo) {
        try {
            if (!orderNo) {
                return {
                    success: false,
                    error: '订单号不能为空'
                };
            }
            const order = await db.getOrderByOrderNo(orderNo);
            if (!order) {
                return {
                    success: false,
                    error: '订单不存在'
                };
            }
            return {
                success: true,
                data: order
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '查询订单状态失败'
            };
        }
    }
    /**
     * 获取用户的订单历史
     */
    async getUserOrders(userId) {
        try {
            if (!userId) {
                return {
                    success: false,
                    error: 'userId 不能为空'
                };
            }
            // 这里可以实现从数据库获取用户所有订单的逻辑
            // 目前简化处理
            return {
                success: true,
                data: []
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : '获取订单历史失败'
            };
        }
    }
}
// 默认导出用于云函数
const handler = new WechatPayHandler();
export default handler;
//# sourceMappingURL=wechat-pay.js.map