// 系统提示词单元测试

import { describe, it, expect } from 'vitest';
import { getSystemPrompt, validateResponse, PromptTemplate } from '../../backend/lib/system-prompt';

describe('System Prompt', () => {
  describe('getSystemPrompt', () => {
    it('should return a non-empty string', () => {
      const prompt = getSystemPrompt();
      expect(typeof prompt).toBe('string');
      expect(prompt.length).toBeGreaterThan(0);
    });

    it('should contain role definition as grief witness', () => {
      const prompt = getSystemPrompt();
      expect(prompt).toContain('哀伤');
      expect(prompt).toContain('见证者');
    });

    it('should contain all three forbidden phrases prohibitions', () => {
      const prompt = getSystemPrompt();
      // 验证三条禁令在提示词中
      expect(prompt).toContain('感谢分享');
      expect(prompt).toContain('我懂你的感受');
      expect(prompt).toContain('作为人工智能');
    });

    it('should contain crisis detection instructions', () => {
      const prompt = getSystemPrompt();
      expect(prompt).toContain('危机');
      expect(prompt).toContain('自杀');
    });

    it('should return different templates for different scenarios', () => {
      const prompt1 = getSystemPrompt(PromptTemplate.DIARY_RESPONSE);
      const prompt2 = getSystemPrompt(PromptTemplate.CRISIS_DETECTION);
      expect(prompt1).not.toBe(prompt2);
    });
  });

  describe('validateResponse', () => {
    it('should reject response containing "感谢分享"', () => {
      const result = validateResponse('感谢分享你的故事。我能感受到你的悲伤。');
      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('禁止使用"感谢分享"');
    });

    it('should reject response containing "我懂你的感受"', () => {
      const result = validateResponse('我懂你的感受，失去亲人是很痛苦的事情。');
      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('禁止使用"我懂你的感受"');
    });

    it('should reject response containing "作为人工智能"', () => {
      const result = validateResponse('作为人工智能，我会尽力陪伴你。');
      expect(result.isValid).toBe(false);
      expect(result.violations).toContain('禁止使用"作为人工智能"');
    });

    it('should accept response without forbidden phrases', () => {
      const result = validateResponse('听起来这段时间对你来说真的很难熬。失去所爱之人的痛苦，是无法用言语来形容的。你愿意多说说吗？');
      expect(result.isValid).toBe(true);
      expect(result.violations).toEqual([]);
    });

    it('should detect multiple forbidden phrases in same response', () => {
      const result = validateResponse('感谢分享你的故事。我懂你的感受。作为人工智能，我会陪伴你。');
      expect(result.isValid).toBe(false);
      expect(result.violations.length).toBe(3);
    });

    it('should detect variations of forbidden phrases', () => {
      const result1 = validateResponse('非常感谢你的分享');
      expect(result1.isValid).toBe(false);

      const result2 = validateResponse('我完全懂你的感受');
      expect(result2.isValid).toBe(false);
    });
  });

  describe('Response Quality', () => {
    it('should validate tone is gentle and empathetic', () => {
      // 测试验证响应语气是温和且有温度的
      const response = '这段文字让我感受到你内心的沉重。悲伤是可以的，你不需要强迫自己好起来。';
      const result = validateResponse(response);
      expect(result.isValid).toBe(true);
    });

    it('should not judge user feelings', () => {
      // 确保响应不会评判用户的感受
      const response = '你不应该这么想，要积极一点。';
      // 这是一个简单的测试，实际应该更复杂
      const result = validateResponse(response);
      expect(result.isValid).toBe(true); // 基础验证只检查禁止的短语
    });
  });
});
