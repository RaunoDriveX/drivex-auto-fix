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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          adas_calibration_reason: string | null
          additional_notes: string | null
          ai_assessment_details: Json | null
          ai_confidence_score: number | null
          ai_recommended_repair: string | null
          appointment_date: string
          appointment_time: string
          completion_documents_verified: boolean | null
          completion_proof_path: string | null
          completion_proof_uploaded_at: string | null
          confirmation_email_sent: boolean | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          damage_photos: string[] | null
          damage_type: string | null
          driver_view_obstruction: boolean | null
          estimated_completion: string | null
          id: string
          insurer_name: string | null
          invoice_file_path: string | null
          invoice_sent_to_insurer_at: string | null
          invoice_uploaded_at: string | null
          is_insurance_claim: boolean | null
          is_out_of_network: boolean | null
          is_preferred_shop: boolean | null
          job_completed_at: string | null
          job_started_at: string | null
          job_status: Database["public"]["Enums"]["job_status_type"] | null
          notes: string | null
          reminder_email_sent: boolean | null
          requires_adas_calibration: boolean | null
          service_type: string
          shop_id: string
          shop_name: string
          status: string
          total_cost: number | null
          tracking_token: string | null
          updated_at: string
          vehicle_info: Json | null
        }
        Insert: {
          adas_calibration_reason?: string | null
          additional_notes?: string | null
          ai_assessment_details?: Json | null
          ai_confidence_score?: number | null
          ai_recommended_repair?: string | null
          appointment_date: string
          appointment_time: string
          completion_documents_verified?: boolean | null
          completion_proof_path?: string | null
          completion_proof_uploaded_at?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          damage_photos?: string[] | null
          damage_type?: string | null
          driver_view_obstruction?: boolean | null
          estimated_completion?: string | null
          id?: string
          insurer_name?: string | null
          invoice_file_path?: string | null
          invoice_sent_to_insurer_at?: string | null
          invoice_uploaded_at?: string | null
          is_insurance_claim?: boolean | null
          is_out_of_network?: boolean | null
          is_preferred_shop?: boolean | null
          job_completed_at?: string | null
          job_started_at?: string | null
          job_status?: Database["public"]["Enums"]["job_status_type"] | null
          notes?: string | null
          reminder_email_sent?: boolean | null
          requires_adas_calibration?: boolean | null
          service_type?: string
          shop_id: string
          shop_name: string
          status?: string
          total_cost?: number | null
          tracking_token?: string | null
          updated_at?: string
          vehicle_info?: Json | null
        }
        Update: {
          adas_calibration_reason?: string | null
          additional_notes?: string | null
          ai_assessment_details?: Json | null
          ai_confidence_score?: number | null
          ai_recommended_repair?: string | null
          appointment_date?: string
          appointment_time?: string
          completion_documents_verified?: boolean | null
          completion_proof_path?: string | null
          completion_proof_uploaded_at?: string | null
          confirmation_email_sent?: boolean | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          damage_photos?: string[] | null
          damage_type?: string | null
          driver_view_obstruction?: boolean | null
          estimated_completion?: string | null
          id?: string
          insurer_name?: string | null
          invoice_file_path?: string | null
          invoice_sent_to_insurer_at?: string | null
          invoice_uploaded_at?: string | null
          is_insurance_claim?: boolean | null
          is_out_of_network?: boolean | null
          is_preferred_shop?: boolean | null
          job_completed_at?: string | null
          job_started_at?: string | null
          job_status?: Database["public"]["Enums"]["job_status_type"] | null
          notes?: string | null
          reminder_email_sent?: boolean | null
          requires_adas_calibration?: boolean | null
          service_type?: string
          shop_id?: string
          shop_name?: string
          status?: string
          total_cost?: number | null
          tracking_token?: string | null
          updated_at?: string
          vehicle_info?: Json | null
        }
        Relationships: []
      }
      call_center_activities: {
        Row: {
          activity_type: string
          ai_agent_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          lead_id: string
          metadata: Json | null
          scheduled_for: string | null
          status: string | null
          summary: string | null
          transcript: string | null
        }
        Insert: {
          activity_type: string
          ai_agent_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lead_id: string
          metadata?: Json | null
          scheduled_for?: string | null
          status?: string | null
          summary?: string | null
          transcript?: string | null
        }
        Update: {
          activity_type?: string
          ai_agent_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          scheduled_for?: string | null
          status?: string | null
          summary?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "call_center_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "call_center_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      call_center_leads: {
        Row: {
          created_at: string
          customer_email: string | null
          customer_name: string
          customer_phone: string
          damage_description: string | null
          id: string
          initial_message: string | null
          lead_source: string | null
          location_info: Json | null
          must_contact_by: string | null
          priority_level: number | null
          shop_id: string | null
          status: string | null
          updated_at: string
          vehicle_info: Json | null
        }
        Insert: {
          created_at?: string
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          damage_description?: string | null
          id?: string
          initial_message?: string | null
          lead_source?: string | null
          location_info?: Json | null
          must_contact_by?: string | null
          priority_level?: number | null
          shop_id?: string | null
          status?: string | null
          updated_at?: string
          vehicle_info?: Json | null
        }
        Update: {
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          damage_description?: string | null
          id?: string
          initial_message?: string | null
          lead_source?: string | null
          location_info?: Json | null
          must_contact_by?: string | null
          priority_level?: number | null
          shop_id?: string | null
          status?: string | null
          updated_at?: string
          vehicle_info?: Json | null
        }
        Relationships: []
      }
      call_center_stats: {
        Row: {
          average_response_time_minutes: number | null
          calls_made: number | null
          calls_successful: number | null
          created_at: string
          date: string
          id: string
          inspections_scheduled: number | null
          leads_contacted: number | null
          leads_converted: number | null
          leads_received: number | null
          revenue_generated: number | null
          shop_id: string
          updated_at: string
        }
        Insert: {
          average_response_time_minutes?: number | null
          calls_made?: number | null
          calls_successful?: number | null
          created_at?: string
          date?: string
          id?: string
          inspections_scheduled?: number | null
          leads_contacted?: number | null
          leads_converted?: number | null
          leads_received?: number | null
          revenue_generated?: number | null
          shop_id: string
          updated_at?: string
        }
        Update: {
          average_response_time_minutes?: number | null
          calls_made?: number | null
          calls_successful?: number | null
          created_at?: string
          date?: string
          id?: string
          inspections_scheduled?: number | null
          leads_contacted?: number | null
          leads_converted?: number | null
          leads_received?: number | null
          revenue_generated?: number | null
          shop_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      insurance_claims: {
        Row: {
          ai_assessment_details: Json | null
          ai_confidence_score: number | null
          api_response: Json | null
          appointment_id: string | null
          claim_number: string
          claim_status: string | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          damage_location: string
          damage_photos: string[] | null
          damage_severity: string
          damage_type: string
          email_sent_at: string | null
          estimated_cost_max: number | null
          estimated_cost_min: number | null
          id: string
          insurer_decision_date: string | null
          insurer_name: string
          insurer_response: Json | null
          policy_number: string
          recommended_action: string
          submission_method: string
          submission_status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          ai_assessment_details?: Json | null
          ai_confidence_score?: number | null
          api_response?: Json | null
          appointment_id?: string | null
          claim_number: string
          claim_status?: string | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          damage_location: string
          damage_photos?: string[] | null
          damage_severity: string
          damage_type: string
          email_sent_at?: string | null
          estimated_cost_max?: number | null
          estimated_cost_min?: number | null
          id?: string
          insurer_decision_date?: string | null
          insurer_name: string
          insurer_response?: Json | null
          policy_number: string
          recommended_action: string
          submission_method?: string
          submission_status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          ai_assessment_details?: Json | null
          ai_confidence_score?: number | null
          api_response?: Json | null
          appointment_id?: string | null
          claim_number?: string
          claim_status?: string | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          damage_location?: string
          damage_photos?: string[] | null
          damage_severity?: string
          damage_type?: string
          email_sent_at?: string | null
          estimated_cost_max?: number | null
          estimated_cost_min?: number | null
          id?: string
          insurer_decision_date?: string | null
          insurer_name?: string
          insurer_response?: Json | null
          policy_number?: string
          recommended_action?: string
          submission_method?: string
          submission_status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_details: {
        Row: {
          booking_reference: string
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          id: string
          insurance_company_name: string
          insurer_name: string
          updated_at: string
        }
        Insert: {
          booking_reference: string
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          insurance_company_name: string
          insurer_name: string
          updated_at?: string
        }
        Update: {
          booking_reference?: string
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          id?: string
          insurance_company_name?: string
          insurer_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      insurer_preferred_shops: {
        Row: {
          created_at: string
          id: string
          insurer_id: string
          is_active: boolean | null
          priority_level: number | null
          shop_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          insurer_id: string
          is_active?: boolean | null
          priority_level?: number | null
          shop_id: string
        }
        Update: {
          created_at?: string
          id?: string
          insurer_id?: string
          is_active?: boolean | null
          priority_level?: number | null
          shop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurer_preferred_shops_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "insurer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurer_preferred_shops_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      insurer_profiles: {
        Row: {
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          insurer_name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          insurer_name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          insurer_name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      insurer_users: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          full_name: string
          id: string
          insurer_id: string
          is_active: boolean
          role: Database["public"]["Enums"]["insurer_user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          full_name: string
          id?: string
          insurer_id: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["insurer_user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          full_name?: string
          id?: string
          insurer_id?: string
          is_active?: boolean
          role?: Database["public"]["Enums"]["insurer_user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurer_users_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "insurer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      insurer_webhook_configs: {
        Row: {
          created_at: string
          events_subscribed: string[] | null
          id: string
          insurer_id: string
          is_active: boolean | null
          last_failure_at: string | null
          last_success_at: string | null
          retry_attempts: number | null
          timeout_seconds: number | null
          updated_at: string
          webhook_secret: string | null
          webhook_secret_hash: string | null
          webhook_url: string
        }
        Insert: {
          created_at?: string
          events_subscribed?: string[] | null
          id?: string
          insurer_id: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          retry_attempts?: number | null
          timeout_seconds?: number | null
          updated_at?: string
          webhook_secret?: string | null
          webhook_secret_hash?: string | null
          webhook_url: string
        }
        Update: {
          created_at?: string
          events_subscribed?: string[] | null
          id?: string
          insurer_id?: string
          is_active?: boolean | null
          last_failure_at?: string | null
          last_success_at?: string | null
          retry_attempts?: number | null
          timeout_seconds?: number | null
          updated_at?: string
          webhook_secret?: string | null
          webhook_secret_hash?: string | null
          webhook_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurer_webhook_configs_insurer_id_fkey"
            columns: ["insurer_id"]
            isOneToOne: false
            referencedRelation: "insurer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_completion_documents: {
        Row: {
          appointment_id: string
          completion_proof_file_name: string
          completion_proof_file_size: number | null
          completion_proof_path: string
          created_at: string
          id: string
          insurer_delivery_method: string | null
          insurer_delivery_response: Json | null
          insurer_delivery_status: string | null
          invoice_file_name: string
          invoice_file_path: string
          invoice_file_size: number | null
          notes: string | null
          sent_to_insurer_at: string | null
          shop_id: string
          updated_at: string
          uploaded_at: string
        }
        Insert: {
          appointment_id: string
          completion_proof_file_name: string
          completion_proof_file_size?: number | null
          completion_proof_path: string
          created_at?: string
          id?: string
          insurer_delivery_method?: string | null
          insurer_delivery_response?: Json | null
          insurer_delivery_status?: string | null
          invoice_file_name: string
          invoice_file_path: string
          invoice_file_size?: number | null
          notes?: string | null
          sent_to_insurer_at?: string | null
          shop_id: string
          updated_at?: string
          uploaded_at?: string
        }
        Update: {
          appointment_id?: string
          completion_proof_file_name?: string
          completion_proof_file_size?: number | null
          completion_proof_path?: string
          created_at?: string
          id?: string
          insurer_delivery_method?: string | null
          insurer_delivery_response?: Json | null
          insurer_delivery_status?: string | null
          invoice_file_name?: string
          invoice_file_path?: string
          invoice_file_size?: number | null
          notes?: string | null
          sent_to_insurer_at?: string | null
          shop_id?: string
          updated_at?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_completion_documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_completion_documents_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offer_upsells: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_accepted: boolean | null
          job_offer_id: string
          offered_price: number
          upsell_service_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_accepted?: boolean | null
          job_offer_id: string
          offered_price: number
          upsell_service_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_accepted?: boolean | null
          job_offer_id?: string
          offered_price?: number
          upsell_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_offer_upsells_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_offer_upsells_upsell_service_id_fkey"
            columns: ["upsell_service_id"]
            isOneToOne: false
            referencedRelation: "upsell_services"
            referencedColumns: ["id"]
          },
        ]
      }
      job_offers: {
        Row: {
          adas_calibration_notes: string | null
          appointment_id: string | null
          created_at: string
          decline_reason: string | null
          estimated_completion_time: unknown
          expires_at: string
          id: string
          is_out_of_network: boolean | null
          is_preferred_shop: boolean | null
          notes: string | null
          offered_at: string
          offered_price: number
          requires_adas_calibration: boolean | null
          responded_at: string | null
          shop_id: string
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string
        }
        Insert: {
          adas_calibration_notes?: string | null
          appointment_id?: string | null
          created_at?: string
          decline_reason?: string | null
          estimated_completion_time?: unknown
          expires_at: string
          id?: string
          is_out_of_network?: boolean | null
          is_preferred_shop?: boolean | null
          notes?: string | null
          offered_at?: string
          offered_price: number
          requires_adas_calibration?: boolean | null
          responded_at?: string | null
          shop_id: string
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
        }
        Update: {
          adas_calibration_notes?: string | null
          appointment_id?: string | null
          created_at?: string
          decline_reason?: string | null
          estimated_completion_time?: unknown
          expires_at?: string
          id?: string
          is_out_of_network?: boolean | null
          is_preferred_shop?: boolean | null
          notes?: string | null
          offered_at?: string
          offered_price?: number
          requires_adas_calibration?: boolean | null
          responded_at?: string | null
          shop_id?: string
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_offers_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      job_skill_requirements: {
        Row: {
          created_at: string
          damage_type: string | null
          description: string | null
          id: string
          minimum_experience_years: number | null
          required_certifications:
            | Database["public"]["Enums"]["certification_type"][]
            | null
          service_type: string
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          damage_type?: string | null
          description?: string | null
          id?: string
          minimum_experience_years?: number | null
          required_certifications?:
            | Database["public"]["Enums"]["certification_type"][]
            | null
          service_type: string
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          damage_type?: string | null
          description?: string | null
          id?: string
          minimum_experience_years?: number | null
          required_certifications?:
            | Database["public"]["Enums"]["certification_type"][]
            | null
          service_type?: string
          vehicle_type?: string | null
        }
        Relationships: []
      }
      job_status_audit: {
        Row: {
          appointment_id: string
          changed_by_shop_id: string | null
          claim_id: string | null
          created_at: string
          id: string
          job_offer_id: string | null
          metadata: Json | null
          new_status: Database["public"]["Enums"]["job_status_type"]
          notes: string | null
          old_status: Database["public"]["Enums"]["job_status_type"] | null
          status_changed_at: string
          webhook_response: Json | null
          webhook_sent_at: string | null
        }
        Insert: {
          appointment_id: string
          changed_by_shop_id?: string | null
          claim_id?: string | null
          created_at?: string
          id?: string
          job_offer_id?: string | null
          metadata?: Json | null
          new_status: Database["public"]["Enums"]["job_status_type"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["job_status_type"] | null
          status_changed_at?: string
          webhook_response?: Json | null
          webhook_sent_at?: string | null
        }
        Update: {
          appointment_id?: string
          changed_by_shop_id?: string | null
          claim_id?: string | null
          created_at?: string
          id?: string
          job_offer_id?: string | null
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["job_status_type"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["job_status_type"] | null
          status_changed_at?: string
          webhook_response?: Json | null
          webhook_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_status_audit_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_audit_changed_by_shop_id_fkey"
            columns: ["changed_by_shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_status_audit_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_leaderboard: {
        Row: {
          bonus_earned: number | null
          created_at: string
          customer_rating_avg: number | null
          id: string
          jobs_completed: number | null
          leaderboard_rank: number | null
          month_year: string
          points_earned: number | null
          response_time_avg: number | null
          shop_id: string
        }
        Insert: {
          bonus_earned?: number | null
          created_at?: string
          customer_rating_avg?: number | null
          id?: string
          jobs_completed?: number | null
          leaderboard_rank?: number | null
          month_year: string
          points_earned?: number | null
          response_time_avg?: number | null
          shop_id: string
        }
        Update: {
          bonus_earned?: number | null
          created_at?: string
          customer_rating_avg?: number | null
          id?: string
          jobs_completed?: number | null
          leaderboard_rank?: number | null
          month_year?: string
          points_earned?: number | null
          response_time_avg?: number | null
          shop_id?: string
        }
        Relationships: []
      }
      parts_fitment_requirements: {
        Row: {
          calibration_sensitive: boolean | null
          created_at: string
          damage_type: string
          id: string
          part_specifications: Json | null
          reason: string | null
          requires_oem: boolean | null
          updated_at: string
          vehicle_make: string
          vehicle_model: string | null
          year_from: number
          year_to: number
        }
        Insert: {
          calibration_sensitive?: boolean | null
          created_at?: string
          damage_type: string
          id?: string
          part_specifications?: Json | null
          reason?: string | null
          requires_oem?: boolean | null
          updated_at?: string
          vehicle_make: string
          vehicle_model?: string | null
          year_from: number
          year_to: number
        }
        Update: {
          calibration_sensitive?: boolean | null
          created_at?: string
          damage_type?: string
          id?: string
          part_specifications?: Json | null
          reason?: string | null
          requires_oem?: boolean | null
          updated_at?: string
          vehicle_make?: string
          vehicle_model?: string | null
          year_from?: number
          year_to?: number
        }
        Relationships: []
      }
      parts_sourcing_requests: {
        Row: {
          created_at: string
          estimated_cost: number | null
          estimated_delivery_days: number | null
          id: string
          job_offer_id: string | null
          notes: string | null
          oem_required: boolean | null
          part_type: string
          requested_delivery_date: string | null
          shop_id: string
          status: string | null
          supplier_quote: Json | null
          updated_at: string
          vehicle_make: string
          vehicle_model: string | null
          vehicle_year: number
        }
        Insert: {
          created_at?: string
          estimated_cost?: number | null
          estimated_delivery_days?: number | null
          id?: string
          job_offer_id?: string | null
          notes?: string | null
          oem_required?: boolean | null
          part_type: string
          requested_delivery_date?: string | null
          shop_id: string
          status?: string | null
          supplier_quote?: Json | null
          updated_at?: string
          vehicle_make: string
          vehicle_model?: string | null
          vehicle_year: number
        }
        Update: {
          created_at?: string
          estimated_cost?: number | null
          estimated_delivery_days?: number | null
          id?: string
          job_offer_id?: string | null
          notes?: string | null
          oem_required?: boolean | null
          part_type?: string
          requested_delivery_date?: string | null
          shop_id?: string
          status?: string | null
          supplier_quote?: Json | null
          updated_at?: string
          vehicle_make?: string
          vehicle_model?: string | null
          vehicle_year?: number
        }
        Relationships: [
          {
            foreignKeyName: "parts_sourcing_requests_job_offer_id_fkey"
            columns: ["job_offer_id"]
            isOneToOne: false
            referencedRelation: "job_offers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_pricing: {
        Row: {
          base_price: number
          created_at: string
          damage_type: string
          description: string | null
          estimated_duration_minutes: number | null
          id: string
          service_type: string
          shop_id: string
          updated_at: string
        }
        Insert: {
          base_price: number
          created_at?: string
          damage_type: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          service_type: string
          shop_id: string
          updated_at?: string
        }
        Update: {
          base_price?: number
          created_at?: string
          damage_type?: string
          description?: string | null
          estimated_duration_minutes?: number | null
          id?: string
          service_type?: string
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_pricing_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_achievements: {
        Row: {
          achievement_type: Database["public"]["Enums"]["achievement_type"]
          created_at: string
          data: Json | null
          description: string
          earned_at: string
          id: string
          points_value: number
          shop_id: string
          title: string
        }
        Insert: {
          achievement_type: Database["public"]["Enums"]["achievement_type"]
          created_at?: string
          data?: Json | null
          description: string
          earned_at?: string
          id?: string
          points_value?: number
          shop_id: string
          title: string
        }
        Update: {
          achievement_type?: Database["public"]["Enums"]["achievement_type"]
          created_at?: string
          data?: Json | null
          description?: string
          earned_at?: string
          id?: string
          points_value?: number
          shop_id?: string
          title?: string
        }
        Relationships: []
      }
      shop_availability: {
        Row: {
          appointment_id: string | null
          created_at: string
          date: string
          id: string
          is_available: boolean
          shop_id: string
          time_slot: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          date: string
          id?: string
          is_available?: boolean
          shop_id: string
          time_slot: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean
          shop_id?: string
          time_slot?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_availability_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_availability_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at: string | null
          sent_at: string
          shop_id: string
          title: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          notification_type: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          sent_at?: string
          shop_id: string
          title: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          notification_type?: Database["public"]["Enums"]["notification_type"]
          read_at?: string | null
          sent_at?: string
          shop_id?: string
          title?: string
        }
        Relationships: []
      }
      shop_reviews: {
        Row: {
          appointment_id: string | null
          created_at: string
          customer_email: string | null
          customer_name: string
          id: string
          rating: number
          review_text: string | null
          service_type: string | null
          shop_id: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name: string
          id?: string
          rating: number
          review_text?: string | null
          service_type?: string | null
          shop_id: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string
          id?: string
          rating?: number
          review_text?: string | null
          service_type?: string | null
          shop_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_reviews_shop_id_fkey"
            columns: ["shop_id"]
            isOneToOne: false
            referencedRelation: "shops"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_rewards: {
        Row: {
          best_streak_days: number | null
          created_at: string
          id: string
          level_tier: string | null
          lifetime_earnings: number | null
          monthly_bonus: number | null
          next_level_points: number | null
          referral_bonus: number | null
          shop_id: string
          streak_days: number | null
          total_points: number | null
          updated_at: string
        }
        Insert: {
          best_streak_days?: number | null
          created_at?: string
          id?: string
          level_tier?: string | null
          lifetime_earnings?: number | null
          monthly_bonus?: number | null
          next_level_points?: number | null
          referral_bonus?: number | null
          shop_id: string
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string
        }
        Update: {
          best_streak_days?: number | null
          created_at?: string
          id?: string
          level_tier?: string | null
          lifetime_earnings?: number | null
          monthly_bonus?: number | null
          next_level_points?: number | null
          referral_bonus?: number | null
          shop_id?: string
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      shop_technician_certifications: {
        Row: {
          certificate_number: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          certified_date: string
          certifying_body: string | null
          created_at: string
          expires_date: string | null
          id: string
          technician_id: string
        }
        Insert: {
          certificate_number?: string | null
          certification_type: Database["public"]["Enums"]["certification_type"]
          certified_date?: string
          certifying_body?: string | null
          created_at?: string
          expires_date?: string | null
          id?: string
          technician_id: string
        }
        Update: {
          certificate_number?: string | null
          certification_type?: Database["public"]["Enums"]["certification_type"]
          certified_date?: string
          certifying_body?: string | null
          created_at?: string
          expires_date?: string | null
          id?: string
          technician_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_technician_certifications_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "shop_technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      shop_technicians: {
        Row: {
          created_at: string
          email: string | null
          hire_date: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          shop_id: string
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          shop_id: string
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          created_at?: string
          email?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          shop_id?: string
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      shop_upsell_offerings: {
        Row: {
          created_at: string
          custom_description: string | null
          custom_price: number | null
          id: string
          is_active: boolean | null
          shop_id: string
          updated_at: string
          upsell_service_id: string
        }
        Insert: {
          created_at?: string
          custom_description?: string | null
          custom_price?: number | null
          id?: string
          is_active?: boolean | null
          shop_id: string
          updated_at?: string
          upsell_service_id: string
        }
        Update: {
          created_at?: string
          custom_description?: string | null
          custom_price?: number | null
          id?: string
          is_active?: boolean | null
          shop_id?: string
          updated_at?: string
          upsell_service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_upsell_offerings_upsell_service_id_fkey"
            columns: ["upsell_service_id"]
            isOneToOne: false
            referencedRelation: "upsell_services"
            referencedColumns: ["id"]
          },
        ]
      }
      shops: {
        Row: {
          acceptance_rate: number | null
          adas_calibration_capability: boolean | null
          address: string
          average_lead_time_days: number | null
          business_hours: Json | null
          city: string
          created_at: string
          current_streak: number | null
          description: string | null
          email: string | null
          id: string
          insurance_approved: boolean | null
          is_certified: boolean | null
          is_mobile_service: boolean | null
          jobs_accepted_count: number | null
          jobs_declined_count: number | null
          jobs_offered_count: number | null
          last_job_offered_at: string | null
          latitude: number | null
          level_tier: string | null
          logo_url: string | null
          longitude: number | null
          monthly_bonus_rate: number | null
          name: string
          performance_tier: string | null
          phone: string | null
          postal_code: string
          quality_score: number | null
          rating: number | null
          repair_types: Database["public"]["Enums"]["repair_type"] | null
          response_time_minutes: number | null
          service_capability:
            | Database["public"]["Enums"]["service_capability"]
            | null
          spare_parts_stock: Json | null
          special_badges: string[] | null
          total_points: number | null
          total_reviews: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          acceptance_rate?: number | null
          adas_calibration_capability?: boolean | null
          address: string
          average_lead_time_days?: number | null
          business_hours?: Json | null
          city: string
          created_at?: string
          current_streak?: number | null
          description?: string | null
          email?: string | null
          id: string
          insurance_approved?: boolean | null
          is_certified?: boolean | null
          is_mobile_service?: boolean | null
          jobs_accepted_count?: number | null
          jobs_declined_count?: number | null
          jobs_offered_count?: number | null
          last_job_offered_at?: string | null
          latitude?: number | null
          level_tier?: string | null
          logo_url?: string | null
          longitude?: number | null
          monthly_bonus_rate?: number | null
          name: string
          performance_tier?: string | null
          phone?: string | null
          postal_code: string
          quality_score?: number | null
          rating?: number | null
          repair_types?: Database["public"]["Enums"]["repair_type"] | null
          response_time_minutes?: number | null
          service_capability?:
            | Database["public"]["Enums"]["service_capability"]
            | null
          spare_parts_stock?: Json | null
          special_badges?: string[] | null
          total_points?: number | null
          total_reviews?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          acceptance_rate?: number | null
          adas_calibration_capability?: boolean | null
          address?: string
          average_lead_time_days?: number | null
          business_hours?: Json | null
          city?: string
          created_at?: string
          current_streak?: number | null
          description?: string | null
          email?: string | null
          id?: string
          insurance_approved?: boolean | null
          is_certified?: boolean | null
          is_mobile_service?: boolean | null
          jobs_accepted_count?: number | null
          jobs_declined_count?: number | null
          jobs_offered_count?: number | null
          last_job_offered_at?: string | null
          latitude?: number | null
          level_tier?: string | null
          logo_url?: string | null
          longitude?: number | null
          monthly_bonus_rate?: number | null
          name?: string
          performance_tier?: string | null
          phone?: string | null
          postal_code?: string
          quality_score?: number | null
          rating?: number | null
          repair_types?: Database["public"]["Enums"]["repair_type"] | null
          response_time_minutes?: number | null
          service_capability?:
            | Database["public"]["Enums"]["service_capability"]
            | null
          spare_parts_stock?: Json | null
          special_badges?: string[] | null
          total_points?: number | null
          total_reviews?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      technician_certifications: {
        Row: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at: string
          description: string | null
          id: string
          name: string
          required_for_jobs: string[] | null
        }
        Insert: {
          certification_type: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          required_for_jobs?: string[] | null
        }
        Update: {
          certification_type?: Database["public"]["Enums"]["certification_type"]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          required_for_jobs?: string[] | null
        }
        Relationships: []
      }
      upsell_services: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          name: string
          requires_parts: boolean | null
          typical_price_max: number | null
          typical_price_min: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name: string
          requires_parts?: boolean | null
          typical_price_max?: number | null
          typical_price_min?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          name?: string
          requires_parts?: boolean | null
          typical_price_max?: number | null
          typical_price_min?: number | null
        }
        Relationships: []
      }
      windshield_parts: {
        Row: {
          aftermarket_price: number | null
          availability_status: string | null
          created_at: string
          description: string | null
          id: string
          lead_time_days: number | null
          make: string
          model: string
          oem_price: number | null
          part_number: string
          updated_at: string
          year_from: number
          year_to: number
        }
        Insert: {
          aftermarket_price?: number | null
          availability_status?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_time_days?: number | null
          make: string
          model: string
          oem_price?: number | null
          part_number: string
          updated_at?: string
          year_from: number
          year_to: number
        }
        Update: {
          aftermarket_price?: number | null
          availability_status?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lead_time_days?: number | null
          make?: string
          model?: string
          oem_price?: number | null
          part_number?: string
          updated_at?: string
          year_from?: number
          year_to?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_oem_requirements: {
        Args: {
          _damage_type: string
          _vehicle_make: string
          _vehicle_model: string
          _vehicle_year: number
        }
        Returns: Json
      }
      detect_adas_calibration_needs: {
        Args: {
          damage_location?: string
          damage_type: string
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
        }
        Returns: boolean
      }
      get_user_insurer_id: { Args: { _user_id: string }; Returns: string }
      is_insurer_admin: { Args: { _user_id: string }; Returns: boolean }
      set_webhook_secret: {
        Args: { _config_id: string; _secret: string }
        Returns: undefined
      }
      shop_has_qualified_technicians: {
        Args: {
          _damage_type?: string
          _service_type: string
          _shop_id: string
          _vehicle_type?: string
        }
        Returns: boolean
      }
      verify_webhook_signature: {
        Args: { _config_id: string; _payload: string; _signature: string }
        Returns: boolean
      }
    }
    Enums: {
      achievement_type:
        | "speed_demon"
        | "quality_master"
        | "reliable_partner"
        | "volume_champion"
        | "customer_favorite"
        | "innovation_leader"
        | "consistency_king"
        | "early_adopter"
      certification_type:
        | "adas_calibration"
        | "windshield_replacement"
        | "mobile_service"
        | "luxury_vehicle"
        | "heavy_duty_vehicle"
        | "laminated_glass"
        | "tempered_glass"
        | "heated_windshield"
        | "heads_up_display"
        | "rain_sensor"
        | "tinted_glass"
      insurer_user_role: "admin" | "claims_user"
      job_status:
        | "pending"
        | "offered"
        | "accepted"
        | "declined"
        | "expired"
        | "completed"
      job_status_type: "scheduled" | "in_progress" | "completed" | "cancelled"
      notification_type: "job_offer" | "job_update" | "payment"
      repair_type: "chip_repair" | "crack_repair" | "both_repairs"
      service_capability: "repair_only" | "replacement_only" | "both"
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      achievement_type: [
        "speed_demon",
        "quality_master",
        "reliable_partner",
        "volume_champion",
        "customer_favorite",
        "innovation_leader",
        "consistency_king",
        "early_adopter",
      ],
      certification_type: [
        "adas_calibration",
        "windshield_replacement",
        "mobile_service",
        "luxury_vehicle",
        "heavy_duty_vehicle",
        "laminated_glass",
        "tempered_glass",
        "heated_windshield",
        "heads_up_display",
        "rain_sensor",
        "tinted_glass",
      ],
      insurer_user_role: ["admin", "claims_user"],
      job_status: [
        "pending",
        "offered",
        "accepted",
        "declined",
        "expired",
        "completed",
      ],
      job_status_type: ["scheduled", "in_progress", "completed", "cancelled"],
      notification_type: ["job_offer", "job_update", "payment"],
      repair_type: ["chip_repair", "crack_repair", "both_repairs"],
      service_capability: ["repair_only", "replacement_only", "both"],
    },
  },
} as const
