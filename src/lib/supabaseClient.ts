import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

// Fallback to local Supabase defaults for robust local development
const defaultUrl = 'http://127.0.0.1:54321';
const defaultAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabaseUrl = envUrl || defaultUrl;
const supabaseAnonKey = envAnonKey || defaultAnonKey;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey);
};

// Singleton Supabase Client with Per-Tab Session Isolation via sessionStorage
export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'sfa_auth_session_token',
    },
  }
);

export default supabase;
