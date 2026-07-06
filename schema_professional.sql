-- =====================================================
-- KSU Admission Portal - Professional Database Schema
-- Execute this entire script in Supabase SQL Editor
-- =====================================================

-- 0. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. PROFILES - Student Registration & Personal Info
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  full_name_en TEXT DEFAULT '',
  national_id TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  nationality TEXT DEFAULT 'saudi',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. ACADEMIC RECORDS - Grades & Weighted Scores
-- =====================================================
CREATE TABLE IF NOT EXISTS academic_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  high_school_gpa NUMERIC(5,2) DEFAULT 0,
  qudurat_score NUMERIC(5,2) DEFAULT 0,
  tahsili_score NUMERIC(5,2) DEFAULT 0,
  weighted_average NUMERIC(5,2) DEFAULT 0,
  high_school_type TEXT DEFAULT 'scientific',
  graduation_year TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. APPLICATIONS - College/Diploma Applications
-- =====================================================
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  diploma_name TEXT NOT NULL,
  track_type TEXT DEFAULT '',
  fee_amount NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. SUBSCRIPTIONS - Payment & Card Tokenization
-- =====================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  gateway_token TEXT DEFAULT '',
  masked_card TEXT DEFAULT '',
  cardholder_name TEXT DEFAULT '',
  payment_method TEXT DEFAULT 'mada',
  total_amount NUMERIC(10,2) DEFAULT 0,
  transaction_id TEXT DEFAULT '',
  billing_status TEXT DEFAULT 'active' CHECK (billing_status IN ('active', 'suspended', 'cancelled')),
  next_payment_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 year',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. ADMIN USERS - Dashboard Access Control
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT DEFAULT 'Administrator',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. FEE STRUCTURE - Configurable College Fees
-- =====================================================
CREATE TABLE IF NOT EXISTS fee_structure (
  id SERIAL PRIMARY KEY,
  application_fee NUMERIC(10,2) DEFAULT 200,
  colleges JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure ENABLE ROW LEVEL SECURITY;

-- --- PROFILES: students can read/update own; admin can read all ---
CREATE POLICY "profiles_own_select" ON profiles
  FOR SELECT USING (auth.uid()::text = id::text OR current_setting('app.is_admin') = 'true');

CREATE POLICY "profiles_own_insert" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (auth.uid()::text = id::text);

-- --- ACADEMIC RECORDS: students can read/insert own; admin all ---
CREATE POLICY "academic_own_select" ON academic_records
  FOR SELECT USING (auth.uid()::text = user_id::text OR current_setting('app.is_admin') = 'true');

CREATE POLICY "academic_own_insert" ON academic_records
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "academic_own_update" ON academic_records
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- --- APPLICATIONS: students can read/insert own; admin all ---
CREATE POLICY "applications_own_select" ON applications
  FOR SELECT USING (auth.uid()::text = user_id::text OR current_setting('app.is_admin') = 'true');

CREATE POLICY "applications_own_insert" ON applications
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "applications_admin_update" ON applications
  FOR UPDATE USING (current_setting('app.is_admin') = 'true');

-- --- SUBSCRIPTIONS: students can read own; admin all ---
CREATE POLICY "subscriptions_own_select" ON subscriptions
  FOR SELECT USING (auth.uid()::text = user_id::text OR current_setting('app.is_admin') = 'true');

CREATE POLICY "subscriptions_own_insert" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- --- FEE STRUCTURE: everyone can read; only admin can update ---
CREATE POLICY "fee_structure_select" ON fee_structure
  FOR SELECT USING (true);

CREATE POLICY "fee_structure_admin" ON fee_structure
  FOR ALL USING (current_setting('app.is_admin') = 'true');

-- =====================================================
-- SEED DATA
-- =====================================================

-- Seed admin user (password is hashed, use bcrypt in production)
INSERT INTO admin_users (email, password_hash, full_name)
VALUES ('aszxgvhbqw@gmail.com', 'admin_hash_placeholder', 'مدير النظام')
ON CONFLICT (email) DO NOTHING;

-- Seed fee structure
INSERT INTO fee_structure (application_fee, colleges)
SELECT 200, '{
  "الطب البشري": { "saudi": 25000, "nonSaudi": 150000, "diploma": null },
  "طب الأسنان": { "saudi": 20000, "nonSaudi": 120000, "diploma": null },
  "الصيدلة": { "saudi": 15000, "nonSaudi": 100000, "diploma": null },
  "علوم الحاسب": { "saudi": 10000, "nonSaudi": 70000, "diploma": 35000 },
  "الهندسة الكهربائية": { "saudi": 8000, "nonSaudi": 65000, "diploma": 32000 },
  "إدارة الأعمال": { "saudi": 8000, "nonSaudi": 55000, "diploma": 28000 }
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM fee_structure);

-- =====================================================
-- HELPER FUNCTION: Set admin context for RLS bypass
-- =====================================================
CREATE OR REPLACE FUNCTION set_admin_context()
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.is_admin', 'true', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant usage to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
