
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex h-screen items-center justify-center bg-discord-bg">
      <div className="max-w-md rounded-lg border border-discord-sidebar-bg bg-discord-deep-bg p-8 text-center">
        <h1 className="mb-4 text-4xl font-bold text-discord-header-text">404</h1>
        <p className="mb-6 text-discord-secondary-text">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate('/')}
            className="discord-button-primary"
          >
            Return to Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className="discord-button-secondary"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
