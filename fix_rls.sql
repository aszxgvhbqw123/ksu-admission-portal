-- Fix RLS for KSU Admission Portal
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/icinkhzmnigfbclngeaj/sql/new

-- 1. Disable Row Level Security on all tables
ALTER TABLE students DISABLE ROW LEVEL SECURITY;
ALTER TABLE academic_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structure DISABLE ROW LEVEL SECURITY;

-- 2. Grant full permissions to the anonymous role
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 3. Verify tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
