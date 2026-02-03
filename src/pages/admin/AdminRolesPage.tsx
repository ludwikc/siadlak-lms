
import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import RoleAccessManager from "./components/RoleAccessManager";
import DiscordUserAccessValidator from "./components/DiscordUserAccessValidator";

const AdminRolesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex items-center gap-4">
        <button
          onClick={() => navigate("/admin")}
          className="rounded-md p-2 text-discord-secondary-text hover:bg-discord-sidebar-bg hover:text-discord-header-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-discord-header-text">
          Discord Role Management
        </h1>
      </header>
      <DiscordUserAccessValidator />
      <RoleAccessManager />
    </div>
  );
};

export default AdminRolesPage;
