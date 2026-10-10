import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
// RLS filters record notifications for students. Refetch on focus/reconnect plus
// controlled query polling covers register changes and realtime disconnects.
export function useAttendanceUpdates() {
 const cache = useQueryClient();
 useEffect(() => {
  const refresh = () => { void cache.invalidateQueries({ queryKey: ['attendance'] }); };
  const channel = supabase.channel('attendance-' + crypto.randomUUID())
   .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_records' }, refresh)
   .on('postgres_changes', { event: '*', schema: 'public', table: 'attendance_registers' }, refresh)
   .subscribe(s => { if (s === 'SUBSCRIBED' || s === 'CHANNEL_ERROR') refresh(); });
  window.addEventListener('online', refresh);
  return () => { window.removeEventListener('online', refresh); void supabase.removeChannel(channel); };
 }, [cache]);
}
