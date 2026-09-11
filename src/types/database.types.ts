export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      attempt_answers: {
        Row: {
          answered_at: string
          attempt_id: string
          id: string
          marked_for_review: boolean
          question_id: string
          selected_option_id: string | null
          updated_at: string
        }
        Insert: {
          answered_at?: string
          attempt_id: string
          id?: string
          marked_for_review?: boolean
          question_id: string
          selected_option_id?: string | null
          updated_at?: string
        }
        Update: {
          answered_at?: string
          attempt_id?: string
          id?: string
          marked_for_review?: boolean
          question_id?: string
          selected_option_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "v_active_monitoring"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_answers_selected_option_id_fkey"
            columns: ["selected_option_id"]
            isOneToOne: false
            referencedRelation: "question_options"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_heartbeats: {
        Row: {
          answered_count: number
          attempt_id: string
          connection_state: string
          current_question_index: number
          current_section_name: string | null
          last_seen: string
          metadata: Json | null
          progress_percent: number
          student_id: string
          test_id: string
          updated_at: string
        }
        Insert: {
          answered_count?: number
          attempt_id: string
          connection_state?: string
          current_question_index?: number
          current_section_name?: string | null
          last_seen?: string
          metadata?: Json | null
          progress_percent?: number
          student_id: string
          test_id: string
          updated_at?: string
        }
        Update: {
          answered_count?: number
          attempt_id?: string
          connection_state?: string
          current_question_index?: number
          current_section_name?: string | null
          last_seen?: string
          metadata?: Json | null
          progress_percent?: number
          student_id?: string
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempt_heartbeats_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_heartbeats_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "v_active_monitoring"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "attempt_heartbeats_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_heartbeats_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      attempt_section_progress: {
        Row: {
          attempt_id: string
          completed_at: string | null
          expires_at: string | null
          id: string
          section_id: string
          started_at: string | null
        }
        Insert: {
          attempt_id: string
          completed_at?: string | null
          expires_at?: string | null
          id?: string
          section_id: string
          started_at?: string | null
        }
        Update: {
          attempt_id?: string
          completed_at?: string | null
          expires_at?: string | null
          id?: string
          section_id?: string
          started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attempt_section_progress_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempt_section_progress_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "v_active_monitoring"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "attempt_section_progress_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "test_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_role: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_role: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_role?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
      batch_enrollments: {
        Row: {
          batch_id: string
          enrolled_at: string
          id: string
          notes: string | null
          status: string
          student_id: string
        }
        Insert: {
          batch_id: string
          enrolled_at?: string
          id?: string
          notes?: string | null
          status?: string
          student_id: string
        }
        Update: {
          batch_id?: string
          enrolled_at?: string
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_enrollments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "batch_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          code: string
          course_id: string
          created_at: string
          end_date: string | null
          id: string
          max_cadets: number
          name: string
          session_name: string
          start_date: string
          status: Database["public"]["Enums"]["batch_status"]
          updated_at: string
        }
        Insert: {
          code: string
          course_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          max_cadets?: number
          name: string
          session_name: string
          start_date: string
          status?: Database["public"]["Enums"]["batch_status"]
          updated_at?: string
        }
        Update: {
          code?: string
          course_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          max_cadets?: number
          name?: string
          session_name?: string
          start_date?: string
          status?: Database["public"]["Enums"]["batch_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_subjects: {
        Row: {
          course_id: string
          is_mandatory: boolean
          minimum_pass_percentage: number
          subject_id: string
        }
        Insert: {
          course_id: string
          is_mandatory?: boolean
          minimum_pass_percentage?: number
          subject_id: string
        }
        Update: {
          course_id?: string
          is_mandatory?: boolean
          minimum_pass_percentage?: number
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_subjects_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          code: string
          created_at: string
          description: string | null
          duration_weeks: number
          eligibility_criteria: Json | null
          force_id: string
          id: string
          name: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          duration_weeks?: number
          eligibility_criteria?: Json | null
          force_id: string
          id?: string
          name: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          duration_weeks?: number
          eligibility_criteria?: Json | null
          force_id?: string
          id?: string
          name?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_force_id_fkey"
            columns: ["force_id"]
            isOneToOne: false
            referencedRelation: "forces"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      familiarization_completions: {
        Row: {
          completed_at: string
          id: string
          student_id: string
          test_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          student_id: string
          test_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          student_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "familiarization_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "familiarization_completions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_types: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      finance_audit_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_data: Json | null
          old_data: Json | null
          performed_by: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_by: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "finance_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      finance_expenses: {
        Row: {
          amount: number
          category_code: string
          created_at: string
          description: string | null
          expense_category_id: string | null
          expense_date: string
          id: string
          is_recurring: boolean
          payee_name: string | null
          payment_method: string
          receipt_url: string | null
          recorded_by: string
          recurring_period: string | null
          reference_number: string | null
          status: string
          teacher_id: string | null
          title: string
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          category_code: string
          created_at?: string
          description?: string | null
          expense_category_id?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean
          payee_name?: string | null
          payment_method: string
          receipt_url?: string | null
          recorded_by: string
          recurring_period?: string | null
          reference_number?: string | null
          status?: string
          teacher_id?: string | null
          title: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          category_code?: string
          created_at?: string
          description?: string | null
          expense_category_id?: string | null
          expense_date?: string
          id?: string
          is_recurring?: boolean
          payee_name?: string | null
          payment_method?: string
          receipt_url?: string | null
          recorded_by?: string
          recurring_period?: string | null
          reference_number?: string | null
          status?: string
          teacher_id?: string | null
          title?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finance_expenses_expense_category_id_fkey"
            columns: ["expense_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finance_expenses_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      forces: {
        Row: {
          code: string
          created_at: string
          description: string | null
          headquarters: string | null
          id: string
          motto: string | null
          name: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          headquarters?: string | null
          id?: string
          motto?: string | null
          name: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          headquarters?: string | null
          id?: string
          motto?: string | null
          name?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          email: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          email: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          email?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          notes: string | null
          performed_by: string | null
          question_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          question_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          notes?: string | null
          performed_by?: string | null
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_audit_log_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_audit_log_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_courses: {
        Row: {
          course_id: string
          question_id: string
        }
        Insert: {
          course_id: string
          question_id: string
        }
        Update: {
          course_id?: string
          question_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_courses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_import_batches: {
        Row: {
          batch_number: string
          created_at: string
          error_log: Json | null
          failed_count: number
          id: string
          imported_count: number
          source_filename: string | null
          status: string
          subject_id: string | null
          total_items: number
          uploaded_by: string | null
        }
        Insert: {
          batch_number: string
          created_at?: string
          error_log?: Json | null
          failed_count?: number
          id?: string
          imported_count?: number
          source_filename?: string | null
          status?: string
          subject_id?: string | null
          total_items?: number
          uploaded_by?: string | null
        }
        Update: {
          batch_number?: string
          created_at?: string
          error_log?: Json | null
          failed_count?: number
          id?: string
          imported_count?: number
          source_filename?: string | null
          status?: string
          subject_id?: string | null
          total_items?: number
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "question_import_batches_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_import_batches_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      question_options: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          is_correct: boolean
          label: string
          option_key: string
          question_id: string
          sort_order: number
          text: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_correct?: boolean
          label: string
          option_key: string
          question_id: string
          sort_order?: number
          text: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          is_correct?: boolean
          label?: string
          option_key?: string
          question_id?: string
          sort_order?: number
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      question_passages: {
        Row: {
          author_id: string | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          subject_id: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          subject_id: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          subject_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_passages_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_passages_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      question_topics: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          name: string
          parent_topic_id: string | null
          sort_order: number
          subject_id: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_topic_id?: string | null
          sort_order?: number
          subject_id: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_topic_id?: string | null
          sort_order?: number
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_topics_parent_topic_id_fkey"
            columns: ["parent_topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_topics_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          author_id: string | null
          code: string
          cognitive_level: Database["public"]["Enums"]["cognitive_level"]
          created_at: string
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          difficulty_index: number | null
          explanation: string | null
          id: string
          import_batch_id: string | null
          is_verified: boolean
          passage_id: string | null
          question_format: Database["public"]["Enums"]["question_format"]
          status: Database["public"]["Enums"]["question_status"]
          stem: string
          stem_image_url: string | null
          subject_id: string
          tags: string[] | null
          time_limit_seconds: number
          times_attempted: number
          times_correct: number
          topic_id: string | null
          updated_at: string
          usage_type: string
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          author_id?: string | null
          code: string
          cognitive_level?: Database["public"]["Enums"]["cognitive_level"]
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          difficulty_index?: number | null
          explanation?: string | null
          id?: string
          import_batch_id?: string | null
          is_verified?: boolean
          passage_id?: string | null
          question_format?: Database["public"]["Enums"]["question_format"]
          status?: Database["public"]["Enums"]["question_status"]
          stem: string
          stem_image_url?: string | null
          subject_id: string
          tags?: string[] | null
          time_limit_seconds?: number
          times_attempted?: number
          times_correct?: number
          topic_id?: string | null
          updated_at?: string
          usage_type?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          author_id?: string | null
          code?: string
          cognitive_level?: Database["public"]["Enums"]["cognitive_level"]
          created_at?: string
          difficulty?: Database["public"]["Enums"]["question_difficulty"]
          difficulty_index?: number | null
          explanation?: string | null
          id?: string
          import_batch_id?: string | null
          is_verified?: boolean
          passage_id?: string | null
          question_format?: Database["public"]["Enums"]["question_format"]
          status?: Database["public"]["Enums"]["question_status"]
          stem?: string
          stem_image_url?: string | null
          subject_id?: string
          tags?: string[] | null
          time_limit_seconds?: number
          times_attempted?: number
          times_correct?: number
          topic_id?: string | null
          updated_at?: string
          usage_type?: string
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "question_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_passage_id_fkey"
            columns: ["passage_id"]
            isOneToOne: false
            referencedRelation: "question_passages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "question_topics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      retake_permissions: {
        Row: {
          approved_at: string
          approved_by: string
          consumed_attempt_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          original_attempt_id: string | null
          status: Database["public"]["Enums"]["retake_status"]
          student_id: string
          test_id: string
          updated_at: string
        }
        Insert: {
          approved_at?: string
          approved_by: string
          consumed_attempt_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          original_attempt_id?: string | null
          status?: Database["public"]["Enums"]["retake_status"]
          student_id: string
          test_id: string
          updated_at?: string
        }
        Update: {
          approved_at?: string
          approved_by?: string
          consumed_attempt_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          original_attempt_id?: string | null
          status?: Database["public"]["Enums"]["retake_status"]
          student_id?: string
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retake_permissions_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retake_permissions_consumed_attempt_id_fkey"
            columns: ["consumed_attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retake_permissions_consumed_attempt_id_fkey"
            columns: ["consumed_attempt_id"]
            isOneToOne: false
            referencedRelation: "v_active_monitoring"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "retake_permissions_original_attempt_id_fkey"
            columns: ["original_attempt_id"]
            isOneToOne: false
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retake_permissions_original_attempt_id_fkey"
            columns: ["original_attempt_id"]
            isOneToOne: false
            referencedRelation: "v_active_monitoring"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "retake_permissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retake_permissions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fee_accounts: {
        Row: {
          amount_due: number
          amount_paid: number
          batch_id: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          discount_amount: number
          due_date: string | null
          fee_month: number | null
          fee_period: string | null
          fee_type: string
          fee_year: number
          fine_amount: number
          id: string
          notes: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number
          batch_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          fee_month?: number | null
          fee_period?: string | null
          fee_type: string
          fee_year: number
          fine_amount?: number
          id?: string
          notes?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          batch_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          discount_amount?: number
          due_date?: string | null
          fee_month?: number | null
          fee_period?: string | null
          fee_type?: string
          fee_year?: number
          fine_amount?: number
          id?: string
          notes?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_fee_accounts_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_accounts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_accounts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_accounts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_fee_payments: {
        Row: {
          amount: number
          created_at: string
          fee_account_id: string | null
          id: string
          notes: string | null
          payment_date: string
          payment_method: string
          receipt_number: string
          received_by: string
          reference_number: string | null
          status: string
          student_id: string
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          fee_account_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method: string
          receipt_number: string
          received_by: string
          reference_number?: string | null
          status?: string
          student_id: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          fee_account_id?: string | null
          id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          receipt_number?: string
          received_by?: string
          reference_number?: string | null
          status?: string
          student_id?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_fee_payments_fee_account_id_fkey"
            columns: ["fee_account_id"]
            isOneToOne: false
            referencedRelation: "student_fee_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_payments_received_by_fkey"
            columns: ["received_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_fee_payments_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          admission_date: string | null
          alternate_phone: string | null
          cnic: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          education: string | null
          education_details: string | null
          father_name: string
          gender: string | null
          guardian_name: string | null
          guardian_phone: string | null
          guardian_relationship: string | null
          id: string
          notes: string | null
          photo_url: string | null
          profile_id: string
          roll_number: string
          status: Database["public"]["Enums"]["student_status"]
          target_course_id: string
          target_force_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          alternate_phone?: string | null
          cnic?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          education?: string | null
          education_details?: string | null
          father_name: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          profile_id: string
          roll_number: string
          status?: Database["public"]["Enums"]["student_status"]
          target_course_id: string
          target_force_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          alternate_phone?: string | null
          cnic?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          education?: string | null
          education_details?: string | null
          father_name?: string
          gender?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          guardian_relationship?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          profile_id?: string
          roll_number?: string
          status?: Database["public"]["Enums"]["student_status"]
          target_course_id?: string
          target_force_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_target_course_id_fkey"
            columns: ["target_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_target_force_id_fkey"
            columns: ["target_force_id"]
            isOneToOne: false
            referencedRelation: "forces"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          category: Database["public"]["Enums"]["subject_category"]
          code: string
          created_at: string
          default_time_per_question_sec: number
          description: string | null
          id: string
          name: string
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["subject_category"]
          code: string
          created_at?: string
          default_time_per_question_sec?: number
          description?: string | null
          id?: string
          name: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["subject_category"]
          code?: string
          created_at?: string
          default_time_per_question_sec?: number
          description?: string | null
          id?: string
          name?: string
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      teacher_salary_payments: {
        Row: {
          base_salary: number
          bonus: number
          created_at: string
          deduction: number
          expense_id: string
          id: string
          net_paid: number
          notes: string | null
          payment_date: string
          payment_type: string
          salary_month: number
          salary_year: number
          status: string
          teacher_profile_id: string
        }
        Insert: {
          base_salary?: number
          bonus?: number
          created_at?: string
          deduction?: number
          expense_id: string
          id?: string
          net_paid: number
          notes?: string | null
          payment_date?: string
          payment_type?: string
          salary_month: number
          salary_year: number
          status?: string
          teacher_profile_id: string
        }
        Update: {
          base_salary?: number
          bonus?: number
          created_at?: string
          deduction?: number
          expense_id?: string
          id?: string
          net_paid?: number
          notes?: string | null
          payment_date?: string
          payment_type?: string
          salary_month?: number
          salary_year?: number
          status?: string
          teacher_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_salary_payments_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "finance_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_salary_payments_teacher_profile_id_fkey"
            columns: ["teacher_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_subjects: {
        Row: {
          subject_id: string
          teacher_id: string
        }
        Insert: {
          subject_id: string
          teacher_id: string
        }
        Update: {
          subject_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_subjects_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          branch_code: string
          created_at: string
          id: string
          profile_id: string
          rank: string
          role_title: string
          service_number: string
          status: Database["public"]["Enums"]["teacher_status"]
          updated_at: string
        }
        Insert: {
          branch_code: string
          created_at?: string
          id?: string
          profile_id: string
          rank: string
          role_title?: string
          service_number: string
          status?: Database["public"]["Enums"]["teacher_status"]
          updated_at?: string
        }
        Update: {
          branch_code?: string
          created_at?: string
          id?: string
          profile_id?: string
          rank?: string
          role_title?: string
          service_number?: string
          status?: Database["public"]["Enums"]["teacher_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_branch_code_fkey"
            columns: ["branch_code"]
            isOneToOne: false
            referencedRelation: "forces"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "teachers_branch_code_fkey"
            columns: ["branch_code"]
            isOneToOne: false
            referencedRelation: "v_active_monitoring"
            referencedColumns: ["force_code"]
          },
          {
            foreignKeyName: "teachers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      test_assignments: {
        Row: {
          assigned_by: string
          available_from: string
          available_until: string | null
          batch_id: string
          created_at: string
          id: string
          max_attempts: number
          notes: string | null
          status: Database["public"]["Enums"]["assignment_status"]
          test_id: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          available_from?: string
          available_until?: string | null
          batch_id: string
          created_at?: string
          id?: string
          max_attempts?: number
          notes?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          test_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          available_from?: string
          available_until?: string | null
          batch_id?: string
          created_at?: string
          id?: string
          max_attempts?: number
          notes?: string | null
          status?: Database["public"]["Enums"]["assignment_status"]
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_assignments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_assignments_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          assignment_id: string
          attempt_number: number
          created_at: string
          current_section_id: string | null
          expires_at: string
          id: string
          ip_address: string | null
          option_order: Json
          question_order: Json
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submitted_at: string | null
          test_id: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          assignment_id: string
          attempt_number?: number
          created_at?: string
          current_section_id?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          option_order?: Json
          question_order?: Json
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id: string
          submitted_at?: string | null
          test_id: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          assignment_id?: string
          attempt_number?: number
          created_at?: string
          current_section_id?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          option_order?: Json
          question_order?: Json
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          student_id?: string
          submitted_at?: string | null
          test_id?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "test_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_current_section_id_fkey"
            columns: ["current_section_id"]
            isOneToOne: false
            referencedRelation: "test_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_eligible_courses: {
        Row: {
          course_id: string
          created_at: string
          force_id: string
          id: string
          test_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          force_id: string
          id?: string
          test_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          force_id?: string
          id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_eligible_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_eligible_courses_force_id_fkey"
            columns: ["force_id"]
            isOneToOne: false
            referencedRelation: "forces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_eligible_courses_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_pattern_section_subjects: {
        Row: {
          created_at: string
          default_question_distribution: number | null
          id: string
          is_default: boolean
          is_required: boolean
          pattern_section_id: string
          subject_id: string
        }
        Insert: {
          created_at?: string
          default_question_distribution?: number | null
          id?: string
          is_default?: boolean
          is_required?: boolean
          pattern_section_id: string
          subject_id: string
        }
        Update: {
          created_at?: string
          default_question_distribution?: number | null
          id?: string
          is_default?: boolean
          is_required?: boolean
          pattern_section_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_pattern_section_subjects_pattern_section_id_fkey"
            columns: ["pattern_section_id"]
            isOneToOne: false
            referencedRelation: "test_pattern_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_pattern_section_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      test_pattern_sections: {
        Row: {
          created_at: string
          default_duration_minutes: number
          default_enabled: boolean
          default_question_count: number
          display_order: number
          id: string
          instructions: string | null
          is_mandatory: boolean
          max_duration_minutes: number
          max_question_count: number
          min_duration_minutes: number
          min_question_count: number
          negative_marking: boolean
          passing_percentage: number
          question_type: string
          section_code: string
          section_name: string
          section_type: string
          teacher_can_disable: boolean
          teacher_can_override_duration: boolean
          teacher_can_override_question_count: boolean
          teacher_can_reorder: boolean
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_duration_minutes?: number
          default_enabled?: boolean
          default_question_count?: number
          display_order?: number
          id?: string
          instructions?: string | null
          is_mandatory?: boolean
          max_duration_minutes?: number
          max_question_count?: number
          min_duration_minutes?: number
          min_question_count?: number
          negative_marking?: boolean
          passing_percentage?: number
          question_type?: string
          section_code: string
          section_name: string
          section_type?: string
          teacher_can_disable?: boolean
          teacher_can_override_duration?: boolean
          teacher_can_override_question_count?: boolean
          teacher_can_reorder?: boolean
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_duration_minutes?: number
          default_enabled?: boolean
          default_question_count?: number
          display_order?: number
          id?: string
          instructions?: string | null
          is_mandatory?: boolean
          max_duration_minutes?: number
          max_question_count?: number
          min_duration_minutes?: number
          min_question_count?: number
          negative_marking?: boolean
          passing_percentage?: number
          question_type?: string
          section_code?: string
          section_name?: string
          section_type?: string
          teacher_can_disable?: boolean
          teacher_can_override_duration?: boolean
          teacher_can_override_question_count?: boolean
          teacher_can_reorder?: boolean
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_pattern_sections_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "test_pattern_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      test_pattern_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          entry_course_id: string
          force_id: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          stage: string
          updated_at: string
          version: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_course_id: string
          force_id: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          stage?: string
          updated_at?: string
          version?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_course_id?: string
          force_id?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          stage?: string
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_pattern_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_pattern_templates_entry_course_id_fkey"
            columns: ["entry_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_pattern_templates_force_id_fkey"
            columns: ["force_id"]
            isOneToOne: false
            referencedRelation: "forces"
            referencedColumns: ["id"]
          },
        ]
      }
      test_results: {
        Row: {
          attempt_id: string
          correct_count: number
          created_at: string
          generated_at: string
          id: string
          incorrect_count: number
          marks_obtained: number
          max_marks: number
          passed: boolean
          percentage: number
          section_results: Json
          skipped_count: number
          student_id: string
          test_id: string
          time_spent_seconds: number | null
          total_questions: number
        }
        Insert: {
          attempt_id: string
          correct_count?: number
          created_at?: string
          generated_at?: string
          id?: string
          incorrect_count?: number
          marks_obtained?: number
          max_marks?: number
          passed?: boolean
          percentage?: number
          section_results?: Json
          skipped_count?: number
          student_id: string
          test_id: string
          time_spent_seconds?: number | null
          total_questions?: number
        }
        Update: {
          attempt_id?: string
          correct_count?: number
          created_at?: string
          generated_at?: string
          id?: string
          incorrect_count?: number
          marks_obtained?: number
          max_marks?: number
          passed?: boolean
          percentage?: number
          section_results?: Json
          skipped_count?: number
          student_id?: string
          test_id?: string
          time_spent_seconds?: number | null
          total_questions?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "v_active_monitoring"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "test_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_section_questions: {
        Row: {
          created_at: string
          id: string
          marks: number
          position: number
          question_id: string
          test_section_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          marks?: number
          position?: number
          question_id: string
          test_section_id: string
        }
        Update: {
          created_at?: string
          id?: string
          marks?: number
          position?: number
          question_id?: string
          test_section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_section_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_section_questions_test_section_id_fkey"
            columns: ["test_section_id"]
            isOneToOne: false
            referencedRelation: "test_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      test_section_subjects: {
        Row: {
          created_at: string
          subject_id: string
          test_section_id: string
        }
        Insert: {
          created_at?: string
          subject_id: string
          test_section_id: string
        }
        Update: {
          created_at?: string
          subject_id?: string
          test_section_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_section_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_section_subjects_test_section_id_fkey"
            columns: ["test_section_id"]
            isOneToOne: false
            referencedRelation: "test_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      test_sections: {
        Row: {
          created_at: string
          duration_minutes: number
          id: string
          is_enabled: boolean
          is_mandatory: boolean
          marks_per_question: number
          name: string
          passing_percentage: number
          position: number
          question_count: number
          section_code: string | null
          shuffle_questions: boolean
          source_template_section_id: string | null
          subject_id: string | null
          test_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number
          id?: string
          is_enabled?: boolean
          is_mandatory?: boolean
          marks_per_question?: number
          name: string
          passing_percentage?: number
          position?: number
          question_count?: number
          section_code?: string | null
          shuffle_questions?: boolean
          source_template_section_id?: string | null
          subject_id?: string | null
          test_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number
          id?: string
          is_enabled?: boolean
          is_mandatory?: boolean
          marks_per_question?: number
          name?: string
          passing_percentage?: number
          position?: number
          question_count?: number
          section_code?: string | null
          shuffle_questions?: boolean
          source_template_section_id?: string | null
          subject_id?: string | null
          test_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_sections_source_template_section_id_fkey"
            columns: ["source_template_section_id"]
            isOneToOne: false
            referencedRelation: "test_pattern_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_sections_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_sections_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          allow_section_navigation: boolean
          batch_id: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          force_id: string
          id: string
          name: string
          negative_mark_value: number
          negative_marking: boolean
          passing_threshold: number
          published_at: string | null
          published_by: string | null
          show_answer_review: boolean
          show_result_immediately: boolean
          shuffle_options: boolean
          shuffle_questions: boolean
          status: Database["public"]["Enums"]["test_status"]
          template_id: string | null
          template_version: number | null
          test_type: string
          total_marks: number
          updated_at: string
        }
        Insert: {
          allow_section_navigation?: boolean
          batch_id?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          force_id: string
          id?: string
          name: string
          negative_mark_value?: number
          negative_marking?: boolean
          passing_threshold?: number
          published_at?: string | null
          published_by?: string | null
          show_answer_review?: boolean
          show_result_immediately?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          status?: Database["public"]["Enums"]["test_status"]
          template_id?: string | null
          template_version?: number | null
          test_type?: string
          total_marks?: number
          updated_at?: string
        }
        Update: {
          allow_section_navigation?: boolean
          batch_id?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number
          force_id?: string
          id?: string
          name?: string
          negative_mark_value?: number
          negative_marking?: boolean
          passing_threshold?: number
          published_at?: string | null
          published_by?: string | null
          show_answer_review?: boolean
          show_result_immediately?: boolean
          shuffle_options?: boolean
          shuffle_questions?: boolean
          status?: Database["public"]["Enums"]["test_status"]
          template_id?: string | null
          template_version?: number | null
          test_type?: string
          total_marks?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_force_id_fkey"
            columns: ["force_id"]
            isOneToOne: false
            referencedRelation: "forces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "test_pattern_templates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_active_monitoring: {
        Row: {
          answered_count: number | null
          attempt_id: string | null
          attempt_number: number | null
          attempt_status: Database["public"]["Enums"]["attempt_status"] | null
          connection_state: string | null
          current_question_index: number | null
          current_section_name: string | null
          expires_at: string | null
          force_code: string | null
          force_name: string | null
          last_seen: string | null
          liveness: string | null
          progress_percent: number | null
          remaining_seconds: number | null
          roll_number: string | null
          started_at: string | null
          student_id: string | null
          student_name: string | null
          test_id: string | null
          test_name: string | null
          total_questions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      view_best_student_test_results: {
        Row: {
          attempt_id: string | null
          correct_count: number | null
          course_id: string | null
          force_id: string | null
          generated_at: string | null
          incorrect_count: number | null
          marks_obtained: number | null
          max_marks: number | null
          passed: boolean | null
          percentage: number | null
          result_id: string | null
          skipped_count: number | null
          student_id: string | null
          submitted_at: string | null
          test_batch_id: string | null
          test_id: string | null
          test_name: string | null
          time_spent_seconds: number | null
          total_questions: number | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "test_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: true
            referencedRelation: "v_active_monitoring"
            referencedColumns: ["attempt_id"]
          },
          {
            foreignKeyName: "test_results_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_results_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_batch_id_fkey"
            columns: ["test_batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_force_id_fkey"
            columns: ["force_id"]
            isOneToOne: false
            referencedRelation: "forces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      add_question_to_section: {
        Args: {
          p_marks?: number
          p_position?: number
          p_question_id: string
          p_section_id: string
        }
        Returns: string
      }
      admin_create_student: {
        Args: {
          p_batch_id?: string
          p_cnic: string
          p_date_of_birth: string
          p_father_name: string
          p_roll_number: string
          p_target_course_id: string
          p_target_force_id: string
          p_user_id: string
        }
        Returns: string
      }
      admin_create_teacher: {
        Args: {
          p_branch_code: string
          p_rank: string
          p_role_title: string
          p_service_number: string
          p_subject_ids?: string[]
          p_user_id: string
        }
        Returns: string
      }
      admin_upsert_question: {
        Args: {
          p_code: string
          p_course_ids: string[]
          p_difficulty: Database["public"]["Enums"]["question_difficulty"]
          p_explanation: string
          p_id: string
          p_options: Json
          p_status: Database["public"]["Enums"]["question_status"]
          p_stem: string
          p_stem_image_url: string
          p_subject_id: string
          p_tags: string[]
          p_time_limit_seconds: number
        }
        Returns: string
      }
      advance_section: {
        Args: { p_attempt_id: string; p_next_section_id: string }
        Returns: Json
      }
      approve_retake: {
        Args: {
          p_expires_at?: string
          p_notes?: string
          p_original_attempt_id?: string
          p_student_id: string
          p_test_id: string
        }
        Returns: string
      }
      assign_test: {
        Args: {
          p_available_from?: string
          p_available_until?: string
          p_batch_id: string
          p_max_attempts?: number
          p_notes?: string
          p_test_id: string
        }
        Returns: string
      }
      can_manage_test: { Args: { p_test_id: string }; Returns: boolean }
      check_cnic_exists: { Args: { p_cnic: string }; Returns: boolean }
      check_email_exists: { Args: { p_email: string }; Returns: boolean }
      check_roll_number_exists: {
        Args: { p_roll_number: string }
        Returns: boolean
      }
      create_registered_student_profile: {
        Args: {
          p_address?: string
          p_admission_date?: string
          p_alternate_phone?: string
          p_auth_user_id: string
          p_batch_id: string
          p_cnic: string
          p_creator_id?: string
          p_date_of_birth?: string
          p_display_name: string
          p_education: string
          p_education_details?: string
          p_email: string
          p_father_name: string
          p_gender?: string
          p_guardian_name?: string
          p_guardian_phone?: string
          p_guardian_relationship?: string
          p_notes?: string
          p_phone: string
          p_photo_url?: string
          p_roll_number: string
          p_status?: string
          p_target_course_id: string
          p_target_force_id: string
        }
        Returns: Json
      }
      create_test_with_eligibilities: {
        Args: { p_eligibilities: Json; p_test: Json }
        Returns: {
          allow_section_navigation: boolean
          batch_id: string | null
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number
          force_id: string
          id: string
          name: string
          negative_mark_value: number
          negative_marking: boolean
          passing_threshold: number
          published_at: string | null
          published_by: string | null
          show_answer_review: boolean
          show_result_immediately: boolean
          shuffle_options: boolean
          shuffle_questions: boolean
          status: Database["public"]["Enums"]["test_status"]
          template_id: string | null
          template_version: number | null
          test_type: string
          total_marks: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "tests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_app_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      force_submit_attempt: { Args: { p_attempt_id: string }; Returns: Json }
      generate_monthly_fees: {
        Args: {
          p_amount?: number
          p_batch_id?: string
          p_course_id?: string
          p_due_date?: string
          p_fee_month: number
          p_fee_period: string
          p_fee_type?: string
          p_fee_year: number
          p_force_id?: string
        }
        Returns: Json
      }
      generate_receipt_number: { Args: never; Returns: string }
      generate_test_section_questions: {
        Args: {
          p_count: number
          p_course_id?: string
          p_force_id?: string
          p_section_id: string
          p_subject_id: string
        }
        Returns: number
      }
      get_academy_leaderboard: {
        Args: {
          p_batch_id?: string
          p_course_id?: string
          p_force_id?: string
          p_limit?: number
          p_min_tests?: number
        }
        Returns: Json
      }
      get_course_leaderboard: {
        Args: {
          p_batch_id?: string
          p_course_id: string
          p_limit?: number
          p_min_tests?: number
        }
        Returns: Json
      }
      get_familiarization_payload: {
        Args: { p_test_id: string }
        Returns: Json
      }
      get_finance_summary: {
        Args: { p_from?: string; p_to?: string }
        Returns: Json
      }
      get_finance_transactions: {
        Args: {
          p_category?: string
          p_from?: string
          p_to?: string
          p_type?: string
        }
        Returns: Json
      }
      get_question_bank_statistics: {
        Args: { p_subject_id?: string }
        Returns: Json
      }
      get_rank_neighborhood: {
        Args: { p_range?: number; p_scope?: string; p_scope_id?: string }
        Returns: Json
      }
      get_result_detail: { Args: { p_result_id: string }; Returns: Json }
      get_safe_exam_payload: { Args: { p_attempt_id: string }; Returns: Json }
      get_safe_exam_questions: {
        Args: { p_question_ids: string[] }
        Returns: {
          code: string
          difficulty: Database["public"]["Enums"]["question_difficulty"]
          id: string
          options: Json
          stem: string
          stem_image_url: string
          subject_id: string
          time_limit_seconds: number
        }[]
      }
      get_server_time: { Args: never; Returns: string }
      get_student_assigned_tests: {
        Args: { p_student_id: string }
        Returns: {
          duration_minutes: number
          id: string
          name: string
          negative_marking: boolean
          passing_threshold: number
          shuffle_options: boolean
          shuffle_questions: boolean
          total_marks: number
        }[]
      }
      get_student_rank_summary: {
        Args: { p_student_id?: string }
        Returns: Json
      }
      get_test_leaderboard: {
        Args: { p_limit?: number; p_test_id: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      is_familiarization_completed: {
        Args: { p_test_id: string }
        Returns: boolean
      }
      is_student: { Args: never; Returns: boolean }
      is_teacher: { Args: never; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_entity_id?: string
          p_entity_type: string
          p_metadata?: Json
        }
        Returns: string
      }
      normalize_cnic: { Args: { p_cnic: string }; Returns: string }
      normalize_phone: { Args: { p_phone: string }; Returns: string }
      publish_test: { Args: { p_test_id: string }; Returns: boolean }
      record_familiarization_completion: {
        Args: { p_test_id: string }
        Returns: boolean
      }
      record_finance_expense: {
        Args: {
          p_amount?: number
          p_base_salary?: number
          p_bonus?: number
          p_category_code: string
          p_deduction?: number
          p_description?: string
          p_expense_date?: string
          p_is_recurring?: boolean
          p_payee_name?: string
          p_payment_method?: string
          p_receipt_url?: string
          p_recurring_period?: string
          p_reference_number?: string
          p_salary_month?: number
          p_salary_payment_type?: string
          p_salary_year?: number
          p_teacher_id?: string
          p_title: string
        }
        Returns: Json
      }
      record_heartbeat: {
        Args: {
          p_answered_count?: number
          p_attempt_id: string
          p_current_question_index?: number
          p_current_section_name?: string
        }
        Returns: boolean
      }
      record_student_fee_payment: {
        Args: {
          p_amount: number
          p_fee_account_id: string
          p_notes?: string
          p_payment_method: string
          p_reference_number?: string
          p_student_id: string
        }
        Returns: Json
      }
      remove_question_from_section: {
        Args: { p_question_id: string; p_section_id: string }
        Returns: boolean
      }
      report_batch_performance: {
        Args: {
          p_batch_id?: string
          p_date_from?: string
          p_date_to?: string
          p_force_id?: string
        }
        Returns: Json
      }
      report_force_performance: {
        Args: { p_date_from?: string; p_date_to?: string }
        Returns: Json
      }
      report_pass_fail_summary: {
        Args: { p_date_from?: string; p_date_to?: string; p_force_id?: string }
        Returns: Json
      }
      report_student_performance: {
        Args: {
          p_batch_id?: string
          p_date_from?: string
          p_date_to?: string
          p_student_id?: string
        }
        Returns: Json
      }
      report_test_performance: {
        Args: {
          p_date_from?: string
          p_date_to?: string
          p_force_id?: string
          p_test_id?: string
        }
        Returns: Json
      }
      save_answer: {
        Args: {
          p_attempt_id: string
          p_marked_for_review?: boolean
          p_question_id: string
          p_selected_option_id?: string
        }
        Returns: boolean
      }
      start_test_attempt: { Args: { p_test_id: string }; Returns: Json }
      submit_test_attempt: { Args: { p_attempt_id: string }; Returns: Json }
      update_student_fee_adjustment: {
        Args: {
          p_discount_amount: number
          p_fee_account_id: string
          p_fine_amount: number
          p_reason?: string
        }
        Returns: Json
      }
      void_finance_expense: {
        Args: { p_expense_id: string; p_reason: string }
        Returns: Json
      }
      void_student_fee_payment: {
        Args: { p_payment_id: string; p_reason: string }
        Returns: Json
      }
      waive_student_fee: {
        Args: { p_fee_account_id: string; p_reason: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "ADMIN" | "TEACHER" | "STUDENT"
      assignment_status: "ACTIVE" | "EXPIRED" | "CANCELLED" | "COMPLETED"
      attempt_status:
        | "IN_PROGRESS"
        | "SUBMITTED"
        | "AUTO_SUBMITTED"
        | "EXPIRED"
        | "FORCE_SUBMITTED"
      batch_status: "ACTIVE" | "UPCOMING" | "COMPLETED" | "ARCHIVED"
      cognitive_level:
        | "REMEMBERING"
        | "UNDERSTANDING"
        | "APPLYING"
        | "ANALYZING"
        | "EVALUATING"
      question_difficulty: "EASY" | "MEDIUM" | "HARD"
      question_format:
        | "MCQ_SINGLE"
        | "MCQ_MULTIPLE"
        | "PASSAGE_BASED"
        | "IMAGE_SERIES"
        | "IMAGE_ANALOGY"
        | "ODD_ONE_OUT"
      question_status: "DRAFT" | "APPROVED" | "INACTIVE" | "ARCHIVED"
      retake_status: "AVAILABLE" | "USED" | "EXPIRED" | "REVOKED"
      student_status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "DISQUALIFIED"
      subject_category: "INTELLIGENCE" | "ACADEMIC"
      teacher_status: "ACTIVE" | "ON_LEAVE" | "INACTIVE"
      test_status: "DRAFT" | "PUBLISHED" | "ACTIVE" | "COMPLETED" | "ARCHIVED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
          versioning_status: string
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
          versioning_status?: string
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      iceberg_namespaces: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_namespaces_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
        ]
      }
      iceberg_tables: {
        Row: {
          bucket_name: string
          catalog_id: string
          created_at: string
          id: string
          location: string
          name: string
          namespace_id: string
          remote_table_id: string | null
          shard_id: string | null
          shard_key: string | null
          updated_at: string
        }
        Insert: {
          bucket_name: string
          catalog_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          namespace_id: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Update: {
          bucket_name?: string
          catalog_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          namespace_id?: string
          remote_table_id?: string | null
          shard_id?: string | null
          shard_key?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "iceberg_tables_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "buckets_analytics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iceberg_tables_namespace_id_fkey"
            columns: ["namespace_id"]
            isOneToOne: false
            referencedRelation: "iceberg_namespaces"
            referencedColumns: ["id"]
          },
        ]
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          archived_at: string | null
          bucket_id: string | null
          created_at: string | null
          id: string
          is_delete_marker: boolean
          is_versioned: boolean
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          archived_at?: string | null
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          is_delete_marker?: boolean
          is_versioned?: boolean
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          metadata: Json | null
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          metadata?: Json | null
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      allow_any_operation: {
        Args: { expected_operations: string[] }
        Returns: boolean
      }
      allow_only_operation: {
        Args: { expected_operation: string }
        Returns: boolean
      }
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["ADMIN", "TEACHER", "STUDENT"],
      assignment_status: ["ACTIVE", "EXPIRED", "CANCELLED", "COMPLETED"],
      attempt_status: [
        "IN_PROGRESS",
        "SUBMITTED",
        "AUTO_SUBMITTED",
        "EXPIRED",
        "FORCE_SUBMITTED",
      ],
      batch_status: ["ACTIVE", "UPCOMING", "COMPLETED", "ARCHIVED"],
      cognitive_level: [
        "REMEMBERING",
        "UNDERSTANDING",
        "APPLYING",
        "ANALYZING",
        "EVALUATING",
      ],
      question_difficulty: ["EASY", "MEDIUM", "HARD"],
      question_format: [
        "MCQ_SINGLE",
        "MCQ_MULTIPLE",
        "PASSAGE_BASED",
        "IMAGE_SERIES",
        "IMAGE_ANALOGY",
        "ODD_ONE_OUT",
      ],
      question_status: ["DRAFT", "APPROVED", "INACTIVE", "ARCHIVED"],
      retake_status: ["AVAILABLE", "USED", "EXPIRED", "REVOKED"],
      student_status: ["ACTIVE", "INACTIVE", "SUSPENDED", "DISQUALIFIED"],
      subject_category: ["INTELLIGENCE", "ACADEMIC"],
      teacher_status: ["ACTIVE", "ON_LEAVE", "INACTIVE"],
      test_status: ["DRAFT", "PUBLISHED", "ACTIVE", "COMPLETED", "ARCHIVED"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const

