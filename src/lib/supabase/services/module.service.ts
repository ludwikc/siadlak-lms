
import { supabase } from '../client';
import type { Module } from '../types';
import { courseService } from './course.service';

export const moduleService = {
  getModulesByCourseId: async (courseId: string) => {
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });
    
    return { data, error };
  },
  
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
  
  createModule: async (module: Omit<Module, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('modules')
      .insert(module)
      .select()
      .single();
    
    return { data, error };
  },
  
  updateModule: async (id: string, updates: Partial<Omit<Module, 'id' | 'created_at' | 'updated_at'>>) => {
    const { data, error } = await supabase
      .from('modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
  
  deleteModule: async (id: string) => {
    const { error } = await supabase
      .from('modules')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};
