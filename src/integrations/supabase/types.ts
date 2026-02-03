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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          awarded_at: string
          badge_code: string
          user_id: string
        }
        Insert: {
          awarded_at?: string
          badge_code: string
          user_id: string
        }
        Update: {
          awarded_at?: string
          badge_code?: string
          user_id?: string
        }
        Relationships: []
      }
      cohort_members: {
        Row: {
          collection_id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          collection_id: string
          joined_at?: string
          user_id: string
        }
        Update: {
          collection_id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cohort_members_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_roles: {
        Row: {
          access: string
          course_id: string
          created_at: string
          discord_role_id: string
        }
        Insert: {
          access?: string
          course_id: string
          created_at?: string
          discord_role_id: string
        }
        Update: {
          access?: string
          course_id?: string
          created_at?: string
          discord_role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_roles_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_roles_discord_role_id_fkey"
            columns: ["discord_role_id"]
            isOneToOne: false
            referencedRelation: "guild_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          blurb: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          name: string
          slug: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          blurb?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name: string
          slug: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          blurb?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          name?: string
          slug?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      feature_requests: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          status: string
          title: string
          updated_at: string
          votes: number
        }
        Insert: {
          category: string
          completed_at?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          status?: string
          title: string
          updated_at?: string
          votes?: number
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
          votes?: number
        }
        Relationships: []
      }
      feature_votes: {
        Row: {
          feature_id: string
          user_id: string
          voted_at: string
        }
        Insert: {
          feature_id: string
          user_id: string
          voted_at?: string
        }
        Update: {
          feature_id?: string
          user_id?: string
          voted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_votes_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "feature_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      guild_roles: {
        Row: {
          color: number
          hoist: boolean
          id: string
          managed: boolean
          mentionable: boolean
          name: string
          position: number
          updated_at: string | null
        }
        Insert: {
          color: number
          hoist: boolean
          id: string
          managed: boolean
          mentionable: boolean
          name: string
          position: number
          updated_at?: string | null
        }
        Update: {
          color?: number
          hoist?: boolean
          id?: string
          managed?: boolean
          mentionable?: boolean
          name?: string
          position?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      lesson_events: {
        Row: {
          created_at: string
          ends_at: string
          lesson_id: string
          stage_channel_id: number | null
          starts_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          lesson_id: string
          stage_channel_id?: number | null
          starts_at: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          lesson_id?: string
          stage_channel_id?: number | null
          starts_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_events_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string
          discord_forum_url: string | null
          discord_processed: boolean | null
          discord_thread_id: number | null
          embed_html: string | null
          id: string
          kind: Database["public"]["Enums"]["lesson_kind"]
          live_at: string | null
          module_id: string
          order_index: number | null
          sidebar_icon: string
          slug: string
          thumbnail_url: string | null
          title: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          discord_forum_url?: string | null
          discord_processed?: boolean | null
          discord_thread_id?: number | null
          embed_html?: string | null
          id?: string
          kind: Database["public"]["Enums"]["lesson_kind"]
          live_at?: string | null
          module_id: string
          order_index?: number | null
          sidebar_icon?: string
          slug: string
          thumbnail_url?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          discord_forum_url?: string | null
          discord_processed?: boolean | null
          discord_thread_id?: number | null
          embed_html?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["lesson_kind"]
          live_at?: string | null
          module_id?: string
          order_index?: number | null
          sidebar_icon?: string
          slug?: string
          thumbnail_url?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
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
          created_at: string
          description: string | null
          discord_thread_url: string | null
          id: string
          order_index: number
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          discord_thread_url?: string | null
          id: string
          order_index?: number
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          discord_thread_url?: string | null
          id?: string
          order_index?: number
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
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
      pending_users: {
        Row: {
          claimed_at: string | null
          claimed_by: string | null
          course_id: string | null
          created_at: string | null
          email: string
          id: string
          purchase_data: Json | null
          stripe_customer_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          claimed_at?: string | null
          claimed_by?: string | null
          course_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          purchase_data?: Json | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          claimed_at?: string | null
          claimed_by?: string | null
          course_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          purchase_data?: Json | null
          stripe_customer_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_users_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_history: {
        Row: {
          amount: number
          course_id: string | null
          created_at: string | null
          currency: string
          id: string
          status: string
          stripe_customer_id: string
          stripe_event_id: string
          stripe_session_id: string
          user_id: string | null
          webhook_data: Json
        }
        Insert: {
          amount: number
          course_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          status?: string
          stripe_customer_id: string
          stripe_event_id: string
          stripe_session_id: string
          user_id?: string | null
          webhook_data: Json
        }
        Update: {
          amount?: number
          course_id?: string | null
          created_at?: string | null
          currency?: string
          id?: string
          status?: string
          stripe_customer_id?: string
          stripe_event_id?: string
          stripe_session_id?: string
          user_id?: string | null
          webhook_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "purchase_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_categories: {
        Row: {
          color_class: string
          course_ids: string[]
          created_at: string
          display_order: number
          enabled: boolean
          homepage_limit: number
          icon_name: string
          id: string
          name: string
          show_on_homepage: boolean
          slug: string
          updated_at: string
        }
        Insert: {
          color_class: string
          course_ids?: string[]
          created_at?: string
          display_order?: number
          enabled?: boolean
          homepage_limit?: number
          icon_name: string
          id?: string
          name: string
          show_on_homepage?: boolean
          slug: string
          updated_at?: string
        }
        Update: {
          color_class?: string
          course_ids?: string[]
          created_at?: string
          display_order?: number
          enabled?: boolean
          homepage_limit?: number
          icon_name?: string
          id?: string
          name?: string
          show_on_homepage?: boolean
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_grants: {
        Row: {
          created_at: string
          discord_role_id: string
          id: string
          resource_id: string | null
          resource_type: string
        }
        Insert: {
          created_at?: string
          discord_role_id: string
          id?: string
          resource_id?: string | null
          resource_type: string
        }
        Update: {
          created_at?: string
          discord_role_id?: string
          id?: string
          resource_id?: string | null
          resource_type?: string
        }
        Relationships: []
      }
      role_assignment_audit: {
        Row: {
          action: string
          course_id: string
          discord_role_id: string
          id: string
          old_discord_role_id: string | null
          source: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          course_id: string
          discord_role_id: string
          id?: string
          old_discord_role_id?: string | null
          source?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          course_id?: string
          discord_role_id?: string
          id?: string
          old_discord_role_id?: string | null
          source?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_assignment_audit_discord_role_id_fkey"
            columns: ["discord_role_id"]
            isOneToOne: false
            referencedRelation: "guild_roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_assignment_audit_old_discord_role_id_fkey"
            columns: ["old_discord_role_id"]
            isOneToOne: false
            referencedRelation: "guild_roles"
            referencedColumns: ["id"]
          },
        ]
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
          discord_nickname: string | null
          discord_username: string
          first_name: string | null
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
          discord_nickname?: string | null
          discord_username: string
          first_name?: string | null
          id: string
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
          discord_nickname?: string | null
          discord_username?: string
          first_name?: string | null
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
      xp_events: {
        Row: {
          discord_message_id: number | null
          granted_at: string
          id: string
          source: string
          user_id: string
          xp: number
        }
        Insert: {
          discord_message_id?: number | null
          granted_at?: string
          id?: string
          source: string
          user_id: string
          xp: number
        }
        Update: {
          discord_message_id?: number | null
          granted_at?: string
          id?: string
          source?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
    }
    Views: {
      v_course_progress: {
        Row: {
          completed_lessons: number | null
          completion_percentage: number | null
          course_id: string | null
          total_lessons: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
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
    }
    Functions: {
      claim_pending_user: {
        Args: { _email: string; _user_id: string }
        Returns: boolean
      }
      create_course:
        | {
            Args: { _description: string; _slug: string; _title: string }
            Returns: number
          }
        | {
            Args: {
              course_description?: string
              course_slug: string
              course_thumbnail_url?: string
              course_title: string
            }
            Returns: string
          }
      create_lesson:
        | { Args: { _module_id: number; _title: string }; Returns: number }
        | {
            Args: {
              lesson_content?: string
              lesson_media_type?: string
              lesson_media_url?: string
              lesson_module_id: string
              lesson_order_index: number
              lesson_published?: boolean
              lesson_slug: string
              lesson_title: string
              lesson_transcript?: string
            }
            Returns: string
          }
      create_module:
        | { Args: { _course_id: number; _title: string }; Returns: number }
        | {
            Args: {
              module_course_id: string
              module_discord_thread_url?: string
              module_order_index?: number
              module_slug: string
              module_title: string
            }
            Returns: string
          }
      create_pending_user: {
        Args: {
          _course_id: string
          _email: string
          _purchase_data: Json
          _stripe_customer_id: string
          _stripe_session_id: string
        }
        Returns: string
      }
      delete_lesson:
        | { Args: { _id: number }; Returns: undefined }
        | { Args: { lesson_id: string }; Returns: undefined }
      delete_module:
        | { Args: { _id: number }; Returns: undefined }
        | { Args: { module_id: string }; Returns: undefined }
      generate_unique_lesson_slug: {
        Args: { base_slug: string; lesson_id?: string }
        Returns: string
      }
      get_homepage_resource_categories: {
        Args: never
        Returns: {
          color_class: string
          course_ids: string[]
          display_order: number
          homepage_limit: number
          icon_name: string
          id: string
          name: string
          slug: string
        }[]
      }
      get_pending_purchases_by_email: {
        Args: { _email: string }
        Returns: {
          amount: number
          course_id: string
          course_name: string
          currency: string
          pending_user_id: string
          purchase_date: string
        }[]
      }
      get_user_purchase_status: {
        Args: { _course_id: string; _user_id: string }
        Returns: {
          amount_paid: number
          currency: string
          has_purchased: boolean
          purchase_date: string
        }[]
      }
      get_user_purchases: {
        Args: { _user_id: string }
        Returns: {
          amount: number
          course_id: string
          course_name: string
          currency: string
          purchase_date: string
          purchase_id: string
          status: string
        }[]
      }
      get_user_xp: { Args: { p_user: string }; Returns: number }
      handle_discord_login:
        | {
            Args: {
              _discord_avatar: string
              _discord_id: string
              _discord_nickname: string
              _discord_username: string
              _roles: string[]
            }
            Returns: string
          }
        | {
            Args: {
              _discord_avatar: string
              _discord_id: string
              _discord_username: string
              _roles: string[]
            }
            Returns: string
          }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_authorized_discord_user: { Args: never; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_lesson_available_to_user:
        | { Args: { p_les: string; p_user: string }; Returns: boolean }
        | { Args: { p_les: string; p_user: string }; Returns: boolean }
      mark_upgrade_as_done: {
        Args: { completion_link?: string; upgrade_id: string }
        Returns: undefined
      }
      process_stripe_webhook: {
        Args: {
          _amount_total: number
          _course_id: string
          _currency: string
          _customer_email: string
          _customer_id: string
          _event_id: string
          _event_type: string
          _session_id: string
          _webhook_data: Json
        }
        Returns: string
      }
      reorder_lessons:
        | {
            Args: { _module_id: number; _ordered_ids: number[] }
            Returns: undefined
          }
        | {
            Args: { lesson_ids: string[]; module_id: string }
            Returns: undefined
          }
      reorder_modules:
        | {
            Args: { _course_id: number; _ordered_ids: number[] }
            Returns: undefined
          }
        | {
            Args: { course_id: string; module_ids: string[] }
            Returns: undefined
          }
      should_sync_discord_roles: { Args: never; Returns: boolean }
      update_lesson:
        | { Args: { _id: number; _title: string }; Returns: undefined }
        | {
            Args: {
              lesson_content?: string
              lesson_id: string
              lesson_media_type?: string
              lesson_media_url?: string
              lesson_module_id?: string
              lesson_order_index?: number
              lesson_published?: boolean
              lesson_slug?: string
              lesson_title?: string
              lesson_transcript?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              lesson_content?: string
              lesson_id: string
              lesson_media_type?: string
              lesson_media_url?: string
              lesson_module_id?: string
              lesson_order_index?: number
              lesson_published?: boolean
              lesson_slug?: string
              lesson_title?: string
              lesson_transcript?: string
            }
            Returns: boolean
          }
      update_module:
        | { Args: { _id: number; _title: string }; Returns: undefined }
        | {
            Args: {
              module_course_id?: string
              module_discord_thread_url?: string
              module_id: string
              module_order_index?: number
              module_slug?: string
              module_title?: string
            }
            Returns: boolean
          }
        | {
            Args: {
              module_course_id?: string
              module_discord_thread_url?: string
              module_id: string
              module_order_index?: number
              module_slug?: string
              module_title?: string
            }
            Returns: boolean
          }
      user_has_course_access:
        | { Args: { p_course: string; p_user: string }; Returns: boolean }
        | { Args: { p_course: string; p_user: string }; Returns: boolean }
      user_has_discord_role: {
        Args: { discord_role_id: string; user_id: string }
        Returns: boolean
      }
      user_has_purchase_access: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      validate_discord_role_exists:
        | {
            Args: { role_id: number }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.validate_discord_role_exists(role_id => int8), public.validate_discord_role_exists(role_id => text). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { role_id: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.validate_discord_role_exists(role_id => int8), public.validate_discord_role_exists(role_id => text). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      validate_lesson_exists: { Args: { lesson_id: string }; Returns: boolean }
      validate_lesson_slug_uniqueness: {
        Args: { lesson_id?: string; lesson_slug: string; module_id: string }
        Returns: boolean
      }
    }
    Enums: {
      course_type:
        | "course"
        | "module"
        | "webinar"
        | "protip"
        | "workshop"
        | "extra"
      lesson_kind: "text" | "video" | "audio"
      upgrade_status: "pending" | "done"
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
      course_type: [
        "course",
        "module",
        "webinar",
        "protip",
        "workshop",
        "extra",
      ],
      lesson_kind: ["text", "video", "audio"],
      upgrade_status: ["pending", "done"],
    },
  },
} as const
