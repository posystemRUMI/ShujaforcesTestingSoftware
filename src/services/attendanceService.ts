import { supabase } from '@/lib/supabaseClient';
export type AttendanceStatus = 'UNMARKED' | 'PRESENT' | 'ABSENT' | 'EXCUSED';
export type AttendanceSection = 'Army' | 'Navy' | 'Air Force';
export interface AttendanceTotals { unique_students: number; eligible: number; present: number; absent: number; excused: number; unmarked: number; conflicts: number; percentage: number | null }
export interface AttendanceRow { student_id: string; register_id: string; attendance_date: string; state: string; student_name: string; roll_number: string; photo_url: string | null; status: AttendanceStatus; arrival_at: string | null; updated_at: string; conflict: boolean; memberships: { section: AttendanceSection; course_id: string; course_name: string; force_id: string }[] }
export interface AttendanceReport { today: string; totals: AttendanceTotals; total: number; rows: AttendanceRow[]; registers: { id: string; attendance_date: string; state: string; reason: string | null }[]; monthly: { student_id: string; student_name: string; roll_number: string; month: string; present: number; absent: number; excused: number; percentage: number | null }[]; courses: { id: string; name: string; section: AttendanceSection }[]; audit: { id: number; action: string; previous_status: string | null; new_status: string | null; reason: string | null; actor_name: string; occurred_at: string }[] }
export interface StudentAttendance { today: string; month: string; today_status: string; totals: { present: number; absent: number; excused: number; percentage: number | null }; days: { date: string; status: string; state: string | null; arrival_at: string | null }[] }
export const academyDate = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Karachi', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
export const attendanceTime = (date: string | null) => date ? new Intl.DateTimeFormat('en-PK', { timeZone: 'Asia/Karachi', hour: '2-digit', minute: '2-digit' }).format(new Date(date)) : '—';
export const statusLabel = (s: string) => ({ PRESENT: 'Present', ABSENT: 'Absent', EXCUSED: 'Excused', UNMARKED: 'Not marked yet', NO_REGISTER: 'Attendance not started', NON_CLASS: 'Non-class day', NOT_ELIGIBLE: 'Not on eligible roster', OPEN: 'Open', FINALIZED: 'Finalized' }[s] || s);
async function rpc<T>(name: string, args: Record<string, unknown>): Promise<T> { const { data, error } = await (supabase as any).rpc(name, args); if (error) throw new Error(error.message); return data as T; }
export interface AttendanceFilters { from: string; to: string; section?: string; course?: string; search?: string; status?: string; offset?: number; limit?: number; includeUnmarked?: boolean }
export const attendanceService = {
 action: (action: string, date: string, data: Record<string, unknown> = {}) => rpc<{ message: string; already_present?: boolean }>('attendance_admin', { p_action: action, p_date: date, p_data: data }),
 report: (f: AttendanceFilters) => rpc<AttendanceReport>('attendance_report', { p_from: f.from, p_to: f.to, p_section: f.section || null, p_course: f.course || null, p_search: f.search || '', p_status: f.status || null, p_offset: f.offset || 0, p_limit: f.limit || 50, p_include_unmarked: f.includeUnmarked ?? true }),
 student: (month?: string) => rpc<StudentAttendance>('attendance_student', { p_month: month ? month + '-01' : null }),
};
