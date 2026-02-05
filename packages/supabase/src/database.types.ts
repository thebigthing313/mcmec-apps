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
      adult_mosquito_complaints: {
        Row: {
          additional_details: string | null
          address_line_1: string
          address_line_2: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          is_accessible: boolean
          is_daytime: boolean
          is_dusk_dawn: boolean
          is_front_of_property: boolean
          is_general_vicinity: boolean
          is_nighttime: boolean
          is_processed: boolean
          is_rear_of_property: boolean
          phone: string
          updated_at: string
          updated_by: string | null
          zip_code_id: string
        }
        Insert: {
          additional_details?: string | null
          address_line_1: string
          address_line_2?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_accessible?: boolean
          is_daytime?: boolean
          is_dusk_dawn?: boolean
          is_front_of_property?: boolean
          is_general_vicinity?: boolean
          is_nighttime?: boolean
          is_processed?: boolean
          is_rear_of_property?: boolean
          phone: string
          updated_at?: string
          updated_by?: string | null
          zip_code_id: string
        }
        Update: {
          additional_details?: string | null
          address_line_1?: string
          address_line_2?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_accessible?: boolean
          is_daytime?: boolean
          is_dusk_dawn?: boolean
          is_front_of_property?: boolean
          is_general_vicinity?: boolean
          is_nighttime?: boolean
          is_processed?: boolean
          is_rear_of_property?: boolean
          phone?: string
          updated_at?: string
          updated_by?: string | null
          zip_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "adult_mosquito_complaints_zip_code_id_fkey"
            columns: ["zip_code_id"]
            isOneToOne: false
            referencedRelation: "zip_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_form_submissions: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_closed: boolean
          message: string
          name: string
          subject: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_closed?: boolean
          message: string
          name: string
          subject: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_closed?: boolean
          message?: string
          name?: string
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      insecticides: {
        Row: {
          active_ingredient: string
          active_ingredient_url: string
          created_at: string
          created_by: string | null
          id: string
          label_url: string
          msds_url: string
          trade_name: string
          type_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          active_ingredient: string
          active_ingredient_url: string
          created_at?: string
          created_by?: string | null
          id?: string
          label_url: string
          msds_url: string
          trade_name: string
          type_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          active_ingredient?: string
          active_ingredient_url?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label_url?: string
          msds_url?: string
          trade_name?: string
          type_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      meetings: {
        Row: {
          agenda_url: string | null
          created_at: string
          created_by: string | null
          id: string
          is_cancelled: boolean
          location: string
          meeting_at: string
          minutes_url: string | null
          name: string
          notes: string | null
          notice_url: string | null
          report_url: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          agenda_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_cancelled?: boolean
          location: string
          meeting_at: string
          minutes_url?: string | null
          name: string
          notes?: string | null
          notice_url?: string | null
          report_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          agenda_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_cancelled?: boolean
          location?: string
          meeting_at?: string
          minutes_url?: string | null
          name?: string
          notes?: string | null
          notice_url?: string | null
          report_url?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      mosquito_fish_requests: {
        Row: {
          additional_details: string | null
          address_line_1: string
          address_line_2: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          is_processed: boolean
          location_of_water_body: string
          phone: string
          type_of_water_body: string
          updated_at: string
          updated_by: string | null
          zip_code_id: string
        }
        Insert: {
          additional_details?: string | null
          address_line_1: string
          address_line_2?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_processed?: boolean
          location_of_water_body: string
          phone: string
          type_of_water_body: string
          updated_at?: string
          updated_by?: string | null
          zip_code_id: string
        }
        Update: {
          additional_details?: string | null
          address_line_1?: string
          address_line_2?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_processed?: boolean
          location_of_water_body?: string
          phone?: string
          type_of_water_body?: string
          updated_at?: string
          updated_by?: string | null
          zip_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mosquito_fish_requests_zip_code_id_fkey"
            columns: ["zip_code_id"]
            isOneToOne: false
            referencedRelation: "zip_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      notice_types: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notices: {
        Row: {
          content: Json
          created_at: string
          created_by: string | null
          id: string
          is_archived: boolean
          is_published: boolean
          notice_date: string
          notice_type_id: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_archived?: boolean
          is_published?: boolean
          notice_date: string
          notice_type_id: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string | null
          id?: string
          is_archived?: boolean
          is_published?: boolean
          notice_date?: string
          notice_type_id?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notices_notice_type_id_fkey"
            columns: ["notice_type_id"]
            isOneToOne: false
            referencedRelation: "notice_types"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          created_at: string
          id: string
          permission_description: string | null
          permission_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_description?: string | null
          permission_name: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_description?: string | null
          permission_name?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          permission_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          permission_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          permission_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permissions_permission_name_fkey"
            columns: ["permission_name"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["permission_name"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          created_by: string | null
          display_name: string
          display_title: string | null
          id: string
          updated_at: string | null
          updated_by: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name: string
          display_title?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          created_by?: string | null
          display_name?: string
          display_title?: string | null
          id?: string
          updated_at?: string | null
          updated_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      water_management_requests: {
        Row: {
          additional_details: string | null
          address_line_1: string
          address_line_2: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          is_on_my_property: boolean
          is_on_neighbor_property: boolean
          is_on_public_property: boolean
          is_processed: boolean
          other_location_description: string | null
          phone: string
          updated_at: string
          updated_by: string | null
          zip_code_id: string
        }
        Insert: {
          additional_details?: string | null
          address_line_1: string
          address_line_2?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_on_my_property?: boolean
          is_on_neighbor_property?: boolean
          is_on_public_property?: boolean
          is_processed?: boolean
          other_location_description?: string | null
          phone: string
          updated_at?: string
          updated_by?: string | null
          zip_code_id: string
        }
        Update: {
          additional_details?: string | null
          address_line_1?: string
          address_line_2?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_on_my_property?: boolean
          is_on_neighbor_property?: boolean
          is_on_public_property?: boolean
          is_processed?: boolean
          other_location_description?: string | null
          phone?: string
          updated_at?: string
          updated_by?: string | null
          zip_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "water_management_requests_zip_code_id_fkey"
            columns: ["zip_code_id"]
            isOneToOne: false
            referencedRelation: "zip_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      zip_codes: {
        Row: {
          city: string
          code: string
          created_at: string
          created_by: string | null
          id: string
          state: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          city: string
          code: string
          created_at?: string
          created_by?: string | null
          id?: string
          state: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          city?: string
          code?: string
          created_at?: string
          created_by?: string | null
          id?: string
          state?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_permission: { Args: { p_permission_name: string }; Returns: boolean }
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

