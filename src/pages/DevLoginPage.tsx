
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { DEV_CREDENTIALS } from '@/config/dev-auth.config';

// DEV-ONLY COMPONENT - WILL NOT BE INCLUDED IN PRODUCTION BUILDS
const DevLoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check credentials against our hard-coded list
    if (DEV_CREDENTIALS[username] && DEV_CREDENTIALS[username] === password) {
      // Create the user object to store in localStorage
      const devUser = {
        id: username,
        email: `${username}@dev.local`,
        discord_id: username,
        discord_username: username,
        discord_avatar: '',
        is_admin: username === 'ludwikc' || username === 'admin',
        user_metadata: {
          discord_id: username,
          discord_username: username,
          discord_avatar: '',
          provider_id: username,
          is_admin: username === 'ludwikc' || username === 'admin'
        }
      };

      // Store auth data in localStorage (matching the format used in AuthContext)
      localStorage.setItem("siadlak_auth_token", `dev-token-${username}`);
      localStorage.setItem("siadlak_auth_user", JSON.stringify(devUser));
      
      toast.success(`Logged in as ${username} (Development mode)`);
      
      // Redirect to courses page
      navigate('/courses');
    } else {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-discord-bg">
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-discord-header-text">
              Development Login
            </h1>
            <p className="mt-2 text-discord-secondary-text">
              This login is for development purposes only.
            </p>
          </div>
          
          <div className="bg-discord-deep-bg p-8 rounded-lg shadow-lg">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-3 rounded mb-4">
                {error}
              </div>
            )}
            
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-discord-header-text mb-1">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="w-full px-3 py-2 border bg-discord-sidebar-bg border-discord-sidebar-border rounded-md text-discord-text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-discord-header-text mb-1">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-3 py-2 border bg-discord-sidebar-bg border-discord-sidebar-border rounded-md text-discord-text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              
              <button
                type="submit"
                className="discord-button-primary w-full"
              >
                Sign in (Dev mode)
              </button>
            </form>
            
            <div className="mt-4 text-sm text-center text-discord-secondary-text">
              <p>Available accounts:</p>
              <ul className="mt-2">
                {Object.keys(DEV_CREDENTIALS).map((user) => (
                  <li key={user} className="font-mono">
                    {user} ({user === 'ludwikc' || user === 'admin' ? 'admin' : 'user'})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <div className="py-4 bg-discord-deep-bg text-center text-discord-secondary-text text-xs">
        <p className="font-bold text-red-400">DEVELOPMENT ENVIRONMENT ONLY</p>
        <p>To disable this page, set ENABLE_DEV_LOGIN = false in dev-auth.config.ts</p>
      </div>
    </div>
  );
};

export default DevLoginPage;
