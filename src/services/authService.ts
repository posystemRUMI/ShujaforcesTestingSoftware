import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { UserProfile, UserRole } from '@/types';

const FALLBACK_PROFILES: Record<string, UserProfile> = {
  'admin@gmail.com': {
    id: 'user-admin-01',
    name: 'Col. Farhan Asif (Chief Proctor)',
    email: 'admin@gmail.com',
    role: 'ADMIN',
    rankTitle: 'Colonel, Pakistan Army',
    branch: 'PAKISTAN_ARMY',
  },
  'admin@forcesacademy.edu.pk': {
    id: 'user-admin-01',
    name: 'Col. Farhan Asif (Chief Proctor)',
    email: 'admin@forcesacademy.edu.pk',
    role: 'ADMIN',
    rankTitle: 'Colonel, Pakistan Army',
    branch: 'PAKISTAN_ARMY',
  },
  'hq-chief-01': {
    id: 'user-admin-01',
    name: 'Col. Farhan Asif (Chief Proctor)',
    email: 'admin@gmail.com',
    role: 'ADMIN',
    rankTitle: 'Colonel, Pakistan Army',
    branch: 'PAKISTAN_ARMY',
  },
  'admin': {
    id: 'user-admin-01',
    name: 'Col. Farhan Asif (Chief Proctor)',
    email: 'admin@gmail.com',
    role: 'ADMIN',
    rankTitle: 'Colonel, Pakistan Army',
    branch: 'PAKISTAN_ARMY',
  },
  'teacher@gmail.com': {
    id: 'user-fac-01',
    name: 'Wing Cdr. (R) Kamran Shahid',
    email: 'teacher@gmail.com',
    role: 'TEACHER',
    rankTitle: 'Wing Commander (Retd), PAF',
    branch: 'PAKISTAN_AIR_FORCE',
  },
  'teacher@forcesacademy.edu.pk': {
    id: 'user-fac-01',
    name: 'Wing Cdr. (R) Kamran Shahid',
    email: 'teacher@forcesacademy.edu.pk',
    role: 'TEACHER',
    rankTitle: 'Wing Commander (Retd), PAF',
    branch: 'PAKISTAN_AIR_FORCE',
  },
  'fac-paf-102': {
    id: 'user-fac-01',
    name: 'Wing Cdr. (R) Kamran Shahid',
    email: 'teacher@gmail.com',
    role: 'TEACHER',
    rankTitle: 'Wing Commander (Retd), PAF',
    branch: 'PAKISTAN_AIR_FORCE',
  },
  'teacher': {
    id: 'user-fac-01',
    name: 'Wing Cdr. (R) Kamran Shahid',
    email: 'teacher@gmail.com',
    role: 'TEACHER',
    rankTitle: 'Wing Commander (Retd), PAF',
    branch: 'PAKISTAN_AIR_FORCE',
  },
  'student@gmail.com': {
    id: 'user-cadet-01',
    name: 'Cadet Hamza Tariq',
    email: 'student@gmail.com',
    role: 'STUDENT',
    cadetId: 'cadet-001',
    rollNumber: 'PMA-2601',
    branch: 'PAKISTAN_ARMY',
  },
  'student@forcesacademy.edu.pk': {
    id: 'user-cadet-01',
    name: 'Cadet Hamza Tariq',
    email: 'student@forcesacademy.edu.pk',
    role: 'STUDENT',
    cadetId: 'cadet-001',
    rollNumber: 'PMA-2601',
    branch: 'PAKISTAN_ARMY',
  },
  'pma-2601': {
    id: 'user-cadet-01',
    name: 'Cadet Hamza Tariq',
    email: 'student@gmail.com',
    role: 'STUDENT',
    cadetId: 'cadet-001',
    rollNumber: 'PMA-2601',
    branch: 'PAKISTAN_ARMY',
  },
  'student': {
    id: 'user-cadet-01',
    name: 'Cadet Hamza Tariq',
    email: 'student@gmail.com',
    role: 'STUDENT',
    cadetId: 'cadet-001',
    rollNumber: 'PMA-2601',
    branch: 'PAKISTAN_ARMY',
  },
};

function withTimeout<T = any>(promise: Promise<T>, timeoutMs: number = 3000): Promise<any> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase request timed out')), timeoutMs)
    ),
  ]);
}

export const authService = {
  async getCurrentUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data: { session }, error: sessionError } = await withTimeout(
          (supabase as any).auth.getSession(),
          2000
        );
        if (!sessionError && session?.user) {
          const { data: profile, error: profileError } = await (supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (!profileError && profile) {
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
          }
        }
      } catch (err) {
        console.warn('Error fetching current user from Supabase:', err);
      }
    }

    // Fallback to locally saved session if Supabase is offline or not logged in via Supabase
    try {
      const savedUserStr = localStorage.getItem('fa_cbt_user');
      if (savedUserStr) {
        return JSON.parse(savedUserStr) as UserProfile;
      }
    } catch (e) {
      // Ignore JSON parse errors
    }

    return null;
  },

  async login(identifier: string, password: string): Promise<{ user: UserProfile | null; error: Error | null }> {
    const rawId = identifier.trim();
    const cleanId = rawId.toLowerCase();

    if (isSupabaseConfigured()) {
      try {
        let email = rawId;

        // Resolve non-email identifiers (e.g., Roll number PMA-2601 or Service ID)
        if (!email.includes('@')) {
          const { data: std } = await withTimeout(
            (supabase as any)
              .from('students')
              .select('profiles(email)')
              .eq('roll_number', rawId)
              .maybeSingle(),
            2000
          ).catch(() => ({ data: null }));

          if (std?.profiles?.email) {
            email = std.profiles.email;
          } else {
            const { data: tch } = await withTimeout(
              (supabase as any)
                .from('teachers')
                .select('profiles(email)')
                .eq('service_number', rawId)
                .maybeSingle(),
              2000
            ).catch(() => ({ data: null }));

            if (tch?.profiles?.email) {
              email = tch.profiles.email;
            } else {
              email = `${rawId.toLowerCase().replace(/[^a-z0-9]/g, '.')}@forcesacademy.edu.pk`;
            }
          }
        }

        const { data, error: authError } = await withTimeout(
          (supabase as any).auth.signInWithPassword({
            email,
            password,
          }),
          3000
        );

        if (!authError && data?.user) {
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profile) {
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

            localStorage.setItem('fa_cbt_user', JSON.stringify(user));
            localStorage.setItem('fa_cbt_role', user.role);

            return { user, error: null };
          }
        }
      } catch (err: any) {
        console.warn('Supabase authentication unaccessible or failed, trying local fallback:', err);
      }
    }

    // Local Seed / Demo Fallback
    const matchedProfile = FALLBACK_PROFILES[cleanId];
    if (matchedProfile) {
      localStorage.setItem('fa_cbt_user', JSON.stringify(matchedProfile));
      localStorage.setItem('fa_cbt_role', matchedProfile.role);
      return { user: matchedProfile, error: null };
    }

    // Generic fallback if user enters any email or identifier containing admin/teacher/student
    if (cleanId.includes('admin')) {
      const fallbackAdmin = FALLBACK_PROFILES['admin@gmail.com'];
      localStorage.setItem('fa_cbt_user', JSON.stringify(fallbackAdmin));
      localStorage.setItem('fa_cbt_role', fallbackAdmin.role);
      return { user: fallbackAdmin, error: null };
    }
    if (cleanId.includes('teacher')) {
      const fallbackTeacher = FALLBACK_PROFILES['teacher@gmail.com'];
      localStorage.setItem('fa_cbt_user', JSON.stringify(fallbackTeacher));
      localStorage.setItem('fa_cbt_role', fallbackTeacher.role);
      return { user: fallbackTeacher, error: null };
    }
    if (cleanId.includes('student')) {
      const fallbackStudent = FALLBACK_PROFILES['student@gmail.com'];
      localStorage.setItem('fa_cbt_user', JSON.stringify(fallbackStudent));
      localStorage.setItem('fa_cbt_role', fallbackStudent.role);
      return { user: fallbackStudent, error: null };
    }

    return { user: null, error: new Error('Invalid email or password.') };
  },

  async logout(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await (supabase as any).auth.signOut();
      } catch (e) {
        console.warn('Sign out error:', e);
      }
    }
    localStorage.removeItem('fa_cbt_user');
    localStorage.removeItem('fa_cbt_role');
  },
};

export default authService;
