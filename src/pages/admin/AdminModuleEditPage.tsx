
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const AdminModuleEditPage: React.FC = () => {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();
  const isEditing = !!moduleId;

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/admin/courses/${courseId}`)}
          className="rounded-md p-2 text-discord-secondary-text hover:bg-discord-sidebar-bg hover:text-discord-header-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-discord-header-text">
          {isEditing ? 'Edit Module' : 'Create New Module'}
        </h1>
      </header>

      <div className="rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-8 text-center">
        <p className="text-discord-secondary-text">
          This page is under construction. Module management will be implemented soon.
        </p>
      </div>
    </div>
  );
};

export default AdminModuleEditPage;
