
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase/client';
import { AdminContextType, ADMIN_DISCORD_IDS } from '@/types/auth';
import { toast } from 'sonner';

// Create context with default values
const AdminContext = createContext<AdminContextType>({
  isLoading: true,
  courses: 0,
  recentlyUpdated: {
    courses: 0,
    modules: 0,
    lessons: 0,
  },
  refreshData: async () => {},
});

// Custom hook to use admin context
export const useAdmin = () => useContext(AdminContext);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState(0);
  const [recentlyUpdated, setRecentlyUpdated] = useState({
    courses: 0,
    modules: 0,
    lessons: 0,
  });

  // Check if authenticated user is an admin
  const isUserAdmin = user?.is_admin || 
    (user?.user_metadata?.provider_id && 
      ADMIN_DISCORD_IDS.includes(user.user_metadata.provider_id));

  // Fetch admin dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      // Fetch total course count
      const { count: courseCount, error: courseError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true });

      if (courseError) throw courseError;
      setCourses(courseCount || 0);

      // Get recently updated counts (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateString = sevenDaysAgo.toISOString();

      const [courseUpdates, moduleUpdates, lessonUpdates] = await Promise.all([
        supabase.from('courses').select('id', { count: 'exact', head: true })
          .gt('updated_at', dateString),
        supabase.from('modules').select('id', { count: 'exact', head: true })
          .gt('updated_at', dateString),
        supabase.from('lessons').select('id', { count: 'exact', head: true })
          .gt('updated_at', dateString)
      ]);

      setRecentlyUpdated({
        courses: courseUpdates.count || 0,
        modules: moduleUpdates.count || 0,
        lessons: lessonUpdates.count || 0,
      });

    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
      toast.error('Failed to load admin dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data on initial load
  useEffect(() => {
    // Set a timeout to prevent infinite loading state
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        console.log('Forced loading state to complete after timeout');
      }
    }, 5000);

    // Fetch dashboard data
    fetchDashboardData();

    // Clear timeout on cleanup
    return () => clearTimeout(timeoutId);
  }, []);

  // Value to provide to consumers
  const value: AdminContextType = {
    isLoading,
    courses,
    recentlyUpdated,
    refreshData: fetchDashboardData
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
