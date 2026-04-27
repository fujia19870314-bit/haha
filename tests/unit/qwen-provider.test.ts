// 通义千问 LLM 提供商单元测试

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QwenProvider } from '../../backend/lib/qwen-provider';

// Mock fetch
global.fetch = vi.fn();

describe('QwenProvider', () => {
  let provider: QwenProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new QwenProvider({
      apiKey: 'test-api-key',
      model: 'qwen-turbo'
    });
  });

  it('should create instance with config', () => {
    expect(provider).toBeDefined();
    expect(provider.getName()).toBe('qwen');
  });

  it('should format messages correctly for Qwen API', async () => {
    const mockResponse = {
      output: {
        choices: [{
          message: { role: 'assistant', content: 'Hello from Qwen' }
        }]
      },
      usage: {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15
      },
      model: 'qwen-turbo'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const response = await provider.chat({
      messages: [
        { role: 'system', content: 'You are a helper' },
        { role: 'user', content: 'Hello' }
      ]
    });

    expect(global.fetch).toHaveBeenCalled();
    const fetchArgs = (global.fetch as any).mock.calls[0];
    const body = JSON.parse(fetchArgs[1].body);

    expect(body.input.messages).toHaveLength(2);
    expect(body.input.messages[0].role).toBe('system');
    expect(body.input.messages[1].role).toBe('user');
  });

  it('should return correct LLMResponse format', async () => {
    const mockResponse = {
      output: {
        choices: [{
          message: { role: 'assistant', content: 'Test response content' }
        }]
      },
      usage: {
        input_tokens: 10,
        output_tokens: 5,
        total_tokens: 15
      },
      model: 'qwen-turbo'
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const response = await provider.chat({
      messages: [{ role: 'user', content: 'Hello' }]
    });

    expect(response.content).toBe('Test response content');
    expect(response.provider).toBe('qwen');
    expect(response.model).toBe('qwen-turbo');
    expect(response.usage).toEqual({
      promptTokens: 10,
      completionTokens: 5,
      totalTokens: 15
    });
  });

  it('should throw error when API call fails', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    });

    await expect(provider.chat({
      messages: [{ role: 'user', content: 'Hello' }]
    })).rejects.toThrow();
  });

  it('should handle ping successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        output: {
          choices: [{
            message: { role: 'assistant', content: 'pong' }
          }]
        },
        usage: {},
        model: 'qwen-turbo'
      })
    });

    const result = await provider.ping();
    expect(result).toBe(true);
  });

  it('should return false on ping failure', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const result = await provider.ping();
    expect(result).toBe(false);
  });
});
