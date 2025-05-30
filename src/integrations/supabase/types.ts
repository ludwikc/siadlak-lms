export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      course_roles: {
        Row: {
          course_id: string
          created_at: string | null
          discord_role_id: string
          id: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          discord_role_id: string
          id?: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          discord_role_id?: string
          id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          media_type: string | null
          media_url: string | null
          module_id: string
          order_index: number
          slug: string
          title: string
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          module_id: string
          order_index: number
          slug: string
          title: string
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          media_type?: string | null
          media_url?: string | null
          module_id?: string
          order_index?: number
          slug?: string
          title?: string
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string | null
          discord_thread_url: string | null
          id: string
          order_index: number
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          discord_thread_url?: string | null
          id?: string
          order_index: number
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          discord_thread_url?: string | null
          id?: string
          order_index?: number
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrade_votes: {
        Row: {
          created_at: string
          id: string
          upgrade_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          upgrade_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          upgrade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "upgrade_votes_upgrade_id_fkey"
            columns: ["upgrade_id"]
            isOneToOne: false
            referencedRelation: "upgrades"
            referencedColumns: ["id"]
          },
        ]
      }
      upgrades: {
        Row: {
          category: string
          completed_at: string | null
          completion_link: string | null
          created_at: string
          created_by_discord_username: string
          description: string
          id: string
          status: Database["public"]["Enums"]["upgrade_status"]
          title: string
          updated_at: string
          votes: number | null
        }
        Insert: {
          category: string
          completed_at?: string | null
          completion_link?: string | null
          created_at?: string
          created_by_discord_username: string
          description: string
          id?: string
          status?: Database["public"]["Enums"]["upgrade_status"]
          title: string
          updated_at?: string
          votes?: number | null
        }
        Update: {
          category?: string
          completed_at?: string | null
          completion_link?: string | null
          created_at?: string
          created_by_discord_username?: string
          description?: string
          id?: string
          status?: Database["public"]["Enums"]["upgrade_status"]
          title?: string
          updated_at?: string
          votes?: number | null
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          last_position: number | null
          lesson_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_position?: number | null
          lesson_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          last_position?: number | null
          lesson_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          discord_role_id: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          discord_role_id: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          discord_role_id?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          discord_avatar: string | null
          discord_id: string
          discord_username: string
          id: string
          is_admin: boolean | null
          last_login: string | null
          roles: string[]
          settings: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discord_avatar?: string | null
          discord_id: string
          discord_username: string
          id?: string
          is_admin?: boolean | null
          last_login?: string | null
          roles?: string[]
          settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discord_avatar?: string | null
          discord_id?: string
          discord_username?: string
          id?: string
          is_admin?: boolean | null
          last_login?: string | null
          roles?: string[]
          settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      webinars: {
        Row: {
          created_at: string | null
          created_by: string
          description: string
          id: string
          title: string
          user_votes: Json | null
          votes: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          description: string
          id?: string
          title: string
          user_votes?: Json | null
          votes?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          description?: string
          id?: string
          title?: string
          user_votes?: Json | null
          votes?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_course: {
        Args: {
          course_title: string
          course_slug: string
          course_description?: string
          course_thumbnail_url?: string
        }
        Returns: string
      }
      create_lesson: {
        Args: {
          lesson_title: string
          lesson_slug: string
          lesson_module_id: string
          lesson_order_index: number
          lesson_content?: string
          lesson_media_type?: string
          lesson_media_url?: string
          lesson_transcript?: string
          lesson_published?: boolean
        }
        Returns: string
      }
      create_module: {
        Args: {
          module_title: string
          module_slug: string
          module_course_id: string
          module_order_index?: number
          module_discord_thread_url?: string
        }
        Returns: string
      }
      delete_lesson: {
        Args: { lesson_id: string }
        Returns: boolean
      }
      delete_module: {
        Args: { module_id: string }
        Returns: boolean
      }
      handle_discord_login: {
        Args: {
          _discord_id: string
          _discord_username: string
          _discord_avatar: string
          _roles: string[]
        }
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: boolean
      }
      is_authorized_discord_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      mark_upgrade_as_done: {
        Args: { upgrade_id: string; completion_link?: string }
        Returns: undefined
      }
      reorder_lessons: {
        Args: { module_id: string; lesson_ids: string[] }
        Returns: boolean
      }
      reorder_modules: {
        Args: { course_id: string; module_ids: string[] }
        Returns: boolean
      }
      update_lesson: {
        Args: {
          lesson_id: string
          lesson_title?: string
          lesson_slug?: string
          lesson_module_id?: string
          lesson_order_index?: number
          lesson_content?: string
          lesson_media_type?: string
          lesson_media_url?: string
          lesson_transcript?: string
          lesson_published?: boolean
        }
        Returns: boolean
      }
      update_module: {
        Args: {
          module_id: string
          module_title?: string
          module_slug?: string
          module_course_id?: string
          module_order_index?: number
          module_discord_thread_url?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      upgrade_status: "pending" | "done"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      upgrade_status: ["pending", "done"],
    },
  },
} as const
