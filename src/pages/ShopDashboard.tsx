import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, MapPin, DollarSign, Clock, Wrench, Plus, Users, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

// Import components for each tab
import ShopLocationSettings from "@/components/shop/ShopLocationSettings";
import ShopAvailabilitySettings from "@/components/shop/ShopAvailabilitySettings";
import ShopPricingSettings from "@/components/shop/ShopPricingSettings";
import ShopServiceSettings from "@/components/shop/ShopServiceSettings";
import ShopJobOffers from "@/components/shop/ShopJobOffers";
import ShopCalendarView from "@/components/shop/ShopCalendarView";
import ShopUpsellSettings from "@/components/shop/ShopUpsellSettings";
import ShopTechnicians from "@/components/shop/ShopTechnicians";
import CallCenterOverview from "@/components/call-center/CallCenterOverview";

const ShopDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("offers");
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

        {/* Main Content with Sidebar Layout */}
        <div className="container mx-auto px-4 py-8">
          {shopData && (
            <div className="flex gap-6 min-h-[600px]">
              {/* Left Vertical Toolbar */}
              <div className="w-64 bg-card border rounded-lg p-4">
                <nav className="space-y-2">
                  <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
                    <TabsList className="grid w-full grid-rows-9 h-auto bg-transparent p-0 gap-1">
                      <TabsTrigger 
                        value="offers" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <DollarSign className="h-4 w-4" />
                        Active Job Offers
                      </TabsTrigger>
                      <TabsTrigger 
                        value="calendar" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Clock className="h-4 w-4" />
                        Calendar
                      </TabsTrigger>
                      <TabsTrigger 
                        value="location" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <MapPin className="h-4 w-4" />
                        Location
                      </TabsTrigger>
                      <TabsTrigger 
                        value="availability" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Clock className="h-4 w-4" />
                        Availability
                      </TabsTrigger>
                      <TabsTrigger 
                        value="pricing" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <DollarSign className="h-4 w-4" />
                        Pricing
                      </TabsTrigger>
                      <TabsTrigger 
                        value="services" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Settings className="h-4 w-4" />
                        Services
                      </TabsTrigger>
                      <TabsTrigger 
                        value="upsells" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Plus className="h-4 w-4" />
                        Upsell Services
                      </TabsTrigger>
                      <TabsTrigger 
                        value="technicians" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Users className="h-4 w-4" />
                        Technicians
                      </TabsTrigger>
                      <TabsTrigger 
                        value="call-center" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Phone className="h-4 w-4" />
                        Call Center
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </nav>
              </div>

              {/* Right Content Area */}
              <div className="flex-1 bg-card border rounded-lg p-6">
                {/* Dynamic content based on active tab */}
                {activeTab === 'offers' && (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-primary/10 p-2 rounded-lg">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold leading-none tracking-tight">Active Job Offers</h2>
                          <p className="text-sm text-muted-foreground">
                            New repair requests requiring your response
                          </p>
                        </div>
                      </div>
                    </div>
                    <ShopJobOffers shopId={shopData.id} shop={shopData} />
                  </div>
                )}

                {activeTab === 'calendar' && (
                  <ShopCalendarView shopId={shopData.id} />
                )}

                {activeTab === 'location' && (
                  <ShopLocationSettings shopData={shopData} onUpdate={fetchShopData} />
                )}

                {activeTab === 'availability' && (
                  <ShopAvailabilitySettings shopId={shopData.id} />
                )}

                {activeTab === 'pricing' && (
                  <ShopPricingSettings shopId={shopData.id} />
                )}

                {activeTab === 'services' && (
                  <ShopServiceSettings shopData={shopData} onUpdate={fetchShopData} />
                )}

                {activeTab === 'upsells' && (
                  <ShopUpsellSettings shopId={shopData.id} />
                )}

                {activeTab === 'technicians' && (
                  <ShopTechnicians shopId={shopData.id} />
                )}

                {activeTab === 'call-center' && (
                  <CallCenterOverview />
                )}
              </div>
            </div>
          )}

          {!shopData && (
            <div className="space-y-6">
              <div className="bg-background">
                <div className="mb-6">
                  <h2 className="text-2xl font-semibold leading-none tracking-tight">Complete Your Shop Profile</h2>
                  <p className="text-sm text-muted-foreground">
                    Set up your shop information to start receiving job offers
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-4">
                    Complete the setup below to activate your shop profile and start managing jobs.
                  </p>
                </div>
              </div>
              
              {/* Setup Vertical Sidebar */}
              <div className="flex gap-6 min-h-[600px]">
                {/* Left Vertical Toolbar */}
                <div className="w-64 bg-card border rounded-lg p-4">
                  <nav className="space-y-2">
                    <Tabs defaultValue="location" orientation="vertical" className="w-full">
                      <TabsList className="grid w-full grid-rows-4 h-auto bg-transparent p-0 gap-1">
                        <TabsTrigger 
                          value="location" 
                          className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <MapPin className="h-4 w-4" />
                          Location
                        </TabsTrigger>
                        <TabsTrigger 
                          value="availability" 
                          className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <Clock className="h-4 w-4" />
                          Availability
                        </TabsTrigger>
                        <TabsTrigger 
                          value="pricing" 
                          className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <DollarSign className="h-4 w-4" />
                          Pricing
                        </TabsTrigger>
                        <TabsTrigger 
                          value="services" 
                          className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <Settings className="h-4 w-4" />
                          Services
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </nav>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 bg-card border rounded-lg p-6">
                  <Tabs defaultValue="location" className="w-full">
                    <TabsContent value="location" className="mt-0">
                      <ShopLocationSettings shopData={null} onUpdate={() => fetchShopData(user?.email!)} />
                    </TabsContent>

                    <TabsContent value="availability" className="mt-0">
                      <ShopAvailabilitySettings shopId={user?.email || 'temp'} />
                    </TabsContent>

                    <TabsContent value="pricing" className="mt-0">
                      <ShopPricingSettings shopId={user?.email || 'temp'} />
                    </TabsContent>

                    <TabsContent value="services" className="mt-0">
                      <ShopServiceSettings shopData={null} onUpdate={() => fetchShopData(user?.email!)} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ShopDashboard;