-- Migration: Create Flashcards Schema
-- Purpose: Initialize core database schema for 10xCards application
-- Affected tables: flashcard_sets, flashcards, error_logs
-- Special considerations: 
--   - Implements RLS policies for data isolation
--   - Includes automated triggers for updated_at and source tracking
--   - Creates indexes for query optimization

-- =====================================================
-- 1. CREATE CUSTOM TYPES
-- =====================================================

-- create enum type for tracking flashcard origin
-- values: 'manual' (user-created), 'ai-full' (ai-generated), 'ai-edited' (ai-generated but modified by user)
create type flashcard_source as enum ('manual', 'ai-full', 'ai-edited');

-- =====================================================
-- 2. CREATE TABLES
-- =====================================================

-- -----------------------------------------------------
-- 2.1. flashcard_sets
-- stores collections of flashcards belonging to users
-- -----------------------------------------------------
create table flashcard_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name varchar(100) not null,
  model varchar(100) not null,
  generation_duration integer not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- foreign key constraint with cascade delete
  -- when a user is deleted, all their flashcard sets are automatically removed
  constraint fk_flashcard_sets_user_id 
    foreign key (user_id) 
    references auth.users(id) 
    on delete cascade,
  
  -- ensure unique set names per user
  -- prevents duplicate set names for the same user
  constraint uq_flashcard_sets_user_name 
    unique (user_id, name)
);

-- -----------------------------------------------------
-- 2.2. flashcards
-- stores individual flashcards within sets
-- -----------------------------------------------------
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null,
  avers varchar(200) not null,
  rewers varchar(750) not null,
  source flashcard_source not null,
  flagged boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- foreign key constraint with cascade delete
  -- when a flashcard set is deleted, all contained flashcards are automatically removed
  constraint fk_flashcards_set_id 
    foreign key (set_id) 
    references flashcard_sets(id) 
    on delete cascade,
  
  -- validation: ensure avers (front) is not empty or just whitespace
  constraint chk_flashcards_avers_not_empty 
    check (length(trim(avers)) > 0),
  
  -- validation: ensure rewers (back) is not empty or just whitespace
  constraint chk_flashcards_rewers_not_empty 
    check (length(trim(rewers)) > 0)
);

-- -----------------------------------------------------
-- 2.3. error_logs
-- tracks errors during flashcard operations (primarily ai generation)
-- append-only table for debugging and analytics
-- -----------------------------------------------------
create table error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  model varchar(100) not null,
  error_type varchar(100) not null,
  error_message text not null,
  input_payload jsonb,
  created_at timestamp with time zone not null default now(),
  
  -- foreign key constraint with cascade delete
  -- when a user is deleted, their error logs are automatically removed
  constraint fk_error_logs_user_id 
    foreign key (user_id) 
    references auth.users(id) 
    on delete cascade
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- -----------------------------------------------------
-- 3.1. indexes for flashcard_sets
-- -----------------------------------------------------

-- speeds up queries fetching user's flashcard sets and enforces rls policies
create index idx_flashcard_sets_user_id 
  on flashcard_sets(user_id);

-- optimizes chronological sorting for list views
create index idx_flashcard_sets_created_at 
  on flashcard_sets(created_at desc);

-- supports unique constraint and name-based lookups
create unique index idx_flashcard_sets_user_name 
  on flashcard_sets(user_id, name);

-- -----------------------------------------------------
-- 3.2. indexes for flashcards
-- -----------------------------------------------------

-- speeds up fetching all flashcards from a given set
create index idx_flashcards_set_id 
  on flashcards(set_id);

-- enables quick calculation of ai adoption metrics
create index idx_flashcards_source 
  on flashcards(source);

-- partial index for flagged flashcards (quality analysis)
-- only indexes rows where flagged = true for efficiency
create index idx_flashcards_flagged 
  on flashcards(flagged) 
  where flagged = true;

-- -----------------------------------------------------
-- 3.3. indexes for error_logs
-- -----------------------------------------------------

-- diagnostic queries for specific user
create index idx_error_logs_user_id 
  on error_logs(user_id);

-- chronological sorting of logs
create index idx_error_logs_created_at 
  on error_logs(created_at desc);

-- aggregations and analysis by error type
create index idx_error_logs_error_type 
  on error_logs(error_type);

-- =====================================================
-- 4. CREATE FUNCTIONS AND TRIGGERS
-- =====================================================

-- -----------------------------------------------------
-- 4.1. function to automatically update updated_at timestamp
-- -----------------------------------------------------
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- -----------------------------------------------------
-- 4.2. trigger to update updated_at on flashcard_sets
-- -----------------------------------------------------
create trigger update_flashcard_sets_updated_at
  before update on flashcard_sets
  for each row
  execute function update_updated_at_column();

-- -----------------------------------------------------
-- 4.3. trigger to update updated_at on flashcards
-- -----------------------------------------------------
create trigger update_flashcards_updated_at
  before update on flashcards
  for each row
  execute function update_updated_at_column();

-- -----------------------------------------------------
-- 4.4. function to automatically change source when ai flashcard is edited
-- tracks when users modify ai-generated flashcards
-- -----------------------------------------------------
create or replace function update_flashcard_source_on_edit()
returns trigger as $$
begin
  -- if flashcard was ai-generated and content changed (avers or rewers)
  -- automatically mark it as ai-edited to track user modifications
  if old.source = 'ai-full' and (old.avers != new.avers or old.rewers != new.rewers) then
    new.source = 'ai-edited';
  end if;
  return new;
end;
$$ language plpgsql;

-- -----------------------------------------------------
-- 4.5. trigger to update source when flashcard is edited
-- -----------------------------------------------------
create trigger update_flashcard_source_trigger
  before update on flashcards
  for each row
  execute function update_flashcard_source_on_edit();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY (RLS)
-- =====================================================

-- enable rls on all tables to ensure data isolation between users
alter table flashcard_sets enable row level security;
alter table flashcards enable row level security;
alter table error_logs enable row level security;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- NOTE: ALL POLICIES HAVE BEEN DISABLED
-- RLS is still enabled on tables, but no policies are defined
-- This means no operations will be allowed unless using service role key
-- or RLS is disabled on the tables

-- -----------------------------------------------------
-- 6.1. rls policies for flashcard_sets (DISABLED)
-- -----------------------------------------------------

-- -- policy: allow users to view only their own flashcard sets
-- create policy "Users can view their own flashcard sets"
--   on flashcard_sets for select
--   using (auth.uid() = user_id);

-- -- policy: allow users to create flashcard sets for themselves
-- create policy "Users can create their own flashcard sets"
--   on flashcard_sets for insert
--   with check (auth.uid() = user_id);

-- -- policy: allow users to update only their own flashcard sets
-- -- both using and with check ensure user owns the set before and after update
-- create policy "Users can update their own flashcard sets"
--   on flashcard_sets for update
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);

-- -- policy: allow users to delete only their own flashcard sets
-- create policy "Users can delete their own flashcard sets"
--   on flashcard_sets for delete
--   using (auth.uid() = user_id);

-- -----------------------------------------------------
-- 6.2. rls policies for flashcards (DISABLED)
-- -----------------------------------------------------

-- -- policy: allow users to view flashcards from their own sets
-- -- verifies ownership through join with flashcard_sets
-- create policy "Users can view flashcards from their own sets"
--   on flashcards for select
--   using (
--     exists (
--       select 1 from flashcard_sets
--       where flashcard_sets.id = flashcards.set_id
--       and flashcard_sets.user_id = auth.uid()
--     )
--   );

-- -- policy: allow users to create flashcards in their own sets
-- -- ensures flashcard can only be added to sets owned by the user
-- create policy "Users can create flashcards in their own sets"
--   on flashcards for insert
--   with check (
--     exists (
--       select 1 from flashcard_sets
--       where flashcard_sets.id = flashcards.set_id
--       and flashcard_sets.user_id = auth.uid()
--     )
--   );

-- -- policy: allow users to update flashcards in their own sets
-- -- both using and with check verify ownership through flashcard_sets
-- create policy "Users can update flashcards in their own sets"
--   on flashcards for update
--   using (
--     exists (
--       select 1 from flashcard_sets
--       where flashcard_sets.id = flashcards.set_id
--       and flashcard_sets.user_id = auth.uid()
--     )
--   )
--   with check (
--     exists (
--       select 1 from flashcard_sets
--       where flashcard_sets.id = flashcards.set_id
--       and flashcard_sets.user_id = auth.uid()
--     )
--   );

-- -- policy: allow users to delete flashcards from their own sets
-- create policy "Users can delete flashcards from their own sets"
--   on flashcards for delete
--   using (
--     exists (
--       select 1 from flashcard_sets
--       where flashcard_sets.id = flashcards.set_id
--       and flashcard_sets.user_id = auth.uid()
--     )
--   );

-- -----------------------------------------------------
-- 6.3. rls policies for error_logs (DISABLED)
-- -----------------------------------------------------

-- -- policy: allow users to view only their own error logs
-- create policy "Users can view their own error logs"
--   on error_logs for select
--   using (auth.uid() = user_id);

-- -- policy: allow users to create their own error logs
-- create policy "Users can create their own error logs"
--   on error_logs for insert
--   with check (auth.uid() = user_id);

-- note: intentionally no update or delete policies for error_logs
-- error logs should be append-only for audit trail integrity

