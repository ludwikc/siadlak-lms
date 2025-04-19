
import React from 'react';
import { Link } from 'react-router-dom';
import { Shield } from 'lucide-react';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-discord-bg p-4 text-center">
      <div className="max-w-md">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full bg-discord-brand p-4">
            <Shield className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h1 className="mb-4 text-3xl font-bold text-discord-header-text">
          Access Denied
        </h1>
        
        <p className="mb-8 text-discord-secondary-text">
          You don't have permission to access this area. This section is restricted to administrators only.
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            to="/courses"
            className="rounded-md bg-discord-brand px-6 py-3 text-white transition-opacity hover:opacity-90"
          >
            Back to Courses
          </Link>
          
          <Link
            to="/"
            className="rounded-md border border-discord-deep-bg bg-discord-sidebar-bg px-6 py-3 text-discord-header-text transition-colors hover:bg-discord-deep-bg"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;
