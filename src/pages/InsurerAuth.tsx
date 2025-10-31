import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Only allow demo mode in development environment
const DEMO_MODE = import.meta.env.MODE === 'development' && 
                  import.meta.env.VITE_ENABLE_DEMO_MODE === "true";
const DEMO_EMAILS = ["demo.insurer@allstate.com", "demo@insurer.com"];

export default function InsurerAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Check if demo mode is enabled and email is a demo email
      const isDemoLogin = DEMO_MODE && DEMO_EMAILS.includes(email.toLowerCase());

      if (isDemoLogin) {
        // Demo mode bypass - simulate loading
        await new Promise(resolve => setTimeout(resolve, 500));

        // Store demo mode flag in sessionStorage
        sessionStorage.setItem('demoMode', 'true');
        sessionStorage.setItem('demoEmail', email);

        toast({
          title: 'Demo Mode Active',
          description: 'Signed in with demo credentials.',
        });

        navigate('/insurer-dashboard');
      } else {
        // Real authentication mode
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Verify insurer profile exists
        const { data: profile, error: profileError } = await supabase
          .from('insurer_profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (profileError || !profile) {
          await supabase.auth.signOut();
          throw new Error("No insurer profile found for this email. Please contact support.");
        }

        // Clear demo mode flags
        sessionStorage.removeItem('demoMode');
        sessionStorage.removeItem('demoEmail');

        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in to your insurer account.',
        });

        navigate('/insurer-dashboard');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Insurer Login - DriveX</title>
        <meta name="description" content="Secure login for insurance companies to access DriveX claims management system." />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-background to-muted/50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <Link 
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold">Insurer Portal</h1>
            <p className="text-muted-foreground mt-2">
              Sign in to access your claims management dashboard
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your insurer credentials to access the DriveX platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="insurer@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing In...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Demo Credentials - Only show if demo mode is enabled */}
              {DEMO_MODE && (
                <div className="mt-6 p-3 bg-muted/50 rounded-lg border">
                  <h4 className="text-sm font-medium text-foreground mb-2">Demo Credentials (Testing Mode)</h4>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p><strong>Email:</strong> demo.insurer@allstate.com</p>
                    <p><strong>Password:</strong> Any password works</p>
                    <p className="text-amber-600 font-medium mt-2">⚠️ Demo mode is currently enabled</p>
                  </div>
                </div>
              )}

              <div className="mt-4 text-center text-sm text-muted-foreground">
                <p>Need access? Contact your DriveX administrator.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}