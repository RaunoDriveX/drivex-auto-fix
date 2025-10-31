import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const DEMO_MODE = import.meta.env.VITE_ENABLE_DEMO_MODE === "true";
const DEMO_EMAILS = ["demo.shop@autofix.com", "demo@shop.com"];

const ShopAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (email: string, password: string, isSignUp: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if demo mode is enabled and email is a demo email
      const isDemoLogin = DEMO_MODE && DEMO_EMAILS.includes(email.toLowerCase());

      if (isDemoLogin) {
        // Demo mode bypass - simulate loading
        await new Promise(resolve => setTimeout(resolve, 500));

        // Store demo mode flag in sessionStorage
        sessionStorage.setItem('demoMode', 'true');
        sessionStorage.setItem('demoEmail', email);

        if (isSignUp) {
          toast({
            title: "Demo Account",
            description: "Demo mode enabled - no account created."
          });
        } else {
          toast({
            title: "Demo Mode Active",
            description: "Signed in with demo credentials."
          });
          navigate("/shop-dashboard");
        }
      } else {
        // Real authentication mode
        if (isSignUp) {
          // Sign up new shop user
          const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
          });

          if (signUpError) throw signUpError;

          toast({
            title: "Account created",
            description: "Please check your email to verify your account.",
          });
        } else {
          // Sign in existing shop user
          const { data, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (signInError) throw signInError;

          // Verify shop exists in database
          const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('id')
            .eq('email', email)
            .single();

          if (shopError || !shop) {
            await supabase.auth.signOut();
            throw new Error("No shop profile found for this email. Please contact support.");
          }

          // Clear demo mode flags
          sessionStorage.removeItem('demoMode');
          sessionStorage.removeItem('demoEmail');

          toast({
            title: "Welcome back!",
            description: "Successfully signed in.",
          });

          navigate("/shop-dashboard");
        }
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const AuthForm = ({ isSignUp }: { isSignUp: boolean }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (isSignUp && password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      
      handleAuth(email, password, isSignUp);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="your-shop@email.com"
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
            />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
                <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Processing..." : isSignUp ? "Create Account" : "Sign In"}
        </Button>

        {/* Demo Credentials - Only show if demo mode is enabled */}
        {!isSignUp && DEMO_MODE && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            <h4 className="text-sm font-medium text-foreground mb-2">Demo Credentials (Testing Mode)</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><strong>Email:</strong> demo.shop@autofix.com</p>
              <p><strong>Password:</strong> Any password works</p>
              <p className="text-amber-600 font-medium mt-2">⚠️ Demo mode is currently enabled</p>
            </div>
          </div>
        )}
      </form>
    );
  };

  return (
    <>
      <Helmet>
        <title>Shop Portal - DriveX</title>
        <meta name="description" content="Sign in to your repair shop portal to manage jobs, pricing, and availability." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Card>
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Wrench className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Shop Portal</CardTitle>
              </div>
              <CardDescription>
                Access your repair shop dashboard
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
          
          <div className="flex justify-center">
            <Button variant="ghost" asChild className="gap-2">
              <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShopAuth;