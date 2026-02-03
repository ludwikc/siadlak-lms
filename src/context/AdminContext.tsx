
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
  isUserAdmin: false,
});

// Custom hook to use admin context
export const useAdmin = () => useContext(AdminContext);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAdmin: authIsAdmin } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState(0);
  const [recentlyUpdated, setRecentlyUpdated] = useState({
    courses: 0,
    modules: 0,
    lessons: 0,
  });

  // Enhanced debug logging to troubleshoot admin access issues
  useEffect(() => {
    console.log('AdminContext - User Object:', user);
    console.log('AdminContext - Admin IDs:', ADMIN_DISCORD_IDS);
    console.log('AdminContext - User ID matches admin list?', user?.id && ADMIN_DISCORD_IDS.includes(user.id));
    console.log('AdminContext - Auth says isAdmin?', authIsAdmin);
  }, [user, authIsAdmin]);

  // Check if authenticated user is an admin (memoized)
  const isUserAdmin = useMemo(() => {
    // Debug logs for all relevant fields
    console.log('Admin check in AdminContext:', {
      auth_isAdmin: authIsAdmin,
      user_is_admin: user?.is_admin,
      user_metadata_is_admin: user?.user_metadata?.is_admin,
      provider_id: user?.user_metadata?.provider_id,
      discord_id: user?.discord_id,
      user_id: user?.id,
      ADMIN_DISCORD_IDS,
      exactMatch: user?.id === 'ab546fe3-358c-473e-b5a6-cdaf1a623cbf',
      idIsInList: ADMIN_DISCORD_IDS.includes('ab546fe3-358c-473e-b5a6-cdaf1a623cbf')
    });
    
    // First check from AuthContext to prevent double-checking
    if (authIsAdmin) {
      console.log("User is admin based on AuthContext check");
      return true;
    }

    // Special case check for specific user ID
    if (user?.id === 'ab546fe3-358c-473e-b5a6-cdaf1a623cbf') {
      console.log("User is admin based on exact ID match");
      return true;
    }

    // Fallbacks from user object
    return !!(
      user?.is_admin ||
      user?.user_metadata?.is_admin ||
      (user?.user_metadata?.provider_id && 
        ADMIN_DISCORD_IDS.includes(user.user_metadata.provider_id as string)) ||
      (user?.discord_id && ADMIN_DISCORD_IDS.includes(user.discord_id)) ||
      (user?.id && ADMIN_DISCORD_IDS.includes(user.id))
    );
  }, [user, authIsAdmin]);

  console.log('Final isUserAdmin determination:', isUserAdmin); // Debug log

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

  // Fetch data when user becomes admin (or on mount if already admin)
  useEffect(() => {
    if (!isUserAdmin) {
      setIsLoading(false);
      return;
    }

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
  }, [isUserAdmin]);

  // Value to provide to consumers
  const value: AdminContextType = {
    isLoading,
    courses,
    recentlyUpdated,
    refreshData: fetchDashboardData,
    isUserAdmin,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
};
