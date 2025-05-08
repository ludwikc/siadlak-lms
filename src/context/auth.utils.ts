
import { ExtendedUser } from '@/types/auth';
import { userService } from '@/lib/supabase/services';
import { toast } from 'sonner';

// List of Discord IDs for admin users
export const ADMIN_DISCORD_IDS = ['404038151565213696', '1040257455592050768', 'ab546fe3-358c-473e-b5a6-cdaf1a623cbf'];

/**
 * Determines if a user is an admin based on provider_id or is_admin flag.
 */
export const isAdminUser = (user: ExtendedUser | null): boolean => {
  if (!user) return false;
  const providerId = user.user_metadata?.provider_id as string | undefined;
  // Check admin status from user object or Discord IDs
  return (
    !!user.is_admin ||
    (providerId && ADMIN_DISCORD_IDS.includes(providerId))
  );
};

/**
 * Fetch extended user data from the API and merge with auth user.
 */
export const fetchUserData = async (
  userId: string,
  basicUser: ExtendedUser | null,
  setUser: React.Dispatch<React.SetStateAction<ExtendedUser | null>>,
  setIsAdmin: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!userId) return;
  try {
    const { data: userData, error: userError } = await userService.getUserById(userId);

    if (userError) {
      console.error('Error fetching user data:', userError);
      return;
    }

    if (userData) {
      const isUserAdmin =
        userData.is_admin ||
        (basicUser?.user_metadata?.provider_id &&
          ADMIN_DISCORD_IDS.includes(basicUser.user_metadata.provider_id as string));
      setUser(prevUser => {
        if (!prevUser) return null;
        const extendedUser: ExtendedUser = {
          ...prevUser,
          is_admin: isUserAdmin,
          discord_username: userData.discord_username,
          discord_avatar: userData.discord_avatar,
        };
        return extendedUser;
      });
      setIsAdmin(isUserAdmin);
    }
  } catch (error) {
    console.error('Error in fetchUserData:', error);
    toast.error('Failed to fetch user details');
  }
};
