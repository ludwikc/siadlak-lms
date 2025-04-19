
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-discord-sidebar-bg">
            <AlertTriangle className="h-10 w-10 text-yellow-500" />
          </div>
          <h2 className="mt-6 text-2xl font-bold text-discord-header-text">Something went wrong</h2>
          <p className="mt-2 max-w-md text-discord-secondary-text">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
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
              onClick={() => window.location.href = '/'}
              className="border-discord-sidebar-bg hover:bg-discord-sidebar-bg/50"
            >
              Go to Homepage
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
