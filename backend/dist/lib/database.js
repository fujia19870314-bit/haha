// 数据库访问层 - 仓储模式
// 根据环境变量自动选择 InMemory（开发/测试）或 PostgreSQL（生产）
import { PostgreSQLDatabase } from './pg-database.js';
// 内存数据库用于测试和无数据库环境
export class InMemoryDatabase {
    users = new Map();
    journals = new Map();
    prompts = new Map();
    orders = new Map();
    therapists = new Map();
    // 用户操作
    async createUser(data) {
        const now = new Date();
        const user = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        };
        this.users.set(user.id, user);
        return user;
    }
    async getUserById(id) {
        return this.users.get(id) || null;
    }
    async getUserByOpenid(openid) {
        for (const user of this.users.values()) {
            if (user.openid === openid) {
                return user;
            }
        }
        return null;
    }
    async getUserByEmail(email) {
        for (const user of this.users.values()) {
            if (user.email === email) {
                return user;
            }
        }
        return null;
    }
    async updatePassword(id, passwordHash) {
        const user = this.users.get(id);
        if (!user)
            return null;
        const updated = {
            ...user,
            passwordHash,
            updatedAt: new Date(),
        };
        this.users.set(id, updated);
        return updated;
    }
    async updateUser(id, data) {
        const user = this.users.get(id);
        if (!user)
            return null;
        const updated = {
            ...user,
            ...data,
            updatedAt: new Date(),
        };
        this.users.set(id, updated);
        return updated;
    }
    // 日记操作
    async createJournal(data) {
        const now = new Date();
        const journal = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        };
        this.journals.set(journal.id, journal);
        return journal;
    }
    async getJournalById(id) {
        return this.journals.get(id) || null;
    }
    async getJournalsByUserId(userId, limit = 20) {
        const result = [];
        for (const journal of this.journals.values()) {
            if (journal.userId === userId) {
                result.push(journal);
            }
        }
        return result
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit);
    }
    // 提示词模板操作
    async createPrompt(data) {
        const prompt = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date(),
        };
        this.prompts.set(prompt.id, prompt);
        return prompt;
    }
    async getPromptsByStage(stage, isAnniversary = false) {
        const result = [];
        for (const prompt of this.prompts.values()) {
            if (prompt.stage === stage && prompt.isAnniversary === isAnniversary) {
                result.push(prompt);
            }
        }
        return result;
    }
    // 订单操作
    async createOrder(data) {
        const now = new Date();
        const order = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: now,
            updatedAt: now,
        };
        this.orders.set(order.id, order);
        return order;
    }
    async getOrderByOrderNo(orderNo) {
        for (const order of this.orders.values()) {
            if (order.orderNo === orderNo) {
                return order;
            }
        }
        return null;
    }
    async updateOrder(id, data) {
        const order = this.orders.get(id);
        if (!order)
            return null;
        const updated = {
            ...order,
            ...data,
            updatedAt: new Date(),
        };
        this.orders.set(id, updated);
        return updated;
    }
    // 咨询师操作
    async createTherapist(data) {
        const therapist = {
            ...data,
            id: crypto.randomUUID(),
            createdAt: new Date(),
        };
        this.therapists.set(therapist.id, therapist);
        return therapist;
    }
    async getTherapistsByCity(city) {
        const result = [];
        for (const therapist of this.therapists.values()) {
            if (therapist.city === city || city === 'all') {
                result.push(therapist);
            }
        }
        return result;
    }
    async getAllTherapists() {
        return Array.from(this.therapists.values());
    }
    // 清空数据（用于测试）
    clear() {
        this.users.clear();
        this.journals.clear();
        this.prompts.clear();
        this.orders.clear();
        this.therapists.clear();
    }
}
// 根据环境选择数据库实现
function createDatabase() {
    if (process.env.DATABASE_URL) {
        console.log('Using PostgreSQL database');
        return new PostgreSQLDatabase(process.env.DATABASE_URL);
    }
    console.log('Using InMemory database (set DATABASE_URL for PostgreSQL)');
    return new InMemoryDatabase();
}
// 单例实例 - 所有模块通过此实例访问数据库
export const db = createDatabase();
//# sourceMappingURL=database.js.map