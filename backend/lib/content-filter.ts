// 内容安全 - 敏感词过滤模块

// 敏感词分级
const SENSITIVE_WORDS = {
  // 严重违规 - 直接阻断
  blocked: [
    '法轮功', '台独', '疆独', '藏独', '反党', '反革命',
    '色情', '淫秽', '嫖娼', '卖淫', '强奸', '轮奸',
    '毒品', '贩毒', '制毒', '吸毒', '冰毒', '海洛因',
    '赌博', '博彩', '六合彩', '赌球', '赌场',
  ],
  // 中度敏感 - 警告但仍允许（记录日志）
  warning: [
    '傻逼', '他妈的', '草泥马', '去死吧', '滚蛋',
  ],
};

// 构建正则表达式（支持变体）
function buildPattern(words: string[]): RegExp {
  const escaped = words.map(w =>
    w.split('').map(c => {
      if (/[.*+?^${}()|[\]\\]/.test(c)) return '\\' + c;
      return c;
    }).join('[\\s\\-_]*')
  );
  return new RegExp(escaped.join('|'), 'gi');
}

const blockedPattern = buildPattern(SENSITIVE_WORDS.blocked);
const warningPattern = buildPattern(SENSITIVE_WORDS.warning);

export interface FilterResult {
  isClean: boolean;
  hasBlocked: boolean;
  hasWarning: boolean;
  blockedWords: string[];
  warningWords: string[];
  cleanedText: string;
}

/**
 * 检测文本中的敏感词
 */
export function detectSensitiveWords(text: string): FilterResult {
  const blockedWords: string[] = [];
  const warningWords: string[] = [];

  // 检测严重违规词
  let match: RegExpExecArray | null;
  const blockedRegex = new RegExp(blockedPattern.source, 'gi');
  while ((match = blockedRegex.exec(text)) !== null) {
    blockedWords.push(match[0]);
  }

  // 检测警告词
  const warningRegex = new RegExp(warningPattern.source, 'gi');
  while ((match = warningRegex.exec(text)) !== null) {
    warningWords.push(match[0]);
  }

  // 对违规词进行替换（用 * 替代）
  let cleanedText = text;
  if (blockedWords.length > 0) {
    const uniqueBlocked = [...new Set(blockedWords)];
    for (const word of uniqueBlocked) {
      const replacement = '*'.repeat(word.length);
      cleanedText = cleanedText.replace(new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replacement);
    }
  }

  return {
    isClean: blockedWords.length === 0 && warningWords.length === 0,
    hasBlocked: blockedWords.length > 0,
    hasWarning: warningWords.length > 0,
    blockedWords: [...new Set(blockedWords)],
    warningWords: [...new Set(warningWords)],
    cleanedText,
  };
}

/**
 * 快速检查文本是否包含阻断级敏感词
 */
export function hasBlockedWords(text: string): boolean {
  return blockedPattern.test(text);
}

/**
 * 过滤 AI 响应中的敏感内容
 * 对 AI 响应使用更宽松的标准，主要过滤政治敏感内容
 */
export function filterAIResponse(text: string): { isClean: boolean; cleanedText: string } {
  const result = detectSensitiveWords(text);
  return {
    isClean: !result.hasBlocked,
    cleanedText: result.hasBlocked ? result.cleanedText : text,
  };
}

/**
 * 验证日记内容
 * 返回过滤结果，如果包含阻断级词汇则返回错误信息
 */
export function validateJournalContent(content: string): { valid: boolean; error?: string; cleanedContent?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: '日记内容不能为空' };
  }

  if (content.length > 5000) {
    return { valid: false, error: '日记内容过长，请控制在5000字以内' };
  }

  const result = detectSensitiveWords(content);

  if (result.hasBlocked) {
    return {
      valid: false,
      error: '内容包含敏感信息，请修改后重试',
      cleanedContent: result.cleanedText,
    };
  }

  return { valid: true };
}
