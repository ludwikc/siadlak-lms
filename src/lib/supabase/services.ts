
import { supabase } from './client';
import type { Course, Module, Lesson, UserProgress, User } from './types';

// Course services
export const courseService = {
  // Get all courses the user has access to
  getAccessibleCourses: async (userId: string) => {
    // Get user's Discord roles
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('discord_role_id')
      .eq('user_id', userId);
    
    if (!userRoles) return { data: [], error: null };
    
    const roleIds = userRoles.map(role => role.discord_role_id);
    
    // Get courses that match user's roles
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        course_roles!inner(discord_role_id)
      `)
      .in('course_roles.discord_role_id', roleIds);
    
    return { data, error };
  },
  
  // Get a specific course by slug
  getCourseBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('slug', slug)
      .single();
    
    return { data, error };
  },
  
  // Admin: Create a new course
  createCourse: async (course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select()
      .single();
    
    return { data, error };
  },
  
  // Admin: Update a course
  updateCourse: async (id: string, updates: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>) => {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
  
  // Admin: Delete a course
  deleteCourse: async (id: string) => {
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};

// Module services
export const moduleService = {
  // Get all modules for a course
  getModulesByCourseId: async (courseId: string) => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    return { data, error };
  },
  
  // Get a specific module by slug
  getModuleBySlug: async (courseSlug: string, moduleSlug: string) => {
    // First get the course ID
    const { data: course } = await courseService.getCourseBySlug(courseSlug);
    
    if (!course) return { data: null, error: new Error('Course not found') };
    
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', course.id)
      .eq('slug', moduleSlug)
      .single();
    
    return { data, error };
  },
  
  // Admin: Create a new module
  createModule: async (module: Omit<Module, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('modules')
      .insert(module)
      .select()
      .single();
    
    return { data, error };
  },
  
  // Admin: Update a module
  updateModule: async (id: string, updates: Partial<Omit<Module, 'id' | 'created_at' | 'updated_at'>>) => {
    const { data, error } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
  
  // Admin: Delete a module
  deleteModule: async (id: string) => {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};

// Lesson services
export const lessonService = {
  // Get all lessons for a module
  getLessonsByModuleId: async (moduleId: string) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });
    
    return { data, error };
  },
  
  // Get a specific lesson by slug
  getLessonBySlug: async (courseSlug: string, moduleSlug: string, lessonSlug: string) => {
    // First get the module
    const { data: module } = await moduleService.getModuleBySlug(courseSlug, moduleSlug);
    
    if (!module) return { data: null, error: new Error('Module not found') };
    
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', module.id)
      .eq('slug', lessonSlug)
      .single();
    
    return { data, error };
  },
  
  // Admin: Create a new lesson
  createLesson: async (lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .single();
    
    return { data, error };
  },
  
  // Admin: Update a lesson
  updateLesson: async (id: string, updates: Partial<Omit<Lesson, 'id' | 'created_at' | 'updated_at'>>) => {
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
  
  // Admin: Delete a lesson
  deleteLesson: async (id: string) => {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};

// User progress services
export const progressService = {
  // Get user's progress for a specific lesson
  getUserLessonProgress: async (userId: string, lessonId: string) => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('lesson_id', lessonId)
      .single();
    
    return { data, error };
  },
  
  // Get user's progress for an entire course
  getUserCourseProgress: async (userId: string, courseId: string) => {
    // Get all modules for the course
    const { data: modules } = await moduleService.getModulesByCourseId(courseId);
    
    if (!modules || modules.length === 0) return { data: [], error: null };
    
    const moduleIds = modules.map(module => module.id);
    
    // Get all lessons for the modules
    const { data: lessons } = await supabase
      .from('lessons')
      .select('*')
      .in('module_id', moduleIds);
    
    if (!lessons || lessons.length === 0) return { data: [], error: null };
    
    const lessonIds = lessons.map(lesson => lesson.id);
    
    // Get user's progress for all lessons
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .in('lesson_id', lessonIds);
    
    return { data, error };
  },
  
  // Update user's progress for a lesson
  updateUserProgress: async (progress: Omit<UserProgress, 'id' | 'created_at' | 'updated_at'>) => {
    // First check if a record already exists
    const { data: existingProgress } = await progressService.getUserLessonProgress(
      progress.user_id,
      progress.lesson_id
    );
    
    if (existingProgress) {
      // Update existing record
      const { data, error } = await supabase
        .from('user_progress')
        .update(progress)
        .eq('id', existingProgress.id)
        .select()
        .single();
      
      return { data, error };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from('user_progress')
        .insert(progress)
        .select()
        .single();
      
      return { data, error };
    }
  }
};

// User and role services
export const userService = {
  // Get user details by ID
  getUserById: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    return { data, error };
  },
  
  // Get user details by Discord ID
  getUserByDiscordId: async (discordId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('discord_id', discordId)
      .single();
    
    return { data, error };
  },
  
  // Create or update user after Discord auth
  upsertUser: async (user: Omit<User, 'id' | 'created_at' | 'updated_at'>) => {
    // Check if user exists
    const { data: existingUser } = await userService.getUserByDiscordId(user.discord_id);
    
    if (existingUser) {
      // Update user
      const { data, error } = await supabase
        .from('users')
        .update({
          discord_username: user.discord_username,
          discord_avatar: user.discord_avatar,
          last_login: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();
      
      return { data, error };
    } else {
      // Create new user
      const { data, error } = await supabase
        .from('users')
        .insert({
          ...user,
          last_login: new Date().toISOString()
        })
        .select()
        .single();
      
      return { data, error };
    }
  },
  
  // Get user's Discord roles
  getUserRoles: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('discord_role_id')
      .eq('user_id', userId);
    
    return { data, error };
  },
  
  // Update user's Discord roles
  upsertUserRoles: async (userId: string, discordRoleIds: string[]) => {
    // First delete all existing roles
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    // Then insert new roles
    const rolesToInsert = discordRoleIds.map(roleId => ({
      user_id: userId,
      discord_role_id: roleId
    }));
    
    const { data, error } = await supabase
      .from('user_roles')
      .insert(rolesToInsert)
      .select();
    
    return { data, error };
  }
};
