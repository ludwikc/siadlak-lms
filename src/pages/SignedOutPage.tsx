import React from 'react';
import { useNavigate } from 'react-router-dom';

const SignedOutPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen items-center justify-center bg-discord-bg">
      <div className="max-w-md rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-8 text-center">
        <h1 className="mb-4 text-2xl font-bold text-discord-header-text">Signed Out</h1>
        <p className="mb-6 text-discord-secondary-text">You have been signed out successfully.</p>
        <button
          onClick={() => navigate('/')}
          className="discord-button-secondary w-full"
        >
          Return to Login
        </button>
      </div>
    </div>
  );
};

export default SignedOutPage;
