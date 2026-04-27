-- AI 哀伤引导日记 - 数据库 Schema
-- 腾讯云 PostgreSQL

-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    openid VARCHAR(100) UNIQUE NOT NULL,
    nickname VARCHAR(100),
    avatar_url VARCHAR(500),
    relationship TEXT, -- 与逝者的关系
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE
);

-- 日记表
CREATE TABLE diaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    emotion_tag VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- AI 回应用
CREATE TABLE ai_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id UUID REFERENCES diaries(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    model_provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 危机检测日志 (PIPL 合规：只存结果不存全文)
CREATE TABLE crisis_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    diary_id UUID REFERENCES diaries(id) ON DELETE CASCADE,
    risk_level VARCHAR(20) NOT NULL, -- low, medium, high, critical
    detected_keywords TEXT[] DEFAULT '{}',
    semantic_score NUMERIC(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 订阅表
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'free', -- free, premium
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, cancelled, expired
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 支付订单表
CREATE TABLE payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_no VARCHAR(100) UNIQUE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'CNY',
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, success, failed, refunded
    transaction_id VARCHAR(200),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_diaries_user_id ON diaries(user_id);
CREATE INDEX idx_diaries_created_at ON diaries(created_at);
CREATE INDEX idx_crisis_logs_user_id ON crisis_logs(user_id);
CREATE INDEX idx_crisis_logs_created_at ON crisis_logs(created_at);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);

-- 自动更新 updated_at 触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_diaries_updated_at BEFORE UPDATE ON diaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_orders_updated_at BEFORE UPDATE ON payment_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
