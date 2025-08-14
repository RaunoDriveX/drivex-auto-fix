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
          appointment_date: string
          appointment_time: string
          confirmation_email_sent: boolean | null
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string | null
          damage_type: string | null
          id: string
          is_insurance_claim: boolean | null
          notes: string | null
          reminder_email_sent: boolean | null
          service_type: string
          shop_id: string
          shop_name: string
          status: string
          total_cost: number | null
          updated_at: string
          vehicle_info: Json | null
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          confirmation_email_sent?: boolean | null
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          damage_type?: string | null
          id?: string
          is_insurance_claim?: boolean | null
          notes?: string | null
          reminder_email_sent?: boolean | null
          service_type?: string
          shop_id: string
          shop_name: string
          status?: string
          total_cost?: number | null
          updated_at?: string
          vehicle_info?: Json | null
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          confirmation_email_sent?: boolean | null
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          damage_type?: string | null
          id?: string
          is_insurance_claim?: boolean | null
          notes?: string | null
          reminder_email_sent?: boolean | null
          service_type?: string
          shop_id?: string
          shop_name?: string
          status?: string
          total_cost?: number | null
          updated_at?: string
          vehicle_info?: Json | null
        }
        Relationships: []
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
      job_offers: {
        Row: {
          appointment_id: string | null
          created_at: string
          decline_reason: string | null
          estimated_completion_time: unknown | null
          expires_at: string
          id: string
          notes: string | null
          offered_at: string
          offered_price: number
          responded_at: string | null
          shop_id: string
          status: Database["public"]["Enums"]["job_status"] | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          decline_reason?: string | null
          estimated_completion_time?: unknown | null
          expires_at: string
          id?: string
          notes?: string | null
          offered_at?: string
          offered_price: number
          responded_at?: string | null
          shop_id: string
          status?: Database["public"]["Enums"]["job_status"] | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          decline_reason?: string | null
          estimated_completion_time?: unknown | null
          expires_at?: string
          id?: string
          notes?: string | null
          offered_at?: string
          offered_price?: number
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
      shops: {
        Row: {
          acceptance_rate: number | null
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
      [_ in never]: never
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
      job_status:
        | "pending"
        | "offered"
        | "accepted"
        | "declined"
        | "expired"
        | "completed"
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
      job_status: [
        "pending",
        "offered",
        "accepted",
        "declined",
        "expired",
        "completed",
      ],
      notification_type: ["job_offer", "job_update", "payment"],
      repair_type: ["chip_repair", "crack_repair", "both_repairs"],
      service_capability: ["repair_only", "replacement_only", "both"],
    },
  },
} as const
