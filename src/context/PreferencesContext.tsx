
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { preferencesService, UserPreferences, defaultPreferences } from '@/lib/supabase/services/preferences.service';
import { toast } from 'sonner';

interface PreferencesContextType {
  isLoading: boolean;
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => Promise<void>;
  toggleSidebar: () => Promise<void>;
  setVideoSpeed: (speed: number) => Promise<void>;
  toggleModuleCollapse: (moduleId: string) => Promise<void>;
}

// Create context with default values
const PreferencesContext = createContext<PreferencesContextType>({
  isLoading: true,
  preferences: defaultPreferences,
  updatePreference: async () => {},
  toggleSidebar: async () => {},
  setVideoSpeed: async () => {},
  toggleModuleCollapse: async () => {},
});

// Custom hook to use preferences context
export const usePreferences = () => useContext(PreferencesContext);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Fetch user preferences
  const fetchUserPreferences = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { data: userPreferences, error } = await preferencesService.getUserPreferences(user.id);
      
      if (error) throw error;
      
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      // If there's an error, we just use the defaults
      setPreferences(defaultPreferences);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Update a specific preference
  const updatePreference = async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    if (!user || isUpdating) return;
    
    try {
      setIsUpdating(true);
      
      // Update local state immediately for better UX
      setPreferences(prev => ({
        ...prev,
        [key]: value
      }));
      
      // Update in database
      await preferencesService.updateUserPreferences(user.id, { [key]: value });
    } catch (error) {
      console.error(`Error updating ${String(key)} preference:`, error);
      // Revert local state on error
      fetchUserPreferences();
    } finally {
      setIsUpdating(false);
    }
  };
  
  // Toggle sidebar expanded state
  const toggleSidebar = async () => {
    await updatePreference('sidebarExpanded', !preferences.sidebarExpanded);
  };
  
  // Toggle module collapse state
  const toggleModuleCollapse = async (moduleId: string) => {
    const collapsedModules = preferences.collapsedModules || [];
    const newCollapsedModules = collapsedModules.includes(moduleId)
      ? collapsedModules.filter(id => id !== moduleId)
      : [...collapsedModules, moduleId];
    
    await updatePreference('collapsedModules', newCollapsedModules);
  };
  
  // Set video playback speed
  const setVideoSpeed = async (speed: number) => {
    await updatePreference('videoPlaybackSpeed', speed);
    toast.success(`Playback speed set to ${speed}x`);
  };
  
  // Initial load
  useEffect(() => {
    if (user) {
      fetchUserPreferences();
    } else {
      setIsLoading(false);
      setPreferences(defaultPreferences);
    }
    
    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        console.log('Forced preferences loading state to complete after timeout');
      }
    }, 3000);
    
    return () => clearTimeout(timeoutId);
  }, [user]);
  
  // Value to provide to consumers
  const value: PreferencesContextType = {
    isLoading,
    preferences,
    updatePreference,
    toggleSidebar,
    toggleModuleCollapse,
    setVideoSpeed,
  };
  
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};
