// 统一错误处理模块
const ERROR_MAP = {
    UNKNOWN_ERROR: { status: 500, message: '服务器内部错误', userMessage: '出错了，请稍后再试' },
    INVALID_REQUEST: { status: 400, message: '请求参数错误', userMessage: '请求格式不正确' },
    UNAUTHORIZED: { status: 401, message: '未授权', userMessage: '请先登录' },
    FORBIDDEN: { status: 403, message: '禁止访问', userMessage: '没有权限执行此操作' },
    NOT_FOUND: { status: 404, message: '资源不存在', userMessage: '找不到相关内容' },
    RATE_LIMITED: { status: 429, message: '请求过于频繁', userMessage: '操作太频繁了，请稍后再试' },
    USER_NOT_FOUND: { status: 404, message: '用户不存在', userMessage: '用户不存在，请先完成引导' },
    JOURNAL_EMPTY: { status: 400, message: '日记内容不能为空', userMessage: '请写下你的感受' },
    JOURNAL_TOO_LONG: { status: 400, message: '日记内容过长', userMessage: '日记内容太长了，请精简一些' },
    MOOD_REQUIRED: { status: 400, message: '请选择情绪', userMessage: '请先选择一种情绪' },
    PAYMENT_FAILED: { status: 500, message: '支付处理失败', userMessage: '支付遇到问题，请重试' },
    ORDER_NOT_FOUND: { status: 404, message: '订单不存在', userMessage: '订单不存在或已过期' },
    LLM_UNAVAILABLE: { status: 503, message: 'AI 服务暂时不可用', userMessage: 'AI 服务暂时不可用，请稍后再试' },
    ENCRYPTION_ERROR: { status: 500, message: '数据加密失败', userMessage: '数据保存失败，请重试' },
    CONTENT_BLOCKED: { status: 400, message: '内容包含敏感信息', userMessage: '内容包含敏感信息，请修改后重试' },
};
export class AppError extends Error {
    code;
    status;
    userMessage;
    constructor(code, detail) {
        const def = ERROR_MAP[code];
        const message = detail ? `${def.message}: ${detail}` : def.message;
        super(message);
        this.code = code;
        this.status = def.status;
        this.userMessage = def.userMessage;
        this.name = 'AppError';
    }
}
export function createErrorResponse(error) {
    if (error instanceof AppError) {
        return {
            success: false,
            error: error.userMessage,
            code: error.code,
        };
    }
    const message = error instanceof Error ? error.message : '未知错误';
    return {
        success: false,
        error: message,
    };
}
export function logError(context, error) {
    const timestamp = new Date().toISOString();
    if (error instanceof AppError) {
        console.error(`[${timestamp}] [${context}] ${error.code}: ${error.message} (status: ${error.status})`);
    }
    else if (error instanceof Error) {
        console.error(`[${timestamp}] [${context}] ${error.name}: ${error.message}`);
        if (error.stack) {
            console.error(error.stack);
        }
    }
    else {
        console.error(`[${timestamp}] [${context}] Unknown error:`, error);
    }
}
/**
 * 包装异步函数，统一错误处理
 */
export function withErrorHandling(context, fn) {
    return async (...args) => {
        try {
            return await fn(...args);
        }
        catch (error) {
            logError(context, error);
            throw error;
        }
    };
}
//# sourceMappingURL=error-handler.js.map