import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../lib/database.js';
import { AppError } from '../lib/error-handler.js';
export class WebAuthHandler {
    /**
     * Web 用户注册
     */
    async register(request) {
        const email = request.email?.trim().toLowerCase();
        const password = request.password;
        // 验证邮箱格式
        if (!email || !this.isValidEmail(email)) {
            throw new AppError('INVALID_REQUEST', '邮箱格式不正确');
        }
        // 验证密码强度
        if (!password || password.length < 6) {
            throw new AppError('INVALID_REQUEST', '密码至少6位');
        }
        // 检查邮箱是否已存在
        const existing = await db.getUserByEmail(email);
        if (existing) {
            throw new AppError('INVALID_REQUEST', '邮箱已被注册');
        }
        // 创建用户
        const passwordHash = await bcrypt.hash(password, 10);
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);
        const user = await db.createUser({
            email,
            passwordHash,
            griefStage: 'acceptance',
            isPremium: false,
            trialEndsAt
        });
        const token = this.generateToken(user.id, 'web');
        return { token, userId: user.id, isNewUser: true };
    }
    /**
     * Web 用户登录
     */
    async login(request) {
        const email = request.email?.trim().toLowerCase();
        const password = request.password;
        if (!email || !password) {
            throw new AppError('UNAUTHORIZED', '邮箱和密码不能为空');
        }
        const user = await db.getUserByEmail(email);
        if (!user || !user.passwordHash) {
            throw new AppError('UNAUTHORIZED', '邮箱或密码错误');
        }
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
            throw new AppError('UNAUTHORIZED', '邮箱或密码错误');
        }
        const token = this.generateToken(user.id, 'web');
        return { token, userId: user.id, isNewUser: false };
    }
    /**
     * 生成 JWT Token
     */
    generateToken(userId, platform) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }
        return jwt.sign({ userId, platform }, secret, { expiresIn: '7d' });
    }
    /**
     * 验证 JWT Token
     */
    verifyToken(token) {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is required');
        }
        return jwt.verify(token, secret);
    }
    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
}
export default WebAuthHandler;
//# sourceMappingURL=web-auth.js.map