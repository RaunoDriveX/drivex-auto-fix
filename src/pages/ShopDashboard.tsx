import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, MapPin, DollarSign, Clock, Wrench, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

// Import components for each tab
import ShopLocationSettings from "@/components/shop/ShopLocationSettings";
import ShopAvailabilitySettings from "@/components/shop/ShopAvailabilitySettings";
import ShopPricingSettings from "@/components/shop/ShopPricingSettings";
import ShopServiceSettings from "@/components/shop/ShopServiceSettings";
import ShopJobOffers from "@/components/shop/ShopJobOffers";
import ShopCalendarView from "@/components/shop/ShopCalendarView";

const ShopDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    console.log('ShopDashboard: Initializing auth...');
    
    // Set up auth state listener FIRST to prevent missing events
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('ShopDashboard: Auth state change:', event, !!session);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setShopData(null);
          setLoading(false);
          navigate("/shop-auth");
        } else if (session?.user) {
          setUser(session.user);
          // Defer data fetching to prevent authentication deadlock
          setTimeout(() => {
            fetchShopData(session.user.email!);
          }, 0);
        } else {
          setUser(null);
          setShopData(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    const initializeAuth = async () => {
      try {
        console.log('ShopDashboard: Checking existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          console.log('ShopDashboard: No session found, redirecting to auth');
          navigate("/shop-auth");
          return;
        }
        
        console.log('ShopDashboard: Found existing session for:', session.user.email);
        setUser(session.user);
        await fetchShopData(session.user.email!);
      } catch (error) {
        console.error('ShopDashboard: Error during auth initialization:', error);
        setLoading(false);
        navigate("/shop-auth");
      }
    };

    initializeAuth();
    
    return () => {
      console.log('ShopDashboard: Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, [navigate]);

  const fetchShopData = async (email: string) => {
    console.log('ShopDashboard: Fetching shop data for:', email);
    try {
      const { data: shop, error } = await supabase
        .from('shops')
        .select('*')
        .eq('email', email)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('ShopDashboard: Database error:', error);
        throw error;
      }

      console.log('ShopDashboard: Shop data fetched:', !!shop);
      setShopData(shop);
    } catch (error: any) {
      console.error('ShopDashboard: Error fetching shop data:', error);
      toast({
        title: "Error",
        description: "Failed to load shop data",
        variant: "destructive"
      });
    } finally {
      console.log('ShopDashboard: Setting loading to false');
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
          {shopData && (
            <>
              {/* URGENT JOB OFFERS SECTION - Always visible at top */}
              <div className="mb-8">
                <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-3 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-primary">🚨 Urgent Job Offers</CardTitle>
                        <CardDescription className="text-lg">
                          New repair requests requiring immediate attention
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ShopJobOffers shopId={shopData.id} />
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {!shopData ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Complete Your Shop Profile</CardTitle>
                  <CardDescription>
                    Set up your shop information to start receiving job offers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Complete the setup below to activate your shop profile and start managing jobs.
                  </p>
                </CardContent>
              </Card>
              
              <Tabs defaultValue="location" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
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

                <TabsContent value="location">
                  <ShopLocationSettings shopData={null} onUpdate={() => fetchShopData(user?.email!)} />
                </TabsContent>

                <TabsContent value="availability">
                  <ShopAvailabilitySettings shopId={user?.email || 'temp'} />
                </TabsContent>

                <TabsContent value="pricing">
                  <ShopPricingSettings shopId={user?.email || 'temp'} />
                </TabsContent>

                <TabsContent value="services">
                  <ShopServiceSettings shopData={null} onUpdate={() => fetchShopData(user?.email!)} />
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            /* SHOP MANAGEMENT SECTION - Below job offers */
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Shop Management</CardTitle>
                  <CardDescription>
                    Manage your shop calendar, settings, and business details
                  </CardDescription>
                </CardHeader>
              </Card>

              <Tabs defaultValue="calendar" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="calendar" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Calendar
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

                <TabsContent value="calendar">
                  <ShopCalendarView shopId={shopData.id} />
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
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ShopDashboard;