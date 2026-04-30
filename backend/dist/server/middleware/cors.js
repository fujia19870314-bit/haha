import cors from 'cors';
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'https://mourning-diary.com',
    'https://www.mourning-diary.com',
    'http://localhost:3000',
    'http://localhost:5173'
];
export const corsMiddleware = cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) {
            callback(null, true);
            return;
        }
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
    maxAge: 86400
});
//# sourceMappingURL=cors.js.map