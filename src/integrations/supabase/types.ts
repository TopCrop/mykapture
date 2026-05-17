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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          mobile: string | null
          name: string
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          mobile?: string | null
          name: string
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          mobile?: string | null
          name?: string
          reason?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          date: string | null
          id: string
          location: string | null
          name: string
          org_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string | null
          id?: string
          location?: string | null
          name: string
          org_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string | null
          id?: string
          location?: string | null
          name?: string
          org_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up_bookings: {
        Row: {
          booked_by: string
          calendar_provider: string | null
          created_at: string
          duration_minutes: number
          external_event_id: string | null
          external_event_url: string | null
          follow_up_date: string
          id: string
          lead_id: string
          meeting_type: string
          notes: string | null
          org_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          booked_by: string
          calendar_provider?: string | null
          created_at?: string
          duration_minutes?: number
          external_event_id?: string | null
          external_event_url?: string | null
          follow_up_date: string
          id?: string
          lead_id: string
          meeting_type?: string
          notes?: string | null
          org_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          booked_by?: string
          calendar_provider?: string | null
          created_at?: string
          duration_minutes?: number
          external_event_id?: string | null
          external_event_url?: string | null
          follow_up_date?: string
          id?: string
          lead_id?: string
          meeting_type?: string
          notes?: string | null
          org_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_up_bookings_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_up_bookings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          org_id: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          org_id: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          org_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          bant_authority: string | null
          bant_budget: string | null
          bant_employees: string | null
          bant_need: string[] | null
          bant_timeline: string | null
          captured_by: string
          classification: string
          company: string | null
          created_at: string
          current_solution: string | null
          duplicate_of: string | null
          email: string | null
          event_id: string | null
          follow_up_email_sent: boolean | null
          follow_up_email_sent_at: string | null
          id: string
          is_duplicate: boolean | null
          name: string
          notes: string | null
          org_id: string | null
          phone: string | null
          score: number
          sync_status: string
          synced_at: string | null
          title: string | null
          transcription: string | null
          updated_at: string
          voice_note_url: string | null
          website: string | null
        }
        Insert: {
          bant_authority?: string | null
          bant_budget?: string | null
          bant_employees?: string | null
          bant_need?: string[] | null
          bant_timeline?: string | null
          captured_by: string
          classification?: string
          company?: string | null
          created_at?: string
          current_solution?: string | null
          duplicate_of?: string | null
          email?: string | null
          event_id?: string | null
          follow_up_email_sent?: boolean | null
          follow_up_email_sent_at?: string | null
          id?: string
          is_duplicate?: boolean | null
          name: string
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          score?: number
          sync_status?: string
          synced_at?: string | null
          title?: string | null
          transcription?: string | null
          updated_at?: string
          voice_note_url?: string | null
          website?: string | null
        }
        Update: {
          bant_authority?: string | null
          bant_budget?: string | null
          bant_employees?: string | null
          bant_need?: string[] | null
          bant_timeline?: string | null
          captured_by?: string
          classification?: string
          company?: string | null
          created_at?: string
          current_solution?: string | null
          duplicate_of?: string | null
          email?: string | null
          event_id?: string | null
          follow_up_email_sent?: boolean | null
          follow_up_email_sent_at?: string | null
          id?: string
          is_duplicate?: boolean | null
          name?: string
          notes?: string | null
          org_id?: string | null
          phone?: string | null
          score?: number
          sync_status?: string
          synced_at?: string | null
          title?: string | null
          transcription?: string | null
          updated_at?: string
          voice_note_url?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_captured_by_fkey"
            columns: ["captured_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "leads_duplicate_of_fkey"
            columns: ["duplicate_of"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_features: {
        Row: {
          linkedin_scanner_enabled: boolean
          org_id: string
          schedule_follow_up: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          linkedin_scanner_enabled?: boolean
          org_id: string
          schedule_follow_up?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          linkedin_scanner_enabled?: boolean
          org_id?: string
          schedule_follow_up?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_features_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_solution_options: {
        Row: {
          created_at: string
          id: string
          label: string
          org_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          org_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          org_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "org_solution_options_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          domain: string
          id: string
          logo_url: string | null
          name: string
          proxycurl_api_key: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          domain: string
          id?: string
          logo_url?: string | null
          name: string
          proxycurl_api_key?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          domain?: string
          id?: string
          logo_url?: string | null
          name?: string
          proxycurl_api_key?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email_confirmed: boolean | null
          id: string
          manually_approved_at: string | null
          manually_approved_by: string | null
          org_id: string | null
          phone: string | null
          team: string | null
          territory: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email_confirmed?: boolean | null
          id?: string
          manually_approved_at?: string | null
          manually_approved_by?: string | null
          org_id?: string | null
          phone?: string | null
          team?: string | null
          territory?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email_confirmed?: boolean | null
          id?: string
          manually_approved_at?: string | null
          manually_approved_by?: string | null
          org_id?: string | null
          phone?: string | null
          team?: string | null
          territory?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_approve_user: { Args: { _user_id: string }; Returns: undefined }
      check_duplicate_lead: {
        Args: {
          _current_user_id: string
          _email: string
          _event_id: string
          _phone: string
        }
        Returns: Json
      }
      get_all_org_stats: {
        Args: never
        Returns: {
          account_created_at: string
          admin_email: string
          admin_name: string
          creator_email: string
          lead_count: number
          member_count: number
          org_created_at: string
          org_domain: string
          org_id: string
          org_logo_url: string
          org_name: string
          org_status: string
        }[]
      }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      try_assign_user_to_org: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "sales_rep" | "manager" | "super_admin"
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
      app_role: ["admin", "sales_rep", "manager", "super_admin"],
    },
  },
} as const
