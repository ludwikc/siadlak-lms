
import { supabase } from '../client';
import { toast } from 'sonner';

// Define preference types
export interface UserPreferences {
  videoPlaybackSpeed: number;
  theme?: 'light' | 'dark';
  sidebarExpanded: boolean;
  lastVisitedCourse?: string;
  lastVisitedModule?: string;
  lastVisitedLesson?: string;
}

// Default preferences
export const defaultPreferences: UserPreferences = {
  videoPlaybackSpeed: 1.0,
  sidebarExpanded: true,
};

export const preferencesService = {
  getUserPreferences: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('settings')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      
      // Merge with defaults in case some preferences are missing
      const userPrefs = data?.settings?.preferences as UserPreferences || {};
      return { data: { ...defaultPreferences, ...userPrefs }, error: null };
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      return { data: defaultPreferences, error };
    }
  },
  
  updateUserPreferences: async (userId: string, preferences: Partial<UserPreferences>) => {
    try {
      // First get current settings
      const { data: userData } = await supabase
        .from('users')
        .select('settings')
        .eq('id', userId)
        .single();
      
      // Create new settings object
      const currentSettings = userData?.settings || {};
      const currentPreferences = currentSettings.preferences || {};
      
      const newSettings = {
        ...currentSettings,
        preferences: {
          ...currentPreferences,
          ...preferences
        }
      };
      
      // Update settings
      const { data, error } = await supabase
        .from('users')
        .update({ settings: newSettings })
        .eq('id', userId)
        .select()
        .single();
      
      if (error) throw error;
      return { data: data.settings.preferences, error: null };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      toast.error('Failed to save your preferences');
      return { data: null, error };
    }
  },
  
  updateLastVisited: async (userId: string, courseId?: string, moduleId?: string, lessonId?: string) => {
    try {
      const preferences: Partial<UserPreferences> = {};
      
      if (courseId) preferences.lastVisitedCourse = courseId;
      if (moduleId) preferences.lastVisitedModule = moduleId;
      if (lessonId) preferences.lastVisitedLesson = lessonId;
      
      // Only update if we have at least one piece of data
      if (Object.keys(preferences).length > 0) {
        return await preferencesService.updateUserPreferences(userId, preferences);
      }
      
      return { data: null, error: null };
    } catch (error) {
      console.error('Error updating last visited:', error);
      return { data: null, error };
    }
  }
};
