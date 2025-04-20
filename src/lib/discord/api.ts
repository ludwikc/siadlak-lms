
import { DISCORD_API_URL, GUILD_ID } from './constants';
import type { DiscordGuild, DiscordGuildMember, DiscordRole } from './types';

// Simple Discord API utilities
export const discordApi = {
  // Check if user is a member of our guild
  async checkGuildMembership(accessToken: string): Promise<DiscordGuildMember | null> {
    try {
      console.log(`Checking guild membership for guild ${GUILD_ID}`);
      
      const response = await fetch(
        `${DISCORD_API_URL}/users/@me/guilds/${GUILD_ID}/member`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log('User is not a member of the guild');
          return null;
        }
        
        throw new Error(`Failed to fetch guild member: ${response.status}`);
      }
      
      const member = await response.json();
      console.log('Guild member data:', member);
      return member;
    } catch (error) {
      console.error('Error checking guild membership:', error);
      throw error;
    }
  },

  // Fetch user guilds (optional, for additional checks)
  async fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
    try {
      const response = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch user guilds: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching user guilds:', error);
      throw error;
    }
  },

  // Fetch guild roles (for admin use)
  async fetchGuildRoles(accessToken: string): Promise<DiscordRole[]> {
    try {
      const response = await fetch(`${DISCORD_API_URL}/guilds/${GUILD_ID}/roles`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch guild roles: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching guild roles:', error);
      throw error;
    }
  }
};
