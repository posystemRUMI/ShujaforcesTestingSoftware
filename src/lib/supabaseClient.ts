import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const DEFAULT_SUPABASE_URL = 'https://cxnfxxtlnsypajwqmfni.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4bmZ4eHRsbnN5cGFqd3FtZm5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDkyMDIsImV4cCI6MjEwNDcyNTIwMn0.P8OK8zbLqYcObqqIoVnmsmKOnehiJ23a-Txa6R1dqKo';

const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabaseUrl = envUrl || DEFAULT_SUPABASE_URL;
const supabaseAnonKey = envAnonKey || DEFAULT_SUPABASE_ANON_KEY;

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
