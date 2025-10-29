import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wrench } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ShopAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (email: string, password: string, isSignUp: boolean) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate loading for demo purposes
    setTimeout(() => {
      if (isSignUp) {
        toast({
          title: "Account created",
          description: "Demo account created successfully."
        });
      } else {
        // Skip auth and go directly to dashboard for demo
        navigate("/shop-dashboard");
      }
      setIsLoading(false);
    }, 500);
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

        {/* Demo Credentials */}
        {!isSignUp && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg border">
            <h4 className="text-sm font-medium text-foreground mb-2">Demo Credentials</h4>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p><strong>Email:</strong> demo.shop@autofix.com</p>
              <p><strong>Password:</strong> password123</p>
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
        <Card className="w-full max-w-md">
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
      </div>
    </>
  );
};

export default ShopAuth;