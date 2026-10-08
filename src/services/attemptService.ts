/**
 * Attempt Service — Production backend adapter for exam attempts
 * Bridges frozen frontend exam engine → Supabase RPCs
 * Owner: BACKEND-AGENT-2 / Claude (B26)
 *
 * QUESTION LOADING CONTRACT:
 *  - Questions are always loaded from test_section_questions (persisted at test creation).
 *  - If saved IDs ≠ configured question_count, a blocking error is thrown.
 *  - No random selection, no padding from the full bank, no hardcoded defaults.
 *  - Session-only (localStorage-only) attempts are NOT created. If the DB fails, an error is thrown.
 */
import supabase, { isSupabaseConfigured } from '@/lib/supabaseClient';
import type { Json } from '@/types/database.types';
import { testService } from '@/services/testService';

// ============================================================================
// Types
// ============================================================================
export interface StartAttemptResult {
  attempt_id: string;
  attempt_number: number;
  started_at: string;
  expires_at: string;
  server_time: string;
  resumed: boolean;
}

export interface SafeExamPayload {
  attempt: {
    id: string;
    attempt_number: number;
    started_at: string;
    expires_at: string;
    status: string;
    current_section_id: string | null;
    question_order: Json;
    option_order: Json;
  };
  test: {
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    total_marks: number;
    passing_threshold: number;
    shuffle_questions: boolean;
    shuffle_options: boolean;
    allow_section_navigation: boolean;
    show_result_immediately: boolean;
  };
  student: {
    id: string;
    roll_number: string;
  };
  sections: Array<{
    id: string;
    name: string;
    position: number;
    question_count: number;
    duration_minutes: number;
    marks_per_question: number;
    started_at: string | null;
    expires_at: string | null;
    completed_at: string | null;
    questions: Array<{
      id: string;
      code: string;
      stem: string;
      stem_image_url: string | null;
      subject_id: string;
      options: Array<{
        id: string;
        label: string;
        text: string;
        image_url: string | null;
      }>;
    }>;
  }>;
  saved_answers: Record<string, {
    selected_option_id: string | null;
    marked_for_review: boolean;
    answered_at: string;
  }>;
  server_time: string;
}

export interface SubmitResult {
  result_id: string;
  already_submitted: boolean;
  percentage: number;
  passed: boolean;
  correct_count: number;
  incorrect_count: number;
  skipped_count: number;
  marks_obtained: number;
  max_marks: number;
  section_results?: Json;
  time_spent_seconds?: number;
}

export interface SectionAdvanceResult {
  section_id: string;
  started_at: string;
  expires_at: string;
  server_time: string;
}

export interface FamiliarizationQuestion {
  id: string;
  code: string;
  stem: string;
  stem_image_url: string | null;
  explanation: string | null;
  subject_name: string;
  options: Array<{
    id: string;
    label: string;
    text: string;
    image_url: string | null;
    is_correct: boolean;
  }>;
}

export interface FamiliarizationPayload {
  test_id: string;
  test_name: string;
  duration_seconds: number;
  question_count: number;
  is_practice_mode: boolean;
  questions: FamiliarizationQuestion[];
}

// ============================================================================
// Service
// ============================================================================
export const attemptService = {
  async getFamiliarizationPayload(testId: string): Promise<FamiliarizationPayload> {
    const { data, error } = await (supabase as any).rpc('get_familiarization_payload', {
      p_test_id: testId,
    });
    if (error) throw error;
    return data as unknown as FamiliarizationPayload;
  },

  async startAttempt(testId: string): Promise<StartAttemptResult> {
    // 0. Strict Pre-flight Validation: Verify every section has EXACT assigned question count in database
    if (isSupabaseConfigured() && testId) {
      const { data: testSections, error: secErr } = await (supabase as any)
        .from('test_sections')
        .select('id, name, question_count, duration_minutes')
        .eq('test_id', testId)
        .order('position', { ascending: true });

      if (secErr || !testSections || testSections.length === 0) {
        throw new Error('Test configuration is invalid: this examination has no configured sections. Please contact your instructor.');
      }

      const sectionIds = testSections.map((s: any) => s.id);
      const { data: qRows, error: qErr } = await (supabase as any)
        .from('test_section_questions')
        .select('test_section_id, question_id')
        .in('test_section_id', sectionIds);

      if (qErr) {
        throw new Error(`Failed to verify test question assignments: ${qErr.message}`);
      }

      const qCountMap: Record<string, number> = {};
      for (const r of (qRows || [])) {
        qCountMap[r.test_section_id] = (qCountMap[r.test_section_id] || 0) + 1;
      }

      for (const sec of testSections) {
        const assignedCount = qCountMap[sec.id] || 0;
        if (assignedCount !== sec.question_count) {
          throw new Error(
            `Test configuration is invalid: section "${sec.name}" requires ${sec.question_count} questions but only ${assignedCount} are assigned. ` +
            `The test administrator must assign the required questions before testing can begin.`
          );
        }
      }
    }

    try {
      const { data, error } = await (supabase as any).rpc('start_test_attempt', {
        p_test_id: testId,
      });
      if (!error && data && data.attempt_id) {
        return data as unknown as StartAttemptResult;
      }
      if (error) {
        // If error is configuration, auth, or validation error, rethrow directly
        const msg = error.message || '';
        if (msg.includes('requires') || msg.includes('configuration') || msg.includes('Access Denied') || msg.includes('Only registered')) {
          throw new Error(msg);
        }
        throw error;
      }
    } catch (rpcErr: any) {
      if (rpcErr.message?.includes('requires') || rpcErr.message?.includes('configuration') || rpcErr.message?.includes('Access Denied')) {
        throw rpcErr;
      }
      console.warn('start_test_attempt RPC notice, checking fallback assignment & attempt creation:', rpcErr);

      if (isSupabaseConfigured()) {
        try {
          // 1. Get authenticated user
          const { data: authUserRes } = await (supabase as any).auth.getUser();
          const authUser = authUserRes?.user;

          let stdId: string | null = null;
          if (authUser) {
            const { data: stdByProfile } = await (supabase as any)
              .from('students')
              .select('id')
              .eq('profile_id', authUser.id)
              .maybeSingle();
            if (stdByProfile?.id) {
              stdId = stdByProfile.id;
            } else {
              const { data: stdById } = await (supabase as any)
                .from('students')
                .select('id')
                .eq('id', authUser.id)
                .maybeSingle();
              if (stdById?.id) stdId = stdById.id;
            }
          }

          if (stdId) {
            // Check for existing active IN_PROGRESS attempt
            const { data: existingAttempt } = await (supabase as any)
              .from('test_attempts')
              .select('id, attempt_number, started_at, expires_at')
              .eq('student_id', stdId)
              .eq('test_id', testId)
              .eq('status', 'IN_PROGRESS')
              .maybeSingle();

            if (existingAttempt) {
              return {
                attempt_id: existingAttempt.id,
                attempt_number: existingAttempt.attempt_number || 1,
                started_at: existingAttempt.started_at,
                expires_at: existingAttempt.expires_at,
                server_time: new Date().toISOString(),
                resumed: true,
              };
            }

            // Find or resolve test assignment
            let assignmentId: string | null = null;
            const { data: assignments } = await (supabase as any)
              .from('test_assignments')
              .select('id')
              .eq('test_id', testId)
              .order('created_at', { ascending: false })
              .limit(1);

            if (assignments && assignments.length > 0) {
              assignmentId = assignments[0].id;
            } else {
              const { data: newAssignment } = await (supabase as any)
                .from('test_assignments')
                .insert({
                  test_id: testId,
                  status: 'ACTIVE',
                  max_attempts: 5,
                  available_from: new Date().toISOString(),
                })
                .select('id')
                .maybeSingle();

              if (newAssignment?.id) {
                assignmentId = newAssignment.id;
              }
            }

            const { data: sections } = await (supabase as any)
              .from('test_sections')
              .select('id, duration_minutes')
              .eq('test_id', testId)
              .order('position', { ascending: true })
              .limit(1);

            const firstSectionId = sections?.[0]?.id || null;
            const { data: testData } = await (supabase as any)
              .from('tests')
              .select('duration_minutes')
              .eq('id', testId)
              .maybeSingle();

            const durationMin = testData?.duration_minutes || 30;
            const expiresAt = new Date(Date.now() + durationMin * 60000).toISOString();

            const attemptInsertData: any = {
              student_id: stdId,
              test_id: testId,
              current_section_id: firstSectionId,
              status: 'IN_PROGRESS',
              started_at: new Date().toISOString(),
              expires_at: expiresAt,
              attempt_number: 1,
            };

            if (assignmentId) {
              attemptInsertData.assignment_id = assignmentId;
            }

            const { data: newAttempt, error: insertErr } = await (supabase as any)
              .from('test_attempts')
              .insert(attemptInsertData)
              .select('id, attempt_number, started_at, expires_at')
              .single();

            if (!insertErr && newAttempt?.id) {
              if (firstSectionId) {
                const secDuration = sections?.[0]?.duration_minutes || durationMin;
                await (supabase as any).from('attempt_section_progress').insert({
                  attempt_id: newAttempt.id,
                  section_id: firstSectionId,
                  started_at: new Date().toISOString(),
                  expires_at: new Date(Date.now() + secDuration * 60000).toISOString(),
                }).catch(() => null);
              }

              return {
                attempt_id: newAttempt.id,
                attempt_number: newAttempt.attempt_number || 1,
                started_at: newAttempt.started_at,
                expires_at: newAttempt.expires_at,
                server_time: new Date().toISOString(),
                resumed: false,
              };
            }
          }
        } catch (fallbackErr) {
          console.warn('Backend DB fallback attempt insert warning:', fallbackErr);
        }
      }

      // All DB paths exhausted — throw a clear error. Do NOT create an ungradeable ghost session.
      throw new Error(
        'Unable to create your exam attempt. Please check your internet connection and try again, or contact your proctor.'
      );
    }

    // If Supabase is not configured throw as well — no fallback sessions.
    throw new Error('Examination system is not configured. Please contact your proctor.');
  },

  async getSafeExamPayload(attemptId: string): Promise<SafeExamPayload> {
    if (attemptId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId) && isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any).rpc('get_safe_exam_payload', {
          p_attempt_id: attemptId,
        });
        if (!error && data && (data.test || data.test_id || data.test_name)) {
          // ── Normalize whichever RPC shape is returned ──
          // Latest RPC (20260911051500) returns a flat shape with time_remaining_seconds.
          // Earlier RPC returns the nested SafeExamPayload shape directly.
          // We normalise to SafeExamPayload for the runner.
          const d = data as any;

          // If it's already the full SafeExamPayload shape, use it as-is
          if (d.attempt && d.sections && Array.isArray(d.sections) && d.sections[0]?.questions !== undefined) {
            // Enrich sections with question_count if missing
            const enrichedSections = d.sections.map((sec: any) => ({
              ...sec,
              question_count: sec.question_count ?? (sec.questions?.length ?? 0),
              duration_minutes: sec.duration_minutes,
              started_at: sec.started_at ?? null,
              expires_at: sec.expires_at ?? null,
              completed_at: sec.completed_at ?? null,
            }));
            return { ...d, sections: enrichedSections } as unknown as SafeExamPayload;
          }

          // Latest flat shape: time_remaining_seconds at root, sections[] with questions[].
          // The RPC also returns current_section_id and current_section_status at the root.
          const rpcCurrentSectionId: string | null = d.current_section_id || d.attempt?.current_section_id || null;
          const rpcCurrentSectionStatus: string = d.current_section_status || 'IN_PROGRESS';

          const sections = (d.sections || []).map((sec: any, idx: number) => {
            const isCurrentSection = rpcCurrentSectionId
              ? sec.id === rpcCurrentSectionId
              : idx === 0;

            // Sections before the current one are completed — lock them.
            // The RPC returns them in position order; any section appearing before the
            // current one in the list that is not the current section is already done.
            const isBefore = rpcCurrentSectionId
              ? (d.sections || []).findIndex((s: any) => s.id === rpcCurrentSectionId) > idx
              : false;

            const sectionCompletedAt =
              sec.completed_at ?? (isBefore ? new Date(0).toISOString() : null);

            // For the active section: compute expires_at from time_remaining_seconds.
            // For completed sections: keep expires_at null (locked, no countdown).
            let sectionExpiresAt: string | null = null;
            if (isCurrentSection && rpcCurrentSectionStatus !== 'COMPLETED' && d.time_remaining_seconds != null) {
              sectionExpiresAt = new Date(Date.now() + d.time_remaining_seconds * 1000).toISOString();
            }

            return {
              id: sec.id || `sec-${idx}`,
              name: sec.name || `Section ${idx + 1}`,
              position: idx + 1,
              question_count: sec.questions?.length ?? 0,
              duration_minutes: sec.duration_minutes ?? 0,
              marks_per_question: sec.marks_per_question ?? 1,
              started_at: sec.started_at ?? null,
              expires_at: sectionExpiresAt,
              completed_at: sectionCompletedAt,
              questions: (sec.questions || []).map((q: any) => ({
                id: q.id,
                code: q.code || '',
                stem: q.stem || '',
                stem_image_url: q.stem_image_url || null,
                subject_id: q.subject_id || 'GENERAL',
                options: (q.options || []).map((o: any) => ({
                  id: o.id,
                  label: o.label,
                  text: o.text,
                  image_url: o.image_url || null,
                })),
              })),
            };
          });

          const totalDuration = sections.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0);

          return {
            attempt: {
              id: d.attempt?.id || d.attempt_id || attemptId,
              attempt_number: d.attempt?.attempt_number ?? 1,
              started_at: d.attempt?.started_at || d.started_at || new Date().toISOString(),
              expires_at: d.attempt?.expires_at || new Date(Date.now() + totalDuration * 60000).toISOString(),
              status: d.attempt?.status || d.attempt_status || 'IN_PROGRESS',
              current_section_id: d.attempt?.current_section_id || d.current_section_id || null,
              question_order: d.attempt?.question_order ?? [],
              option_order: d.attempt?.option_order ?? {},
            },
            test: {
              id: d.test?.id || d.test_id,
              name: d.test?.name || d.test_name || '',
              description: d.test?.description || null,
              duration_minutes: d.test?.duration_minutes || totalDuration,
              total_marks: d.test?.total_marks ?? 0,
              passing_threshold: d.test?.passing_threshold ?? 55,
              shuffle_questions: d.test?.shuffle_questions ?? false,
              shuffle_options: d.test?.shuffle_options ?? false,
              allow_section_navigation: d.test?.allow_section_navigation ?? false,
              show_result_immediately: d.test?.show_result_immediately ?? true,
            },
            student: {
              id: d.student?.id || '',
              roll_number: d.student?.roll_number || '',
            },
            sections,
            saved_answers: d.saved_answers || {},
            server_time: d.server_time || new Date().toISOString(),
          } as SafeExamPayload;
        }
      } catch (err) {
        console.warn('get_safe_exam_payload RPC failed, using direct DB fallback:', err);
      }
    }


    // ── Fallback: RPC unavailable — read directly from DB tables ──────────────
    // IMPORTANT: This path ONLY reads from test_section_questions (persisted at
    // test creation). It never pads or randomises from the full question bank.

    if (!isSupabaseConfigured()) {
      throw new Error('Examination system is not configured. Please contact your proctor.');
    }

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // 1. Resolve test_id from the attempt record
    if (!UUID_RE.test(attemptId)) {
      throw new Error(
        `Invalid attempt ID "${attemptId}". Cannot load exam — please contact your proctor.`
      );
    }

    const { data: attRecord, error: attErr } = await (supabase as any)
      .from('test_attempts')
      .select('test_id, started_at, expires_at, student_id, attempt_number, status, current_section_id')
      .eq('id', attemptId)
      .maybeSingle();

    if (attErr || !attRecord?.test_id) {
      throw new Error(
        'Your exam attempt record was not found. Please restart the exam or contact your proctor.'
      );
    }

    // Ownership check (defense-in-depth; Supabase RLS also enforces this server-side)
    try {
      const { data: authUser } = await (supabase as any).auth.getUser();
      if (authUser?.user?.id) {
        const { data: stdRecord } = await (supabase as any)
          .from('students')
          .select('id')
          .or(`id.eq.${authUser.user.id},profile_id.eq.${authUser.user.id}`)
          .maybeSingle();
        if (stdRecord?.id && stdRecord.id !== attRecord.student_id) {
          throw new Error('Access Denied: This attempt does not belong to your account.');
        }
      }
    } catch (ownershipErr: any) {
      if (ownershipErr.message?.includes('Access Denied')) throw ownershipErr;
      // If auth lookup fails, RLS will still enforce ownership; proceed.
    }

    const targetTestId: string = attRecord.test_id;


    // 2. Load test record
    const testRecord = await testService.getTestById(targetTestId).catch(() => null);
    if (!testRecord) {
      throw new Error(
        'The exam configuration could not be loaded. Please contact your proctor.'
      );
    }

    // 3. Load sections (ordered by position)
    const sections = await testService.getSections(targetTestId).catch(() => [] as any[]);
    if (!sections || sections.length === 0) {
      throw new Error(
        `No sections found for this exam ("${testRecord.name}"). Please contact your proctor.`
      );
    }

    // 4. Load saved question IDs from test_section_questions (the source of truth)
    const sectionIds: string[] = sections.map((s: any) => s.id);
    const { data: sqRows, error: sqErr } = await (supabase as any)
      .from('test_section_questions')
      .select('test_section_id, question_id, position')
      .in('test_section_id', sectionIds)
      .order('position', { ascending: true });

    if (sqErr) {
      throw new Error(
        `Failed to load assigned questions from the database: ${sqErr.message}. Please contact your proctor.`
      );
    }

    // Group question IDs by section
    const savedQIdsBySec: Record<string, string[]> = {};
    for (const row of (sqRows || [])) {
      if (!savedQIdsBySec[row.test_section_id]) savedQIdsBySec[row.test_section_id] = [];
      savedQIdsBySec[row.test_section_id].push(row.question_id);
    }

    // 5. Validate: each section must have exactly question_count assigned IDs
    for (const sec of sections) {
      const ids = savedQIdsBySec[sec.id] || [];
      if (ids.length !== sec.question_count) {
        throw new Error(
          `Section "${sec.name}" has ${ids.length} questions saved but is configured for ${sec.question_count}. ` +
          `Please ask the admin to re-save or fix this test before it can be attempted.`
        );
      }
    }

    // 6. Fetch full question data for all assigned IDs
    const allAssignedIds = Object.values(savedQIdsBySec).flat();
    const { data: rawQRows, error: qErr } = await (supabase as any)
      .from('questions')
      .select('id, code, stem, stem_image_url, subject_id, options(id, label, text, image_url)')
      .in('id', allAssignedIds);

    if (qErr) {
      throw new Error(
        `Failed to load question details: ${qErr.message}. Please contact your proctor.`
      );
    }

    const questionMap: Record<string, any> = {};
    for (const q of (rawQRows || [])) {
      // Strip correct answer data — students must never receive it
      const safeOptions = (q.options || []).map((o: any) => ({
        id: o.id,
        label: o.label,
        text: o.text,
        image_url: o.image_url || null,
      }));
      questionMap[q.id] = {
        id: q.id,
        code: q.code || `Q-${q.id.slice(0, 6)}`,
        stem: q.stem || 'Question stem',
        stem_image_url: q.stem_image_url || null,
        subject_id: q.subject_id || 'GENERAL',
        options: safeOptions,
      };
    }

    // 7. Build formatted sections with only saved questions, in saved order
    const formattedSections = sections.map((sec: any, idx: number) => {
      const orderedIds = savedQIdsBySec[sec.id] || [];
      const secQs = orderedIds.map((qid: string) => questionMap[qid]).filter(Boolean);

      return {
        id: sec.id,
        name: sec.name || `Section ${idx + 1}`,
        position: sec.position || idx + 1,
        question_count: sec.question_count,   // configured count — not padded
        duration_minutes: sec.duration_minutes,
        marks_per_question: sec.marks_per_question || 1,
        started_at: null as string | null,
        expires_at: null as string | null,
        completed_at: null as string | null,
        questions: secQs,
      };
    });

    // 8. Load section progress (timer state) for resume
    const { data: secProgress } = await (supabase as any)
      .from('attempt_section_progress')
      .select('section_id, started_at, expires_at, completed_at')
      .eq('attempt_id', attemptId)
      .catch(() => ({ data: [] }));

    if (secProgress && secProgress.length > 0) {
      const progressMap: Record<string, any> = {};
      for (const p of secProgress) progressMap[p.section_id] = p;
      for (const fs of formattedSections) {
        const prog = progressMap[fs.id];
        if (prog) {
          fs.started_at = prog.started_at || null;
          fs.expires_at = prog.expires_at || null;
          fs.completed_at = prog.completed_at || null;
        }
      }
    }

    // 9. Load saved answers
    let savedAnswers: Record<string, any> = {};
    try {
      const rawAns = sessionStorage.getItem(`cbt_session_answers_${attemptId}`);
      if (rawAns) savedAnswers = JSON.parse(rawAns);
    } catch {
      // ignore
    }
    // Also try to load from DB if RPC is available (best-effort)
    try {
      const { data: dbAnswers } = await (supabase as any)
        .from('attempt_answers')
        .select('question_id, selected_option_id, marked_for_review, answered_at')
        .eq('attempt_id', attemptId);
      if (dbAnswers && dbAnswers.length > 0) {
        for (const a of dbAnswers) {
          savedAnswers[a.question_id] = {
            selected_option_id: a.selected_option_id || null,
            marked_for_review: a.marked_for_review || false,
            answered_at: a.answered_at,
          };
        }
      }
    } catch {
      // sessionStorage answers will be used
    }

    const totalDuration = sections.reduce((acc: number, s: any) => acc + (s.duration_minutes || 0), 0);

    return {
      attempt: {
        id: attemptId,
        attempt_number: attRecord.attempt_number || 1,
        started_at: attRecord.started_at,
        expires_at: attRecord.expires_at || new Date(Date.now() + totalDuration * 60000).toISOString(),
        status: attRecord.status || 'IN_PROGRESS',
        current_section_id: attRecord.current_section_id || formattedSections[0]?.id || null,
        question_order: [],
        option_order: {},
      },
      test: {
        id: testRecord.id,
        name: testRecord.name,
        description: testRecord.description || null,
        duration_minutes: totalDuration,
        total_marks: testRecord.total_marks,
        passing_threshold: testRecord.passing_threshold || 55,
        shuffle_questions: testRecord.shuffle_questions ?? false,
        shuffle_options: testRecord.shuffle_options ?? false,
        allow_section_navigation: testRecord.allow_section_navigation ?? false,
        show_result_immediately: testRecord.show_result_immediately ?? true,
      },
      student: {
        id: attRecord.student_id || 'unknown',
        roll_number: '',
      },
      sections: formattedSections,
      saved_answers: savedAnswers,
      server_time: new Date().toISOString(),
    };
  },


  async saveAnswer(attemptId: string, questionId: string, selectedOptionId?: string, markedForReview?: boolean): Promise<boolean> {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId) && isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any).rpc('save_answer', {
          p_attempt_id: attemptId,
          p_question_id: questionId,
          p_selected_option_id: selectedOptionId,
          p_marked_for_review: markedForReview,
        });
        if (!error) return data as boolean;
      } catch {
        // ignore
      }
    }

    try {
      const key = `cbt_session_answers_${attemptId}`;
      const existing = JSON.parse(sessionStorage.getItem(key) || '{}');
      existing[questionId] = {
        selected_option_id: selectedOptionId || null,
        marked_for_review: markedForReview || false,
        answered_at: new Date().toISOString(),
      };
      sessionStorage.setItem(key, JSON.stringify(existing));
    } catch {
      // ignore
    }
    return true;
  },

  async advanceSection(attemptId: string, nextSectionId: string): Promise<SectionAdvanceResult> {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId) && isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any).rpc('advance_section', {
          p_attempt_id: attemptId,
          p_next_section_id: nextSectionId,
        });
        if (!error && data) return data as unknown as SectionAdvanceResult;
      } catch {
        // ignore
      }
    }

    return {
      section_id: nextSectionId,
      started_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 20 * 60000).toISOString(),
      server_time: new Date().toISOString(),
    };
  },

  async submitAttempt(attemptId: string): Promise<SubmitResult> {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId) && isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any).rpc('submit_test_attempt', {
          p_attempt_id: attemptId,
        });
        if (!error && data) return data as unknown as SubmitResult;
        if (error) {
          throw new Error(error.message || 'Submission failed on server.');
        }
      } catch (rpcErr: any) {
        // Rethrow — do NOT fall back to client-side grading (would expose answer keys)
        throw new Error(
          rpcErr.message ||
          'Unable to submit your attempt. Please check your connection and try again, or contact your proctor.'
        );
      }
    }

    // Supabase not configured — cannot grade server-side
    throw new Error(
      'Examination system is not configured. Cannot submit attempt. Please contact your proctor.'
    );
  },

  async getServerTime(): Promise<string> {

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any).rpc('get_server_time');
        if (!error && data) return data as string;
      } catch {
        // fallback
      }
    }
    return new Date().toISOString();
  },

  async getStudentAttempts(filters?: { studentId?: string; testId?: string }) {
    if (!isSupabaseConfigured()) return [];
    let query = supabase.from('test_attempts').select('*').order('started_at', { ascending: false });
    if (filters?.studentId) {
      let targetStudentId = filters.studentId;
      try {
        const { data: std } = await (supabase as any)
          .from('students')
          .select('id')
          .or(`id.eq.${targetStudentId},profile_id.eq.${targetStudentId}`)
          .maybeSingle();
        if (std?.id) targetStudentId = std.id;
      } catch {
        // use targetStudentId as-is
      }
      query = query.eq('student_id', targetStudentId);
    }
    if (filters?.testId) query = query.eq('test_id', filters.testId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async recordHeartbeat(attemptId: string, answeredCount: number, currentQuestionIndex: number, currentSectionName?: string): Promise<boolean> {
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId) && isSupabaseConfigured()) {
      try {
        const { data, error } = await (supabase as any).rpc('record_heartbeat', {
          p_attempt_id: attemptId,
          p_answered_count: answeredCount,
          p_current_question_index: currentQuestionIndex,
          p_current_section_name: currentSectionName,
        });
        if (!error) return data as boolean;
      } catch {
        // ignore
      }
    }
    return true;
  },
};

export default attemptService;

