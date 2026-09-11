import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

const supabaseUrl = envUrl || '';
const supabaseAnonKey = envAnonKey || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'CRITICAL: Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY environment variables. ' +
    'The application requires valid Supabase environment variables to connect.'
  );
}

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
