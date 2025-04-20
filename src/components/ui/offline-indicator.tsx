
import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online! Your connection has been restored.');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline. Some features may be unavailable.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 transform rounded-full bg-discord-deep-bg px-4 py-2 shadow-lg">
      <div className="flex items-center gap-2 text-sm font-medium text-yellow-500">
        <WifiOff className="h-4 w-4" />
        <span>You are offline</span>
      </div>
    </div>
  );
}
