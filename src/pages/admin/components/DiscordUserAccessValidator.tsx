import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { discordApi } from '@/lib/discord/api';
import { userService } from '@/lib/supabase/services';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Search } from 'lucide-react';
import type { DiscordRole } from '@/lib/discord/types';

const getDiscordAccessToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.provider_token ?? null;
};

const DiscordUserAccessValidator: React.FC = () => {
  const queryClient = useQueryClient();
  const [discordIdInput, setDiscordIdInput] = useState('');
  const [searchedId, setSearchedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Guild roles — shared cache with RoleAccessManager
  const { data: guildRoles } = useQuery<DiscordRole[]>({
    queryKey: ['discord-roles'],
    queryFn: async () => {
      const token = await getDiscordAccessToken();
      if (!token) throw new Error('No Discord token');
      return discordApi.fetchGuildRoles(token);
    },
  });

  // User record from the users table
  const { data: foundUser, isLoading: loadingUser } = useQuery({
    queryKey: ['user-lookup', searchedId],
    enabled: !!searchedId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('discord_id', searchedId!)
        .single();

      if (error) {
        // PGRST116 = no rows returned
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    },
  });

  // Stored roles in user_roles for this user
  const { data: storedRoles, isLoading: loadingRoles } = useQuery<{ discord_role_id: string }[]>({
    queryKey: ['user-stored-roles', foundUser?.id],
    enabled: !!foundUser?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('discord_role_id')
        .eq('user_id', foundUser!.id);

      if (error) throw error;
      return data || [];
    },
  });

  const handleSearch = () => {
    const trimmed = discordIdInput.trim();
    if (trimmed) {
      setSearchedId(trimmed);
    }
  };

  const handleRefreshRoles = useCallback(async () => {
    if (!searchedId || !foundUser?.id) return;

    setIsRefreshing(true);
    try {
      const token = await getDiscordAccessToken();
      if (!token) throw new Error('No Discord token available. Please re-authenticate.');

      // Fetch the member's current roles directly from Discord
      const member = await discordApi.fetchGuildMember(token, searchedId);
      if (!member) throw new Error('User not found in the Discord guild.');

      // Overwrite user_roles with the fresh Discord data
      await userService.upsertUserRoles(foundUser.id, member.roles);

      // Refresh the stored-roles query so the UI updates immediately
      await queryClient.invalidateQueries({ queryKey: ['user-stored-roles', foundUser.id] });

      toast.success(`Roles refreshed for ${foundUser.discord_username || searchedId} — ${member.roles.length} role(s) synced.`);
    } catch (error) {
      console.error('Failed to refresh roles:', error);
      toast.error('Failed to refresh roles: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRefreshing(false);
    }
  }, [searchedId, foundUser, queryClient]);

  // Build a quick map: role_id → DiscordRole for name/colour lookup
  const roleMap = new Map<string, DiscordRole>();
  if (guildRoles) {
    guildRoles.forEach(r => roleMap.set(r.id, r));
  }

  return (
    <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
      <CardHeader>
        <CardTitle className="text-discord-header-text">Discord User Access Validator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search input */}
        <div className="flex gap-2">
          <Input
            placeholder="Discord User ID"
            value={discordIdInput}
            onChange={e => setDiscordIdInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="bg-discord-sidebar-bg border-discord-sidebar-bg/50 text-discord-text"
          />
          <Button onClick={handleSearch} className="bg-discord-brand hover:bg-discord-brand-hover text-white">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        {/* Results area */}
        {searchedId && (
          <div className="space-y-3">
            {loadingUser || loadingRoles ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-discord-brand border-t-transparent"></div>
              </div>
            ) : foundUser ? (
              <>
                <div className="rounded-lg bg-discord-sidebar-bg p-4 space-y-2">
                  <p className="text-discord-secondary-text">
                    <span className="font-medium text-discord-header-text">Discord ID:</span> {foundUser.discord_id}
                  </p>
                  <p className="text-discord-secondary-text">
                    <span className="font-medium text-discord-header-text">Username:</span>{' '}
                    {foundUser.discord_username || '—'}
                  </p>
                  <p className="text-discord-secondary-text">
                    <span className="font-medium text-discord-header-text">
                      Roles ({storedRoles?.length ?? 0}):
                    </span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {storedRoles && storedRoles.length > 0 ? (
                      storedRoles.map(r => {
                        const role = roleMap.get(r.discord_role_id);
                        return (
                          <span
                            key={r.discord_role_id}
                            className="inline-flex items-center gap-1.5 rounded-md bg-discord-deep-bg px-2.5 py-1 text-sm text-discord-secondary-text"
                          >
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full"
                              style={{
                                backgroundColor: role
                                  ? `#${role.color.toString(16).padStart(6, '0')}`
                                  : '#4f545c',
                              }}
                            />
                            {role?.name ?? r.discord_role_id}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-discord-secondary-text italic">No roles stored</span>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleRefreshRoles}
                  disabled={isRefreshing}
                  className="w-full bg-discord-brand hover:bg-discord-brand-hover text-white"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing…' : 'Refresh Discord Roles'}
                </Button>
              </>
            ) : (
              <p className="text-discord-secondary-text italic">
                No user with this Discord ID found in the system.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscordUserAccessValidator;
