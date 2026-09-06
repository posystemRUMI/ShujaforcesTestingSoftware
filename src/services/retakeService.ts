/**
 * Retake Service — Production backend adapter for retake authorization
 * Owner: BACKEND-AGENT-2 / Claude (B26)
 */
import supabase, { isSupabaseConfigured } from '@/lib/supabaseClient';

export interface RetakePermissionRecord {
  id: string;
  student_id: string;
  test_id: string;
  original_attempt_id: string | null;
  approved_by: string;
  approved_at: string;
  expires_at: string | null;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED' | 'REVOKED';
  notes: string | null;
  consumed_attempt_id: string | null;
  created_at: string;
}

export const retakeService = {
  async getRetakePermissions(filters?: { studentId?: string; testId?: string; status?: string }) {
    if (!isSupabaseConfigured()) return [];
    let query = supabase.from('retake_permissions').select('*').order('approved_at', { ascending: false });
    if (filters?.studentId) query = query.eq('student_id', filters.studentId);
    if (filters?.testId) query = query.eq('test_id', filters.testId);
    if (filters?.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as RetakePermissionRecord[];
  },

  async approveRetake(studentId: string, testId: string, originalAttemptId?: string, expiresAt?: string, notes?: string): Promise<string> {
    const { data, error } = await (supabase as any).rpc('approve_retake', {
      p_student_id: studentId,
      p_test_id: testId,
      p_original_attempt_id: originalAttemptId,
      p_expires_at: expiresAt,
      p_notes: notes,
    });
    if (error) throw error;
    return data as string;
  },

  async revokeRetake(retakeId: string) {
    if (!isSupabaseConfigured()) throw new Error('Supabase not configured');
    const { error } = await (supabase as any)
      .from('retake_permissions')
      .update({ status: 'REVOKED' })
      .eq('id', retakeId);
    if (error) throw error;
  },
};

export default retakeService;
