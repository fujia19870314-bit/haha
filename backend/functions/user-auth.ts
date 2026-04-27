// 用户认证云函数

import type { ApiResponse, User } from '../types/database';
import type { GriefStage } from '../types/database';
import { db } from '../lib/database';
import { wechatAPI } from '../lib/wechat-api';

export interface AuthRequest {
  code: string;
}

export interface AuthResponseData {
  openid: string;
  isNewUser: boolean;
  user: User;
}

export interface UpdateStageRequest {
  userId: string;
  stage: GriefStage;
}

const VALID_STAGES: GriefStage[] = ['denial', 'anger', 'bargaining', 'depression', 'acceptance'];

export class UserAuthHandler {
  /**
   * 处理用户认证（微信 code2Session + 新用户创建）
   */
  async handleAuth(request: AuthRequest): Promise<ApiResponse<AuthResponseData>> {
    try {
      // 验证输入
      if (!request.code || request.code.trim() === '') {
        return {
          success: false,
          error: 'code 不能为空'
        };
      }

      // 调用微信 code2Session
      const sessionResult = await wechatAPI.code2Session(request.code);

      // 检查用户是否已存在
      let user = await db.getUserByOpenid(sessionResult.openid);
      let isNewUser = false;

      if (!user) {
        // 创建新用户，设置 7 天免费试用
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);

        user = await db.createUser({
          openid: sessionResult.openid,
          unionid: sessionResult.unionid,
          griefStage: 'acceptance', // 默认阶段
          isPremium: false,
          trialEndsAt
        });
        isNewUser = true;
      }

      return {
        success: true,
        data: {
          openid: sessionResult.openid,
          isNewUser,
          user
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '认证失败'
      };
    }
  }

  /**
   * 更新用户哀伤阶段
   */
  async updateGriefStage(request: UpdateStageRequest): Promise<ApiResponse<{ griefStage: GriefStage }>> {
    try {
      // 验证输入
      if (!request.userId) {
        return {
          success: false,
          error: 'userId 不能为空'
        };
      }

      if (!VALID_STAGES.includes(request.stage)) {
        return {
          success: false,
          error: `无效的 stage 值，必须是: ${VALID_STAGES.join(', ')}`
        };
      }

      // 检查用户是否存在
      const existingUser = await db.getUserById(request.userId);
      if (!existingUser) {
        return {
          success: false,
          error: '用户不存在'
        };
      }

      // 更新用户阶段
      const updatedUser = await db.updateUser(request.userId, {
        griefStage: request.stage
      });

      if (!updatedUser) {
        return {
          success: false,
          error: '更新失败'
        };
      }

      return {
        success: true,
        data: {
          griefStage: updatedUser.griefStage
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '更新失败'
      };
    }
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(userId: string): Promise<ApiResponse<User>> {
    try {
      const user = await db.getUserById(userId);

      if (!user) {
        return {
          success: false,
          error: '用户不存在'
        };
      }

      return {
        success: true,
        data: user
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取用户信息失败'
      };
    }
  }

  /**
   * 检查用户是否有高级权限（会员或试用期内）
   */
  hasPremiumAccess(user: User): boolean {
    if (user.isPremium) {
      return true;
    }

    // 检查是否在试用期内
    const now = new Date();
    return user.trialEndsAt > now;
  }
}

// 默认导出用于云函数
const handler = new UserAuthHandler();
export default handler;
