import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { UserProfile, UserRole } from '@/types';

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data: { session }, error: sessionError } = await (supabase as any).auth.getSession();
    if (sessionError || !session?.user) return null;

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      name: profile.display_name,
      email: profile.email,
      role: (profile.role || 'STUDENT').toUpperCase() as UserRole,
      avatarUrl: profile.avatar_url || undefined,
    };
  },

  async login(email: string, password: string): Promise<{ user: UserProfile | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { user: null, error: new Error('Supabase credentials not configured.') };
    }

    const { data, error } = await (supabase as any).auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      return { user: null, error: error ? new Error(error.message) : new Error('Login failed') };
    }

    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      return { user: null, error: new Error('Profile record not found for user.') };
    }

    const user: UserProfile = {
      id: profile.id,
      name: profile.display_name,
      email: profile.email,
      role: (profile.role || 'STUDENT').toUpperCase() as UserRole,
      avatarUrl: profile.avatar_url || undefined,
    };

    return { user, error: null };
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      await (supabase as any).auth.signOut();
    }
  },
};
