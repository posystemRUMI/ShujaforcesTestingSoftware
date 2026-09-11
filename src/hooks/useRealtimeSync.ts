import { useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { queryClient } from '@/lib/queryClient';

/**
 * Scoped Supabase Realtime auto-invalidation sync.
 * Listens for PostgreSQL changes and invalidates corresponding TanStack Query keys
 * so that visible UI automatically updates without manual page refreshes.
 */
export function useRealtimeSync(scope?: 'admin' | 'student' | 'global') {
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    console.log(`📡 Initializing Supabase Realtime Auto-Refresh Sync [Scope: ${scope || 'global'}]...`);

    const channel = supabase.channel(`app-realtime-sync-${scope || 'global'}`);

    channel
      // 1. Students / Profiles
      .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, (payload) => {
        console.log('⚡ Realtime Event: students changed', payload.eventType);
        queryClient.invalidateQueries({ queryKey: ['students'] });
        queryClient.invalidateQueries({ queryKey: ['batches'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
        console.log('⚡ Realtime Event: profiles changed', payload.eventType);
        queryClient.invalidateQueries({ queryKey: ['students'] });
        queryClient.invalidateQueries({ queryKey: ['teachers'] });
      })
      // 2. Teachers
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teachers' }, () => {
        console.log('⚡ Realtime Event: teachers changed');
        queryClient.invalidateQueries({ queryKey: ['teachers'] });
      })
      // 3. Batches
      .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, () => {
        console.log('⚡ Realtime Event: batches changed');
        queryClient.invalidateQueries({ queryKey: ['batches'] });
      })
      // 4. Forces & Courses
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forces' }, () => {
        console.log('⚡ Realtime Event: forces changed');
        queryClient.invalidateQueries({ queryKey: ['forces'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courses' }, () => {
        console.log('⚡ Realtime Event: courses changed');
        queryClient.invalidateQueries({ queryKey: ['courses'] });
      })
      // 5. Tests & Assignments & Patterns & Questions
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tests' }, () => {
        console.log('⚡ Realtime Event: tests changed');
        queryClient.invalidateQueries({ queryKey: ['tests'] });
        queryClient.invalidateQueries({ queryKey: ['student-tests'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'test_assignments' }, () => {
        console.log('⚡ Realtime Event: test_assignments changed');
        queryClient.invalidateQueries({ queryKey: ['tests'] });
        queryClient.invalidateQueries({ queryKey: ['student-tests'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'test_pattern_templates' }, () => {
        console.log('⚡ Realtime Event: test_pattern_templates changed');
        queryClient.invalidateQueries({ queryKey: ['test-patterns'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        console.log('⚡ Realtime Event: questions changed');
        queryClient.invalidateQueries({ queryKey: ['question-bank'] });
      })
      // 6. Attempts / Scoring / Results / Leaderboard
      .on('postgres_changes', { event: '*', schema: 'public', table: 'test_attempts' }, () => {
        console.log('⚡ Realtime Event: test_attempts changed');
        queryClient.invalidateQueries({ queryKey: ['results'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        queryClient.invalidateQueries({ queryKey: ['student-tests'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'test_results' }, () => {
        console.log('⚡ Realtime Event: test_results changed');
        queryClient.invalidateQueries({ queryKey: ['results'] });
        queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      })
      // 7. Finance (Ledger, Fee Payments, Expenses, Salary Payments)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_transactions' }, () => {
        console.log('⚡ Realtime Event: finance_transactions changed');
        queryClient.invalidateQueries({ queryKey: ['finance'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'student_fee_payments' }, () => {
        console.log('⚡ Realtime Event: student_fee_payments changed');
        queryClient.invalidateQueries({ queryKey: ['finance'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finance_expenses' }, () => {
        console.log('⚡ Realtime Event: finance_expenses changed');
        queryClient.invalidateQueries({ queryKey: ['finance'] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teacher_salary_payments' }, () => {
        console.log('⚡ Realtime Event: teacher_salary_payments changed');
        queryClient.invalidateQueries({ queryKey: ['finance'] });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✓ Supabase Realtime channel SUBSCRIBED cleanly.');
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('Realtime channel closed/error, invalidating queries on reconnect.');
          queryClient.invalidateQueries();
        }
      });

    return () => {
      console.log('🧹 Cleaning up Supabase Realtime channel...');
      supabase.removeChannel(channel);
    };
  }, [scope]);
}
