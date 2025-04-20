
import React from "react";

type DiscordRole = {
  id: string;
  name: string;
  color: number;
  position: number;
};

interface DiscordRoleListProps {
  roles: DiscordRole[];
}

const DiscordRoleList: React.FC<DiscordRoleListProps> = ({ roles }) => (
  <div className="rounded-lg bg-discord-sidebar-bg p-4 border border-discord-sidebar-bg">
    <h2 className="text-xl font-bold mb-2 text-discord-header-text">Discord Roles</h2>
    <ul className="space-y-1">
      {[...roles]
        .sort((a, b) => b.position - a.position)
        .map((role) => (
        <li
          key={role.id}
          className="flex items-center space-x-2 p-2 rounded bg-discord-deep-bg hover:bg-discord-sidebar-bg transition"
        >
          <span
            className="inline-block rounded-full w-3 h-3 ring-2 ring-discord-header-text"
            style={{
              backgroundColor: `#${role.color.toString(16).padStart(6, "0")}`
            }}
            title={`role color: #${role.color.toString(16)}`}
          />
          <span className="text-discord-secondary-text">{role.name}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default DiscordRoleList;
