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
      campaign_email_accounts: {
        Row: {
          campaign_id: string
          created_at: string
          daily_limit: number
          email_account_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          daily_limit?: number
          email_account_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          daily_limit?: number
          email_account_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_email_accounts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_email_accounts_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_email_events: {
        Row: {
          campaign_email_id: string | null
          campaign_id: string | null
          created_at: string
          diagnostic: string | null
          email_account_id: string | null
          event_type: string
          from_email: string | null
          id: string
          occurred_at: string | null
          provider_message_id: string | null
          raw_header_message_ids: string[]
          snippet: string | null
          subject: string | null
        }
        Insert: {
          campaign_email_id?: string | null
          campaign_id?: string | null
          created_at?: string
          diagnostic?: string | null
          email_account_id?: string | null
          event_type: string
          from_email?: string | null
          id?: string
          occurred_at?: string | null
          provider_message_id?: string | null
          raw_header_message_ids?: string[]
          snippet?: string | null
          subject?: string | null
        }
        Update: {
          campaign_email_id?: string | null
          campaign_id?: string | null
          created_at?: string
          diagnostic?: string | null
          email_account_id?: string | null
          event_type?: string
          from_email?: string | null
          id?: string
          occurred_at?: string | null
          provider_message_id?: string | null
          raw_header_message_ids?: string[]
          snippet?: string | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_email_events_campaign_email_id_fkey"
            columns: ["campaign_email_id"]
            isOneToOne: false
            referencedRelation: "campaign_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_email_events_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_emails: {
        Row: {
          attempt_count: number
          body: string
          bounce_reason: string | null
          bounce_type: string | null
          bounced_at: string | null
          campaign_id: string
          claim_token: string | null
          claimed_at: string | null
          created_at: string
          email_account_id: string | null
          id: string
          last_error: string | null
          lead_id: string
          paused_from_status: string | null
          priority_at: string | null
          priority_score: number
          queue_position: number
          reply_detected_at: string | null
          reply_from_email: string | null
          reply_snippet: string | null
          reply_subject: string | null
          scheduled_at: string | null
          sent_at: string | null
          sent_from_email: string | null
          smtp_message_id: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          attempt_count?: number
          body: string
          bounce_reason?: string | null
          bounce_type?: string | null
          bounced_at?: string | null
          campaign_id: string
          claim_token?: string | null
          claimed_at?: string | null
          created_at?: string
          email_account_id?: string | null
          id?: string
          last_error?: string | null
          lead_id: string
          paused_from_status?: string | null
          priority_at?: string | null
          priority_score?: number
          queue_position?: number
          reply_detected_at?: string | null
          reply_from_email?: string | null
          reply_snippet?: string | null
          reply_subject?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_from_email?: string | null
          smtp_message_id?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          attempt_count?: number
          body?: string
          bounce_reason?: string | null
          bounce_type?: string | null
          bounced_at?: string | null
          campaign_id?: string
          claim_token?: string | null
          claimed_at?: string | null
          created_at?: string
          email_account_id?: string | null
          id?: string
          last_error?: string | null
          lead_id?: string
          paused_from_status?: string | null
          priority_at?: string | null
          priority_score?: number
          queue_position?: number
          reply_detected_at?: string | null
          reply_from_email?: string | null
          reply_snippet?: string | null
          reply_subject?: string | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_from_email?: string | null
          smtp_message_id?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_emails_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_emails_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_emails_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "user_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          created_at: string
          email_account_id: string | null
          id: string
          name: string
          progress: number | null
          prompt_angle: string | null
          replies_count: number | null
          sending_window: string
          sent_count: number | null
          status: string | null
          total_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email_account_id?: string | null
          id?: string
          name: string
          progress?: number | null
          prompt_angle?: string | null
          replies_count?: number | null
          sending_window?: string
          sent_count?: number | null
          status?: string | null
          total_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          email_account_id?: string | null
          id?: string
          name?: string
          progress?: number | null
          prompt_angle?: string | null
          replies_count?: number | null
          sending_window?: string
          sent_count?: number | null
          status?: string | null
          total_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
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
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          metadata: Json
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      email_account_imap_cursors: {
        Row: {
          email_account_id: string
          last_uid: number
          mailbox: string
          updated_at: string
        }
        Insert: {
          email_account_id: string
          last_uid?: number
          mailbox?: string
          updated_at?: string
        }
        Update: {
          email_account_id?: string
          last_uid?: number
          mailbox?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_account_imap_cursors_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          created_at: string
          daily_limit: number | null
          email_address: string
          id: string
          imap_host: string | null
          imap_last_sync_at: string | null
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
          imap_last_sync_at?: string | null
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
          imap_last_sync_at?: string | null
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
          ai_icebreaker: string | null
          city: string | null
          company_name: string
          created_at: string
          email: string | null
          email_source: string | null
          enriched_at: string | null
          enrichment_status: string | null
          facebook_url: string | null
          id: string
          industry: string | null
          instagram_last_post: string | null
          instagram_url: string | null
          linkedin_bio: string | null
          linkedin_url: string | null
          query_hash: string
          website: string | null
        }
        Insert: {
          ai_icebreaker?: string | null
          city?: string | null
          company_name: string
          created_at?: string
          email?: string | null
          email_source?: string | null
          enriched_at?: string | null
          enrichment_status?: string | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          instagram_last_post?: string | null
          instagram_url?: string | null
          linkedin_bio?: string | null
          linkedin_url?: string | null
          query_hash: string
          website?: string | null
        }
        Update: {
          ai_icebreaker?: string | null
          city?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          email_source?: string | null
          enriched_at?: string | null
          enrichment_status?: string | null
          facebook_url?: string | null
          id?: string
          industry?: string | null
          instagram_last_post?: string | null
          instagram_url?: string | null
          linkedin_bio?: string | null
          linkedin_url?: string | null
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
          mailbox_connected: boolean | null
          onboarding_completed: boolean
          phone: string | null
          plan: string | null
          timezone: string | null
        }
        Insert: {
          created_at?: string
          credits?: number | null
          full_name?: string | null
          id: string
          mailbox_connected?: boolean | null
          onboarding_completed?: boolean
          phone?: string | null
          plan?: string | null
          timezone?: string | null
        }
        Update: {
          created_at?: string
          credits?: number | null
          full_name?: string | null
          id?: string
          mailbox_connected?: boolean | null
          onboarding_completed?: boolean
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
      zec_worker_tokens: {
        Row: {
          active: boolean
          created_at: string
          id: string
          last_used_at: string | null
          purpose: string
          token_hash: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          last_used_at?: string | null
          purpose: string
          token_hash: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          last_used_at?: string | null
          purpose?: string
          token_hash?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      zec_claim_due_campaign_emails: {
        Args: { p_claim_token?: string; p_limit?: number }
        Returns: {
          attempt_count: number
          body: string
          campaign_id: string
          claim_token: string
          email_account_id: string
          email_id: string
          lead_id: string
          recipient_company: string
          recipient_email: string
          sender_email: string
          sender_name: string
          smtp_host: string
          smtp_password: string
          smtp_port: number
          subject: string
        }[]
      }
      zec_get_imap_accounts: {
        Args: { p_limit?: number }
        Returns: {
          email_account_id: string
          email_address: string
          imap_host: string
          imap_port: number
          last_uid: number
          smtp_password: string
        }[]
      }
      zec_mark_campaign_email_failed: {
        Args: { p_claim_token: string; p_email_id: string; p_error?: string }
        Returns: undefined
      }
      zec_mark_campaign_email_sent: {
        Args: {
          p_claim_token: string
          p_email_id: string
          p_smtp_message_id?: string
        }
        Returns: undefined
      }
      zec_move_campaign_email: {
        Args: { p_direction: string; p_email_id: string }
        Returns: undefined
      }
      zec_normalize_search_text: { Args: { p_value: string }; Returns: string }
      zec_pause_campaign: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      zec_preview_global_leads: {
        Args: { p_limit?: number }
        Returns: {
          ai_icebreaker: string | null
          city: string | null
          company_name: string
          created_at: string
          email: string | null
          email_source: string | null
          enriched_at: string | null
          enrichment_status: string | null
          facebook_url: string | null
          id: string
          industry: string | null
          instagram_last_post: string | null
          instagram_url: string | null
          linkedin_bio: string | null
          linkedin_url: string | null
          query_hash: string
          website: string | null
        }[]
      }
      zec_record_campaign_inbound_event: {
        Args: {
          p_bounce_type?: string
          p_diagnostic: string
          p_email_account_id: string
          p_event_type: string
          p_from_email: string
          p_header_message_ids: string[]
          p_occurred_at: string
          p_provider_message_id: string
          p_recipient_email?: string
          p_snippet: string
          p_subject: string
        }
        Returns: {
          campaign_email_id: string
          campaign_id: string
          matched: boolean
        }[]
      }
      zec_reschedule_campaign: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      zec_resume_campaign: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      zec_search_global_leads: {
        Args: {
          p_city?: string | null
          p_country?: string | null
          p_industry_tokens?: string[]
          p_keyword_tokens?: string[]
          p_max_leads?: number
          p_only_enriched?: boolean
          p_require_email?: boolean
          p_require_social?: boolean
          p_require_website?: boolean
          p_search_depth?: string
        }
        Returns: {
          ai_icebreaker: string | null
          charged_credits: number
          city: string | null
          company_name: string
          created_at: string
          credits_after: number
          email: string | null
          email_source: string | null
          enriched_at: string | null
          enrichment_status: string | null
          facebook_url: string | null
          id: string
          industry: string | null
          instagram_last_post: string | null
          instagram_url: string | null
          linkedin_bio: string | null
          linkedin_url: string | null
          query_hash: string
          total_matches: number
          website: string | null
        }[]
      }
      zec_set_campaign_email_priority: {
        Args: { p_email_id: string; p_priority: boolean }
        Returns: undefined
      }
      zec_spend_profile_credits: {
        Args: { p_amount: number; p_metadata?: Json; p_reason?: string }
        Returns: number
      }
      zec_start_campaign_sending: {
        Args: { p_campaign_id: string }
        Returns: undefined
      }
      zec_update_imap_cursor: {
        Args: {
          p_email_account_id: string
          p_last_uid: number
          p_mailbox?: string
        }
        Returns: undefined
      }
      zec_verify_worker_token: {
        Args: { p_purpose?: string; p_token: string }
        Returns: boolean
      }
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
