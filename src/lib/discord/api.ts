
import { DISCORD_API_URL, GUILD_ID } from './constants';
import type { DiscordGuild, DiscordGuildMember, DiscordRole } from './types';

export const discordApi = {
  async fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
    const response = await fetch(`${DISCORD_API_URL}/users/@me/guilds`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user guilds');
    }
    
    return response.json();
  },

  async fetchGuildMember(accessToken: string): Promise<DiscordGuildMember | null> {
    const response = await fetch(
      `${DISCORD_API_URL}/users/@me/guilds/${GUILD_ID}/member`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error('Failed to fetch guild member');
    }
    
    return response.json();
  },

  async fetchGuildRoles(accessToken: string): Promise<DiscordRole[]> {
    const response = await fetch(`${DISCORD_API_URL}/guilds/${GUILD_ID}/roles`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch guild roles');
    }
    
    return response.json();
  }
};
