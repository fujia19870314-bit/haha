// LLM 抽象层单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { LLMProvider, LLMRequest, LLMResponse } from '../../backend/types/llm';

// Mock 实现用于测试接口
class MockLLMProvider implements LLMProvider {
  async chat(request: LLMRequest): Promise<LLMResponse> {
    return {
      content: 'Mock response',
      model: 'mock-model',
      provider: 'mock',
      usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 }
    };
  }

  async ping(): Promise<boolean> {
    return true;
  }

  getName(): string {
    return 'mock';
  }
}

describe('LLM Provider Interface', () => {
  let provider: LLMProvider;

  beforeEach(() => {
    provider = new MockLLMProvider();
  });

  it('should implement chat method', async () => {
    const request: LLMRequest = {
      messages: [{ role: 'user', content: 'Hello' }]
    };
    const response = await provider.chat(request);
    expect(response.content).toBeDefined();
    expect(response.model).toBeDefined();
    expect(response.provider).toBeDefined();
  });

  it('should implement ping method', async () => {
    const result = await provider.ping();
    expect(typeof result).toBe('boolean');
  });

  it('should implement getName method', () => {
    const name = provider.getName();
    expect(typeof name).toBe('string');
  });
});
