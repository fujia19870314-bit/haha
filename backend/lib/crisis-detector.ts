// 危机检测模块

import type { CrisisDetectionResult } from '../types/llm';

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

    // 检查是否有关键词在 critical 列表中
    const hasCritical = keywords.some(k => CRISIS_KEYWORDS.critical.includes(k));
    if (hasCritical) {
      return 'critical';
    }

    // 检查是否有关键词在 high 列表中
    const hasHigh = keywords.some(k => CRISIS_KEYWORDS.high.includes(k));
    if (hasHigh) {
      return 'high';
    }

    // 检查是否有关键词在 medium 列表中
    const hasMedium = keywords.some(k => CRISIS_KEYWORDS.medium.includes(k));
    if (hasMedium) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * 计算语义风险分数 (0-1)
   * 基于关键词强度和数量的简单算法
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

    // 根据文本长度调整 - 危机相关词在短文本中权重更高
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
   * 完整的危机检测
   */
  async detect(text: string): Promise<CrisisDetectionResult> {
    // 处理空文本
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

    // 定义危机阈值
    // medium 及以上都视为需要关注的危机
    const hasCrisis = riskLevel !== 'low';

    return {
      riskLevel,
      detectedKeywords: keywords,
      semanticScore,
      hasCrisis
    };
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

    // 这里可以根据地区返回不同的热线
    return nationalHotlines;
  }
}
