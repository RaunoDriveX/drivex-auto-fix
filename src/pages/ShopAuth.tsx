import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation(['auth', 'common', 'forms']);

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
          if (signUpError.message?.toLowerCase().includes('already registered') || 
              signUpError.message?.toLowerCase().includes('already exists')) {
            throw new Error("An account with this email already exists. Please use the Sign In tab instead.");
          }
          throw signUpError;
        }

        if (data.session) {
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
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        const { data: shop, error: shopError } = await supabase
          .from('shops')
          .select('id')
          .eq('email', email)
          .single();

        if (shopError || !shop) {
          setAuthenticatedEmail(email);
          setNeedsProfileSetup(true);
          toast({
            title: t('auth:messages.welcome_back'),
            description: "Please complete your shop profile to continue.",
          });
          return;
        }

        toast({
          title: t('auth:messages.welcome_back'),
          description: t('auth:messages.shop_sign_in_success'),
        });

        navigate("/shop-dashboard");
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      setError(error.message || t('auth:messages.invalid_credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateShopProfile = async (profileData: ShopProfileData) => {
    if (!authenticatedEmail) return;
    
    setIsLoading(true);
    setError(null);

    try {
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
          <Label htmlFor="shopName">{t('forms:labels.company_name')} *</Label>
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
          <Label htmlFor="address">{t('forms:labels.address')} *</Label>
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
            <Label htmlFor="city">{t('forms:labels.city')} *</Label>
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
            <Label htmlFor="postalCode">{t('forms:labels.postal_code')} *</Label>
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
          <Label htmlFor="phone">{t('forms:labels.phone')}</Label>
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
              {t('common:status.saving')}
            </>
          ) : (
            t('common:buttons.confirm')
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
          <Label htmlFor="email">{t('auth:fields.email')}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder={t('auth:fields.shop_email_placeholder')}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="password">{t('auth:fields.password')}</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder={t('auth:fields.password_placeholder')}
          />
        </div>
        
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth:fields.password')}</Label>
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
              {isSignUp ? t('auth:actions.signing_up') : t('auth:actions.signing_in')}
            </>
          ) : (
            isSignUp ? t('auth:actions.sign_up') : t('auth:actions.sign_in')
          )}
        </Button>
      </form>
    );
  };

  return (
    <>
      <Helmet>
        <title>{t('auth:shop.title')} - DriveX</title>
        <meta name="description" content={t('auth:shop.subtitle')} />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-end mb-2">
              <LanguageSwitcher />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Wrench className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">{t('auth:shop.title')}</CardTitle>
            </div>
            <CardDescription>
              {t('auth:shop.subtitle')}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {needsProfileSetup ? (
              <ShopProfileForm />
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

        <div className="mt-4 flex justify-center">
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/" onClick={() => window.scrollTo(0, 0)}>
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </>
  );
};

export default ShopAuth;
