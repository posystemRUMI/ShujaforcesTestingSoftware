import { supabase } from '@/lib/supabaseClient';
export interface PracticeOption { id: string; label: string; text: string; imageUrl?: string }
export interface PracticeQuestion { id: string; code: string; subjectId: string; subjectName: string; stem: string; imageUrl?: string; options: PracticeOption[]; correctOptionId: string; explanation: string }
export const familiarizationService = {
  async isFamiliarizationCompleted(testId: string): Promise<boolean> {
    const { data, error } = await (supabase as any).rpc('is_familiarization_completed', { p_test_id: testId });
    if (error) throw new Error(error.message);
    return data === true;
  },
  async markFamiliarizationCompleted(testId: string): Promise<void> {
    const { error } = await (supabase as any).rpc('record_familiarization_completion', { p_test_id: testId });
    if (error) throw new Error(error.message);
  },
};
export default familiarizationService;
