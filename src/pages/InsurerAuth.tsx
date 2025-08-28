
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

export default function InsurerAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Skip all validation and go directly to dashboard for demo
    setTimeout(() => {
      toast({
        title: 'Welcome back!',
        description: 'Successfully signed in to your insurer account.',
      });
      
      navigate('/insurer-dashboard');
      setLoading(false);
    }, 500);
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
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="insurer@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
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

              {/* Demo Credentials */}
              <div className="mt-6 p-3 bg-muted/50 rounded-lg border">
                <h4 className="text-sm font-medium text-foreground mb-2">Demo Credentials</h4>
                <div className="space-y-1 text-xs text-muted-foreground">
                  <p><strong>Email:</strong> demo.insurer@allstate.com</p>
                  <p><strong>Password:</strong> password123</p>
                  <p className="text-green-600 font-medium">Any credentials will work for demo</p>
                </div>
              </div>

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
