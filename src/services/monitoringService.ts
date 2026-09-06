/**
 * Monitoring Service — Production backend adapter for live proctoring
 * Owner: BACKEND-AGENT-2 / Claude (B26)
 */
import supabase, { isSupabaseConfigured } from '@/lib/supabaseClient';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface ActiveAttemptMonitor {
  attempt_id: string;
  test_id: string;
  test_name: string;
  student_id: string;
  roll_number: string;
  student_name: string;
  force_code: string;
  force_name: string;
  started_at: string;
  expires_at: string;
  attempt_status: string;
  attempt_number: number;
  answered_count: number;
  current_question_index: number;
  current_section_name: string | null;
  progress_percent: number;
  connection_state: string;
  last_seen: string | null;
  liveness: string;
  total_questions: number;
  remaining_seconds: number;
}

export const monitoringService = {
  async getActiveAttempts(): Promise<ActiveAttemptMonitor[]> {
    if (!isSupabaseConfigured()) return [];
    const { data, error } = await supabase
      .from('v_active_monitoring' as any)
      .select('*');
    if (error) throw error;
    return (data || []) as ActiveAttemptMonitor[];
  },

  async forceSubmitAttempt(attemptId: string) {
    const { data, error } = await (supabase as any).rpc('force_submit_attempt', {
      p_attempt_id: attemptId,
    });
    if (error) throw error;
    return data;
  },

  subscribeToHeartbeats(callback: (payload: any) => void): RealtimeChannel {
    return supabase
      .channel('heartbeat-monitor')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attempt_heartbeats',
        },
        callback
      )
      .subscribe();
  },

  unsubscribe(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
  },
};

export default monitoringService;
