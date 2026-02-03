import React, { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { userService } from '@/lib/supabase/services';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RefreshCw, Search, ShieldCheck, AlertCircle } from 'lucide-react';
import type { DiscordRole } from '@/lib/discord/types';

const DiscordUserAccessValidator: React.FC = () => {
  const queryClient = useQueryClient();
  const [discordIdInput, setDiscordIdInput] = useState('');
  const [searchedId, setSearchedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  // Live snapshot fetched directly from Discord via edge function
  const [liveSnapshot, setLiveSnapshot] = useState<{ username: string; roles: string[] } | null>(null);

  // Guild roles from database
  const { data: guildRoles } = useQuery<DiscordRole[]>({
    queryKey: ['discord-roles-db'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('guild_roles')
        .select('id, name, color, position')
        .order('position', { ascending: false });
      
      if (error) throw error;
      return (data || []).map(r => ({
        id: r.id,
        name: r.name,
        color: r.color,
        position: r.position,
        hoist: false,
        managed: false,
        mentionable: false,
        permissions: '0',
      }));
    },
  });

  // User record from the local users table (may legitimately be null)
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
        if (error.code === 'PGRST116') return null; // no rows — expected
        throw error;
      }
      return data;
    },
  });

  // Stored roles — only fetched when the user exists in the local DB
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
      setLiveSnapshot(null); // clear any previous live fetch
      setSearchedId(trimmed);
    }
  };

  const handleRefreshRoles = useCallback(async () => {
    if (!searchedId) return;

    setIsRefreshing(true);
    try {
      // Call the edge function that uses the bot token
      const { data, error } = await supabase.functions.invoke('fetch-discord-member', {
        body: { discordUserId: searchedId },
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch member');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Keep the live snapshot for display
      setLiveSnapshot({ 
        username: data.user?.username ?? '', 
        roles: data.roles || [] 
      });

      console.log('Fetched roles from Discord:', data.roles);
      toast.success(`Fetched ${data.roles?.length || 0} role(s) from Discord for ${searchedId}.`);
    } catch (error) {
      console.error('Failed to refresh roles:', error);
      toast.error('Failed to refresh roles: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRefreshing(false);
    }
  }, [searchedId]);

  // Separate function to sync roles to database (updates access)
  const handleSyncAccessRoles = useCallback(async () => {
    if (!searchedId || !foundUser?.id) return;
    
    const rolesToSync = liveSnapshot?.roles ?? storedRoles?.map(r => r.discord_role_id) ?? [];
    
    if (rolesToSync.length === 0) {
      toast.error('No roles to sync. Please refresh from Discord first.');
      return;
    }

    setIsRefreshing(true);
    try {
      // Use the new syncUserRoles that updates both user_roles table AND users.roles array
      await userService.syncUserRoles(foundUser.id, rolesToSync);
      await queryClient.invalidateQueries({ queryKey: ['user-stored-roles', foundUser.id] });
      toast.success(`Access updated: ${rolesToSync.length} role(s) synced for ${foundUser.discord_username || searchedId}.`);
    } catch (error) {
      console.error('Failed to sync roles:', error);
      toast.error('Failed to sync roles: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsRefreshing(false);
    }
  }, [searchedId, foundUser, liveSnapshot, storedRoles, queryClient]);

  // Build a quick map: role_id → DiscordRole for name/colour lookup
  const roleMap = new Map<string, DiscordRole>();
  if (guildRoles) {
    guildRoles.forEach(r => roleMap.set(r.id, r));
  }

  // The role IDs to render: live snapshot wins after a refresh, otherwise fall back to DB
  const displayRoleIds: string[] =
    liveSnapshot?.roles ??
    storedRoles?.map(r => r.discord_role_id) ??
    [];

  // Username: live snapshot > local DB > nothing
  const displayUsername =
    liveSnapshot?.username || foundUser?.discord_username || null;

  // Check if roles have changed between live snapshot and stored
  const hasRoleChanges = liveSnapshot && storedRoles && (
    liveSnapshot.roles.length !== storedRoles.length ||
    liveSnapshot.roles.some(r => !storedRoles.find(sr => sr.discord_role_id === r))
  );

  return (
    <Card className="bg-discord-deep-bg border-discord-sidebar-bg">
      <CardHeader>
        <CardTitle className="text-discord-header-text">Discord User Access Validator</CardTitle>
        <CardDescription className="text-discord-secondary-text">
          Look up a user's Discord roles and sync their access permissions
        </CardDescription>
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
            {loadingUser || (loadingRoles && !liveSnapshot) ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-discord-brand border-t-transparent"></div>
              </div>
            ) : (
              <>
                <div className="rounded-lg bg-discord-sidebar-bg p-4 space-y-2">
                  <p className="text-discord-secondary-text">
                    <span className="font-medium text-discord-header-text">Discord ID:</span> {searchedId}
                  </p>
                  <p className="text-discord-secondary-text">
                    <span className="font-medium text-discord-header-text">Username:</span>{' '}
                    {displayUsername || '—'}
                  </p>
                  <p className="text-discord-secondary-text">
                    <span className="font-medium text-discord-header-text">Local User Record:</span>{' '}
                    {foundUser ? (
                      <span className="text-green-400">Found</span>
                    ) : (
                      <span className="text-yellow-400">Not found</span>
                    )}
                  </p>

                  {/* Label differentiates "live from Discord" vs "stored in DB" */}
                  <p className="text-discord-secondary-text">
                    <span className="font-medium text-discord-header-text">
                      Roles ({displayRoleIds.length}):
                    </span>
                    {liveSnapshot && (
                      <span className="ml-2 text-xs text-discord-brand">(live from Discord)</span>
                    )}
                    {!liveSnapshot && storedRoles && (
                      <span className="ml-2 text-xs text-discord-secondary-text">(from database)</span>
                    )}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {displayRoleIds.length > 0 ? (
                      displayRoleIds.map(id => {
                        const role = roleMap.get(id);
                        return (
                          <span
                            key={id}
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
                            {role?.name ?? id}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-sm text-discord-secondary-text italic">
                        No roles — click "Fetch from Discord" to retrieve current roles
                      </span>
                    )}
                  </div>
                </div>

                {/* Note when the user has no local DB record */}
                {!foundUser && (
                  <div className="flex items-center gap-2 rounded-md bg-yellow-500/10 border border-yellow-500/20 p-3">
                    <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                    <p className="text-xs text-yellow-200">
                      This Discord ID has no local user record. Roles can be fetched from Discord but access cannot be synced until the user logs in.
                    </p>
                  </div>
                )}

                {/* Show role change notification */}
                {hasRoleChanges && foundUser && (
                  <div className="flex items-center gap-2 rounded-md bg-discord-brand/10 border border-discord-brand/20 p-3">
                    <ShieldCheck className="h-4 w-4 text-discord-brand flex-shrink-0" />
                    <p className="text-xs text-discord-brand">
                      Role changes detected! Click "Sync Access" to update this user's permissions.
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleRefreshRoles}
                    disabled={isRefreshing}
                    variant="outline"
                    className="flex-1 border-discord-sidebar-bg hover:bg-discord-sidebar-bg text-discord-text"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Fetching…' : 'Fetch from Discord'}
                  </Button>
                  
                  {foundUser && (
                    <Button
                      onClick={handleSyncAccessRoles}
                      disabled={isRefreshing || (!liveSnapshot && !storedRoles?.length)}
                      className="flex-1 bg-discord-brand hover:bg-discord-brand-hover text-white"
                    >
                      <ShieldCheck className="h-4 w-4 mr-2" />
                      Sync Access
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DiscordUserAccessValidator;
