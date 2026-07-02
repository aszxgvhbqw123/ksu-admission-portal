-- =====================================================
-- KSU Admission Portal - Supabase Schema
-- Instructions: Go to Supabase Dashboard → SQL Editor
-- Paste and run this entire script
-- =====================================================

-- 1. students: user registration data
CREATE TABLE IF NOT EXISTS students (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name_arabic TEXT NOT NULL,
  full_name_english TEXT DEFAULT '',
  national_id TEXT DEFAULT '',
  email TEXT DEFAULT '',
  mobile TEXT DEFAULT '',
  nationality TEXT DEFAULT 'saudi',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. academic_records: academic data per student
CREATE TABLE IF NOT EXISTS academic_records (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_email TEXT DEFAULT '',
  high_school_gpa NUMERIC DEFAULT 0,
  qudurat_score NUMERIC DEFAULT 0,
  tahsili_score NUMERIC DEFAULT 0,
  weighted_average NUMERIC DEFAULT 0,
  high_school_type TEXT DEFAULT 'scientific',
  graduation_year TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. preferences: college preferences per student
CREATE TABLE IF NOT EXISTS preferences (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_email TEXT DEFAULT '',
  preferences JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. payments: payment records
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  cardholder_name TEXT DEFAULT '',
  card_number TEXT DEFAULT '',
  expiry_date TEXT DEFAULT '',
  payment_method TEXT DEFAULT '',
  total_amount NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'pending',
  transaction_id TEXT DEFAULT '',
  student_email TEXT DEFAULT '',
  student_national_id TEXT DEFAULT '',
  timestamp TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. admin_users: manually added by admin
CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  full_name_arabic TEXT DEFAULT '',
  national_id TEXT DEFAULT '',
  email TEXT DEFAULT '',
  mobile TEXT DEFAULT '',
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  is_admin_added BOOLEAN DEFAULT TRUE
);

-- 6. fee_structure: single-row config
CREATE TABLE IF NOT EXISTS fee_structure (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_fee NUMERIC DEFAULT 200,
  colleges JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. mfa_codes: one-time codes
CREATE TABLE IF NOT EXISTS mfa_codes (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  mobile TEXT DEFAULT '',
  code TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

-- 8. csrf_tokens
CREATE TABLE IF NOT EXISTS csrf_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  token TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. auth_tokens: simple session management
CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_email TEXT DEFAULT '',
  token TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours'
);

-- =====================================================
-- Seed data: default fee structure
-- =====================================================
INSERT INTO fee_structure (application_fee, colleges)
SELECT 200, '{
  "الطب البشري": { "saudi": 25000, "nonSaudi": 150000, "diploma": null },
  "طب الأسنان": { "saudi": 20000, "nonSaudi": 120000, "diploma": null },
  "الصيدلة": { "saudi": 15000, "nonSaudi": 100000, "diploma": null },
  "العلوم الطبية التطبيقية": { "saudi": 12000, "nonSaudi": 80000, "diploma": 45000 },
  "علوم الحاسب": { "saudi": 10000, "nonSaudi": 70000, "diploma": 35000 },
  "الأمن السيبراني": { "saudi": 12000, "nonSaudi": 75000, "diploma": 40000 },
  "الهندسة المدنية": { "saudi": 8000, "nonSaudi": 65000, "diploma": 32000 },
  "الهندسة الكهربائية": { "saudi": 8000, "nonSaudi": 65000, "diploma": 32000 },
  "الهندسة الميكانيكية": { "saudi": 8000, "nonSaudi": 65000, "diploma": 32000 },
  "القانون": { "saudi": 7000, "nonSaudi": 50000, "diploma": 25000 },
  "إدارة الأعمال": { "saudi": 8000, "nonSaudi": 55000, "diploma": 28000 },
  "اللغات والترجمة": { "saudi": 5000, "nonSaudi": 45000, "diploma": 22000 },
  "الآداب والعلوم الإنسانية": { "saudi": 4000, "nonSaudi": 40000, "diploma": 20000 },
  "التربية": { "saudi": 4000, "nonSaudi": 40000, "diploma": 20000 }
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM fee_structure);

-- =====================================================
-- Enable Row Level Security (optional - disabled for simplicity)
-- =====================================================
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure DISABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE csrf_tokens DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth_tokens DISABLE ROW LEVEL SECURITY;
