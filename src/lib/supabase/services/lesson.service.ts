
import { supabase } from '../client';
import type { Lesson } from '../types';
import { moduleService } from './module.service';

export const lessonService = {
  getLessonsByModuleId: async (moduleId: string) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });
    
    return { data, error };
  },
  
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
  
  createLesson: async (lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .single();
    
    return { data, error };
  },
  
  updateLesson: async (id: string, updates: Partial<Omit<Lesson, 'id' | 'created_at' | 'updated_at'>>) => {
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },
  
  deleteLesson: async (id: string) => {
    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);
    
    return { error };
  }
};
