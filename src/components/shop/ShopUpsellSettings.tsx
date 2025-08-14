import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Settings, DollarSign, Clock, Package } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface UpsellService {
  id: string;
  name: string;
  description: string;
  category: string;
  typical_price_min: number;
  typical_price_max: number;
  duration_minutes: number;
  requires_parts: boolean;
}

interface ShopUpsellOffering {
  id: string;
  upsell_service_id: string;
  custom_price: number | null;
  custom_description: string | null;
  is_active: boolean;
  upsell_services: UpsellService;
}

interface ShopUpsellSettingsProps {
  shopId: string;
}

const ShopUpsellSettings = ({ shopId }: ShopUpsellSettingsProps) => {
  const [upsellServices, setUpsellServices] = useState<UpsellService[]>([]);
  const [shopOfferings, setShopOfferings] = useState<ShopUpsellOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [shopId]);

  const fetchData = async () => {
    try {
      // Fetch all available upsell services
      const { data: services, error: servicesError } = await supabase
        .from('upsell_services')
        .select('*')
        .order('category, name');

      if (servicesError) throw servicesError;

      // Fetch shop's current offerings
      const { data: offerings, error: offeringsError } = await supabase
        .from('shop_upsell_offerings')
        .select(`
          *,
          upsell_services (*)
        `)
        .eq('shop_id', shopId);

      if (offeringsError) throw offeringsError;

      setUpsellServices(services || []);
      setShopOfferings(offerings || []);
    } catch (error: any) {
      console.error('Error fetching upsell data:', error);
      toast({
        title: "Error",
        description: "Failed to load upsell services",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleOffering = async (serviceId: string, isActive: boolean) => {
    setSaving(serviceId);

    try {
      const existingOffering = shopOfferings.find(o => o.upsell_service_id === serviceId);

      if (existingOffering) {
        // Update existing offering
        const { error } = await supabase
          .from('shop_upsell_offerings')
          .update({ is_active: isActive })
          .eq('id', existingOffering.id);

        if (error) throw error;
      } else if (isActive) {
        // Create new offering
        const { error } = await supabase
          .from('shop_upsell_offerings')
          .insert({
            shop_id: shopId,
            upsell_service_id: serviceId,
            is_active: true
          });

        if (error) throw error;
      }

      await fetchData();
      toast({
        title: "Success",
        description: isActive ? "Upsell service enabled" : "Upsell service disabled"
      });
    } catch (error: any) {
      console.error('Error updating offering:', error);
      toast({
        title: "Error",
        description: "Failed to update upsell service",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const handleUpdatePricing = async (serviceId: string, customPrice: number | null, customDescription: string | null) => {
    setSaving(serviceId);

    try {
      const existingOffering = shopOfferings.find(o => o.upsell_service_id === serviceId);

      if (existingOffering) {
        const { error } = await supabase
          .from('shop_upsell_offerings')
          .update({ 
            custom_price: customPrice,
            custom_description: customDescription
          })
          .eq('id', existingOffering.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('shop_upsell_offerings')
          .insert({
            shop_id: shopId,
            upsell_service_id: serviceId,
            custom_price: customPrice,
            custom_description: customDescription,
            is_active: true
          });

        if (error) throw error;
      }

      await fetchData();
      toast({
        title: "Success",
        description: "Pricing updated successfully"
      });
    } catch (error: any) {
      console.error('Error updating pricing:', error);
      toast({
        title: "Error",
        description: "Failed to update pricing",
        variant: "destructive"
      });
    } finally {
      setSaving(null);
    }
  };

  const getOfferingForService = (serviceId: string) => {
    return shopOfferings.find(o => o.upsell_service_id === serviceId);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'insurance': return '🛡️';
      case 'maintenance': return '🔧';
      case 'enhancement': return '✨';
      case 'replacement': return '🔄';
      case 'technical': return '🔬';
      case 'lighting': return '💡';
      default: return '⚙️';
    }
  };

  const groupedServices = upsellServices.reduce((acc, service) => {
    if (!acc[service.category]) {
      acc[service.category] = [];
    }
    acc[service.category].push(service);
    return acc;
  }, {} as Record<string, UpsellService[]>);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading upsell services...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Upsell Services</h3>
        <p className="text-sm text-muted-foreground">
          Configure additional services you want to offer to customers alongside their primary repair.
        </p>
      </div>

      {Object.entries(groupedServices).map(([category, services]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">{getCategoryIcon(category)}</span>
              {category.charAt(0).toUpperCase() + category.slice(1)} Services
            </CardTitle>
            <CardDescription>
              Configure your offerings for {category} services
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {services.map((service) => {
              const offering = getOfferingForService(service.id);
              const isActive = offering?.is_active || false;

              return (
                <div key={service.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{service.name}</h4>
                        <Badge variant="outline" className="text-xs">
                          ${service.typical_price_min}-${service.typical_price_max}
                        </Badge>
                        <Badge variant="outline" className="text-xs flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {service.duration_minutes}min
                        </Badge>
                        {service.requires_parts && (
                          <Badge variant="outline" className="text-xs flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            Parts required
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                    <Switch
                      checked={isActive}
                      onCheckedChange={(checked) => handleToggleOffering(service.id, checked)}
                      disabled={saving === service.id}
                    />
                  </div>

                  {isActive && (
                    <>
                      <Separator />
                      <UpsellPricingForm
                        service={service}
                        offering={offering}
                        onUpdate={(price, description) => handleUpdatePricing(service.id, price, description)}
                        loading={saving === service.id}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface UpsellPricingFormProps {
  service: UpsellService;
  offering?: ShopUpsellOffering;
  onUpdate: (price: number | null, description: string | null) => void;
  loading: boolean;
}

const UpsellPricingForm = ({ service, offering, onUpdate, loading }: UpsellPricingFormProps) => {
  const [customPrice, setCustomPrice] = useState(offering?.custom_price?.toString() || '');
  const [customDescription, setCustomDescription] = useState(offering?.custom_description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const price = customPrice ? parseFloat(customPrice) : null;
    const description = customDescription.trim() || null;
    onUpdate(price, description);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`price-${service.id}`}>Your Price (optional)</Label>
          <Input
            id={`price-${service.id}`}
            type="number"
            step="0.01"
            min="0"
            placeholder={`${service.typical_price_min}-${service.typical_price_max}`}
            value={customPrice}
            onChange={(e) => setCustomPrice(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use typical pricing range
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`desc-${service.id}`}>Custom Description (optional)</Label>
          <Textarea
            id={`desc-${service.id}`}
            placeholder="Add your specific details..."
            value={customDescription}
            onChange={(e) => setCustomDescription(e.target.value)}
            rows={3}
          />
        </div>
      </div>
      <Button type="submit" disabled={loading} size="sm">
        {loading ? "Saving..." : "Update Pricing"}
      </Button>
    </form>
  );
};

export default ShopUpsellSettings;