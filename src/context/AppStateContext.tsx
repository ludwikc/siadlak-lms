
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useProgress } from './ProgressContext';
import { usePreferences } from './PreferencesContext';

type AppStateContextType = {
  isAppReady: boolean;
  isDataLoading: boolean;
  isContentLoading: boolean;
  setContentLoading: (isLoading: boolean) => void;
  hasNetworkConnection: boolean;
};

const AppStateContext = createContext<AppStateContextType>({
  isAppReady: false,
  isDataLoading: true,
  isContentLoading: false,
  setContentLoading: () => {},
  hasNetworkConnection: true,
});

export const useAppState = () => useContext(AppStateContext);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoading: isAuthLoading } = useAuth();
  const { isLoading: isProgressLoading } = useProgress();
  const { isLoading: isPreferencesLoading } = usePreferences();
  
  const [isContentLoading, setContentLoading] = useState(false);
  const [hasNetworkConnection, setHasNetworkConnection] = useState(true);
  
  // Monitor network status
  useEffect(() => {
    const handleConnectionChange = () => {
      setHasNetworkConnection(navigator.onLine);
    };
    
    // Set initial state
    setHasNetworkConnection(navigator.onLine);
    
    // Add event listeners
    window.addEventListener('online', handleConnectionChange);
    window.addEventListener('offline', handleConnectionChange);
    
    return () => {
      window.removeEventListener('online', handleConnectionChange);
      window.removeEventListener('offline', handleConnectionChange);
    };
  }, []);
  
  // Combine all loading states
  const isDataLoading = useMemo(() => {
    return isAuthLoading || isProgressLoading || isPreferencesLoading;
  }, [isAuthLoading, isProgressLoading, isPreferencesLoading]);
  
  // Determine if app is ready (all initial data loaded)
  const isAppReady = useMemo(() => {
    return !isDataLoading;
  }, [isDataLoading]);
  
  const value = {
    isAppReady,
    isDataLoading,
    isContentLoading,
    setContentLoading,
    hasNetworkConnection,
  };
  
  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
};

export default AppStateProvider;
