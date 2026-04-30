// 通义千问 LLM 提供商实现

import type { LLMProvider, LLMRequest, LLMResponse } from '../types/llm.js';

export interface QwenConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export class QwenProvider implements LLMProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: QwenConfig) {
    this.apiKey = config.apiKey;
    this.model = config.model || 'qwen-turbo';
    this.baseUrl = config.baseUrl || 'https://dashscope.aliyuncs.com/api/v1';
  }

  getName(): string {
    return 'qwen';
  }

  async chat(request: LLMRequest): Promise<LLMResponse> {
    const url = `${this.baseUrl}/services/aigc/text-generation/generation`;

    const body = {
      model: request.model || this.model,
      input: {
        messages: request.messages
      },
      parameters: {
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 1000,
        result_format: 'message'
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Qwen API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    // 处理两种可能的响应格式
    const choices = data.output?.choices || data.choices;
    if (!Array.isArray(choices) || choices.length === 0) {
      throw new Error('Invalid LLM response: empty choices');
    }
    const firstChoice = choices[0];
    const content = firstChoice?.message?.content;
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid LLM response: missing content');
    }

    const usage = data.usage || {};

    return {
      content,
      model: data.model || this.model,
      provider: this.getName(),
      usage: usage.input_tokens ? {
        promptTokens: usage.input_tokens,
        completionTokens: usage.output_tokens,
        totalTokens: usage.total_tokens
      } : usage.prompt_tokens ? {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      } : undefined
    };
  }

  async ping(): Promise<boolean> {
    try {
      await this.chat({
        messages: [{ role: 'user', content: 'ping' }],
        maxTokens: 5
      });
      return true;
    } catch {
      return false;
    }
  }
}
