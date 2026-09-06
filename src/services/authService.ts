import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { UserProfile, UserRole } from '@/types';

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data: { session }, error: sessionError } = await (supabase as any).auth.getSession();
      if (sessionError || !session?.user) return null;

      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError || !profile) return null;

      let cadetId: string | undefined;
      let rollNumber: string | undefined;
      let branch: any = 'PAKISTAN_ARMY';
      let rankTitle: string | undefined;

      if (profile.role === 'STUDENT') {
        const { data: std } = await (supabase as any)
          .from('students')
          .select('id, roll_number, forces(code)')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (std) {
          cadetId = std.id;
          rollNumber = std.roll_number;
          branch = std.forces?.code || 'PAKISTAN_ARMY';
        }
      } else if (profile.role === 'TEACHER') {
        const { data: tch } = await (supabase as any)
          .from('teachers')
          .select('id, service_number, rank, branch_code')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (tch) {
          rankTitle = tch.rank;
          branch = tch.branch_code || 'TRI_SERVICE';
        }
      }

      return {
        id: profile.id,
        name: profile.display_name,
        email: profile.email,
        role: (profile.role || 'STUDENT').toUpperCase() as UserRole,
        cadetId,
        rollNumber,
        branch,
        rankTitle,
        avatarUrl: profile.avatar_url || undefined,
      };
    } catch (err) {
      console.warn('Error fetching current user:', err);
      return null;
    }
  },

  async login(identifier: string, password: string): Promise<{ user: UserProfile | null; error: Error | null }> {
    if (!isSupabaseConfigured()) {
      return { user: null, error: new Error('Supabase credentials not configured.') };
    }

    try {
      let email = identifier.trim();

      // Resolve non-email identifiers (e.g., Roll number PMA-2601 or Service ID)
      if (!email.includes('@')) {
        const { data: std } = await (supabase as any)
          .from('students')
          .select('profiles(email)')
          .eq('roll_number', identifier)
          .maybeSingle();

        if (std?.profiles?.email) {
          email = std.profiles.email;
        } else {
          const { data: tch } = await (supabase as any)
            .from('teachers')
            .select('profiles(email)')
            .eq('service_number', identifier)
            .maybeSingle();

          if (tch?.profiles?.email) {
            email = tch.profiles.email;
          } else {
            email = `${identifier.toLowerCase().replace(/[^a-z0-9]/g, '.')}@forcesacademy.edu.pk`;
          }
        }
      }

      const { data, error: authError } = await (supabase as any).auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.user) {
        return { user: null, error: authError ? new Error(authError.message) : new Error('Invalid credentials.') };
      }

      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        return { user: null, error: new Error('Profile record not found for user.') };
      }

      if (profile.status === 'SUSPENDED' || profile.status === 'INACTIVE') {
        await (supabase as any).auth.signOut();
        return { user: null, error: new Error('Account access suspended. Contact testing command center.') };
      }

      let cadetId: string | undefined;
      let rollNumber: string | undefined;
      let branch: any = 'PAKISTAN_ARMY';
      let rankTitle: string | undefined;

      if (profile.role === 'STUDENT') {
        const { data: std } = await (supabase as any)
          .from('students')
          .select('id, roll_number, forces(code)')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (std) {
          cadetId = std.id;
          rollNumber = std.roll_number;
          branch = std.forces?.code || 'PAKISTAN_ARMY';
        }
      } else if (profile.role === 'TEACHER') {
        const { data: tch } = await (supabase as any)
          .from('teachers')
          .select('id, service_number, rank, branch_code')
          .eq('profile_id', profile.id)
          .maybeSingle();
        if (tch) {
          rankTitle = tch.rank;
          branch = tch.branch_code || 'TRI_SERVICE';
        }
      }

      const user: UserProfile = {
        id: profile.id,
        name: profile.display_name,
        email: profile.email,
        role: (profile.role || 'STUDENT').toUpperCase() as UserRole,
        cadetId,
        rollNumber,
        branch,
        rankTitle,
        avatarUrl: profile.avatar_url || undefined,
      };

      return { user, error: null };
    } catch (err: any) {
      return { user: null, error: new Error(err?.message || 'Login failed') };
    }
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await (supabase as any).auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
  },
};

export default authService;
