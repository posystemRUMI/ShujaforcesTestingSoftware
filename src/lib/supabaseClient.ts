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

function getSafeStorage(): Storage | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const testKey = '__sfa_storage_test__';
    window.sessionStorage.setItem(testKey, testKey);
    window.sessionStorage.removeItem(testKey);
    return window.sessionStorage;
  } catch (e) {
    console.warn('sessionStorage restricted or unavailable. Falling back to in-memory auth storage.');
    const memoryStore = new Map<string, string>();
    return {
      getItem: (key: string) => memoryStore.get(key) ?? null,
      setItem: (key: string, value: string) => { memoryStore.set(key, value); },
      removeItem: (key: string) => { memoryStore.delete(key); },
      clear: () => { memoryStore.clear(); },
      length: memoryStore.size,
      key: (index: number) => Array.from(memoryStore.keys())[index] ?? null,
    };
  }
}

function initSupabaseClient(): SupabaseClient<Database> {
  const url = (supabaseUrl && supabaseUrl.trim().startsWith('http')) ? supabaseUrl.trim() : DEFAULT_SUPABASE_URL;
  const key = (supabaseAnonKey && supabaseAnonKey.trim().length > 10) ? supabaseAnonKey.trim() : DEFAULT_SUPABASE_ANON_KEY;

  try {
    const client = createClient<Database>(url, key, {
      auth: {
        persistSession: true,
        storage: getSafeStorage(),
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sfa_auth_session_token',
      },
    });

    // Verify rest property and core methods are initialized
    if (client && (client as any).rest && typeof client.from === 'function') {
      return client;
    }

    console.warn('Primary Supabase client missing rest property, creating standard fallback client.');
    return createClient<Database>(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return createClient<Database>(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_ANON_KEY);
  }
}

// Singleton Supabase Client with Per-Tab Session Isolation via sessionStorage
export const supabase: SupabaseClient<Database> = initSupabaseClient();

export default supabase;
