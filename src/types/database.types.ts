export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: 'ADMIN' | 'TEACHER' | 'STUDENT';
          display_name: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
          display_name: string;
          email: string;
          phone?: string | null;
          avatar_url?: string | null;
          status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: 'ADMIN' | 'TEACHER' | 'STUDENT';
          display_name?: string;
          email?: string;
          phone?: string | null;
          avatar_url?: string | null;
          status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
          created_at?: string;
          updated_at?: string;
        };
      };
      forces: {
        Row: {
          id: string;
          code: string;
          name: string;
          description: string | null;
          motto: string | null;
          headquarters: string | null;
          status: 'ACTIVE' | 'INACTIVE';
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          description?: string | null;
          motto?: string | null;
          headquarters?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          motto?: string | null;
          headquarters?: string | null;
          status?: 'ACTIVE' | 'INACTIVE';
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          force_id: string;
          code: string;
          name: string;
          description: string | null;
          duration_weeks: number;
          eligibility_criteria: Json | null;
          status: 'ACTIVE' | 'INACTIVE';
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          force_id: string;
          code: string;
          name: string;
          description?: string | null;
          duration_weeks?: number;
          eligibility_criteria?: Json | null;
          status?: 'ACTIVE' | 'INACTIVE';
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          force_id?: string;
          code?: string;
          name?: string;
          description?: string | null;
          duration_weeks?: number;
          eligibility_criteria?: Json | null;
          status?: 'ACTIVE' | 'INACTIVE';
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          code: string;
          name: string;
          category: 'INTELLIGENCE' | 'ACADEMIC';
          description: string | null;
          default_time_per_question_sec: number;
          status: 'ACTIVE' | 'INACTIVE';
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          category?: 'INTELLIGENCE' | 'ACADEMIC';
          description?: string | null;
          default_time_per_question_sec?: number;
          status?: 'ACTIVE' | 'INACTIVE';
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          category?: 'INTELLIGENCE' | 'ACADEMIC';
          description?: string | null;
          default_time_per_question_sec?: number;
          status?: 'ACTIVE' | 'INACTIVE';
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      course_subjects: {
        Row: {
          course_id: string;
          subject_id: string;
          is_mandatory: boolean;
          minimum_pass_percentage: number;
        };
        Insert: {
          course_id: string;
          subject_id: string;
          is_mandatory?: boolean;
          minimum_pass_percentage?: number;
        };
        Update: {
          course_id?: string;
          subject_id?: string;
          is_mandatory?: boolean;
          minimum_pass_percentage?: number;
        };
      };
      batches: {
        Row: {
          id: string;
          code: string;
          name: string;
          course_id: string;
          session_name: string;
          start_date: string;
          end_date: string | null;
          status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ARCHIVED';
          max_cadets: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          course_id: string;
          session_name: string;
          start_date: string;
          end_date?: string | null;
          status?: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ARCHIVED';
          max_cadets?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          course_id?: string;
          session_name?: string;
          start_date?: string;
          end_date?: string | null;
          status?: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ARCHIVED';
          max_cadets?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      teachers: {
        Row: {
          id: string;
          profile_id: string;
          service_number: string;
          rank: string;
          branch_code: string;
          role_title: string;
          status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          service_number: string;
          rank: string;
          branch_code: string;
          role_title?: string;
          status?: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          service_number?: string;
          rank?: string;
          branch_code?: string;
          role_title?: string;
          status?: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
          created_at?: string;
          updated_at?: string;
        };
      };
      teacher_subjects: {
        Row: {
          teacher_id: string;
          subject_id: string;
        };
        Insert: {
          teacher_id: string;
          subject_id: string;
        };
        Update: {
          teacher_id?: string;
          subject_id?: string;
        };
      };
      students: {
        Row: {
          id: string;
          profile_id: string;
          roll_number: string;
          father_name: string;
          cnic: string | null;
          date_of_birth: string | null;
          target_force_id: string;
          target_course_id: string;
          status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DISQUALIFIED';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          roll_number: string;
          father_name: string;
          cnic?: string | null;
          date_of_birth?: string | null;
          target_force_id: string;
          target_course_id: string;
          status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DISQUALIFIED';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          profile_id?: string;
          roll_number?: string;
          father_name?: string;
          cnic?: string | null;
          date_of_birth?: string | null;
          target_force_id?: string;
          target_course_id?: string;
          status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DISQUALIFIED';
          created_at?: string;
          updated_at?: string;
        };
      };
      batch_enrollments: {
        Row: {
          id: string;
          batch_id: string;
          student_id: string;
          enrolled_at: string;
          status: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          batch_id: string;
          student_id: string;
          enrolled_at?: string;
          status?: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          batch_id?: string;
          student_id?: string;
          enrolled_at?: string;
          status?: string;
          notes?: string | null;
        };
      };
      questions: {
        Row: {
          id: string;
          code: string;
          subject_id: string;
          difficulty: 'EASY' | 'MEDIUM' | 'HARD';
          stem: string;
          stem_image_url: string | null;
          explanation: string | null;
          time_limit_seconds: number;
          status: 'DRAFT' | 'APPROVED' | 'INACTIVE' | 'ARCHIVED';
          author_id: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          subject_id: string;
          difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
          stem: string;
          stem_image_url?: string | null;
          explanation?: string | null;
          time_limit_seconds?: number;
          status?: 'DRAFT' | 'APPROVED' | 'INACTIVE' | 'ARCHIVED';
          author_id?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          subject_id?: string;
          difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
          stem?: string;
          stem_image_url?: string | null;
          explanation?: string | null;
          time_limit_seconds?: number;
          status?: 'DRAFT' | 'APPROVED' | 'INACTIVE' | 'ARCHIVED';
          author_id?: string | null;
          tags?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      question_options: {
        Row: {
          id: string;
          question_id: string;
          option_key: string;
          label: string;
          text: string;
          image_url: string | null;
          is_correct: boolean;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          option_key: string;
          label: string;
          text: string;
          image_url?: string | null;
          is_correct?: boolean;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          option_key?: string;
          label?: string;
          text?: string;
          image_url?: string | null;
          is_correct?: boolean;
          sort_order?: number;
          created_at?: string;
        };
      };
      question_courses: {
        Row: {
          question_id: string;
          course_id: string;
        };
        Insert: {
          question_id: string;
          course_id: string;
        };
        Update: {
          question_id?: string;
          course_id?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          actor_role: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          actor_role: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          actor_role?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      // ================================================================
      // BACKEND-AGENT-2 / Claude — Assessment Engine Tables
      // ================================================================
      tests: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          force_id: string;
          course_id: string;
          batch_id: string | null;
          passing_threshold: number;
          total_marks: number;
          duration_minutes: number;
          shuffle_questions: boolean;
          shuffle_options: boolean;
          allow_section_navigation: boolean;
          show_result_immediately: boolean;
          show_answer_review: boolean;
          negative_marking: boolean;
          negative_mark_value: number;
          status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
          created_by: string | null;
          published_at: string | null;
          published_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          force_id: string;
          course_id: string;
          batch_id?: string | null;
          passing_threshold?: number;
          total_marks?: number;
          duration_minutes?: number;
          shuffle_questions?: boolean;
          shuffle_options?: boolean;
          allow_section_navigation?: boolean;
          show_result_immediately?: boolean;
          show_answer_review?: boolean;
          negative_marking?: boolean;
          negative_mark_value?: number;
          status?: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
          created_by?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          force_id?: string;
          course_id?: string;
          batch_id?: string | null;
          passing_threshold?: number;
          total_marks?: number;
          duration_minutes?: number;
          shuffle_questions?: boolean;
          shuffle_options?: boolean;
          allow_section_navigation?: boolean;
          show_result_immediately?: boolean;
          show_answer_review?: boolean;
          negative_marking?: boolean;
          negative_mark_value?: number;
          status?: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
          created_by?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      test_sections: {
        Row: {
          id: string;
          test_id: string;
          name: string;
          position: number;
          question_count: number;
          duration_minutes: number;
          subject_id: string | null;
          marks_per_question: number;
          shuffle_questions: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          test_id: string;
          name: string;
          position?: number;
          question_count?: number;
          duration_minutes?: number;
          subject_id?: string | null;
          marks_per_question?: number;
          shuffle_questions?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          test_id?: string;
          name?: string;
          position?: number;
          question_count?: number;
          duration_minutes?: number;
          subject_id?: string | null;
          marks_per_question?: number;
          shuffle_questions?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      test_section_questions: {
        Row: {
          id: string;
          test_section_id: string;
          question_id: string;
          position: number;
          marks: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          test_section_id: string;
          question_id: string;
          position?: number;
          marks?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          test_section_id?: string;
          question_id?: string;
          position?: number;
          marks?: number;
          created_at?: string;
        };
      };
      test_assignments: {
        Row: {
          id: string;
          test_id: string;
          batch_id: string;
          assigned_by: string;
          available_from: string;
          available_until: string | null;
          max_attempts: number;
          status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          test_id: string;
          batch_id: string;
          assigned_by: string;
          available_from?: string;
          available_until?: string | null;
          max_attempts?: number;
          status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          test_id?: string;
          batch_id?: string;
          assigned_by?: string;
          available_from?: string;
          available_until?: string | null;
          max_attempts?: number;
          status?: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      test_attempts: {
        Row: {
          id: string;
          student_id: string;
          test_id: string;
          assignment_id: string;
          attempt_number: number;
          started_at: string;
          expires_at: string;
          submitted_at: string | null;
          current_section_id: string | null;
          status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'EXPIRED' | 'FORCE_SUBMITTED';
          question_order: Json;
          option_order: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          test_id: string;
          assignment_id: string;
          attempt_number?: number;
          started_at?: string;
          expires_at: string;
          submitted_at?: string | null;
          current_section_id?: string | null;
          status?: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'EXPIRED' | 'FORCE_SUBMITTED';
          question_order?: Json;
          option_order?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          test_id?: string;
          assignment_id?: string;
          attempt_number?: number;
          started_at?: string;
          expires_at?: string;
          submitted_at?: string | null;
          current_section_id?: string | null;
          status?: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'EXPIRED' | 'FORCE_SUBMITTED';
          question_order?: Json;
          option_order?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attempt_section_progress: {
        Row: {
          id: string;
          attempt_id: string;
          section_id: string;
          started_at: string | null;
          expires_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          section_id: string;
          started_at?: string | null;
          expires_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          section_id?: string;
          started_at?: string | null;
          expires_at?: string | null;
          completed_at?: string | null;
        };
      };
      attempt_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_option_id: string | null;
          marked_for_review: boolean;
          answered_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          question_id: string;
          selected_option_id?: string | null;
          marked_for_review?: boolean;
          answered_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          question_id?: string;
          selected_option_id?: string | null;
          marked_for_review?: boolean;
          answered_at?: string;
          updated_at?: string;
        };
      };
      test_results: {
        Row: {
          id: string;
          attempt_id: string;
          student_id: string;
          test_id: string;
          total_questions: number;
          correct_count: number;
          incorrect_count: number;
          skipped_count: number;
          marks_obtained: number;
          max_marks: number;
          percentage: number;
          passed: boolean;
          section_results: Json;
          stanine: number | null;
          time_spent_seconds: number | null;
          generated_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          attempt_id: string;
          student_id: string;
          test_id: string;
          total_questions?: number;
          correct_count?: number;
          incorrect_count?: number;
          skipped_count?: number;
          marks_obtained?: number;
          max_marks?: number;
          percentage?: number;
          passed?: boolean;
          section_results?: Json;
          stanine?: number | null;
          time_spent_seconds?: number | null;
          generated_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          attempt_id?: string;
          student_id?: string;
          test_id?: string;
          total_questions?: number;
          correct_count?: number;
          incorrect_count?: number;
          skipped_count?: number;
          marks_obtained?: number;
          max_marks?: number;
          percentage?: number;
          passed?: boolean;
          section_results?: Json;
          stanine?: number | null;
          time_spent_seconds?: number | null;
          generated_at?: string;
          created_at?: string;
        };
      };
      retake_permissions: {
        Row: {
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
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id: string;
          test_id: string;
          original_attempt_id?: string | null;
          approved_by: string;
          approved_at?: string;
          expires_at?: string | null;
          status?: 'AVAILABLE' | 'USED' | 'EXPIRED' | 'REVOKED';
          notes?: string | null;
          consumed_attempt_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string;
          test_id?: string;
          original_attempt_id?: string | null;
          approved_by?: string;
          approved_at?: string;
          expires_at?: string | null;
          status?: 'AVAILABLE' | 'USED' | 'EXPIRED' | 'REVOKED';
          notes?: string | null;
          consumed_attempt_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      attempt_heartbeats: {
        Row: {
          attempt_id: string;
          student_id: string;
          test_id: string;
          last_seen: string;
          answered_count: number;
          current_question_index: number;
          current_section_name: string | null;
          connection_state: string;
          progress_percent: number;
          metadata: Json;
          updated_at: string;
        };
        Insert: {
          attempt_id: string;
          student_id: string;
          test_id: string;
          last_seen?: string;
          answered_count?: number;
          current_question_index?: number;
          current_section_name?: string | null;
          connection_state?: string;
          progress_percent?: number;
          metadata?: Json;
          updated_at?: string;
        };
        Update: {
          attempt_id?: string;
          student_id?: string;
          test_id?: string;
          last_seen?: string;
          answered_count?: number;
          current_question_index?: number;
          current_section_name?: string | null;
          connection_state?: string;
          progress_percent?: number;
          metadata?: Json;
          updated_at?: string;
        };
      };
    };
    Views: {
      v_active_monitoring: {
        Row: {
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
        };
      };
    };
    Functions: {
      current_app_role: {
        Args: Record<PropertyKey, never>;
        Returns: 'ADMIN' | 'TEACHER' | 'STUDENT';
      };
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_teacher: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_student: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      log_audit_event: {
        Args: {
          p_action: string;
          p_entity_type: string;
          p_entity_id?: string;
          p_metadata?: Json;
        };
        Returns: string;
      };
      admin_create_student: {
        Args: {
          p_user_id: string;
          p_roll_number: string;
          p_father_name: string;
          p_cnic: string;
          p_date_of_birth: string;
          p_target_force_id: string;
          p_target_course_id: string;
          p_batch_id?: string;
        };
        Returns: string;
      };
      admin_create_teacher: {
        Args: {
          p_user_id: string;
          p_service_number: string;
          p_rank: string;
          p_branch_code: string;
          p_role_title: string;
          p_subject_ids?: string[];
        };
        Returns: string;
      };
      admin_upsert_question: {
        Args: {
          p_id?: string;
          p_code: string;
          p_subject_id: string;
          p_difficulty: 'EASY' | 'MEDIUM' | 'HARD';
          p_stem: string;
          p_stem_image_url?: string;
          p_explanation?: string;
          p_time_limit_seconds: number;
          p_status: 'DRAFT' | 'APPROVED' | 'INACTIVE' | 'ARCHIVED';
          p_tags: string[];
          p_course_ids: string[];
          p_options: Json;
        };
        Returns: string;
      };
      get_safe_exam_questions: {
        Args: {
          p_question_ids: string[];
        };
        Returns: {
          id: string;
          code: string;
          subject_id: string;
          difficulty: 'EASY' | 'MEDIUM' | 'HARD';
          stem: string;
          stem_image_url: string | null;
          time_limit_seconds: number;
          options: Json;
        }[];
      };
      // Claude Assessment Engine RPCs
      generate_test_section_questions: {
        Args: {
          p_section_id: string;
          p_subject_id: string;
          p_count: number;
          p_force_id?: string;
          p_course_id?: string;
        };
        Returns: number;
      };
      add_question_to_section: {
        Args: {
          p_section_id: string;
          p_question_id: string;
          p_position?: number;
          p_marks?: number;
        };
        Returns: string;
      };
      remove_question_from_section: {
        Args: {
          p_section_id: string;
          p_question_id: string;
        };
        Returns: boolean;
      };
      publish_test: {
        Args: {
          p_test_id: string;
        };
        Returns: boolean;
      };
      assign_test: {
        Args: {
          p_test_id: string;
          p_batch_id: string;
          p_available_from?: string;
          p_available_until?: string;
          p_max_attempts?: number;
          p_notes?: string;
        };
        Returns: string;
      };
      start_test_attempt: {
        Args: {
          p_test_id: string;
        };
        Returns: Json;
      };
      get_safe_exam_payload: {
        Args: {
          p_attempt_id: string;
        };
        Returns: Json;
      };
      advance_section: {
        Args: {
          p_attempt_id: string;
          p_next_section_id: string;
        };
        Returns: Json;
      };
      save_answer: {
        Args: {
          p_attempt_id: string;
          p_question_id: string;
          p_selected_option_id?: string;
          p_marked_for_review?: boolean;
        };
        Returns: boolean;
      };
      submit_test_attempt: {
        Args: {
          p_attempt_id: string;
        };
        Returns: Json;
      };
      get_result_detail: {
        Args: {
          p_result_id: string;
        };
        Returns: Json;
      };
      approve_retake: {
        Args: {
          p_student_id: string;
          p_test_id: string;
          p_original_attempt_id?: string;
          p_expires_at?: string;
          p_notes?: string;
        };
        Returns: string;
      };
      get_server_time: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      record_heartbeat: {
        Args: {
          p_attempt_id: string;
          p_answered_count?: number;
          p_current_question_index?: number;
          p_current_section_name?: string;
        };
        Returns: boolean;
      };
      force_submit_attempt: {
        Args: {
          p_attempt_id: string;
        };
        Returns: Json;
      };
      calculate_stanine: {
        Args: {
          p_percentage: number;
        };
        Returns: number;
      };
      report_batch_performance: {
        Args: {
          p_batch_id?: string;
          p_force_id?: string;
          p_date_from?: string;
          p_date_to?: string;
        };
        Returns: Json;
      };
      report_student_performance: {
        Args: {
          p_student_id?: string;
          p_batch_id?: string;
          p_date_from?: string;
          p_date_to?: string;
        };
        Returns: Json;
      };
      report_test_performance: {
        Args: {
          p_test_id?: string;
          p_force_id?: string;
          p_date_from?: string;
          p_date_to?: string;
        };
        Returns: Json;
      };
      report_pass_fail_summary: {
        Args: {
          p_force_id?: string;
          p_date_from?: string;
          p_date_to?: string;
        };
        Returns: Json;
      };
      report_force_performance: {
        Args: {
          p_date_from?: string;
          p_date_to?: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      app_role: 'ADMIN' | 'TEACHER' | 'STUDENT';
      question_difficulty: 'EASY' | 'MEDIUM' | 'HARD';
      question_status: 'DRAFT' | 'APPROVED' | 'INACTIVE' | 'ARCHIVED';
      subject_category: 'INTELLIGENCE' | 'ACADEMIC';
      batch_status: 'ACTIVE' | 'UPCOMING' | 'COMPLETED' | 'ARCHIVED';
      student_status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DISQUALIFIED';
      teacher_status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE';
      test_status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
      attempt_status: 'IN_PROGRESS' | 'SUBMITTED' | 'AUTO_SUBMITTED' | 'EXPIRED' | 'FORCE_SUBMITTED';
      assignment_status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'COMPLETED';
      retake_status: 'AVAILABLE' | 'USED' | 'EXPIRED' | 'REVOKED';
    };
  };
};
