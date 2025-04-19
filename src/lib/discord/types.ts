
export interface DiscordUser {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: string;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
}

export interface DiscordGuildMember {
  user: DiscordUser;
  nick: string | null;
  roles: string[];
  joined_at: string;
}
