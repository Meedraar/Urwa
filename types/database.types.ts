export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: string
          halaqa_id: string | null
          id: string
          message: string
          published_at: string
          published_by: string
          title: string
        }
        Insert: {
          audience?: string
          halaqa_id?: string | null
          id?: string
          message: string
          published_at?: string
          published_by: string
          title: string
        }
        Update: {
          audience?: string
          halaqa_id?: string | null
          id?: string
          message?: string
          published_at?: string
          published_by?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          assignment_type: string | null
          created_at: string
          due_date: string | null
          halaqa_id: string
          id: string
          instructions: string | null
          teacher_id: string
          title: string
        }
        Insert: {
          assignment_type?: string | null
          created_at?: string
          due_date?: string | null
          halaqa_id: string
          id?: string
          instructions?: string | null
          teacher_id: string
          title: string
        }
        Update: {
          assignment_type?: string | null
          created_at?: string
          due_date?: string | null
          halaqa_id?: string
          id?: string
          instructions?: string | null
          teacher_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          class_date: string
          created_at: string
          halaqa_id: string
          id: string
          notes: string | null
          recorded_by: string
          status: string
          student_id: string
        }
        Insert: {
          class_date?: string
          created_at?: string
          halaqa_id: string
          id?: string
          notes?: string | null
          recorded_by: string
          status: string
          student_id: string
        }
        Update: {
          class_date?: string
          created_at?: string
          halaqa_id?: string
          id?: string
          notes?: string | null
          recorded_by?: string
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_announcements: {
        Row: {
          audience: string
          body: string
          created_at: string
          department_id: string | null
          expires_at: string | null
          id: string
          published_at: string
          published_by: string
          title: string
        }
        Insert: {
          audience?: string
          body: string
          created_at?: string
          department_id?: string | null
          expires_at?: string | null
          id?: string
          published_at?: string
          published_by: string
          title: string
        }
        Update: {
          audience?: string
          body?: string
          created_at?: string
          department_id?: string | null
          expires_at?: string | null
          id?: string
          published_at?: string
          published_by?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_announcements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_announcements_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_applications: {
        Row: {
          additional_information: string | null
          applicant_id: string
          availability: string | null
          created_at: string
          department_id: string
          id: string
          leadership_experience: string | null
          motivation: string
          position_id: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          skills_experience: string | null
          status: string
          updated_at: string
        }
        Insert: {
          additional_information?: string | null
          applicant_id: string
          availability?: string | null
          created_at?: string
          department_id: string
          id?: string
          leadership_experience?: string | null
          motivation: string
          position_id: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills_experience?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          additional_information?: string | null
          applicant_id?: string
          availability?: string | null
          created_at?: string
          department_id?: string
          id?: string
          leadership_experience?: string | null
          motivation?: string
          position_id?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          skills_experience?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_applications_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_applications_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "department_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_conversation_participants: {
        Row: {
          added_by: string | null
          conversation_id: string
          joined_at: string
          last_read_at: string | null
          profile_id: string
        }
        Insert: {
          added_by?: string | null
          conversation_id: string
          joined_at?: string
          last_read_at?: string | null
          profile_id: string
        }
        Update: {
          added_by?: string | null
          conversation_id?: string
          joined_at?: string
          last_read_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_conversation_participants_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "department_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_conversation_participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_conversations: {
        Row: {
          conversation_type: string
          created_at: string
          created_by: string
          department_id: string | null
          id: string
          title: string | null
        }
        Insert: {
          conversation_type: string
          created_at?: string
          created_by: string
          department_id?: string | null
          id?: string
          title?: string | null
        }
        Update: {
          conversation_type?: string
          created_at?: string
          created_by?: string
          department_id?: string | null
          id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "department_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_conversations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_events: {
        Row: {
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          ends_at: string | null
          id: string
          location: string | null
          starts_at: string
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at: string
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          ends_at?: string | null
          id?: string
          location?: string | null
          starts_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_events_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_memberships: {
        Row: {
          appointed_by: string | null
          created_at: string
          department_id: string
          end_date: string | null
          id: string
          membership_status: string
          notes: string | null
          position_id: string
          profile_id: string
          source_application_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          appointed_by?: string | null
          created_at?: string
          department_id: string
          end_date?: string | null
          id?: string
          membership_status?: string
          notes?: string | null
          position_id: string
          profile_id: string
          source_application_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          appointed_by?: string | null
          created_at?: string
          department_id?: string
          end_date?: string | null
          id?: string
          membership_status?: string
          notes?: string | null
          position_id?: string
          profile_id?: string
          source_application_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_memberships_appointed_by_fkey"
            columns: ["appointed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_memberships_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_memberships_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "department_positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_memberships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_memberships_source_application_id_fkey"
            columns: ["source_application_id"]
            isOneToOne: false
            referencedRelation: "department_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      department_messages: {
        Row: {
          attachment_path: string | null
          body: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          sender_id: string
        }
        Insert: {
          attachment_path?: string | null
          body: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          sender_id: string
        }
        Update: {
          attachment_path?: string | null
          body?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "department_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_positions: {
        Row: {
          code: string
          created_at: string
          department_id: string
          description: string | null
          id: string
          is_active: boolean
          is_leadership: boolean
          is_open_for_application: boolean
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          department_id: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_leadership?: boolean
          is_open_for_application?: boolean
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          department_id?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_leadership?: boolean
          is_open_for_application?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_positions_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_renewal_requests: {
        Row: {
          availability: string | null
          continued_interest: boolean
          created_at: string
          department_id: string
          id: string
          member_notes: string | null
          membership_id: string
          profile_id: string
          review_notes: string | null
          review_year: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
        }
        Insert: {
          availability?: string | null
          continued_interest?: boolean
          created_at?: string
          department_id: string
          id?: string
          member_notes?: string | null
          membership_id: string
          profile_id: string
          review_notes?: string | null
          review_year: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Update: {
          availability?: string | null
          continued_interest?: boolean
          created_at?: string
          department_id?: string
          id?: string
          member_notes?: string | null
          membership_id?: string
          profile_id?: string
          review_notes?: string | null
          review_year?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_renewal_requests_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_renewal_requests_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "department_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_renewal_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_renewal_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_reports: {
        Row: {
          achievements: string | null
          attachment_path: string | null
          challenges: string | null
          created_at: string
          department_id: string
          id: string
          recommendations: string | null
          report_period_end: string | null
          report_period_start: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          submitted_by: string
          summary: string
          title: string
        }
        Insert: {
          achievements?: string | null
          attachment_path?: string | null
          challenges?: string | null
          created_at?: string
          department_id: string
          id?: string
          recommendations?: string | null
          report_period_end?: string | null
          report_period_start?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by: string
          summary: string
          title: string
        }
        Update: {
          achievements?: string | null
          attachment_path?: string | null
          challenges?: string | null
          created_at?: string
          department_id?: string
          id?: string
          recommendations?: string | null
          report_period_end?: string | null
          report_period_start?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_reports_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_reports_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_reviews: {
        Row: {
          attendance_score: number | null
          contribution_score: number | null
          created_at: string
          department_id: string
          id: string
          membership_id: string
          outcome: string | null
          overall_notes: string | null
          profile_id: string
          reliability_score: number | null
          review_type: string
          review_year: number
          reviewed_at: string
          reviewed_by: string
          task_completion_score: number | null
          teamwork_score: number | null
        }
        Insert: {
          attendance_score?: number | null
          contribution_score?: number | null
          created_at?: string
          department_id: string
          id?: string
          membership_id: string
          outcome?: string | null
          overall_notes?: string | null
          profile_id: string
          reliability_score?: number | null
          review_type?: string
          review_year: number
          reviewed_at?: string
          reviewed_by: string
          task_completion_score?: number | null
          teamwork_score?: number | null
        }
        Update: {
          attendance_score?: number | null
          contribution_score?: number | null
          created_at?: string
          department_id?: string
          id?: string
          membership_id?: string
          outcome?: string | null
          overall_notes?: string | null
          profile_id?: string
          reliability_score?: number | null
          review_type?: string
          review_year?: number
          reviewed_at?: string
          reviewed_by?: string
          task_completion_score?: number | null
          teamwork_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "department_reviews_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_reviews_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "department_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_reviews_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_reviews_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      department_task_assignees: {
        Row: {
          assigned_at: string
          assigned_by: string
          profile_id: string
          task_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by: string
          profile_id: string
          task_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string
          profile_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_task_assignees_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_task_assignees_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "department_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      department_tasks: {
        Row: {
          created_at: string
          created_by: string
          department_id: string
          description: string | null
          due_at: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department_id: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department_id?: string
          description?: string | null
          due_at?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_tasks_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      department_transfers: {
        Row: {
          created_at: string
          from_department_id: string
          id: string
          membership_id: string
          profile_id: string
          reason: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          to_department_id: string
        }
        Insert: {
          created_at?: string
          from_department_id: string
          id?: string
          membership_id: string
          profile_id: string
          reason: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_department_id: string
        }
        Update: {
          created_at?: string
          from_department_id?: string
          id?: string
          membership_id?: string
          profile_id?: string
          reason?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          to_department_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "department_transfers_from_department_id_fkey"
            columns: ["from_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_transfers_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "department_memberships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_transfers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_transfers_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "department_transfers_to_department_id_fkey"
            columns: ["to_department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
          purpose: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          name: string
          purpose?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
          purpose?: string | null
          slug?: string
        }
        Relationships: []
      }
      halaqas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      hifdh_records: {
        Row: {
          created_at: string
          from_ayah: number | null
          id: string
          juz: number | null
          notes: string | null
          recorded_by: string | null
          recorded_on: string
          student_id: string
          surah: string | null
          to_ayah: number | null
        }
        Insert: {
          created_at?: string
          from_ayah?: number | null
          id?: string
          juz?: number | null
          notes?: string | null
          recorded_by?: string | null
          recorded_on?: string
          student_id: string
          surah?: string | null
          to_ayah?: number | null
        }
        Update: {
          created_at?: string
          from_ayah?: number | null
          id?: string
          juz?: number | null
          notes?: string | null
          recorded_by?: string | null
          recorded_on?: string
          student_id?: string
          surah?: string | null
          to_ayah?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "hifdh_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hifdh_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      murajaah_records: {
        Row: {
          completed_on: string
          created_at: string
          id: string
          juz: number | null
          notes: string | null
          pages: string | null
          quality: string | null
          recorded_by: string | null
          student_id: string
          surah: string | null
        }
        Insert: {
          completed_on?: string
          created_at?: string
          id?: string
          juz?: number | null
          notes?: string | null
          pages?: string | null
          quality?: string | null
          recorded_by?: string | null
          student_id: string
          surah?: string | null
        }
        Update: {
          completed_on?: string
          created_at?: string
          id?: string
          juz?: number | null
          notes?: string | null
          pages?: string | null
          quality?: string | null
          recorded_by?: string | null
          student_id?: string
          surah?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "murajaah_records_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "murajaah_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_level: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["urwa_role"]
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          admin_level?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["urwa_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          admin_level?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["urwa_role"]
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      student_enrollments: {
        Row: {
          created_at: string
          halaqa_id: string | null
          id: string
          level: string | null
          preferred_session: string | null
          programme: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["account_status"]
          student_id: string
        }
        Insert: {
          created_at?: string
          halaqa_id?: string | null
          id?: string
          level?: string | null
          preferred_session?: string | null
          programme?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          student_id: string
        }
        Update: {
          created_at?: string
          halaqa_id?: string | null
          id?: string
          level?: string | null
          preferred_session?: string | null
          programme?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollments_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_welfare_cases: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          details: string
          escalated_to_admin: boolean
          id: string
          priority: string
          resolution_summary: string | null
          resolved_at: string | null
          status: string
          student_id: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string
          details: string
          escalated_to_admin?: boolean
          id?: string
          priority?: string
          resolution_summary?: string | null
          resolved_at?: string | null
          status?: string
          student_id: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          details?: string
          escalated_to_admin?: boolean
          id?: string
          priority?: string
          resolution_summary?: string | null
          resolved_at?: string | null
          status?: string
          student_id?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_welfare_cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_welfare_cases_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      submissions: {
        Row: {
          assignment_id: string
          content: string | null
          feedback: string | null
          file_url: string | null
          id: string
          reviewed_at: string | null
          reviewed_by: string | null
          student_id: string
          submitted_at: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          student_id: string
          submitted_at?: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          feedback?: string | null
          file_url?: string | null
          id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          student_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "submissions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_applications: {
        Row: {
          area_of_interest: string | null
          availability: string | null
          created_at: string
          id: string
          teaching_background: string | null
        }
        Insert: {
          area_of_interest?: string | null
          availability?: string | null
          created_at?: string
          id: string
          teaching_background?: string | null
        }
        Update: {
          area_of_interest?: string | null
          availability?: string | null
          created_at?: string
          id?: string
          teaching_background?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teacher_applications_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teacher_assignments: {
        Row: {
          created_at: string
          halaqa_id: string
          id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          halaqa_id: string
          id?: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          halaqa_id?: string
          id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_assignments_halaqa_id_fkey"
            columns: ["halaqa_id"]
            isOneToOne: false
            referencedRelation: "halaqas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_assignments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_set_admin_level: {
        Args: { new_level: string; target_user_id: string }
        Returns: undefined
      }
      can_access_department_conversation: {
        Args: { target_conversation: string }
        Returns: boolean
      }
      can_manage_welfare_cases: { Args: never; Returns: boolean }
      can_view_department_profile: {
        Args: { target_profile: string }
        Returns: boolean
      }
      current_role: {
        Args: never
        Returns: Database["public"]["Enums"]["urwa_role"]
      }
      get_department_collaboration_directory: {
        Args: never
        Returns: {
          department_id: string
          department_name: string
          full_name: string
          profile_id: string
        }[]
      }
      has_active_department_membership: {
        Args: { target_profile: string }
        Returns: boolean
      }
      is_active_department_member: {
        Args: { target_department: string }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_approved_teacher_of: {
        Args: { target_halaqa: string }
        Returns: boolean
      }
      is_department_leader: {
        Args: { target_department: string }
        Returns: boolean
      }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      account_status: "pending" | "approved" | "suspended" | "cancelled"
      urwa_role: "student" | "teacher" | "admin"
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
  public: {
    Enums: {
      account_status: ["pending", "approved", "suspended", "cancelled"],
      urwa_role: ["student", "teacher", "admin"],
    },
  },
} as const
