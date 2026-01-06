import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { LogOut, Settings, MapPin, DollarSign, Clock, Wrench, Plus, Users, Phone, XCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { User } from "@supabase/supabase-js";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

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
import ShopDeclinedJobs from "@/components/shop/ShopDeclinedJobs";

interface ShopData {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string;
  city: string;
  performance_tier?: string;
  [key: string]: unknown;
}

const ShopDashboard = () => {
  const { t } = useTranslation('shop');
  const [user, setUser] = useState<User | null>(null);
  const [shopData, setShopData] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("offers");
  const [isDemoMode, setIsDemoMode] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Only allow demo mode in development
        const isDevelopment = import.meta.env.MODE === 'development';
        const demoMode = isDevelopment && sessionStorage.getItem('demoMode') === 'true';
        const demoEmail = sessionStorage.getItem('demoEmail');

        if (demoMode && demoEmail) {
          // Demo mode - only in development
          setIsDemoMode(true);
          const mockUser = { email: demoEmail } as User;
          const mockShopData: ShopData = {
            id: 'demo-shop',
            name: 'AutoFix Demo Shop',
            email: demoEmail,
            phone: '555-0123',
            address: '123 Demo Street',
            city: 'Demo City',
            performance_tier: 'Gold'
          };

          setUser(mockUser);
          setShopData(mockShopData);
          setLoading(false);
        } else {
          // Real auth mode
          setIsDemoMode(false);
          const { data: { session } } = await supabase.auth.getSession();

          if (!session) {
            navigate('/shop-auth');
            return;
          }

          setUser(session.user);

          if (session.user.email) {
            await fetchShopData(session.user.email);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        navigate('/shop-auth');
      }
    };

    checkAuth();

    // Subscribe to auth changes (only for real auth mode)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!sessionStorage.getItem('demoMode')) {
        if (event === 'SIGNED_OUT' || !session) {
          navigate('/shop-auth');
        } else if (session?.user && !user) {
          setUser(session.user);
          if (session.user.email) {
            await fetchShopData(session.user.email);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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

      if (!shop) {
        toast({
          title: t('error', { ns: 'common' }),
          description: t('error_no_profile'),
          variant: "destructive"
        });
        navigate('/shop-auth');
        return;
      }

      setShopData(shop);
    } catch (error: any) {
      console.error('Error fetching shop data:', error);
      toast({
        title: t('error', { ns: 'common' }),
        description: t('error_load_data'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (isDemoMode) {
      // Demo mode - just clear session storage and navigate
      sessionStorage.removeItem('demoMode');
      sessionStorage.removeItem('demoEmail');
      navigate("/shop-auth");
    } else {
      // Real auth - sign out from Supabase
      try {
        await supabase.auth.signOut();
        navigate("/shop-auth");
      } catch (error) {
        console.error('Error signing out:', error);
        toast({
          title: t('error', { ns: 'common' }),
          description: t('error_sign_out'),
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{t('page_title')}</title>
        <meta name="description" content={t('page_description')} />
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
                  <h1 className="text-2xl font-bold">{t('title')}</h1>
                  <p className="text-muted-foreground">
                    {shopData?.name || user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {isDemoMode && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                    🧪 {t('demo_mode')}
                  </Badge>
                )}
                {shopData?.performance_tier && (
                  <Badge variant="secondary">
                    {shopData.performance_tier} {t('partner')}
                  </Badge>
                )}
                <LanguageSwitcher />
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  {t('sign_out')}
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
                    <TabsList className="grid w-full grid-rows-10 h-auto bg-transparent p-0 gap-1">
                      <TabsTrigger 
                        value="offers" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <DollarSign className="h-4 w-4" />
                        {t('tabs.offers')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="declined" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <XCircle className="h-4 w-4" />
                        {t('tabs.declined')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="calendar" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Clock className="h-4 w-4" />
                        {t('tabs.calendar')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="location" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <MapPin className="h-4 w-4" />
                        {t('tabs.location')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="availability" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Clock className="h-4 w-4" />
                        {t('tabs.availability')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="pricing" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <DollarSign className="h-4 w-4" />
                        {t('tabs.pricing')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="services" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Settings className="h-4 w-4" />
                        {t('tabs.services')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="upsells" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Plus className="h-4 w-4" />
                        {t('tabs.upsells')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="technicians" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Users className="h-4 w-4" />
                        {t('tabs.technicians')}
                      </TabsTrigger>
                      <TabsTrigger 
                        value="call-center" 
                        className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        <Phone className="h-4 w-4" />
                        {t('tabs.call_center')}
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
                          <h2 className="text-xl font-semibold leading-none tracking-tight">{t('offers.title')}</h2>
                          <p className="text-sm text-muted-foreground">
                            {t('offers.description')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ShopJobOffers shopId={shopData.id} shop={shopData} />
                  </div>
                )}

                {activeTab === 'declined' && (
                  <div>
                    <div className="mb-6">
                      <div className="flex items-center gap-3">
                        <div className="bg-red-100 p-2 rounded-lg">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold leading-none tracking-tight">{t('declined.title')}</h2>
                          <p className="text-sm text-muted-foreground">
                            {t('declined.description')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <ShopDeclinedJobs shopId={shopData.id} />
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
                  <h2 className="text-2xl font-semibold leading-none tracking-tight">{t('no_profile_title')}</h2>
                  <p className="text-sm text-muted-foreground">
                    {t('no_profile_description')}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-4">
                    {t('no_profile_message')}
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
                          {t('tabs.location')}
                        </TabsTrigger>
                        <TabsTrigger 
                          value="availability" 
                          className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <Clock className="h-4 w-4" />
                          {t('tabs.availability')}
                        </TabsTrigger>
                        <TabsTrigger 
                          value="pricing" 
                          className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <DollarSign className="h-4 w-4" />
                          {t('tabs.pricing')}
                        </TabsTrigger>
                        <TabsTrigger 
                          value="services" 
                          className="w-full justify-start gap-3 p-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                        >
                          <Settings className="h-4 w-4" />
                          {t('tabs.services')}
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