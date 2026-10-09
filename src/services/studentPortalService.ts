import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
export interface PortalResult {
    id: string;
    attempt_id: string;
    test_name: string;
    marks_obtained: number;
    max_marks: number;
    percentage: number;
    completed_at: string;
}
export interface PortalTest {
    id: string;
    name: string;
    duration_minutes: number;
    question_count: number;
    passing_threshold: number;
    is_retake: boolean;
}
export interface PortalSnapshot {
    profile: {
        name: string;
        email: string;
        phone: string | null;
        role: string;
        roll_number: string;
        father_name: string | null;
        cnic: string | null;
        force_name: string | null;
        course_name: string | null;
    };
    statistics: {
        completed_tests: number;
        average_percentage: number | null;
        aggregate_percentage: number | null;
    };
    fees: {
        total_fee: number | null;
        paid_fee: number;
        remaining_fee: number | null;
    };
    results: PortalResult[];
    assigned_tests: PortalTest[];
    course_position: number | null;
    academy_position: number | null;
    timezone: string;
}
export interface PortalBoard {
    total: number;
    current_position: number | null;
    rows: {
        position: number | null;
        student_name: string;
        roll_number: string;
        percentage: number | null;
        is_current_user: boolean;
    }[];
}
async function rpc<T>(name: string, args = {}) {
    if (!isSupabaseConfigured())
        throw new Error('Database connection is not configured.');
    const { data, error } = await (supabase as any).rpc(name, args);
    if (error)
        throw new Error(error.message);
    if (data === null)
        throw new Error('The backend returned no data.');
    return data as T;
}
export const studentPortalService = { snapshot: () => rpc<PortalSnapshot>('student_portal_snapshot'), tests: () => rpc<{
        id: string;
        name: string;
    }[]>('student_portal_tests'), leaderboard: (testId: string | null, offset: number) => rpc<PortalBoard>('student_portal_leaderboard', { p_test_id: testId, p_offset: offset, p_limit: 100 }) };
