-- ============================================================================
-- Migration: 20261003000000_add_test_sections_optional_columns.sql
-- Description: Add metadata columns to test_sections table
-- Author: ANTIGRAVITY / DEEPMIND PAIR PROGRAMMING
-- ============================================================================

ALTER TABLE public.test_sections
  ADD COLUMN IF NOT EXISTS section_code TEXT,
  ADD COLUMN IF NOT EXISTS source_template_section_id UUID,
  ADD COLUMN IF NOT EXISTS passing_percentage INT DEFAULT 50,
  ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false;
