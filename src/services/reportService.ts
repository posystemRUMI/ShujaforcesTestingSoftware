/**
 * Report Service — Production backend adapter for analytics/reports
 * Owner: BACKEND-AGENT-2 / Claude (B26)
 */
import supabase from '@/lib/supabaseClient';
import type { Json } from '@/types/database.types';

export interface ReportFilters {
  batchId?: string;
  forceId?: string;
  testId?: string;
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export const reportService = {
  async getBatchPerformance(filters?: ReportFilters): Promise<Json> {
    const { data, error } = await (supabase as any).rpc('report_batch_performance', {
      p_batch_id: filters?.batchId,
      p_force_id: filters?.forceId,
      p_date_from: filters?.dateFrom,
      p_date_to: filters?.dateTo,
    });
    if (error) throw error;
    return data;
  },

  async getStudentPerformance(filters?: ReportFilters): Promise<Json> {
    const { data, error } = await (supabase as any).rpc('report_student_performance', {
      p_student_id: filters?.studentId,
      p_batch_id: filters?.batchId,
      p_date_from: filters?.dateFrom,
      p_date_to: filters?.dateTo,
    });
    if (error) throw error;
    return data;
  },

  async getTestPerformance(filters?: ReportFilters): Promise<Json> {
    const { data, error } = await (supabase as any).rpc('report_test_performance', {
      p_test_id: filters?.testId,
      p_force_id: filters?.forceId,
      p_date_from: filters?.dateFrom,
      p_date_to: filters?.dateTo,
    });
    if (error) throw error;
    return data;
  },

  async getPassFailSummary(filters?: ReportFilters): Promise<Json> {
    const { data, error } = await (supabase as any).rpc('report_pass_fail_summary', {
      p_force_id: filters?.forceId,
      p_date_from: filters?.dateFrom,
      p_date_to: filters?.dateTo,
    });
    if (error) throw error;
    return data;
  },

  async getForcePerformance(filters?: ReportFilters): Promise<Json> {
    const { data, error } = await (supabase as any).rpc('report_force_performance', {
      p_date_from: filters?.dateFrom,
      p_date_to: filters?.dateTo,
    });
    if (error) throw error;
    return data;
  },
};

export default reportService;
