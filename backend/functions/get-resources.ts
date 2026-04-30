// 获取心理咨询师目录云函数

import type { ApiResponse, Therapist } from '../types/database.js';
import { db } from '../lib/database.js';

export interface GetResourcesRequest {
  city?: string;
}

export interface GetResourcesResponse {
  therapists: Therapist[];
  hotlines: string[];
  fallbackMessage?: string;
}

const DEFAULT_HOTLINES = [
  '全国心理援助热线：400-161-9995',
  '北京心理危机研究与干预中心：010-82951332',
  '上海心理热线：021-64383562'
];

// 初始咨询师数据（MVP 阶段为静态 curated 列表）
const INITIAL_THERAPISTS: Omit<Therapist, 'id' | 'createdAt'>[] = [
  {
    name: '张咨询师',
    title: '国家二级心理咨询师',
    city: '北京',
    specialties: ['丧亲辅导', '哀伤治疗', '创伤修复'],
    phone: '010-12345678',
    platformUrl: 'https://www.xinli001.com',
    isVerified: true
  },
  {
    name: '李咨询师',
    title: '注册心理师',
    city: '上海',
    specialties: ['临终关怀', '家庭治疗', '抑郁症'],
    phone: '021-87654321',
    platformUrl: 'https://www.simplepsy.cn',
    isVerified: true
  },
  {
    name: '王咨询师',
    title: '心理治疗师',
    city: '广州',
    specialties: ['丧亲辅导', '焦虑障碍', '正念疗法'],
    phone: '020-11223344',
    platformUrl: 'https://www.jiandanxinli.com',
    isVerified: true
  },
  {
    name: '陈咨询师',
    title: '临床心理学硕士',
    city: '深圳',
    specialties: ['哀伤治疗', '认知行为疗法', '危机干预'],
    phone: '0755-55667788',
    platformUrl: 'https://www.xinli001.com',
    isVerified: true
  },
  {
    name: '刘咨询师',
    title: '高级心理咨询师',
    city: '北京',
    specialties: ['家庭系统治疗', '儿童哀伤', '创伤修复'],
    phone: '010-99887766',
    platformUrl: 'https://www.simplepsy.cn',
    isVerified: true
  }
];

export class GetResourcesHandler {
  private initialized = false;

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;

    const existing = await db.getAllTherapists();
    if (existing.length === 0) {
      for (const therapist of INITIAL_THERAPISTS) {
        await db.createTherapist(therapist);
      }
    }
    this.initialized = true;
  }

  /**
   * 获取咨询师目录
   */
  async getResources(request: GetResourcesRequest): Promise<ApiResponse<GetResourcesResponse>> {
    try {
      await this.ensureInitialized();

      const city = request.city?.trim();
      let therapists: Therapist[];
      let fallbackMessage: string | undefined;

      if (city && city !== 'all') {
        therapists = await db.getTherapistsByCity(city);
        if (therapists.length === 0) {
          fallbackMessage = `暂无 ${city} 的咨询师信息，以下是全国心理援助热线：`;
          therapists = await db.getAllTherapists();
        }
      } else {
        therapists = await db.getAllTherapists();
      }

      return {
        success: true,
        data: {
          therapists,
          hotlines: DEFAULT_HOTLINES,
          fallbackMessage
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '获取资源失败'
      };
    }
  }
}

// 默认导出用于云函数
const handler = new GetResourcesHandler();
export default handler;
