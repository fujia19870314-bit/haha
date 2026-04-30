// 提交日记云函数
import { db } from '../lib/database.js';
import { CrisisDetector } from '../lib/crisis-detector.js';
import { encryptToString } from '../lib/encryption.js';
import { getSystemPrompt, PromptTemplate } from '../lib/system-prompt.js';
import { QwenProvider } from '../lib/qwen-provider.js';
import { AppError, createErrorResponse, logError } from '../lib/error-handler.js';
import { validateJournalContent, filterAIResponse } from '../lib/content-filter.js';
export class SubmitJournalHandler {
    crisisDetector;
    llmProvider;
    constructor() {
        const apiKey = process.env.QWEN_API_KEY;
        if (apiKey) {
            this.llmProvider = new QwenProvider({ apiKey });
        }
        // 启用 LLM 危机检测（双模式）
        this.crisisDetector = new CrisisDetector(!!this.llmProvider);
    }
    /**
     * 提交日记主逻辑
     * 1. 内容安全校验
     * 2. LLM 情绪分析
     * 3. 危机检测（关键词 + LLM 双模式）
     * 4. 调用 AI 获取回复
     * 5. 加密存储
     */
    async submitJournal(request) {
        try {
            // 验证输入
            if (!request.content || request.content.trim() === '') {
                throw new AppError('JOURNAL_EMPTY');
            }
            if (!request.userId) {
                throw new AppError('UNAUTHORIZED');
            }
            if (request.content.length > 5000) {
                throw new AppError('JOURNAL_TOO_LONG');
            }
            // 内容安全校验
            const contentValidation = validateJournalContent(request.content);
            if (!contentValidation.valid) {
                throw new AppError('CONTENT_BLOCKED', contentValidation.error);
            }
            // 检查用户是否存在
            const user = await db.getUserById(request.userId);
            if (!user) {
                throw new AppError('USER_NOT_FOUND');
            }
            // 步骤 1：LLM 情绪分析
            const emotionTag = await this.analyzeEmotion(request.content, request.mood);
            // 步骤 2：危机检测（关键词 + LLM 双模式）
            const crisisResult = await this.crisisDetector.detect(request.content);
            // 步骤 3：调用 AI 获取回复
            const aiResponse = await this.getAIResponse(request.content, crisisResult.riskLevel);
            // 对 AI 响应进行内容安全过滤
            const filteredResponse = filterAIResponse(aiResponse.content);
            const finalAiContent = filteredResponse.isClean
                ? aiResponse.content
                : filteredResponse.cleanedText;
            // 步骤 4：加密存储
            const encryptionKey = process.env.ENCRYPTION_KEY;
            if (!encryptionKey) {
                throw new AppError('ENCRYPTION_ERROR');
            }
            const encryptedContent = encryptToString(request.content, encryptionKey);
            // 创建日记记录
            const journal = await db.createJournal({
                userId: request.userId,
                encryptedContent,
                aiResponse: finalAiContent,
                emotionTag,
                crisisDetected: crisisResult.hasCrisis,
                crisisRiskLevel: crisisResult.riskLevel
            });
            // 准备响应
            const response = {
                journal,
                aiResponse: {
                    content: finalAiContent,
                    model: aiResponse.model,
                    provider: aiResponse.provider
                },
                crisisDetected: crisisResult.hasCrisis,
                riskLevel: crisisResult.riskLevel,
                emotionTag
            };
            // 如果检测到危机，返回热线信息
            if (crisisResult.hasCrisis) {
                response.hotlines = this.crisisDetector.getHotlines();
            }
            return {
                success: true,
                data: response
            };
        }
        catch (error) {
            logError('submitJournal', error);
            return createErrorResponse(error);
        }
    }
    /**
     * 使用 LLM 分析情绪
     * 如果 LLM 失败，回退到用户选择的 mood
     */
    async analyzeEmotion(content, fallbackMood) {
        if (!this.llmProvider) {
            return fallbackMood || '平静';
        }
        try {
            const systemPrompt = getSystemPrompt(PromptTemplate.EMOTION_ANALYSIS);
            const response = await this.llmProvider.chat({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content }
                ],
                temperature: 0.3,
                maxTokens: 50
            });
            const result = response.content.trim();
            // 验证返回的标签是否有效
            const validEmotions = ['悲伤', '思念', '愤怒', '内疚', '平静', '温暖', '焦虑', '麻木', '混乱'];
            const matched = validEmotions.find(e => result.includes(e));
            if (matched) {
                return matched;
            }
            // 如果 LLM 返回无效标签，回退
            return fallbackMood || '平静';
        }
        catch (error) {
            logError('analyzeEmotion', error);
            return fallbackMood || '平静';
        }
    }
    /**
     * 获取 AI 回复
     */
    async getAIResponse(content, riskLevel) {
        try {
            // 危机情况下使用特殊的 AI 回复
            if (riskLevel === 'high' || riskLevel === 'critical') {
                return {
                    content: '听起来你现在非常痛苦，我很担心你。这样的想法一定让你承受了很大的压力。' +
                        '你不是一个人，有很多人愿意帮助你。' +
                        '如果你愿意，可以拨打心理援助热线寻求专业的支持。',
                    model: 'crisis-response',
                    provider: 'system'
                };
            }
            // 正常情况调用 LLM
            if (!this.llmProvider) {
                return {
                    content: '谢谢你愿意分享这些。你的感受很重要。',
                    model: 'fallback',
                    provider: 'system'
                };
            }
            const systemPrompt = getSystemPrompt(PromptTemplate.DIARY_RESPONSE);
            const response = await this.llmProvider.chat({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content }
                ],
                temperature: 0.7,
                maxTokens: 500
            });
            return {
                content: response.content,
                model: response.model,
                provider: response.provider
            };
        }
        catch (error) {
            logError('getAIResponse', error);
            // LLM 调用失败时返回兜底回复
            return {
                content: '谢谢你愿意分享这些。你的感受很重要。',
                model: 'fallback',
                provider: 'system'
            };
        }
    }
    /**
     * 获取用户日记历史
     */
    async getJournalHistory(userId, limit = 20) {
        try {
            if (!userId) {
                throw new AppError('UNAUTHORIZED');
            }
            const journals = await db.getJournalsByUserId(userId, limit);
            return {
                success: true,
                data: journals
            };
        }
        catch (error) {
            logError('getJournalHistory', error);
            return createErrorResponse(error);
        }
    }
}
// 默认导出用于云函数
const handler = new SubmitJournalHandler();
export default handler;
//# sourceMappingURL=submit-journal.js.map