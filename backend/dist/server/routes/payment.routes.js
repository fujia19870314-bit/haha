import { Router } from 'express';
import { WechatPayHandler } from '../../functions/wechat-pay.js';
import { authenticate } from '../middleware/auth.js';
const router = Router();
const handler = new WechatPayHandler();
// Create payment order - requires authentication
router.post('/wechat-pay', authenticate, async (req, res, next) => {
    try {
        const { amount, description } = req.body;
        const result = await handler.createOrder({
            userId: req.user.userId,
            amount,
            description
        });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// Payment callback (public endpoint for payment provider)
router.post('/wechat-pay/callback', async (req, res, next) => {
    try {
        const { orderNo, status, transactionId, paidAt, errorMessage } = req.body;
        const result = await handler.handlePaymentCallback({
            orderNo,
            status,
            transactionId,
            paidAt,
            errorMessage
        });
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// Get order status - requires authentication
router.get('/order-status', authenticate, async (req, res, next) => {
    try {
        const orderNo = req.query.orderNo;
        const result = await handler.getOrderStatus(orderNo);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
// Get user orders - requires authentication
router.get('/user-orders', authenticate, async (req, res, next) => {
    try {
        const result = await handler.getUserOrders(req.user.userId);
        res.json(result);
    }
    catch (err) {
        next(err);
    }
});
export default router;
//# sourceMappingURL=payment.routes.js.map