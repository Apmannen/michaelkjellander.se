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
      article_field_values: {
        Row: {
          article_id: string
          field_id: string
          href: string | null
          id: string
          position: number
          target_article_id: string | null
          text: string
        }
        Insert: {
          article_id: string
          field_id: string
          href?: string | null
          id?: string
          position?: number
          target_article_id?: string | null
          text: string
        }
        Update: {
          article_id?: string
          field_id?: string
          href?: string | null
          id?: string
          position?: number
          target_article_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_field_values_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "field_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_field_values_target_article_id_fkey"
            columns: ["target_article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_tags: {
        Row: {
          article_id: string
          position: number
          tag_id: string
        }
        Insert: {
          article_id: string
          position?: number
          tag_id: string
        }
        Update: {
          article_id?: string
          position?: number
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "article_tags_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      articles: {
        Row: {
          body: Json
          cover_image: Json | null
          created_at: string
          cta: Json | null
          id: string
          intro: string
          published: boolean
          published_at: string
          site_id: string
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: Json
          cover_image?: Json | null
          created_at?: string
          cta?: Json | null
          id?: string
          intro?: string
          published?: boolean
          published_at?: string
          site_id: string
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: Json
          cover_image?: Json | null
          created_at?: string
          cta?: Json | null
          id?: string
          intro?: string
          published?: boolean
          published_at?: string
          site_id?: string
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_users: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      field_definitions: {
        Row: {
          created_at: string
          description: string
          id: string
          key: string
          label: string
          multiple: boolean
          site_id: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          key: string
          label: string
          multiple?: boolean
          site_id: string
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          key?: string
          label?: string
          multiple?: boolean
          site_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_definitions_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      issue_columns: {
        Row: {
          created_at: string
          id: string
          name: string
          position: number
          site_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          position?: number
          site_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          position?: number
          site_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_columns_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          column_id: string
          created_at: string
          id: string
          number: number
          position: number
          site_id: string
          text: string
          title: string
          updated_at: string
        }
        Insert: {
          column_id: string
          created_at?: string
          id?: string
          number: number
          position?: number
          site_id: string
          text?: string
          title: string
          updated_at?: string
        }
        Update: {
          column_id?: string
          created_at?: string
          id?: string
          number?: number
          position?: number
          site_id?: string
          text?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "issues_column_id_fkey"
            columns: ["column_id"]
            isOneToOne: false
            referencedRelation: "issue_columns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "issues_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          api_secret: string
          created_at: string
          id: string
          last_issue_number: number
          name: string
          updated_at: string
          url: string
        }
        Insert: {
          api_secret?: string
          created_at?: string
          id: string
          last_issue_number?: number
          name: string
          updated_at?: string
          url?: string
        }
        Update: {
          api_secret?: string
          created_at?: string
          id?: string
          last_issue_number?: number
          name?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      tag_parents: {
        Row: {
          parent_id: string
          position: number
          tag_id: string
        }
        Insert: {
          parent_id: string
          position?: number
          tag_id: string
        }
        Update: {
          parent_id?: string
          position?: number
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tag_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tag_parents_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          description: Json
          id: string
          name: string
          singular_name: string
          site_id: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: Json
          id?: string
          name: string
          singular_name?: string
          site_id: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: Json
          id?: string
          name?: string
          singular_name?: string
          site_id?: string
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tags_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      test_table: {
        Row: {
          a_valuie: string
          created_at: string
          id: number
        }
        Insert: {
          a_valuie?: string
          created_at?: string
          id?: number
        }
        Update: {
          a_valuie?: string
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      trash: {
        Row: {
          data: Json
          deleted_at: string
          document_id: string
          document_type: string
          id: string
          site_id: string | null
        }
        Insert: {
          data: Json
          deleted_at?: string
          document_id: string
          document_type: string
          id?: string
          site_id?: string | null
        }
        Update: {
          data?: Json
          deleted_at?: string
          document_id?: string
          document_type?: string
          id?: string
          site_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cms_before_user_created: { Args: { event: Json }; Returns: Json }
      create_issue: {
        Args: {
          column_id: string
          site_id: string
          text: string
          title: string
        }
        Returns: {
          column_id: string
          created_at: string
          id: string
          number: number
          position: number
          site_id: string
          text: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "issues"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_issue_column: {
        Args: { name: string; site_id: string }
        Returns: {
          created_at: string
          id: string
          name: string
          position: number
          site_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "issue_columns"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      delete_issue_column: { Args: { column_id: string }; Returns: boolean }
      move_issue: {
        Args: { column_id: string; issue_id: string; new_position: number }
        Returns: boolean
      }
      move_issue_column: {
        Args: { column_id: string; new_position: number }
        Returns: boolean
      }
      renumber_issues: { Args: { column_id: string }; Returns: undefined }
      set_article_field_values: {
        Args: { article_id: string; field_values: Json }
        Returns: Json
      }
      set_article_tags: {
        Args: { article_id: string; tag_ids: string[] }
        Returns: string[]
      }
      set_tag_parents: {
        Args: { parent_ids: string[]; tag_id: string }
        Returns: string[]
      }
      trash_article: { Args: { article_id: string }; Returns: boolean }
      trash_field_definition: { Args: { field_id: string }; Returns: boolean }
      trash_issue: { Args: { issue_id: string }; Returns: boolean }
      trash_tag: { Args: { tag_id: string }; Returns: boolean }
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
    Enums: {},
  },
} as const
