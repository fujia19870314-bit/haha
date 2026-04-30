import jwt from 'jsonwebtoken';
export function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({
            success: false,
            error: '请先登录',
            code: 'UNAUTHORIZED'
        });
        return;
    }
    const token = authHeader.slice(7);
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET not configured');
        }
        const decoded = jwt.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch {
        res.status(401).json({
            success: false,
            error: '登录已过期，请重新登录',
            code: 'UNAUTHORIZED'
        });
    }
}
export function optionalAuth(req, _res, next) {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7);
        try {
            const secret = process.env.JWT_SECRET;
            if (secret) {
                const decoded = jwt.verify(token, secret);
                req.user = decoded;
            }
        }
        catch {
            // Invalid token, continue without user
        }
    }
    next();
}
//# sourceMappingURL=auth.js.map