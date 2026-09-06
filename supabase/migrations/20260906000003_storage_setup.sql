-- ============================================================================
-- Migration: 20260906000003_storage_setup.sql
-- Description: Supabase Storage Buckets and Access Control Policies
-- Author: BACKEND-AGENT-1 / Antigravity
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CREATE STORAGE BUCKETS
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'question-media',
    'question-media',
    false,
    5242880, -- 5 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  ),
  (
    'profile-images',
    'profile-images',
    true,
    2097152, -- 2 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp']
  ),
  (
    'academy-assets',
    'academy-assets',
    true,
    10485760, -- 10 MB
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  ),
  (
    'import-files',
    'import-files',
    false,
    10485760, -- 10 MB
    ARRAY['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
  )
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ----------------------------------------------------------------------------
-- 2. STORAGE RLS POLICIES (storage.objects)
-- ----------------------------------------------------------------------------

-- Question Media Policies
CREATE POLICY "question_media_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'question-media');

CREATE POLICY "question_media_staff_manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'question-media'
    AND (public.is_admin() OR public.is_teacher())
  )
  WITH CHECK (
    bucket_id = 'question-media'
    AND (public.is_admin() OR public.is_teacher())
  );

-- Profile Images Policies
CREATE POLICY "profile_images_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'profile-images');

CREATE POLICY "profile_images_owner_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'profile-images'
    AND (
      public.is_admin()
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "profile_images_owner_update_delete"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (
      public.is_admin()
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "profile_images_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'profile-images'
    AND (
      public.is_admin()
      OR auth.uid()::text = (storage.foldername(name))[1]
    )
  );

-- Academy Assets Policies
CREATE POLICY "academy_assets_select"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'academy-assets');

CREATE POLICY "academy_assets_admin_manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'academy-assets'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'academy-assets'
    AND public.is_admin()
  );

-- Import Files Policies
CREATE POLICY "import_files_admin_manage"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'import-files'
    AND public.is_admin()
  )
  WITH CHECK (
    bucket_id = 'import-files'
    AND public.is_admin()
  );
