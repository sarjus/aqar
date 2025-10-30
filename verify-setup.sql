-- ============================================
-- VERIFICATION SCRIPT: Check Admin Setup
-- ============================================
-- Run this in Supabase SQL Editor to diagnose the issue
-- ============================================

-- 1. Check all users in auth.users
SELECT '=== USERS IN AUTH SYSTEM ===' as info;
SELECT 
  id as user_id,
  email,
  created_at,
  email_confirmed_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Check all roles in user_roles
SELECT '=== ROLES IN USER_ROLES TABLE ===' as info;
SELECT 
  user_id,
  email,
  role,
  created_at
FROM user_roles
ORDER BY created_at DESC;

-- 3. Check for mismatches (IMPORTANT!)
SELECT '=== CHECKING FOR MISMATCHES ===' as info;
SELECT 
  u.id as auth_user_id,
  u.email as auth_email,
  ur.user_id as role_user_id,
  ur.email as role_email,
  ur.role,
  CASE 
    WHEN u.id = ur.user_id THEN '✅ MATCH'
    ELSE '❌ MISMATCH - THIS IS THE PROBLEM!'
  END as id_match_status
FROM auth.users u
LEFT JOIN user_roles ur ON u.email = ur.email
ORDER BY u.created_at DESC;

-- 4. Find the specific user (REPLACE EMAIL!)
SELECT '=== YOUR SPECIFIC USER ===' as info;
SELECT 
  u.id as user_id_in_auth,
  u.email,
  ur.user_id as user_id_in_roles_table,
  ur.role,
  CASE 
    WHEN u.id = ur.user_id THEN '✅ IDs Match - This is correct!'
    WHEN ur.user_id IS NULL THEN '❌ No role entry found!'
    ELSE '❌ IDs do not match - This is the problem!'
  END as status
FROM auth.users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'sarju.s@sjcetpalai.ac.in';  -- ⚠️ YOUR EMAIL FROM THE SCREENSHOT

-- 5. Check RLS Policies
SELECT '=== ROW LEVEL SECURITY POLICIES ===' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command
FROM pg_policies
WHERE tablename = 'user_roles';

