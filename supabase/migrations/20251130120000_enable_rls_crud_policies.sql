-- Migration: Enable Row Level Security (RLS) with CRUD Policies
-- Purpose: Re-enable RLS and create granular security policies for data isolation
-- Affected tables: flashcard_sets, flashcards, error_logs
-- Special considerations:
--   - Policies are separated by role (anon, authenticated) for granular control
--   - Each CRUD operation has its own policy per role
--   - Anonymous users have no access to these tables (user data only)
--   - error_logs is append-only (no update/delete policies)

-- =====================================================
-- 1. ENABLE ROW LEVEL SECURITY
-- =====================================================

-- re-enable rls on all tables to ensure data isolation between users
alter table flashcard_sets enable row level security;
alter table flashcards enable row level security;
alter table error_logs enable row level security;

-- =====================================================
-- 2. RLS POLICIES FOR flashcard_sets
-- =====================================================

-- -----------------------------------------------------
-- 2.1. Policies for authenticated role
-- Users can only access flashcard sets they own (user_id matches auth.uid())
-- -----------------------------------------------------

-- policy: authenticated users can SELECT their own flashcard sets
-- rationale: users should only see their own data for privacy
create policy "authenticated_select_own_flashcard_sets"
  on flashcard_sets
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy: authenticated users can INSERT flashcard sets for themselves
-- rationale: users can only create sets under their own user_id
create policy "authenticated_insert_own_flashcard_sets"
  on flashcard_sets
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- policy: authenticated users can UPDATE their own flashcard sets
-- rationale: users can only modify sets they own
-- both using and with check ensure ownership before and after update
create policy "authenticated_update_own_flashcard_sets"
  on flashcard_sets
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- policy: authenticated users can DELETE their own flashcard sets
-- rationale: users can only remove sets they own
create policy "authenticated_delete_own_flashcard_sets"
  on flashcard_sets
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------
-- 2.2. Policies for anon role
-- Anonymous users have no access to flashcard_sets (user data only)
-- -----------------------------------------------------

-- policy: anonymous users cannot SELECT any flashcard sets
-- rationale: flashcard sets contain user data, requires authentication
create policy "anon_select_flashcard_sets"
  on flashcard_sets
  for select
  to anon
  using (false);

-- policy: anonymous users cannot INSERT any flashcard sets
-- rationale: creating flashcard sets requires an authenticated user
create policy "anon_insert_flashcard_sets"
  on flashcard_sets
  for insert
  to anon
  with check (false);

-- policy: anonymous users cannot UPDATE any flashcard sets
-- rationale: modifying flashcard sets requires an authenticated user
create policy "anon_update_flashcard_sets"
  on flashcard_sets
  for update
  to anon
  using (false)
  with check (false);

-- policy: anonymous users cannot DELETE any flashcard sets
-- rationale: deleting flashcard sets requires an authenticated user
create policy "anon_delete_flashcard_sets"
  on flashcard_sets
  for delete
  to anon
  using (false);

-- =====================================================
-- 3. RLS POLICIES FOR flashcards
-- =====================================================

-- -----------------------------------------------------
-- 3.1. Policies for authenticated role
-- Users can only access flashcards from sets they own
-- Ownership is verified through join with flashcard_sets table
-- -----------------------------------------------------

-- policy: authenticated users can SELECT flashcards from their own sets
-- rationale: access control inherited from parent flashcard_sets ownership
create policy "authenticated_select_own_flashcards"
  on flashcards
  for select
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.set_id
        and flashcard_sets.user_id = auth.uid()
    )
  );

-- policy: authenticated users can INSERT flashcards into their own sets
-- rationale: users can only add flashcards to sets they own
create policy "authenticated_insert_own_flashcards"
  on flashcards
  for insert
  to authenticated
  with check (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.set_id
        and flashcard_sets.user_id = auth.uid()
    )
  );

-- policy: authenticated users can UPDATE flashcards in their own sets
-- rationale: users can only modify flashcards in sets they own
-- both using and with check verify ownership through flashcard_sets
create policy "authenticated_update_own_flashcards"
  on flashcards
  for update
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.set_id
        and flashcard_sets.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.set_id
        and flashcard_sets.user_id = auth.uid()
    )
  );

-- policy: authenticated users can DELETE flashcards from their own sets
-- rationale: users can only remove flashcards from sets they own
create policy "authenticated_delete_own_flashcards"
  on flashcards
  for delete
  to authenticated
  using (
    exists (
      select 1 from flashcard_sets
      where flashcard_sets.id = flashcards.set_id
        and flashcard_sets.user_id = auth.uid()
    )
  );

-- -----------------------------------------------------
-- 3.2. Policies for anon role
-- Anonymous users have no access to flashcards (user data only)
-- -----------------------------------------------------

-- policy: anonymous users cannot SELECT any flashcards
-- rationale: flashcards contain user data, requires authentication
create policy "anon_select_flashcards"
  on flashcards
  for select
  to anon
  using (false);

-- policy: anonymous users cannot INSERT any flashcards
-- rationale: creating flashcards requires an authenticated user
create policy "anon_insert_flashcards"
  on flashcards
  for insert
  to anon
  with check (false);

-- policy: anonymous users cannot UPDATE any flashcards
-- rationale: modifying flashcards requires an authenticated user
create policy "anon_update_flashcards"
  on flashcards
  for update
  to anon
  using (false)
  with check (false);

-- policy: anonymous users cannot DELETE any flashcards
-- rationale: deleting flashcards requires an authenticated user
create policy "anon_delete_flashcards"
  on flashcards
  for delete
  to anon
  using (false);

-- =====================================================
-- 4. RLS POLICIES FOR error_logs
-- =====================================================

-- -----------------------------------------------------
-- 4.1. Policies for authenticated role
-- error_logs is an append-only table for audit trail integrity
-- Users can only view and create their own error logs
-- NO UPDATE or DELETE policies - errors must be preserved
-- -----------------------------------------------------

-- policy: authenticated users can SELECT their own error logs
-- rationale: users should only see their own errors for debugging
create policy "authenticated_select_own_error_logs"
  on error_logs
  for select
  to authenticated
  using (auth.uid() = user_id);

-- policy: authenticated users can INSERT their own error logs
-- rationale: system records errors under user's id for tracking
create policy "authenticated_insert_own_error_logs"
  on error_logs
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- note: intentionally NO UPDATE policy for error_logs
-- error logs are append-only for audit trail integrity
-- once an error is logged, it should not be modified

-- note: intentionally NO DELETE policy for error_logs
-- error logs must be preserved for debugging and analytics
-- users cannot delete their error history

-- -----------------------------------------------------
-- 4.2. Policies for anon role
-- Anonymous users have no access to error_logs
-- -----------------------------------------------------

-- policy: anonymous users cannot SELECT any error logs
-- rationale: error logs contain user-specific data, requires authentication
create policy "anon_select_error_logs"
  on error_logs
  for select
  to anon
  using (false);

-- policy: anonymous users cannot INSERT any error logs
-- rationale: logging errors requires an authenticated user context
create policy "anon_insert_error_logs"
  on error_logs
  for insert
  to anon
  with check (false);

-- note: no update/delete policies for anon either
-- error_logs is append-only and anonymous users have no access anyway

