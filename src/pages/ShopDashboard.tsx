import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, MapPin, DollarSign, Clock, Wrench, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import type { User } from "@supabase/supabase-js";

// Import components for each tab
import ShopLocationSettings from "@/components/shop/ShopLocationSettings";
import ShopAvailabilitySettings from "@/components/shop/ShopAvailabilitySettings";
import ShopPricingSettings from "@/components/shop/ShopPricingSettings";
import ShopServiceSettings from "@/components/shop/ShopServiceSettings";
import ShopJobOffers from "@/components/shop/ShopJobOffers";
import ShopCalendarView from "@/components/shop/ShopCalendarView";
import { ShopSidebar } from "@/components/ShopSidebar";

const ShopDashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("location");
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
      // Switch to calendar view when shop is set up
      if (shop && activeSection === "location") {
        setActiveSection("calendar");
      }
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

  const renderActiveSection = () => {
    switch (activeSection) {
      case "calendar":
        return shopData ? <ShopCalendarView shopId={shopData.id} /> : null;
      case "location":
        return <ShopLocationSettings shopData={shopData} onUpdate={() => fetchShopData(user?.email!)} />;
      case "availability":
        return <ShopAvailabilitySettings shopId={shopData?.id || user?.email || 'temp'} />;
      case "pricing":
        return <ShopPricingSettings shopId={shopData?.id || user?.email || 'temp'} />;
      case "services":
        return <ShopServiceSettings shopData={shopData} onUpdate={() => fetchShopData(user?.email!)} />;
      default:
        return null;
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
    <SidebarProvider>
      <Helmet>
        <title>Shop Dashboard - DriveX</title>
        <meta name="description" content="Manage your repair shop settings, availability, pricing, and job offers." />
      </Helmet>
      
      <div className="min-h-screen bg-background flex w-full">
        {/* Header */}
        <header className="bg-card border-b fixed top-0 left-0 right-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="mr-2" />
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

        {/* Sidebar */}
        <ShopSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection}
          shopData={shopData}
        />

        {/* Main Content */}
        <main className="flex-1 pt-24 p-8 overflow-auto">
          {shopData && (
            <>
              {/* ACTIVE JOB OFFERS SECTION - Always visible at top */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Active Job Offers</h2>
                    <p className="text-muted-foreground">
                      New repair requests requiring your response
                    </p>
                  </div>
                </div>
                <ShopJobOffers shopId={shopData.id} />
              </div>
            </>
          )}

          {!shopData ? (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Complete Your Shop Profile</h2>
                <p className="text-muted-foreground">
                  Set up your shop information to start receiving job offers
                </p>
              </div>
              
              <div className="space-y-6">
                {renderActiveSection()}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Shop Management</h2>
                <p className="text-muted-foreground">
                  Manage your shop calendar, settings, and business details
                </p>
              </div>

              <div className="space-y-6">
                {renderActiveSection()}
              </div>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default ShopDashboard;