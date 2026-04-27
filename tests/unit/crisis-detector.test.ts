// 危机检测模块单元测试

import { describe, it, expect, beforeEach } from 'vitest';
import { CrisisDetector } from '../../backend/lib/crisis-detector';

describe('CrisisDetector', () => {
  let detector: CrisisDetector;

  beforeEach(() => {
    detector = new CrisisDetector();
  });

  describe('Keyword Matching', () => {
    it('should detect suicide related keywords', () => {
      const result = detector.detectKeywords('我想自杀，活着没有意义');
      expect(result).toContain('自杀');
    });

    it('should detect self-harm related keywords', () => {
      const result = detector.detectKeywords('我想割腕，这样就不会痛了');
      expect(result.some(k => ['自残', '割腕'].includes(k))).toBe(true);
    });

    it('should detect death wish keywords', () => {
      const result = detector.detectKeywords('希望我可以早点死');
      expect(result).toContain('死');
    });

    it('should return empty array when no crisis keywords found', () => {
      const result = detector.detectKeywords('今天心情还好，想起了以前的时光');
      expect(result).toEqual([]);
    });

    it('should match keywords regardless of context', () => {
      const result = detector.detectKeywords('有时候真的想去死，一了百了');
      expect(result).toContain('去死');
    });
  });

  describe('Risk Level Calculation', () => {
    it('should return critical risk for explicit suicide intention', () => {
      const result = detector.calculateRiskLevel(['自杀', '想死', '割腕']);
      expect(result).toBe('critical');
    });

    it('should return high risk for multiple crisis keywords', () => {
      const result = detector.calculateRiskLevel(['死', '痛苦']);
      expect(result).toBe('high');
    });

    it('should return medium risk for single weak crisis keyword', () => {
      const result = detector.calculateRiskLevel(['好累']);
      expect(result).toBe('medium');
    });

    it('should return low risk when no keywords found', () => {
      const result = detector.calculateRiskLevel([]);
      expect(result).toBe('low');
    });
  });

  describe('Semantic Analysis', () => {
    it('should calculate higher score for explicit crisis content', () => {
      const score1 = detector.calculateSemanticScore('我今天晚上就要自杀，再见了这个世界');
      const score2 = detector.calculateSemanticScore('今天心情有点低落');
      expect(score1).toBeGreaterThan(score2);
    });

    it('should return score between 0 and 1', () => {
      const score = detector.calculateSemanticScore('任意内容');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('Full Detection', () => {
    it('should detect critical crisis correctly', async () => {
      const result = await detector.detect('我已经买好了安眠药，今天晚上就可以结束一切了');
      expect(result.hasCrisis).toBe(true);
      expect(result.riskLevel).toBe('critical');
      expect(result.detectedKeywords.length).toBeGreaterThan(0);
      expect(result.semanticScore).toBeGreaterThan(0.7);
    });

    it('should detect high risk crisis correctly', async () => {
      const result = await detector.detect('活着真的太累了，也许死了更好');
      expect(result.hasCrisis).toBe(true);
      expect(['high', 'critical']).toContain(result.riskLevel);
    });

    it('should return no crisis for normal content', async () => {
      const result = await detector.detect('今天去了我们以前常去的公园，想起了很多美好的时光。妈妈，我想你了。');
      expect(result.hasCrisis).toBe(false);
      expect(result.riskLevel).toBe('low');
      expect(result.detectedKeywords).toEqual([]);
    });

    it('should detect medium risk for negative emotions without explicit crisis', async () => {
      const result = await detector.detect('我真的好痛苦，每天都很难受，不知道该怎么办');
      expect(result.riskLevel).toBe('medium');
      expect(result.hasCrisis).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string gracefully', async () => {
      const result = await detector.detect('');
      expect(result.hasCrisis).toBe(false);
      expect(result.riskLevel).toBe('low');
    });

    it('should handle very short text', async () => {
      const result = await detector.detect('想死');
      expect(result.hasCrisis).toBe(true);
    });

    it('should be case insensitive', async () => {
      const result = await detector.detect('我想ZI SHA');
      expect(result.hasCrisis).toBe(true);
    });
  });
});
