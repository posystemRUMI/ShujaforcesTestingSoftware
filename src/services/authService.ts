import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { UserProfile, UserRole } from '@/types';

function withTimeout<T = any>(promise: Promise<T>, timeoutMs: number = 4000): Promise<any> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Authentication request timed out. Check server connection.')), timeoutMs)
    ),
  ]);
}

export const authService = {
  /**
   * Fetch current authenticated user profile from Supabase
   * Reads per-tab session strictly without cross-tab interference.
   */
  async getCurrentUser(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) {
      return null;
    }

    try {
      const { data: { session }, error: sessionError } = await withTimeout(
        supabase.auth.getSession(),
        3000
      );

      if (sessionError || !session?.user) {
        return null;
      }

      const { data: profile, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError || !profile) {
        return null;
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
          branch = (std.forces as any)?.code || 'PAKISTAN_ARMY';
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
      console.warn('Error retrieving authenticated user:', err);
      return null;
    }
  },

  /**
   * Authenticate user with Supabase Auth
   * Supports email address, student roll number, or teacher staff ID.
   */
  async login(identifier: string, password: string): Promise<{ user: UserProfile | null; error: Error | null }> {
    const rawId = identifier.trim();
    if (!rawId) {
      return { user: null, error: new Error('Please enter your email or roll number.') };
    }

    if (!isSupabaseConfigured()) {
      return { user: null, error: new Error('Authentication service is not configured.') };
    }

    try {
      let email = rawId.toLowerCase();

      // Resolve non-email identifiers (e.g. roll number SFA-001 or staff ID TCH-001)
      if (!email.includes('@')) {
        const { data: std } = await withTimeout(
          Promise.resolve(
            (supabase as any)
              .from('students')
              .select('profiles(email)')
              .eq('roll_number', rawId.toUpperCase())
              .maybeSingle()
          ),
          2000
        ).catch(() => ({ data: null }));

        if ((std as any)?.profiles?.email) {
          email = (std as any).profiles.email;
        } else {
          const { data: tch } = await withTimeout(
            Promise.resolve(
              (supabase as any)
                .from('teachers')
                .select('profiles(email)')
                .eq('service_number', rawId.toUpperCase())
                .maybeSingle()
            ),
            2000
          ).catch(() => ({ data: null }));

          if ((tch as any)?.profiles?.email) {
            email = (tch as any).profiles.email;
          }
        }
      }

      const { data, error: authError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email,
          password,
        }),
        4000
      );

      if (authError || !data?.user) {
        return { user: null, error: new Error(authError?.message || 'Invalid email or password.') };
      }

      const { data: profile, error: profileErr } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileErr || !profile) {
        await supabase.auth.signOut();
        return { user: null, error: new Error('User profile record not found. Contact administrator.') };
      }

      if (profile.status === 'SUSPENDED' || profile.status === 'INACTIVE') {
        await supabase.auth.signOut();
        return { user: null, error: new Error('Account access suspended. Contact academy command center.') };
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
          branch = (std.forces as any)?.code || 'PAKISTAN_ARMY';
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
      return { user: null, error: new Error(err?.message || 'Authentication request failed.') };
    }
  },

  /**
   * Terminate current tab session
   */
  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
  },
};

export default authService;
