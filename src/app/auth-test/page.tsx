"use client";

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

export default function AuthTestPage() {
  const { user, loading, error, signOut, clearError } = useAuth();

  const getStatusIcon = () => {
    if (loading) return <Clock className="h-5 w-5 text-yellow-500" />;
    if (error) return <AlertTriangle className="h-5 w-5 text-red-500" />;
    if (user) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <XCircle className="h-5 w-5 text-gray-500" />;
  };

  const getStatusText = () => {
    if (loading) return "Loading...";
    if (error) return "Error";
    if (user) return "Authenticated";
    return "Not Authenticated";
  };

  const getStatusColor = () => {
    if (loading) return "bg-yellow-100 text-yellow-800";
    if (error) return "bg-red-100 text-red-800";
    if (user) return "bg-green-100 text-green-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getStatusIcon()}
              Authentication Status
            </CardTitle>
            <CardDescription>
              Real-time authentication state monitoring for debugging
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge className={getStatusColor()}>
                {getStatusText()}
              </Badge>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-red-800">Authentication Error</h4>
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearError}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Clear Error
                  </Button>
                </div>
              </div>
            )}

            {user && (
              <div className="space-y-3">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">User Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-green-700">User ID:</span>
                      <span className="font-mono text-green-600">{user.uid}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Email:</span>
                      <span className="text-green-600">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Display Name:</span>
                      <span className="text-green-600">{user.displayName || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Email Verified:</span>
                      <Badge className={user.emailVerified ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                        {user.emailVerified ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={signOut} 
                  variant="outline" 
                  className="w-full"
                >
                  Sign Out (Test)
                </Button>
              </div>
            )}

            {!user && !loading && !error && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-gray-600 mb-4">Not authenticated. Try logging in to test the authentication flow.</p>
                <div className="space-y-2">
                  <Button asChild>
                    <a href="/login">Go to Login Page</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/signup">Go to Signup Page</a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>
              Console logs and technical details for troubleshooting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="p-3 bg-gray-50 rounded font-mono">
                <div>Loading: {loading.toString()}</div>
                <div>Error: {error || 'null'}</div>
                <div>User: {user ? 'Object' : 'null'}</div>
                <div>Timestamp: {new Date().toISOString()}</div>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• Check browser console for detailed authentication logs</p>
                <p>• Authentication state changes are logged automatically</p>
                <p>• Firestore operations run in background and are logged</p>
                <p>• Timeouts and errors are handled gracefully</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected Flow</CardTitle>
            <CardDescription>
              What should happen during successful Google authentication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click Google login button</li>
              <li>Google popup opens (check popup blocker if it doesn't)</li>
              <li>User authenticates in popup</li>
              <li>Popup closes automatically</li>
              <li>Page redirects immediately to /profile</li>
              <li>User profile updates in Firestore (background, check console)</li>
              <li>Authentication state updates in this component</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
