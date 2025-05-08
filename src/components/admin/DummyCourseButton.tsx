
import React from 'react';
import { Button } from '@/components/ui/button';
import { seedService } from '@/lib/supabase/services/seed.service';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const DummyCourseButton = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const { isAdmin } = useAuth();

  const handleCreateDummyCourse = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await seedService.createDummyCourse();
      
      if (error) {
        console.error('Error creating dummy course:', error);
        toast.error('Failed to create dummy course');
        return;
      }
      
      toast.success('Dummy course created successfully!');
      console.log('Created dummy course:', data);
      
      // Navigate to the new course after a short delay
      setTimeout(() => {
        window.location.href = `/admin/courses/${data.id}`;
      }, 1500);
      
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Only show this button to admin users
  if (!isAdmin) return null;

  return (
    <Button 
      onClick={handleCreateDummyCourse} 
      disabled={isLoading}
      variant="outline"
      className="bg-discord-deep-bg border-discord-sidebar-bg text-discord-header-text hover:bg-discord-sidebar-bg"
    >
      {isLoading ? 'Creating...' : 'Create Dummy Course'}
    </Button>
  );
};

export default DummyCourseButton;
