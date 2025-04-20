
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorDisplayProps {
  title: string;
  message: string;
  severity?: "warning" | "error";
  retryLabel?: string;
  onRetry?: () => void;
  actionLabel?: string;
  onAction?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  title,
  message,
  retryLabel,
  onRetry,
  actionLabel,
  onAction
}) => (
  <Card>
    <CardContent>
      <div className="py-8 text-center">
        <div className="mx-auto w-12 h-12 flex items-center justify-center rounded-full bg-red-100 mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-destructive mb-2">{title}</h3>
        <p className="text-sm text-discord-secondary-text mb-4">{message}</p>
        <div className="flex justify-center space-x-3">
          {retryLabel && onRetry && (
            <Button 
              variant="outline" 
              onClick={onRetry} 
              className="inline-flex items-center gap-2"
              disabled={retryLabel.includes("Refreshing")}
            >
              {retryLabel.includes("Refreshing") ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {retryLabel}
            </Button>
          )}
          {actionLabel && onAction && (
            <Button variant="destructive" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default ErrorDisplay;
