// 微信 API 封装

export interface Code2SessionResult {
  openid: string;
  session_key: string;
  unionid?: string;
}

export interface WechatPaymentConfig {
  appId: string;
  mchId: string;
  apiKey: string;
  notifyUrl: string;
}

export class WechatAPI {
  private appId: string;
  private appSecret: string;
  private baseUrl = 'https://api.weixin.qq.com';

  constructor(appId: string, appSecret: string) {
    this.appId = appId;
    this.appSecret = appSecret;
  }

  /**
   * 微信 code2Session - 换取用户 openid
   */
  async code2Session(code: string): Promise<Code2SessionResult> {
    if (!code) {
      throw new Error('code is required');
    }
    if (!this.appId || !this.appSecret) {
      throw new Error('WeChat appId and appSecret are not configured');
    }

    const url = `${this.baseUrl}/sns/jscode2session` +
      `?appid=${this.appId}` +
      `&secret=${this.appSecret}` +
      `&js_code=${code}` +
      `&grant_type=authorization_code`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Wechat API error: ${response.status}`);
    }

    const data = await response.json() as any;

    if (data.errcode) {
      throw new Error(`Wechat API error: ${data.errmsg} (code: ${data.errcode})`);
    }

    return {
      openid: data.openid,
      session_key: data.session_key,
      unionid: data.unionid
    };
  }

  /**
   * 生成订单号
   */
  generateOrderNo(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `MD${timestamp}${random}`;
  }

  /**
   * 验证微信支付回调签名（HMAC-SHA256）
   */
  verifyPaymentCallback(data: Record<string, string>, apiKey: string): boolean {
    const { sign, ...rest } = data;
    if (!sign) return false;

    const sortedKeys = Object.keys(rest).sort();
    const stringA = sortedKeys
      .filter(k => rest[k] !== '' && rest[k] !== undefined && rest[k] !== null)
      .map(k => `${k}=${rest[k]}`)
      .join('&');
    const stringSignTemp = `${stringA}&key=${apiKey}`;

    const crypto = require('crypto');
    const calculatedSign = crypto
      .createHmac('sha256', apiKey)
      .update(stringSignTemp)
      .digest('hex')
      .toUpperCase();

    return calculatedSign === sign;
  }
}

function getEnvOrEmpty(name: string): string {
  return process.env[name] || '';
}

// 默认实例（懒加载环境变量，避免启动时崩溃）
export const wechatAPI = new WechatAPI(
  getEnvOrEmpty('WECHAT_APP_ID'),
  getEnvOrEmpty('WECHAT_APP_SECRET')
);
