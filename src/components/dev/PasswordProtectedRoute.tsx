
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface PasswordProtectedRouteProps {
  children: React.ReactNode;
  requiredPassword: string;
}

export const PasswordProtectedRoute: React.FC<PasswordProtectedRouteProps> = ({
  children,
  requiredPassword
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === requiredPassword) {
      setIsOpen(false);
    } else {
      setError(true);
    }
  };

  if (!isOpen) {
    return <>{children}</>;
  }

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Development Access</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the development password to continue
          </AlertDialogDescription>
        </AlertDialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={error ? "border-red-500" : ""}
            />
            {error && (
              <p className="text-sm text-red-500">
                Incorrect password
              </p>
            )}
          </div>
          <AlertDialogFooter className="mt-4">
            <Button type="submit">
              Continue
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

