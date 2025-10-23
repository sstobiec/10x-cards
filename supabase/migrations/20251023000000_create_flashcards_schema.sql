-- Migration: Create Flashcards Schema
-- Description: Initial database schema for 10xCards application
-- Affected Tables: flashcard_sets, flashcards, flashcard_sets_error_logs
-- Special Considerations: 
--   - Enables Row Level Security (RLS) on all tables
--   - Creates custom ENUM type for flashcard source tracking
--   - Implements automatic triggers for updated_at and source transitions
--   - Sets up comprehensive indexes for performance optimization

-- ============================================================================
-- 1. ENUM TYPES
-- ============================================================================

-- flashcard_source enum: tracks the origin of each flashcard
-- - 'manual': user-created flashcard
-- - 'ai-full': AI-generated flashcard (unmodified)
-- - 'ai-edited': AI-generated flashcard that was subsequently edited by user
create type flashcard_source as enum ('manual', 'ai-full', 'ai-edited');

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2.1. flashcard_sets table
-- ----------------------------------------------------------------------------
-- Purpose: Stores flashcard sets owned by users
-- Key Features:
--   - Each user can have multiple sets with unique names
--   - Tracks AI model used and generation duration for analytics
--   - Cascades on user deletion
create table flashcard_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name varchar(100) not null,
  model varchar(100) not null,
  generation_duration integer not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- Ensure each user has unique set names
  constraint unique_user_set_name unique (user_id, name)
);

-- ----------------------------------------------------------------------------
-- 2.2. flashcards table
-- ----------------------------------------------------------------------------
-- Purpose: Stores individual flashcards within sets
-- Key Features:
--   - Each flashcard belongs to exactly one set
--   - Tracks source (manual, AI-full, AI-edited) for adoption metrics
--   - Supports flagging for quality feedback
--   - Enforces non-empty content on front (avers) and back (rewers)
--   - Cascades on set deletion
create table flashcards (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references flashcard_sets(id) on delete cascade,
  avers varchar(200) not null,
  rewers varchar(750) not null,
  source flashcard_source not null,
  flagged boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- Ensure avers (front) is not empty or whitespace-only
  constraint check_avers_not_empty check (length(trim(avers)) > 0),
  
  -- Ensure rewers (back) is not empty or whitespace-only
  constraint check_rewers_not_empty check (length(trim(rewers)) > 0)
);

-- ----------------------------------------------------------------------------
-- 2.3. flashcard_sets_error_logs table
-- ----------------------------------------------------------------------------
-- Purpose: Logs errors occurring during flashcard set operations (primarily AI generation)
-- Key Features:
--   - Tracks which user and optionally which set encountered the error
--   - Stores model, error type, and detailed error message
--   - Preserves input_payload as JSONB for debugging
--   - Uses SET NULL on set deletion to preserve historical logs
--   - Append-only design (no UPDATE/DELETE policies)
create table flashcard_sets_error_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  set_id uuid references flashcard_sets(id) on delete set null,
  model varchar(100) not null,
  error_type varchar(100) not null,
  error_message text not null,
  input_payload jsonb,
  created_at timestamp with time zone not null default now()
);

-- ============================================================================
-- 3. INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1. Indexes on flashcard_sets
-- ----------------------------------------------------------------------------
-- Speeds up queries fetching user's sets and enforces RLS policies efficiently
create index idx_flashcard_sets_user_id on flashcard_sets(user_id);

-- Optimizes chronological sorting for set listings (newest first)
create index idx_flashcard_sets_created_at on flashcard_sets(created_at desc);

-- Supports UNIQUE constraint and queries searching by name
create unique index idx_flashcard_sets_user_name on flashcard_sets(user_id, name);

-- ----------------------------------------------------------------------------
-- 3.2. Indexes on flashcards
-- ----------------------------------------------------------------------------
-- Speeds up retrieval of all flashcards within a set
create index idx_flashcards_set_id on flashcards(set_id);

-- Enables fast computation of AI adoption metrics (US-002)
create index idx_flashcards_source on flashcards(source);

-- Partial index for flagged flashcards (quality analysis)
-- Only indexes flagged=true rows for efficiency
create index idx_flashcards_flagged on flashcards(flagged) where flagged = true;

-- ----------------------------------------------------------------------------
-- 3.3. Indexes on flashcard_sets_error_logs
-- ----------------------------------------------------------------------------
-- Diagnostic queries for specific user's errors
create index idx_error_logs_user_id on flashcard_sets_error_logs(user_id);

-- Partial index for logs associated with specific sets
-- Excludes rows where set_id is null
create index idx_error_logs_set_id on flashcard_sets_error_logs(set_id) where set_id is not null;

-- Chronological sorting of logs (newest first)
create index idx_error_logs_created_at on flashcard_sets_error_logs(created_at desc);

-- Aggregations and analysis by error type
create index idx_error_logs_error_type on flashcard_sets_error_logs(error_type);

-- ============================================================================
-- 4. ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 4.1. Enable RLS on all tables
-- ----------------------------------------------------------------------------
alter table flashcard_sets enable row level security;
alter table flashcards enable row level security;
alter table flashcard_sets_error_logs enable row level security;

-- ----------------------------------------------------------------------------
-- 4.2. RLS Policies for flashcard_sets
-- ----------------------------------------------------------------------------
-- Note: All policies disabled - RLS is enabled but no policies defined

-- ----------------------------------------------------------------------------
-- 4.3. RLS Policies for flashcards
-- ----------------------------------------------------------------------------
-- Note: All policies disabled - RLS is enabled but no policies defined

-- ----------------------------------------------------------------------------
-- 4.4. RLS Policies for flashcard_sets_error_logs
-- ----------------------------------------------------------------------------
-- Note: All policies disabled - RLS is enabled but no policies defined

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.1. Function: Automatically update updated_at timestamp
-- ----------------------------------------------------------------------------
-- Purpose: Shared function for updating updated_at column on row modifications
-- Used by: flashcard_sets and flashcards tables
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- 5.2. Trigger: Update flashcard_sets.updated_at on modification
-- ----------------------------------------------------------------------------
-- Fires: Before each UPDATE on flashcard_sets
-- Effect: Sets updated_at to current timestamp
create trigger update_flashcard_sets_updated_at
before update on flashcard_sets
for each row
execute function update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5.3. Trigger: Update flashcards.updated_at on modification
-- ----------------------------------------------------------------------------
-- Fires: Before each UPDATE on flashcards
-- Effect: Sets updated_at to current timestamp
create trigger update_flashcards_updated_at
before update on flashcards
for each row
execute function update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 5.4. Function: Automatically transition flashcard source on edit
-- ----------------------------------------------------------------------------
-- Purpose: Changes source from 'ai-full' to 'ai-edited' when AI-generated
--          flashcard content (avers or rewers) is modified by user
-- Used by: flashcards table
-- Rationale: Supports AI adoption metrics by tracking user modifications
create or replace function update_flashcard_source_on_edit()
returns trigger as $$
begin
  -- If flashcard was AI-generated (unmodified) and content changed
  if old.source = 'ai-full' and (old.avers != new.avers or old.rewers != new.rewers) then
    new.source = 'ai-edited';
  end if;
  return new;
end;
$$ language plpgsql;

-- ----------------------------------------------------------------------------
-- 5.5. Trigger: Update flashcard source when AI flashcard is edited
-- ----------------------------------------------------------------------------
-- Fires: Before each UPDATE on flashcards
-- Effect: Transitions source from 'ai-full' to 'ai-edited' if content changed
create trigger update_flashcard_source_trigger
before update on flashcards
for each row
execute function update_flashcard_source_on_edit();

