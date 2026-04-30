import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { corsMiddleware } from './middleware/cors.js';
import { rateLimitMiddleware } from './middleware/rate-limit.js';
import { globalErrorHandler } from './middleware/error-handler.js';
import authRoutes from './routes/auth.routes.js';
import journalRoutes from './routes/journal.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import resourceRoutes from './routes/resources.routes.js';
import promptRoutes from './routes/prompt.routes.js';
import pdfRoutes from './routes/pdf.routes.js';
dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3000;
// Security middleware
app.use(helmet());
app.use(corsMiddleware);
app.use(rateLimitMiddleware);
// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// API routes
app.use('/api', authRoutes);
app.use('/api', journalRoutes);
app.use('/api', paymentRoutes);
app.use('/api', resourceRoutes);
app.use('/api', promptRoutes);
app.use('/api', pdfRoutes);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        error: '接口不存在',
        code: 'NOT_FOUND'
    });
});
// Global error handler
app.use(globalErrorHandler);
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
export default app;
//# sourceMappingURL=index.js.map