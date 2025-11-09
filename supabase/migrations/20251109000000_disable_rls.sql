-- Migration: Disable Row Level Security (RLS)
-- Purpose: Disable RLS on all tables to allow unrestricted access
-- Affected tables: flashcard_sets, flashcards, error_logs
-- Note: This removes data isolation - use only for development/testing

-- =====================================================
-- DISABLE ROW LEVEL SECURITY
-- =====================================================

-- disable rls on all tables
alter table flashcard_sets disable row level security;
alter table flashcards disable row level security;
alter table error_logs disable row level security;

