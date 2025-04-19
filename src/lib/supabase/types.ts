
// Supabase database types

export type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail_url: string;
  created_at: string;
  updated_at: string;
};

export type Module = {
  id: string;
  course_id: string;
  title: string;
  slug: string;
  order_index: number;
  discord_thread_url: string;
  created_at: string;
  updated_at: string;
};

export type Lesson = {
  id: string;
  module_id: string;
  title: string;
  slug: string;
  content: string;
  media_type: 'video' | 'audio' | 'text';
  media_url: string;
  transcript?: string;
  order_index: number;
  created_at: string;
  updated_at: string;
};

export type User = {
  id: string;
  discord_id: string;
  discord_username: string;
  discord_avatar: string;
  is_admin: boolean;
  settings: Record<string, any>;
  last_login: string;
  created_at: string;
  updated_at: string;
};

export type UserRole = {
  id: string;
  user_id: string;
  discord_role_id: string;
  created_at: string;
};

export type CourseRole = {
  id: string;
  course_id: string;
  discord_role_id: string;
  created_at: string;
};

export type UserProgress = {
  id: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  last_position: number;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: Course;
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>;
      };
      modules: {
        Row: Module;
        Insert: Omit<Module, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Module, 'id' | 'created_at' | 'updated_at'>>;
      };
      lessons: {
        Row: Lesson;
        Insert: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Lesson, 'id' | 'created_at' | 'updated_at'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      user_roles: {
        Row: UserRole;
        Insert: Omit<UserRole, 'id' | 'created_at'>;
        Update: Partial<Omit<UserRole, 'id' | 'created_at'>>;
      };
      course_roles: {
        Row: CourseRole;
        Insert: Omit<CourseRole, 'id' | 'created_at'>;
        Update: Partial<Omit<CourseRole, 'id' | 'created_at'>>;
      };
      user_progress: {
        Row: UserProgress;
        Insert: Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
};
