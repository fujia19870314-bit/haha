// PostgreSQL 数据库实现 - 生产环境使用

import { Pool, PoolClient } from 'pg';
import type {
  User,
  JournalEntry,
  PromptTemplate,
  PaymentOrder,
  Therapist,
  GriefStage,
} from '../types/database.js';

export class PostgreSQLDatabase {
  private pool: Pool;

  constructor(connectionString?: string) {
    const connStr =
      connectionString ||
      process.env.DATABASE_URL ||
      'postgresql://mourning:mourning@localhost:5432/mourning_diary';

    this.pool = new Pool({
      connectionString: connStr,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    this.pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err);
    });
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private async query<T>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  // --- User operations ---

  async createUser(
    data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<User> {
    const columns: string[] = [];
    const placeholders: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const fields: Record<string, unknown> = {
      openid: data.openid,
      unionid: data.unionid,
      nickname: data.nickname,
      avatar: data.avatar,
      email: data.email,
      password_hash: data.passwordHash,
      grief_stage: data.griefStage,
      is_premium: data.isPremium,
      trial_ends_at: data.trialEndsAt,
    };

    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) {
        columns.push(key);
        placeholders.push(`$${idx++}`);
        values.push(val);
      }
    }

    const sql = `
      INSERT INTO users (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;
    const rows = await this.query<Record<string, unknown>>(sql, values);
    return this.mapUser(rows[0]);
  }

  async getUserById(id: string): Promise<User | null> {
    const rows = await this.query<Record<string, unknown>>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  async getUserByOpenid(openid: string): Promise<User | null> {
    const rows = await this.query<Record<string, unknown>>(
      'SELECT * FROM users WHERE openid = $1',
      [openid]
    );
    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const rows = await this.query<Record<string, unknown>>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  async updatePassword(id: string, passwordHash: string): Promise<User | null> {
    const rows = await this.query<Record<string, unknown>>(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [passwordHash, id]
    );
    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const setParts: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      openid: 'openid',
      unionid: 'unionid',
      nickname: 'nickname',
      avatar: 'avatar',
      email: 'email',
      passwordHash: 'password_hash',
      griefStage: 'grief_stage',
      isPremium: 'is_premium',
      trialEndsAt: 'trial_ends_at',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      const val = data[key as keyof User];
      if (val !== undefined) {
        setParts.push(`${col} = $${idx++}`);
        values.push(val);
      }
    }

    if (setParts.length === 0) {
      return this.getUserById(id);
    }

    values.push(id);
    const sql = `UPDATE users SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
    const rows = await this.query<Record<string, unknown>>(sql, values);
    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  // --- Journal operations ---

  async createJournal(
    data: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<JournalEntry> {
    const sql = `
      INSERT INTO journal_entries
        (user_id, encrypted_content, ai_response, emotion_tag, crisis_detected, crisis_risk_level)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const rows = await this.query<Record<string, unknown>>(sql, [
      data.userId,
      data.encryptedContent,
      data.aiResponse,
      data.emotionTag,
      data.crisisDetected,
      data.crisisRiskLevel,
    ]);
    return this.mapJournal(rows[0]);
  }

  async getJournalById(id: string): Promise<JournalEntry | null> {
    const rows = await this.query<Record<string, unknown>>(
      'SELECT * FROM journal_entries WHERE id = $1',
      [id]
    );
    return rows[0] ? this.mapJournal(rows[0]) : null;
  }

  async getJournalsByUserId(
    userId: string,
    limit = 20
  ): Promise<JournalEntry[]> {
    const rows = await this.query<Record<string, unknown>>(
      `SELECT * FROM journal_entries
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return rows.map((r) => this.mapJournal(r));
  }

  // --- Prompt operations ---

  async createPrompt(
    data: Omit<PromptTemplate, 'id' | 'createdAt'>
  ): Promise<PromptTemplate> {
    const sql = `
      INSERT INTO prompt_templates (stage, content, is_anniversary)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const rows = await this.query<Record<string, unknown>>(sql, [
      data.stage,
      data.content,
      data.isAnniversary,
    ]);
    return this.mapPrompt(rows[0]);
  }

  async getPromptsByStage(
    stage: GriefStage,
    isAnniversary = false
  ): Promise<PromptTemplate[]> {
    const rows = await this.query<Record<string, unknown>>(
      'SELECT * FROM prompt_templates WHERE stage = $1 AND is_anniversary = $2',
      [stage, isAnniversary]
    );
    return rows.map((r) => this.mapPrompt(r));
  }

  // --- Order operations ---

  async createOrder(
    data: Omit<PaymentOrder, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PaymentOrder> {
    const sql = `
      INSERT INTO payment_orders (user_id, order_no, amount, status, prepay_id, paid_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const rows = await this.query<Record<string, unknown>>(sql, [
      data.userId,
      data.orderNo,
      data.amount,
      data.status,
      data.prepayId ?? null,
      data.paidAt ?? null,
    ]);
    return this.mapOrder(rows[0]);
  }

  async getOrderByOrderNo(orderNo: string): Promise<PaymentOrder | null> {
    const rows = await this.query<Record<string, unknown>>(
      'SELECT * FROM payment_orders WHERE order_no = $1',
      [orderNo]
    );
    return rows[0] ? this.mapOrder(rows[0]) : null;
  }

  async updateOrder(
    id: string,
    data: Partial<PaymentOrder>
  ): Promise<PaymentOrder | null> {
    const setParts: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      status: 'status',
      prepayId: 'prepay_id',
      paidAt: 'paid_at',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      const val = data[key as keyof PaymentOrder];
      if (val !== undefined) {
        setParts.push(`${col} = $${idx++}`);
        values.push(val);
      }
    }

    if (setParts.length === 0) {
      const order = await this.query<Record<string, unknown>>(
        'SELECT * FROM payment_orders WHERE id = $1',
        [id]
      );
      return order[0] ? this.mapOrder(order[0]) : null;
    }

    values.push(id);
    const sql = `UPDATE payment_orders SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
    const rows = await this.query<Record<string, unknown>>(sql, values);
    return rows[0] ? this.mapOrder(rows[0]) : null;
  }

  // --- Therapist operations ---

  async createTherapist(
    data: Omit<Therapist, 'id' | 'createdAt'>
  ): Promise<Therapist> {
    const sql = `
      INSERT INTO therapists (name, title, city, specialties, phone, platform_url, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const rows = await this.query<Record<string, unknown>>(sql, [
      data.name,
      data.title,
      data.city,
      data.specialties,
      data.phone ?? null,
      data.platformUrl ?? null,
      data.isVerified,
    ]);
    return this.mapTherapist(rows[0]);
  }

  async getTherapistsByCity(city: string): Promise<Therapist[]> {
    const rows = await this.query<Record<string, unknown>>(
      'SELECT * FROM therapists WHERE city = $1',
      [city]
    );
    return rows.map((r) => this.mapTherapist(r));
  }

  async getAllTherapists(): Promise<Therapist[]> {
    const rows = await this.query<Record<string, unknown>>(
      'SELECT * FROM therapists'
    );
    return rows.map((r) => this.mapTherapist(r));
  }

  // --- Clear data (testing only) ---

  async clear(): Promise<void> {
    await this.pool.query('TRUNCATE TABLE users, journal_entries, prompt_templates, payment_orders, therapists CASCADE');
  }

  // --- Row mappers ---

  private mapUser(row: Record<string, unknown>): User {
    return {
      id: row.id as string,
      openid: row.openid as string | undefined,
      unionid: row.unionid as string | undefined,
      nickname: row.nickname as string | undefined,
      avatar: row.avatar as string | undefined,
      email: row.email as string | undefined,
      passwordHash: row.password_hash as string | undefined,
      griefStage: row.grief_stage as GriefStage,
      isPremium: row.is_premium as boolean,
      trialEndsAt: new Date(row.trial_ends_at as string),
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapJournal(row: Record<string, unknown>): JournalEntry {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      encryptedContent: row.encrypted_content as string,
      aiResponse: row.ai_response as string,
      emotionTag: row.emotion_tag as string,
      crisisDetected: row.crisis_detected as boolean,
      crisisRiskLevel: row.crisis_risk_level as 'low' | 'medium' | 'high' | 'critical',
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapPrompt(row: Record<string, unknown>): PromptTemplate {
    return {
      id: row.id as string,
      stage: row.stage as GriefStage,
      content: row.content as string,
      isAnniversary: row.is_anniversary as boolean,
      createdAt: new Date(row.created_at as string),
    };
  }

  private mapOrder(row: Record<string, unknown>): PaymentOrder {
    return {
      id: row.id as string,
      userId: row.user_id as string,
      orderNo: row.order_no as string,
      amount: Number(row.amount),
      status: row.status as 'pending' | 'paid' | 'failed' | 'refunded',
      prepayId: row.prepay_id as string | undefined,
      paidAt: row.paid_at ? new Date(row.paid_at as string) : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  private mapTherapist(row: Record<string, unknown>): Therapist {
    return {
      id: row.id as string,
      name: row.name as string,
      title: row.title as string,
      city: row.city as string,
      specialties: (row.specialties as string[]) || [],
      phone: row.phone as string | undefined,
      platformUrl: row.platform_url as string | undefined,
      isVerified: row.is_verified as boolean,
      createdAt: new Date(row.created_at as string),
    };
  }
}
