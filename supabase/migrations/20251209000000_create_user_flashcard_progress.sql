-- Migration: Create User Flashcard Progress Schema
-- Purpose: Add spaced repetition tracking for flashcard learning sessions
-- Affected tables: user_flashcard_progress
-- Special considerations:
--   - Stores FSRS algorithm state for each user-flashcard pair
--   - Implements RLS policies for data isolation
--   - Creates indexes for optimized queries

-- =====================================================
-- 1. CREATE ENUM TYPE FOR CARD STATE
-- =====================================================

-- FSRS card states: new (never reviewed), learning (initial learning phase),
-- review (graduated card), relearning (forgotten card being relearned)
create type fsrs_card_state as enum ('new', 'learning', 'review', 'relearning');

-- =====================================================
-- 2. CREATE TABLE
-- =====================================================

-- -----------------------------------------------------
-- user_flashcard_progress
-- Tracks learning progress for each user-flashcard pair
-- Stores FSRS algorithm parameters for spaced repetition
-- -----------------------------------------------------
create table user_flashcard_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  flashcard_id uuid not null,
  
  -- FSRS algorithm state fields
  state fsrs_card_state not null default 'new',
  stability float not null default 0,
  difficulty float not null default 0,
  elapsed_days float not null default 0,
  scheduled_days float not null default 0,
  reps integer not null default 0,
  lapses integer not null default 0,
  learning_steps integer not null default 0,
  
  -- Scheduling timestamps
  last_review timestamp with time zone,
  next_review timestamp with time zone not null default now(),
  
  -- Audit timestamps
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- Foreign key constraints
  constraint fk_user_flashcard_progress_user_id
    foreign key (user_id)
    references auth.users(id)
    on delete cascade,
  
  constraint fk_user_flashcard_progress_flashcard_id
    foreign key (flashcard_id)
    references flashcards(id)
    on delete cascade,
  
  -- Ensure unique progress record per user-flashcard pair
  constraint uq_user_flashcard_progress_user_flashcard
    unique (user_id, flashcard_id)
);

-- =====================================================
-- 3. CREATE INDEXES
-- =====================================================

-- Composite index for fetching due cards efficiently
-- This is the primary query pattern: get cards where next_review <= now() for a user
create index idx_user_flashcard_progress_user_next_review
  on user_flashcard_progress(user_id, next_review);

-- Index for user lookups (supports RLS policies)
create index idx_user_flashcard_progress_user_id
  on user_flashcard_progress(user_id);

-- Index for flashcard lookups (cleanup when flashcard deleted)
create index idx_user_flashcard_progress_flashcard_id
  on user_flashcard_progress(flashcard_id);

-- Index for card state filtering (e.g., find all new cards)
create index idx_user_flashcard_progress_state
  on user_flashcard_progress(state);

-- =====================================================
-- 4. CREATE TRIGGER FOR UPDATED_AT
-- =====================================================

-- Reuse existing function from initial migration
create trigger update_user_flashcard_progress_updated_at
  before update on user_flashcard_progress
  for each row
  execute function update_updated_at_column();

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

alter table user_flashcard_progress enable row level security;

-- =====================================================
-- 6. CREATE RLS POLICIES
-- =====================================================

-- Policy: Allow users to view only their own progress records
create policy "Users can view their own flashcard progress"
  on user_flashcard_progress for select
  using (auth.uid() = user_id);

-- Policy: Allow users to create progress records for themselves
create policy "Users can create their own flashcard progress"
  on user_flashcard_progress for insert
  with check (auth.uid() = user_id);

-- Policy: Allow users to update only their own progress records
create policy "Users can update their own flashcard progress"
  on user_flashcard_progress for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Policy: Allow users to delete only their own progress records
create policy "Users can delete their own flashcard progress"
  on user_flashcard_progress for delete
  using (auth.uid() = user_id);

-- =====================================================
-- 7. COMMENTS
-- =====================================================

comment on table user_flashcard_progress is 'Tracks spaced repetition learning progress for each user-flashcard pair using the FSRS algorithm';
comment on column user_flashcard_progress.state is 'FSRS card state: new, learning, review, or relearning';
comment on column user_flashcard_progress.stability is 'FSRS stability parameter - measure of memory retention';
comment on column user_flashcard_progress.difficulty is 'FSRS difficulty parameter - inherent difficulty of the material';
comment on column user_flashcard_progress.elapsed_days is 'Days since the card was last reviewed';
comment on column user_flashcard_progress.scheduled_days is 'Interval in days until the next scheduled review';
comment on column user_flashcard_progress.reps is 'Total number of times the card has been reviewed';
comment on column user_flashcard_progress.lapses is 'Number of times the card was forgotten (rated Again after graduating)';
comment on column user_flashcard_progress.learning_steps is 'Current step in the learning/relearning phase';
comment on column user_flashcard_progress.last_review is 'Timestamp of the most recent review';
comment on column user_flashcard_progress.next_review is 'Timestamp when the card is next due for review';

