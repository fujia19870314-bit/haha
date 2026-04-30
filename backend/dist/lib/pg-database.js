// PostgreSQL 数据库实现 - 生产环境使用
import { Pool } from 'pg';
export class PostgreSQLDatabase {
    pool;
    constructor(connectionString) {
        const connStr = connectionString ||
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
    async close() {
        await this.pool.end();
    }
    async query(sql, params) {
        const result = await this.pool.query(sql, params);
        return result.rows;
    }
    // --- User operations ---
    async createUser(data) {
        const columns = [];
        const placeholders = [];
        const values = [];
        let idx = 1;
        const fields = {
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
        const rows = await this.query(sql, values);
        return this.mapUser(rows[0]);
    }
    async getUserById(id) {
        const rows = await this.query('SELECT * FROM users WHERE id = $1', [id]);
        return rows[0] ? this.mapUser(rows[0]) : null;
    }
    async getUserByOpenid(openid) {
        const rows = await this.query('SELECT * FROM users WHERE openid = $1', [openid]);
        return rows[0] ? this.mapUser(rows[0]) : null;
    }
    async getUserByEmail(email) {
        const rows = await this.query('SELECT * FROM users WHERE email = $1', [email]);
        return rows[0] ? this.mapUser(rows[0]) : null;
    }
    async updatePassword(id, passwordHash) {
        const rows = await this.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 RETURNING *', [passwordHash, id]);
        return rows[0] ? this.mapUser(rows[0]) : null;
    }
    async updateUser(id, data) {
        const setParts = [];
        const values = [];
        let idx = 1;
        const fieldMap = {
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
            const val = data[key];
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
        const rows = await this.query(sql, values);
        return rows[0] ? this.mapUser(rows[0]) : null;
    }
    // --- Journal operations ---
    async createJournal(data) {
        const sql = `
      INSERT INTO journal_entries
        (user_id, encrypted_content, ai_response, emotion_tag, crisis_detected, crisis_risk_level)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const rows = await this.query(sql, [
            data.userId,
            data.encryptedContent,
            data.aiResponse,
            data.emotionTag,
            data.crisisDetected,
            data.crisisRiskLevel,
        ]);
        return this.mapJournal(rows[0]);
    }
    async getJournalById(id) {
        const rows = await this.query('SELECT * FROM journal_entries WHERE id = $1', [id]);
        return rows[0] ? this.mapJournal(rows[0]) : null;
    }
    async getJournalsByUserId(userId, limit = 20) {
        const rows = await this.query(`SELECT * FROM journal_entries
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`, [userId, limit]);
        return rows.map((r) => this.mapJournal(r));
    }
    // --- Prompt operations ---
    async createPrompt(data) {
        const sql = `
      INSERT INTO prompt_templates (stage, content, is_anniversary)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
        const rows = await this.query(sql, [
            data.stage,
            data.content,
            data.isAnniversary,
        ]);
        return this.mapPrompt(rows[0]);
    }
    async getPromptsByStage(stage, isAnniversary = false) {
        const rows = await this.query('SELECT * FROM prompt_templates WHERE stage = $1 AND is_anniversary = $2', [stage, isAnniversary]);
        return rows.map((r) => this.mapPrompt(r));
    }
    // --- Order operations ---
    async createOrder(data) {
        const sql = `
      INSERT INTO payment_orders (user_id, order_no, amount, status, prepay_id, paid_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
        const rows = await this.query(sql, [
            data.userId,
            data.orderNo,
            data.amount,
            data.status,
            data.prepayId ?? null,
            data.paidAt ?? null,
        ]);
        return this.mapOrder(rows[0]);
    }
    async getOrderByOrderNo(orderNo) {
        const rows = await this.query('SELECT * FROM payment_orders WHERE order_no = $1', [orderNo]);
        return rows[0] ? this.mapOrder(rows[0]) : null;
    }
    async updateOrder(id, data) {
        const setParts = [];
        const values = [];
        let idx = 1;
        const fieldMap = {
            status: 'status',
            prepayId: 'prepay_id',
            paidAt: 'paid_at',
        };
        for (const [key, col] of Object.entries(fieldMap)) {
            const val = data[key];
            if (val !== undefined) {
                setParts.push(`${col} = $${idx++}`);
                values.push(val);
            }
        }
        if (setParts.length === 0) {
            const order = await this.query('SELECT * FROM payment_orders WHERE id = $1', [id]);
            return order[0] ? this.mapOrder(order[0]) : null;
        }
        values.push(id);
        const sql = `UPDATE payment_orders SET ${setParts.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
        const rows = await this.query(sql, values);
        return rows[0] ? this.mapOrder(rows[0]) : null;
    }
    // --- Therapist operations ---
    async createTherapist(data) {
        const sql = `
      INSERT INTO therapists (name, title, city, specialties, phone, platform_url, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
        const rows = await this.query(sql, [
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
    async getTherapistsByCity(city) {
        const rows = await this.query('SELECT * FROM therapists WHERE city = $1', [city]);
        return rows.map((r) => this.mapTherapist(r));
    }
    async getAllTherapists() {
        const rows = await this.query('SELECT * FROM therapists');
        return rows.map((r) => this.mapTherapist(r));
    }
    // --- Clear data (testing only) ---
    async clear() {
        await this.pool.query('TRUNCATE TABLE users, journal_entries, prompt_templates, payment_orders, therapists CASCADE');
    }
    // --- Row mappers ---
    mapUser(row) {
        return {
            id: row.id,
            openid: row.openid,
            unionid: row.unionid,
            nickname: row.nickname,
            avatar: row.avatar,
            email: row.email,
            passwordHash: row.password_hash,
            griefStage: row.grief_stage,
            isPremium: row.is_premium,
            trialEndsAt: new Date(row.trial_ends_at),
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
    mapJournal(row) {
        return {
            id: row.id,
            userId: row.user_id,
            encryptedContent: row.encrypted_content,
            aiResponse: row.ai_response,
            emotionTag: row.emotion_tag,
            crisisDetected: row.crisis_detected,
            crisisRiskLevel: row.crisis_risk_level,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
    mapPrompt(row) {
        return {
            id: row.id,
            stage: row.stage,
            content: row.content,
            isAnniversary: row.is_anniversary,
            createdAt: new Date(row.created_at),
        };
    }
    mapOrder(row) {
        return {
            id: row.id,
            userId: row.user_id,
            orderNo: row.order_no,
            amount: Number(row.amount),
            status: row.status,
            prepayId: row.prepay_id,
            paidAt: row.paid_at ? new Date(row.paid_at) : undefined,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
        };
    }
    mapTherapist(row) {
        return {
            id: row.id,
            name: row.name,
            title: row.title,
            city: row.city,
            specialties: row.specialties || [],
            phone: row.phone,
            platformUrl: row.platform_url,
            isVerified: row.is_verified,
            createdAt: new Date(row.created_at),
        };
    }
}
//# sourceMappingURL=pg-database.js.map