"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with error tracking services like Sentry here
      // Sentry.captureException(error, { extra: errorInfo });
    }

    this.setState({
      hasError: true,
      error,
      errorInfo
    });
  }

  reset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} reset={this.reset} />;
      }

      return <DefaultErrorFallback error={this.state.error!} reset={this.reset} />;
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-red-900/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold text-red-900 dark:text-red-100">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription className="text-red-700 dark:text-red-300">
            We encountered an unexpected error. This has been logged and our team will look into it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Error Details (Development Only):
              </h4>
              <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto max-h-32">
                {error.message}
                {error.stack && '\n\n' + error.stack}
              </pre>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={reset} 
              className="flex-1"
              variant="default"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => window.location.href = '/'} 
              variant="outline"
              className="flex-1"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>
          
          <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
            If this problem persists, please contact support or try refreshing the page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Simple hook for programmatic error boundaries
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error('Unhandled error:', error, errorInfo);
    
    // In production, you might want to show a toast notification
    // and report the error to an external service
    if (process.env.NODE_ENV === 'production') {
      // Report to error tracking service
    }
  };
}

export { ErrorBoundary };
export default ErrorBoundary;
