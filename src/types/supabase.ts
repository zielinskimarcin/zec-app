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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      campaign_defaults: {
        Row: {
          created_at: string
          id: string
          primary_goal: string | null
          tone_of_voice: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          primary_goal?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          primary_goal?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          created_at: string
          id: string
          name: string
          progress: number | null
          prompt_angle: string | null
          replies_count: number | null
          sent_count: number | null
          status: string | null
          total_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          progress?: number | null
          prompt_angle?: string | null
          replies_count?: number | null
          sent_count?: number | null
          status?: string | null
          total_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          progress?: number | null
          prompt_angle?: string | null
          replies_count?: number | null
          sent_count?: number | null
          status?: string | null
          total_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          ai_context: string | null
          competitive_advantages: string | null
          created_at: string
          id: string
          ideal_customer_profile: string | null
          industry: string | null
          name: string
          short_description: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          ai_context?: string | null
          competitive_advantages?: string | null
          created_at?: string
          id?: string
          ideal_customer_profile?: string | null
          industry?: string | null
          name?: string
          short_description?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          ai_context?: string | null
          competitive_advantages?: string | null
          created_at?: string
          id?: string
          ideal_customer_profile?: string | null
          industry?: string | null
          name?: string
          short_description?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      email_accounts: {
        Row: {
          created_at: string
          daily_limit: number | null
          email_address: string
          id: string
          imap_host: string | null
          imap_port: number | null
          last_sync: string | null
          sender_name: string
          sent_today: number | null
          smtp_host: string
          smtp_password: string
          smtp_port: number
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number | null
          email_address: string
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          last_sync?: string | null
          sender_name: string
          sent_today?: number | null
          smtp_host: string
          smtp_password: string
          smtp_port: number
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          daily_limit?: number | null
          email_address?: string
          id?: string
          imap_host?: string | null
          imap_port?: number | null
          last_sync?: string | null
          sender_name?: string
          sent_today?: number | null
          smtp_host?: string
          smtp_password?: string
          smtp_port?: number
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      global_leads: {
        Row: {
          city: string | null
          company_name: string
          created_at: string
          email: string | null
          id: string
          industry: string | null
          query_hash: string
          website: string | null
        }
        Insert: {
          city?: string | null
          company_name: string
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          query_hash: string
          website?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          id?: string
          industry?: string | null
          query_hash?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credits: number | null
          full_name: string | null
          id: string
          phone: string | null
          plan: string | null
          timezone: string | null
        }
        Insert: {
          created_at?: string
          credits?: number | null
          full_name?: string | null
          id: string
          phone?: string | null
          plan?: string | null
          timezone?: string | null
        }
        Update: {
          created_at?: string
          credits?: number | null
          full_name?: string | null
          id?: string
          phone?: string | null
          plan?: string | null
          timezone?: string | null
        }
        Relationships: []
      }
      saved_searches: {
        Row: {
          city: string | null
          created_at: string
          id: string
          industry: string | null
          leads_data: Json | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          leads_data?: Json | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          leads_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      search_requests: {
        Row: {
          created_at: string
          id: string
          leads_found: number | null
          leads_requested: number
          query_hash: string
          status: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          leads_found?: number | null
          leads_requested: number
          query_hash: string
          status?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          leads_found?: number | null
          leads_requested?: number
          query_hash?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_leads: {
        Row: {
          ai_icebreaker: string | null
          campaign_id: string | null
          created_at: string
          global_lead_id: string | null
          has_instagram: boolean | null
          has_linkedin: boolean | null
          history: Json | null
          id: string
          instagram_data: Json | null
          linkedin_data: Json | null
          name: string | null
          request_id: string | null
          status: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          ai_icebreaker?: string | null
          campaign_id?: string | null
          created_at?: string
          global_lead_id?: string | null
          has_instagram?: boolean | null
          has_linkedin?: boolean | null
          history?: Json | null
          id?: string
          instagram_data?: Json | null
          linkedin_data?: Json | null
          name?: string | null
          request_id?: string | null
          status?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          ai_icebreaker?: string | null
          campaign_id?: string | null
          created_at?: string
          global_lead_id?: string | null
          has_instagram?: boolean | null
          has_linkedin?: boolean | null
          history?: Json | null
          id?: string
          instagram_data?: Json | null
          linkedin_data?: Json | null
          name?: string | null
          request_id?: string | null
          status?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_leads_global_lead_id_fkey"
            columns: ["global_lead_id"]
            isOneToOne: false
            referencedRelation: "global_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_leads_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "search_requests"
            referencedColumns: ["id"]
          },
        ]
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
