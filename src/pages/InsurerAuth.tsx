import { useState } from 'react';
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
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface InsurerProfileData {
  insurerName: string;
  contactPerson: string;
  phone: string;
}

export default function InsurerAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (email: string, password: string, insurerName: string, contactPerson: string, phone: string, isSignUp: boolean) => {
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // Sign up new insurer user
        const redirectUrl = `${window.location.origin}/insurer-dashboard`;
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });

        if (signUpError) {
          // Handle "user already registered" error
          if (signUpError.message?.toLowerCase().includes('already registered') || 
              signUpError.message?.toLowerCase().includes('already exists')) {
            throw new Error("An account with this email already exists. Please use the Sign In tab instead.");
          }
          throw signUpError;
        }

        // Check if email confirmation is required
        if (signUpData.session) {
          // Email confirmation disabled - user is already signed in
          // Create insurer profile immediately
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
          // Email confirmation enabled - user needs to verify email
          toast({
            title: 'Verify your email',
            description: 'Please check your email and click the verification link to complete signup.',
          });
          
          setError('Please check your email for a verification link to complete your registration.');
        }
      } else {
        // Sign in existing insurer user
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Check if insurer profile exists
        const { data: profile, error: profileError } = await supabase
          .from('insurer_profiles')
          .select('id')
          .eq('email', email)
          .single();

        if (profileError || !profile) {
          // No insurer profile - offer to create one
          setAuthenticatedEmail(email);
          setNeedsProfileSetup(true);
          toast({
            title: 'Welcome!',
            description: 'Please complete your insurer profile to continue.',
          });
          return;
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

  const handleCreateInsurerProfile = async (profileData: InsurerProfileData) => {
    if (!authenticatedEmail) return;
    
    setLoading(true);
    setError('');

    try {
      const { error: insertError } = await supabase
        .from('insurer_profiles')
        .insert({
          insurer_name: profileData.insurerName,
          email: authenticatedEmail,
          contact_person: profileData.contactPerson,
          phone: profileData.phone || null,
        });

      if (insertError) throw insertError;

      toast({
        title: 'Insurer profile created!',
        description: 'Welcome to the DriveX network.',
      });

      navigate('/insurer-dashboard');
    } catch (error: any) {
      console.error('Profile creation error:', error);
      setError(error.message || 'Failed to create insurer profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const InsurerProfileForm = () => {
    const [insurerName, setInsurerName] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleCreateInsurerProfile({ insurerName, contactPerson, phone });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">
            Complete your insurer profile to access the dashboard
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="insurerName">Insurance Company Name *</Label>
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
          <Label htmlFor="contactPerson">Contact Person *</Label>
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

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Profile...
            </>
          ) : (
            "Complete Setup"
          )}
        </Button>
      </form>
    );
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
              {needsProfileSetup 
                ? "Complete your insurer profile" 
                : "Sign in to access your claims management dashboard"
              }
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-end mb-2">
                <LanguageSwitcher />
              </div>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                {needsProfileSetup 
                  ? "Complete your insurer profile" 
                  : "Access your claims management dashboard"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {needsProfileSetup ? (
                <InsurerProfileForm />
              ) : (
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
