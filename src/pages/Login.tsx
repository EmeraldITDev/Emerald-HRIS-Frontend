import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Eye, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, verifyOtp, isAuthenticated } = useAuth();
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [otp, setOtp] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await login(email, password);
      
      // ===== 2FA DISABLED TEMPORARILY =====
      // if (res.requires2FA && res.tempToken) {
      //   setRequires2FA(true);
      //   setTempToken(res.tempToken);
      //   toast({ title: 'Check your email', description: 'Enter the 6-digit code we sent.' });
      //   return;
      // }
      // ===== END 2FA BLOCK =====

      if (res.success) {
        toast({
          title: "Login Successful",
          description: "Welcome to the HRIS platform!",
        });
      } else {
        setError(res.message || 'Invalid email or password. Please try again.');
      }
  // ===== 2FA DISABLED TEMPORARILY =====
  // const handleVerify = async () => {
  //   if (!tempToken || otp.length !== 6) return;
  //   setIsLoading(true);
  //   try {
  //     const ok = await verifyOtp(tempToken, otp);
  //     if (ok) {
  //       setRequires2FA(false);
  //       setTempToken(null);
  //       setOtp('');
  //       toast({ title: 'Verified', description: 'You are now signed in.' });
  //     } else {
  //       setError('Invalid code. Please try again.');
  //     }
  //   } catch (e) {
  //     setError('Verification failed. Please try again.');
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  // ===== END 2FA BLOCK =====
    } catch (err) {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="w-full max-w-md mx-auto p-6">
        <Card className="w-full">
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
      </div>
      
      {/* ===== 2FA DIALOG DISABLED TEMPORARILY ===== */}
      {/* <Dialog open={requires2FA} onOpenChange={setRequires2FA}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Enter verification code</DialogTitle>
            <DialogDescription>We emailed you a 6-digit code.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                {[0,1,2,3,4,5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button className="w-full mt-4" onClick={handleVerify} disabled={isLoading || otp.length !== 6}>
            Verify
          </Button>
        </DialogContent>
      </Dialog> */}
      {/* ===== END 2FA BLOCK ===== */}
    </div>
  );
};

export default Login;