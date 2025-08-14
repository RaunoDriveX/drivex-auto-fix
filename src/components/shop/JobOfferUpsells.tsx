import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, DollarSign, Clock, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

interface JobOfferUpsell {
  id: string;
  upsell_service_id: string;
  offered_price: number;
  description: string | null;
  upsell_services: UpsellService;
}

interface JobOfferUpsellsProps {
  jobOfferId: string;
  shopId: string;
  onUpsellsChange?: () => void;
}

const JobOfferUpsells = ({ jobOfferId, shopId, onUpsellsChange }: JobOfferUpsellsProps) => {
  const [shopOfferings, setShopOfferings] = useState<ShopUpsellOffering[]>([]);
  const [jobUpsells, setJobUpsells] = useState<JobOfferUpsell[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [jobOfferId, shopId]);

  const fetchData = async () => {
    try {
      // Fetch shop's active upsell offerings
      const { data: offerings, error: offeringsError } = await supabase
        .from('shop_upsell_offerings')
        .select(`
          *,
          upsell_services (*)
        `)
        .eq('shop_id', shopId)
        .eq('is_active', true);

      if (offeringsError) throw offeringsError;

      // Fetch existing upsells for this job offer
      const { data: upsells, error: upsellsError } = await supabase
        .from('job_offer_upsells')
        .select(`
          *,
          upsell_services (*)
        `)
        .eq('job_offer_id', jobOfferId);

      if (upsellsError) throw upsellsError;

      setShopOfferings(offerings || []);
      setJobUpsells(upsells || []);
    } catch (error: any) {
      console.error('Error fetching upsell data:', error);
      toast({
        title: "Error",
        description: "Failed to load upsell data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUpsell = async (formData: { serviceId: string; price: number; description?: string }) => {
    setAdding(true);

    try {
      const { error } = await supabase
        .from('job_offer_upsells')
        .insert({
          job_offer_id: jobOfferId,
          upsell_service_id: formData.serviceId,
          offered_price: formData.price,
          description: formData.description || null
        });

      if (error) throw error;

      await fetchData();
      setDialogOpen(false);
      onUpsellsChange?.();
      
      toast({
        title: "Success",
        description: "Upsell service added to quote"
      });
    } catch (error: any) {
      console.error('Error adding upsell:', error);
      toast({
        title: "Error",
        description: "Failed to add upsell service",
        variant: "destructive"
      });
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveUpsell = async (upsellId: string) => {
    try {
      const { error } = await supabase
        .from('job_offer_upsells')
        .delete()
        .eq('id', upsellId);

      if (error) throw error;

      await fetchData();
      onUpsellsChange?.();
      
      toast({
        title: "Success",
        description: "Upsell service removed from quote"
      });
    } catch (error: any) {
      console.error('Error removing upsell:', error);
      toast({
        title: "Error",
        description: "Failed to remove upsell service",
        variant: "destructive"
      });
    }
  };

  const availableOfferings = shopOfferings.filter(
    offering => !jobUpsells.some(upsell => upsell.upsell_service_id === offering.upsell_service_id)
  );

  const totalUpsellValue = jobUpsells.reduce((sum, upsell) => sum + upsell.offered_price, 0);

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-sm text-muted-foreground">Loading upsells...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">Additional Services</h4>
          <p className="text-sm text-muted-foreground">
            Add upsell services to increase quote value
          </p>
        </div>
        {availableOfferings.length > 0 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Upsell Service</DialogTitle>
                <DialogDescription>
                  Select an additional service to offer to the customer
                </DialogDescription>
              </DialogHeader>
              <AddUpsellForm
                offerings={availableOfferings}
                onSubmit={handleAddUpsell}
                loading={adding}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {jobUpsells.length > 0 ? (
        <div className="space-y-3">
          {jobUpsells.map((upsell) => (
            <div key={upsell.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{upsell.upsell_services.name}</span>
                  <Badge variant="secondary">${upsell.offered_price}</Badge>
                  <Badge variant="outline" className="text-xs flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {upsell.upsell_services.duration_minutes}min
                  </Badge>
                  {upsell.upsell_services.requires_parts && (
                    <Badge variant="outline" className="text-xs flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Parts
                    </Badge>
                  )}
                </div>
                {upsell.description && (
                  <p className="text-sm text-muted-foreground">{upsell.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveUpsell(upsell.id)}
                className="text-destructive hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Separator />
          
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Total Additional Services:</span>
            <span className="text-green-600">+${totalUpsellValue.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-muted-foreground">
          <p>No additional services added</p>
          {availableOfferings.length === 0 && (
            <p className="text-xs mt-1">Configure upsell services in shop settings first</p>
          )}
        </div>
      )}
    </div>
  );
};

interface AddUpsellFormProps {
  offerings: ShopUpsellOffering[];
  onSubmit: (data: { serviceId: string; price: number; description?: string }) => void;
  loading: boolean;
}

const AddUpsellForm = ({ offerings, onSubmit, loading }: AddUpsellFormProps) => {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const selectedOffering = offerings.find(o => o.upsell_service_id === selectedServiceId);
  const service = selectedOffering?.upsell_services;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId || !price) return;

    onSubmit({
      serviceId: selectedServiceId,
      price: parseFloat(price),
      description: description.trim() || undefined
    });
  };

  // Auto-fill price when service is selected
  useEffect(() => {
    if (selectedOffering) {
      if (selectedOffering.custom_price) {
        setPrice(selectedOffering.custom_price.toString());
      } else if (service) {
        // Use middle of typical price range
        const suggestedPrice = (service.typical_price_min + service.typical_price_max) / 2;
        setPrice(suggestedPrice.toFixed(2));
      }
      
      if (selectedOffering.custom_description) {
        setDescription(selectedOffering.custom_description);
      } else if (service) {
        setDescription(service.description || '');
      }
    }
  }, [selectedOffering, service]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="service">Service</Label>
        <Select value={selectedServiceId} onValueChange={setSelectedServiceId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a service" />
          </SelectTrigger>
          <SelectContent>
            {offerings.map((offering) => (
              <SelectItem key={offering.id} value={offering.upsell_service_id}>
                <div className="flex items-center gap-2">
                  <span>{offering.upsell_services.name}</span>
                  <Badge variant="outline" className="text-xs">
                    ${offering.upsell_services.typical_price_min}-${offering.upsell_services.typical_price_max}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {service && (
        <div className="p-3 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">{service.description}</p>
          <div className="flex items-center gap-2 mt-2">
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
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          placeholder="Add specific details for this customer..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={!selectedServiceId || !price || loading}>
          {loading ? "Adding..." : "Add Service"}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default JobOfferUpsells;