import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

interface ShopProfileData {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
}

const ShopAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [authenticatedEmail, setAuthenticatedEmail] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (email: string, password: string, isSignUp: boolean) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/shop-dashboard`;
        const { data, error: signUpError } = await supabase.auth.signUp({
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

        if (data.session) {
          // Email confirmation disabled - prompt for shop profile setup
          setAuthenticatedEmail(email);
          setNeedsProfileSetup(true);
          toast({
            title: "Account created!",
            description: "Please complete your shop profile to continue.",
          });
        } else {
          toast({
            title: "Verify your email",
            description: "Please check your email and click the verification link to complete signup.",
          });
          setError("Please check your email for a verification link to complete your registration.");
        }
      } else {
        // Sign in existing shop user
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        // Check if shop profile exists
        const { data: shop, error: shopError } = await supabase
          .from('shops')
          .select('id')
          .eq('email', email)
          .single();

        if (shopError || !shop) {
          // No shop profile - offer to create one
          setAuthenticatedEmail(email);
          setNeedsProfileSetup(true);
          toast({
            title: "Welcome!",
            description: "Please complete your shop profile to continue.",
          });
          return;
        }

        toast({
          title: "Welcome back!",
          description: "Successfully signed in.",
        });

        navigate("/shop-dashboard");
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || "Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShopProfile = async (profileData: ShopProfileData) => {
    if (!authenticatedEmail) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Generate a unique shop ID
      const shopId = `shop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const { error: insertError } = await supabase
        .from('shops')
        .insert({
          id: shopId,
          name: profileData.name,
          address: profileData.address,
          city: profileData.city,
          postal_code: profileData.postalCode,
          email: authenticatedEmail,
          phone: profileData.phone || null,
        });

      if (insertError) throw insertError;

      toast({
        title: "Shop profile created!",
        description: "Welcome to the DriveX network.",
      });

      navigate("/shop-dashboard");
    } catch (error: any) {
      console.error('Profile creation error:', error);
      setError(error.message || "Failed to create shop profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const ShopProfileForm = () => {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [postalCode, setPostalCode] = useState("");
    const [phone, setPhone] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleCreateShopProfile({ name, address, city, postalCode, phone });
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center mb-4">
          <p className="text-sm text-muted-foreground">
            Complete your shop profile to access the dashboard
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="shopName">Shop Name *</Label>
          <Input
            id="shopName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., AutoGlass Express"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="address">Street Address *</Label>
          <Input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            placeholder="123 Main Street"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City *</Label>
            <Input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
              placeholder="Amsterdam"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code *</Label>
            <Input
              id="postalCode"
              type="text"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              required
              placeholder="1234 AB"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+31 20 1234567"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
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
            />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            isSignUp ? "Create Account" : "Sign In"
          )}
        </Button>
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
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-end mb-2">
              <LanguageSwitcher />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wrench className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Shop Portal</CardTitle>
            </div>
            <CardDescription>
              Access your repair shop dashboard
            </CardDescription>
          </CardHeader>
          
          <div className="flex justify-center pb-6">
            <Button variant="ghost" asChild className="gap-2">
              <Link to="/" onClick={() => window.scrollTo(0, 0)}>
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default ShopAuth;
