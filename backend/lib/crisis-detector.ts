// 危机检测模块 - 支持关键词匹配 + LLM 双模式

import type { CrisisDetectionResult } from '../types/llm';
import { getSystemPrompt, PromptTemplate } from './system-prompt';
import { QwenProvider } from './qwen-provider';
import { logError } from './error-handler';

// 危机关键词库 - 按风险等级分类
const CRISIS_KEYWORDS = {
  critical: [
    '自杀', '自尽', '自绝', '轻生', '自裁', '自戕', 'zi sha',
    '割腕', '割脉', '跳楼', '跳河', '跳江', '上吊', '自缢',
    '服毒', '吃安眠药', '烧炭', '开煤气', '安眠药',
    '结束生命', '结束自己', '不想活了', '活不下去了',
    '一了百了', '与世长辞', '离开这个世界', '去死',
    '自杀计划', '自杀方式', '准备自杀'
  ],
  high: [
    '想死', '要死', '死了算了', '死了更好', '早点死', '死',
    '自残', '自伤', '伤害自己',
    '没有希望', '没有意义', '活着没有意义',
    '生不如死', '痛不欲生'
  ],
  medium: [
    '好累', '太累了', '撑不下去', '撑不住了',
    '好痛苦', '太痛苦了', '很难受', '痛苦',
    '绝望', '无助', '崩溃', '扛不住'
  ]
};

// 所有关键词的扁平列表
const ALL_KEYWORDS = [
  ...CRISIS_KEYWORDS.critical,
  ...CRISIS_KEYWORDS.high,
  ...CRISIS_KEYWORDS.medium
];

export class CrisisDetector {
  private llmProvider?: QwenProvider;
  private useLLM: boolean;

  constructor(useLLM = false) {
    this.useLLM = useLLM;
    if (useLLM) {
      const apiKey = process.env.QWEN_API_KEY;
      if (apiKey) {
        this.llmProvider = new QwenProvider({ apiKey });
      }
    }
  }

  /**
   * 检测文本中的危机关键词
   */
  detectKeywords(text: string): string[] {
    const lowerText = text.toLowerCase();
    const found: string[] = [];

    for (const keyword of ALL_KEYWORDS) {
      if (lowerText.includes(keyword.toLowerCase())) {
        found.push(keyword);
      }
    }

    return [...new Set(found)]; // 去重
  }

  /**
   * 根据关键词计算风险等级
   */
  calculateRiskLevel(keywords: string[]): 'low' | 'medium' | 'high' | 'critical' {
    if (keywords.length === 0) {
      return 'low';
    }

    const hasCritical = keywords.some(k => CRISIS_KEYWORDS.critical.includes(k));
    if (hasCritical) {
      return 'critical';
    }

    const hasHigh = keywords.some(k => CRISIS_KEYWORDS.high.includes(k));
    if (hasHigh) {
      return 'high';
    }

    const hasMedium = keywords.some(k => CRISIS_KEYWORDS.medium.includes(k));
    if (hasMedium) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 计算语义风险分数 (0-1)
   */
  calculateSemanticScore(text: string): number {
    const keywords = this.detectKeywords(text);
    if (keywords.length === 0) {
      return 0;
    }

    let score = 0;
    for (const keyword of keywords) {
      if (CRISIS_KEYWORDS.critical.includes(keyword)) {
        score += 0.6;
      } else if (CRISIS_KEYWORDS.high.includes(keyword)) {
        score += 0.3;
      } else if (CRISIS_KEYWORDS.medium.includes(keyword)) {
        score += 0.15;
      }
    }

    const textLength = text.length;
    if (textLength < 20) {
      score *= 1.5;
    } else if (textLength < 50) {
      score *= 1.3;
    } else if (textLength < 100) {
      score *= 1.2;
    }

    return Math.min(score, 1);
  }

  /**
   * 使用 LLM 进行危机检测
   */
  async detectWithLLM(text: string): Promise<CrisisDetectionResult> {
    if (!this.llmProvider) {
      throw new Error('LLM provider not initialized');
    }

    const systemPrompt = getSystemPrompt(PromptTemplate.CRISIS_DETECTION);

    const response = await this.llmProvider.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      temperature: 0.1,
      maxTokens: 200
    });

    // 解析 LLM 返回的 JSON
    const content = response.content.trim();
    let jsonStr = content;

    // 尝试提取 JSON 部分
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      const result = JSON.parse(jsonStr);
      const riskLevel = ['low', 'medium', 'high', 'critical'].includes(result.riskLevel)
        ? result.riskLevel as 'low' | 'medium' | 'high' | 'critical'
        : 'low';

      return {
        riskLevel,
        detectedKeywords: result.keywords || result.reason || [],
        semanticScore: riskLevel === 'critical' ? 0.9 : riskLevel === 'high' ? 0.7 : riskLevel === 'medium' ? 0.4 : 0,
        hasCrisis: result.hasCrisis === true || riskLevel !== 'low'
      };
    } catch {
      // JSON 解析失败，回退到关键词检测
      return this.detectWithKeywords(text);
    }
  }

  /**
   * 使用关键词进行危机检测
   */
  detectWithKeywords(text: string): CrisisDetectionResult {
    if (!text || text.trim().length === 0) {
      return {
        riskLevel: 'low',
        detectedKeywords: [],
        semanticScore: 0,
        hasCrisis: false
      };
    }

    const keywords = this.detectKeywords(text);
    const riskLevel = this.calculateRiskLevel(keywords);
    const semanticScore = this.calculateSemanticScore(text);
    const hasCrisis = riskLevel !== 'low';

    return {
      riskLevel,
      detectedKeywords: keywords,
      semanticScore,
      hasCrisis
    };
  }

  /**
   * 完整的危机检测 - 优先使用 LLM，失败时回退到关键词
   */
  async detect(text: string): Promise<CrisisDetectionResult> {
    if (!text || text.trim().length === 0) {
      return {
        riskLevel: 'low',
        detectedKeywords: [],
        semanticScore: 0,
        hasCrisis: false
      };
    }

    // 先进行关键词快速检测
    const keywordResult = this.detectWithKeywords(text);

    // 如果关键词检测发现高风险，直接使用结果
    if (keywordResult.riskLevel === 'critical' || keywordResult.riskLevel === 'high') {
      return keywordResult;
    }

    // 如果启用了 LLM 且关键词检测为 low/medium，用 LLM 二次确认
    if (this.useLLM && this.llmProvider) {
      try {
        const llmResult = await this.detectWithLLM(text);
        // 取风险等级更高的结果
        const riskLevels = ['low', 'medium', 'high', 'critical'];
        const keywordIndex = riskLevels.indexOf(keywordResult.riskLevel);
        const llmIndex = riskLevels.indexOf(llmResult.riskLevel);

        if (llmIndex > keywordIndex) {
          return {
            ...llmResult,
            detectedKeywords: [...new Set([...keywordResult.detectedKeywords, ...llmResult.detectedKeywords])]
          };
        }
      } catch (error) {
        logError('CrisisDetector.detect', error);
        // LLM 失败时回退到关键词结果
      }
    }

    return keywordResult;
  }

  /**
   * 获取危机热线列表
   */
  getHotlines(region?: string): string[] {
    const nationalHotlines = [
      '全国心理援助热线：400-161-9995',
      '北京心理危机研究与干预中心：010-82951332',
      '生命热线：400-821-1215'
    ];

    return nationalHotlines;
  }
}
