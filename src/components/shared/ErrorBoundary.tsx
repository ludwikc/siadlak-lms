
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error("Uncaught error:", error, errorInfo);
    
    // Call optional onError callback
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // Send to monitoring service or log backend errors here
    // e.g., Sentry, LogRocket, etc.
  }
  
  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Show success toast on reset
    toast.success('Error boundary reset successfully');
  }
  
  private handleReload = () => {
    window.location.reload();
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
          
          <h2 className="mt-6 text-2xl font-bold text-discord-header-text">Something went wrong</h2>
          
          <p className="mt-2 max-w-md text-discord-secondary-text">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          
          {this.state.error?.stack && (
            <details className="mt-4 rounded-md border border-discord-sidebar-bg bg-discord-deep-bg p-4 text-left">
              <summary className="cursor-pointer text-sm font-medium text-discord-secondary-text">
                Show error details
              </summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded bg-discord-sidebar-bg p-4 text-xs text-discord-secondary-text">
                {this.state.error.stack}
              </pre>
            </details>
          )}
          
          <div className="mt-6 flex gap-4">
            <Button 
              onClick={this.handleReset}
              className="flex items-center gap-2 bg-discord-brand text-white hover:bg-discord-brand/90"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <Button
              variant="outline"
              onClick={this.handleReload}
              className="border-discord-sidebar-bg hover:bg-discord-sidebar-bg/50"
            >
              Reload Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
