import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      
      if (success) {
        toast({
          title: "Login Successful",
          description: "Welcome to the HRIS platform!",
        });
      } else {
        setError('Invalid email or password. Please try again.');
      }
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const demoUsers = [
    { email: 'james@company.com', role: 'Executive', password: 'password123' },
    { email: 'frank@company.com', role: 'HR Manager', password: 'password123' },
    { email: 'sarah@company.com', role: 'Corporate HR', password: 'password123' },
    { email: 'mike@company.com', role: 'Line Manager', password: 'password123' },
    { email: 'finance@company.com', role: 'Finance Manager', password: 'password123' },
    { email: 'tech@company.com', role: 'IT Admin', password: 'password123' },
    { email: 'poweruser@company.com', role: 'IT Power User', password: 'password123' },
    { email: 'contractor@company.com', role: 'Contract Employee', password: 'password123' },
    { email: 'john@company.com', role: 'General Employee', password: 'password123' }
  ];

  const fillDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-6xl mx-auto p-6 flex gap-8">
        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto lg:mx-0">
          <CardHeader className="space-y-1 text-center">
            <div className="flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-primary mr-2" />
              <h1 className="text-2xl font-bold text-foreground">HRIS Platform</h1>
            </div>
            <CardTitle className="text-xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your HR dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Users Panel */}
        <Card className="flex-1 max-w-2xl">
          <CardHeader>
            <CardTitle>Demo Users</CardTitle>
            <CardDescription>
              Click on any user to auto-fill their credentials for testing different role interfaces
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {demoUsers.map((user, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="justify-start h-auto p-4 text-left"
                  onClick={() => fillDemoCredentials(user.email)}
                  disabled={isLoading}
                >
                  <div>
                    <div className="font-medium">{user.email}</div>
                    <div className="text-sm text-muted-foreground">{user.role}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Password: {user.password}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Role Permissions Preview:</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <div><strong>Executives & HR Managers:</strong> Full access to all features</div>
                <div><strong>Corporate HR:</strong> Employee management, CSV imports, approvals</div>
                <div><strong>Line Managers:</strong> Reports, approvals, reviews, comments</div>
                <div><strong>Finance Manager:</strong> All payroll, financials, and reports</div>
                <div><strong>IT (Power User):</strong> Admin tools, system controls</div>
                <div><strong>Contract Employees:</strong> Own payroll, benefits, leave requests</div>
                <div><strong>General Employees:</strong> Self-service features only</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;