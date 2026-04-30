-- PostgreSQL schema for mourning-diary
-- Run this to initialize the database

-- Users table (dual-platform: WeChat + Web)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  openid VARCHAR(64) UNIQUE,
  unionid VARCHAR(64),
  nickname VARCHAR(100),
  avatar TEXT,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  grief_stage VARCHAR(20) NOT NULL DEFAULT 'acceptance',
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  encrypted_content TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  emotion_tag VARCHAR(50) NOT NULL,
  crisis_detected BOOLEAN NOT NULL DEFAULT FALSE,
  crisis_risk_level VARCHAR(20) NOT NULL DEFAULT 'low',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Prompt templates table
CREATE TABLE IF NOT EXISTS prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  is_anniversary BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Payment orders table
CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_no VARCHAR(64) NOT NULL UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  prepay_id VARCHAR(128),
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Therapists table
CREATE TABLE IF NOT EXISTS therapists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  title VARCHAR(200) NOT NULL,
  city VARCHAR(50) NOT NULL,
  specialties TEXT[] NOT NULL DEFAULT '{}',
  phone VARCHAR(20),
  platform_url TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_no ON payment_orders(order_no);
CREATE INDEX IF NOT EXISTS idx_therapists_city ON therapists(city);
CREATE INDEX IF NOT EXISTS idx_prompts_stage ON prompt_templates(stage, is_anniversary);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_orders_updated_at ON payment_orders;
CREATE TRIGGER update_payment_orders_updated_at BEFORE UPDATE ON payment_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default prompt templates
INSERT INTO prompt_templates (stage, content, is_anniversary)
SELECT 'acceptance', '今天想起他/她的时候，有什么温暖的回忆吗？', FALSE
WHERE NOT EXISTS (SELECT 1 FROM prompt_templates LIMIT 1);

INSERT INTO prompt_templates (stage, content, is_anniversary)
SELECT 'acceptance', '如果此刻可以对TA说一句话，你想说什么？', FALSE
WHERE NOT EXISTS (SELECT 1 FROM prompt_templates WHERE content = '如果此刻可以对TA说一句话，你想说什么？');

INSERT INTO prompt_templates (stage, content, is_anniversary)
SELECT 'acceptance', '今天过得怎么样？想写什么都可以。', FALSE
WHERE NOT EXISTS (SELECT 1 FROM prompt_templates WHERE content = '今天过得怎么样？想写什么都可以。');

INSERT INTO prompt_templates (stage, content, is_anniversary)
SELECT 'acceptance', '今天是特别的日子，你还好吗？', TRUE
WHERE NOT EXISTS (SELECT 1 FROM prompt_templates WHERE content = '今天是特别的日子，你还好吗？');

INSERT INTO prompt_templates (stage, content, is_anniversary)
SELECT 'denial', '试着描述一下现在的感受，不用急着接受什么。', FALSE
WHERE NOT EXISTS (SELECT 1 FROM prompt_templates WHERE content = '试着描述一下现在的感受，不用急着接受什么。');

INSERT INTO prompt_templates (stage, content, is_anniversary)
SELECT 'anger', '愤怒也是一种力量，它想告诉你什么？', FALSE
WHERE NOT EXISTS (SELECT 1 FROM prompt_templates WHERE content = '愤怒也是一种力量，它想告诉你什么？');

INSERT INTO prompt_templates (stage, content, is_anniversary)
SELECT 'bargaining', '如果一切可以重来，你最想改变什么？', FALSE
WHERE NOT EXISTS (SELECT 1 FROM prompt_templates WHERE content = '如果一切可以重来，你最想改变什么？');

INSERT INTO prompt_templates (stage, content, is_anniversary)
SELECT 'depression', '难过的时候，你通常会怎么做？', FALSE
WHERE NOT EXISTS (SELECT 1 FROM prompt_templates WHERE content = '难过的时候，你通常会怎么做？');
