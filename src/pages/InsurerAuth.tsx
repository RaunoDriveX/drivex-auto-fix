import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InsurerAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (email: string, password: string, insurerName: string, contactPerson: string, phone: string, isSignUp: boolean) => {
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Sign up new insurer user
        const redirectUrl = `${window.location.origin}/insurer-dashboard`;
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
        // After sign up, sign in to obtain an authenticated session (required for RLS)
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          // If email confirmation is enabled, sign-in may fail until verified
          throw new Error('Please verify your email, then sign in to complete setup.');
        }

        // Create insurer profile AFTER authentication so RLS allows INSERT
        const { error: profileError } = await supabase
          .from('insurer_profiles')
          .insert({
            insurer_name: insurerName,
            email: email,
            contact_person: contactPerson,
            phone: phone
          });

        if (profileError) throw profileError;

        toast({
          title: 'Account created!',
          description: 'Your insurer account has been created successfully.',
        });

        navigate('/insurer-dashboard');
      } else {
        // Sign in existing insurer user
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

        toast({
          title: 'Welcome back!',
          description: 'Successfully signed in to your insurer account.',
        });

        navigate('/insurer-dashboard');
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const AuthForm = ({ isSignUp }: { isSignUp: boolean }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [insurerName, setInsurerName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (isSignUp && password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      
      handleAuth(email, password, insurerName, contactPerson, phone, isSignUp);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <>
            <div className="space-y-2">
              <Label htmlFor="insurerName">Insurance Company Name</Label>
              <Input
                id="insurerName"
                type="text"
                value={insurerName}
                onChange={(e) => setInsurerName(e.target.value)}
                required
                placeholder="e.g., Allianz, AXA"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                required
                placeholder="Full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+31 6 12345678"
              />
            </div>
          </>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="insurer@company.com"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder={isSignUp ? "At least 6 characters" : "Enter your password"}
          />
        </div>
        
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Re-enter your password"
            />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            isSignUp ? 'Create Insurer Account' : 'Sign In'
          )}
        </Button>
      </form>
    );
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
              <CardTitle>Insurer Portal</CardTitle>
              <CardDescription>
                Access your claims management dashboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signin">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="signin" className="mt-6">
                  <AuthForm isSignUp={false} />
                </TabsContent>
                
                <TabsContent value="signup" className="mt-6">
                  <AuthForm isSignUp={true} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}