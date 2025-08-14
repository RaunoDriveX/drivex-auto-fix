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
      shops: {
        Row: {
          address: string
          business_hours: Json | null
          city: string
          created_at: string
          description: string | null
          email: string | null
          id: string
          insurance_approved: boolean | null
          is_certified: boolean | null
          is_mobile_service: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          postal_code: string
          rating: number | null
          total_reviews: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address: string
          business_hours?: Json | null
          city: string
          created_at?: string
          description?: string | null
          email?: string | null
          id: string
          insurance_approved?: boolean | null
          is_certified?: boolean | null
          is_mobile_service?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          postal_code: string
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          business_hours?: Json | null
          city?: string
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          insurance_approved?: boolean | null
          is_certified?: boolean | null
          is_mobile_service?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          postal_code?: string
          rating?: number | null
          total_reviews?: number | null
          updated_at?: string
          website?: string | null
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
