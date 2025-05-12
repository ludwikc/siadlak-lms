
import React from 'react';
import { Button } from '@/components/ui/button';
import { seedService } from '@/lib/supabase/services';
import { useAuth } from '@/context/AuthContext';
import { useAdmin } from '@/context/AdminContext';
import { ADMIN_DISCORD_IDS } from '@/types/auth';
import { toast } from 'sonner';

const ComprehensiveTestCourseButton = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { user, isAdmin: authIsAdmin } = useAuth();
  const { isUserAdmin } = useAdmin();

  // Use a comprehensive admin check similar to other admin components
  const hasAdminAccess = React.useMemo(() => {
    // Get discord ID from various possible locations
    const discordId = user?.discord_id || 
                    user?.user_metadata?.discord_id || 
                    user?.user_metadata?.provider_id || 
                    '';
    
    // Log admin verification for debugging
    console.log("ComprehensiveTestCourseButton admin check:", {
      userId: user?.id,
      authIsAdmin,
      isUserAdmin,
      discordId,
      userIsAdmin: user?.is_admin,
      exactIdMatch: user?.id === 'ab546fe3-358c-473e-b5a6-cdaf1a623cbf',
      ADMIN_DISCORD_IDS
    });
    
    // Check admin status from all possible sources
    return authIsAdmin || 
          isUserAdmin || 
          !!user?.is_admin || 
          !!user?.user_metadata?.is_admin ||
          (discordId && ADMIN_DISCORD_IDS.includes(discordId)) ||
          (user?.id && ADMIN_DISCORD_IDS.includes(user.id));
  }, [user, authIsAdmin, isUserAdmin]);

  const handleCreateTestCourse = async () => {
    try {
      setIsLoading(true);
      
      // Add more logging
      console.log("Starting comprehensive test course creation with user:", {
        userId: user?.id, 
        isAdmin: hasAdminAccess,
        metadata: user?.user_metadata
      });
      
      const { data, error } = await seedService.createComprehensiveTestCourse();
      
      if (error) {
        console.error('Error creating comprehensive test course:', error);
        toast.error(`Failed to create test course: ${error.message || JSON.stringify(error)}`);
        return;
      }
      
      toast.success('Comprehensive test course created successfully!');
      console.log('Created comprehensive test course:', data);
      
      // Navigate to the new course after a short delay
      setTimeout(() => {
        window.location.href = `/admin/courses/${data.id}`;
      }, 1500);
      
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error(`An unexpected error occurred: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Only show this button to admin users
  if (!hasAdminAccess) return null;

  return (
    <Button 
      onClick={handleCreateTestCourse} 
      disabled={isLoading}
      variant="outline"
      className="bg-discord-deep-bg border-discord-sidebar-bg text-discord-header-text hover:bg-discord-sidebar-bg"
    >
      {isLoading ? 'Creating...' : 'Create Comprehensive Test Course'}
    </Button>
  );
};

export default ComprehensiveTestCourseButton;
