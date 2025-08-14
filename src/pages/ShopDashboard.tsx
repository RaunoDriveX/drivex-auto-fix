import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, MapPin, DollarSign, Clock, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

// Import components for each tab
import ShopLocationSettings from "@/components/shop/ShopLocationSettings";
import ShopAvailabilitySettings from "@/components/shop/ShopAvailabilitySettings";
import ShopPricingSettings from "@/components/shop/ShopPricingSettings";
import ShopServiceSettings from "@/components/shop/ShopServiceSettings";
import ShopJobOffers from "@/components/shop/ShopJobOffers";

const ShopDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check authentication and fetch shop data
    const initializeAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/shop-auth");
        return;
      }
      
      setUser(session.user);
      await fetchShopData(session.user.email!);
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          navigate("/shop-auth");
        } else if (session?.user) {
          setUser(session.user);
          await fetchShopData(session.user.email!);
        }
      }
    );

    initializeAuth();
    
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchShopData = async (email: string) => {
    try {
      const { data: shop, error } = await supabase
        .from('shops')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setShopData(shop);
    } catch (error: any) {
      console.error('Error fetching shop data:', error);
      toast({
        title: "Error",
        description: "Failed to load shop data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Shop Dashboard - DriveX</title>
        <meta name="description" content="Manage your repair shop settings, availability, pricing, and job offers." />
      </Helmet>
      
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="bg-card border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Wrench className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Shop Dashboard</h1>
                  <p className="text-muted-foreground">
                    {shopData?.name || user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {shopData?.performance_tier && (
                  <Badge variant="secondary">
                    {shopData.performance_tier} Partner
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          {!shopData ? (
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Shop Profile</CardTitle>
                <CardDescription>
                  Set up your shop information to start receiving job offers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Please contact support to activate your shop profile, or complete the setup in the Location tab.
                </p>
                <Button>Contact Support</Button>
              </CardContent>
            </Card>
          ) : (
            <Tabs defaultValue="jobs" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="jobs" className="flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Job Offers
                </TabsTrigger>
                <TabsTrigger value="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </TabsTrigger>
                <TabsTrigger value="availability" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Availability
                </TabsTrigger>
                <TabsTrigger value="pricing" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Pricing
                </TabsTrigger>
                <TabsTrigger value="services" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Services
                </TabsTrigger>
              </TabsList>

              <TabsContent value="jobs">
                <ShopJobOffers shopId={shopData.id} />
              </TabsContent>

              <TabsContent value="location">
                <ShopLocationSettings shopData={shopData} onUpdate={fetchShopData} />
              </TabsContent>

              <TabsContent value="availability">
                <ShopAvailabilitySettings shopId={shopData.id} />
              </TabsContent>

              <TabsContent value="pricing">
                <ShopPricingSettings shopId={shopData.id} />
              </TabsContent>

              <TabsContent value="services">
                <ShopServiceSettings shopData={shopData} onUpdate={fetchShopData} />
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </>
  );
};

export default ShopDashboard;