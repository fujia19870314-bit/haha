import { AppError } from '../../lib/error-handler.js';
export function globalErrorHandler(err, _req, res, _next) {
    const timestamp = new Date().toISOString();
    if (err instanceof AppError) {
        console.error(`[${timestamp}] [AppError] ${err.code}: ${err.message}`);
        res.status(err.status).json({
            success: false,
            error: err.userMessage,
            code: err.code
        });
        return;
    }
    console.error(`[${timestamp}] [UnhandledError] ${err.name}: ${err.message}`);
    if (err.stack) {
        console.error(err.stack);
    }
    // Don't leak internal error details in production
    const isDev = process.env.NODE_ENV === 'development';
    res.status(500).json({
        success: false,
        error: '服务器内部错误，请稍后再试',
        code: 'UNKNOWN_ERROR',
        ...(isDev ? { detail: err.message } : {})
    });
}
//# sourceMappingURL=error-handler.js.map