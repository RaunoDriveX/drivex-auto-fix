import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { StarRating } from '@/components/ui/star-rating';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { MapPin, Car, Check, Search, Clock, Award, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { mockAvailableShops } from '@/lib/mockData';

interface Shop {
  id: string;
  name: string;
  address: string;
  city: string;
  postal_code: string;
  rating: number;
  total_reviews: number;
  is_mobile_service: boolean;
  adas_calibration_capability: boolean;
  acceptance_rate?: number;
  response_time_minutes?: number;
  quality_score?: number;
  latitude?: number;
  longitude?: number;
}

interface SelectedShop extends Shop {
  priority_order: number;
  estimated_price?: number;
  distance_km?: number;
}

interface CustomerLocation {
  street?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
}

interface ShopSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  onSuccess: () => void;
  isMockMode?: boolean;
  customerLocation?: CustomerLocation;
}

export function ShopSelectionDialog({
  open,
  onOpenChange,
  appointmentId,
  onSuccess,
  isMockMode = false,
  customerLocation,
}: ShopSelectionDialogProps) {
  const { t } = useTranslation('insurer');
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShops, setSelectedShops] = useState<SelectedShop[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchShops();
      setSelectedShops([]);
    }
  }, [open]);

  const fetchShops = async () => {
    setLoading(true);
    try {
      if (isMockMode) {
        setShops(mockAvailableShops);
      } else {
        const { data, error } = await supabase
          .from('shops')
          .select('id, name, address, city, postal_code, rating, total_reviews, is_mobile_service, adas_calibration_capability, acceptance_rate, response_time_minutes, quality_score')
          .eq('insurance_approved', true)
          .order('rating', { ascending: false });

        if (error) throw error;
        setShops(data || []);
      }
    } catch (error) {
      console.error('Error fetching shops:', error);
      toast.error(t('shop_selection.error_loading', 'Failed to load shops'));
    } finally {
      setLoading(false);
    }
  };

  const handleShopToggle = (shop: Shop) => {
    const isSelected = selectedShops.some(s => s.id === shop.id);
    
    if (isSelected) {
      // Remove shop and reassign priorities
      const remaining = selectedShops
        .filter(s => s.id !== shop.id)
        .sort((a, b) => a.priority_order - b.priority_order)
        .map((s, index) => ({ ...s, priority_order: index + 1 }));
      setSelectedShops(remaining);
    } else if (selectedShops.length < 3) {
      // Add shop with next priority
      const newShop: SelectedShop = {
        ...shop,
        priority_order: selectedShops.length + 1,
        estimated_price: Math.floor(Math.random() * 100) + 250, // Mock price for demo
        distance_km: parseFloat((Math.random() * 10 + 1).toFixed(1)), // Mock distance for demo
      };
      setSelectedShops([...selectedShops, newShop]);
    } else {
      toast.error(t('shop_selection.max_three', 'You can select up to 3 shops'));
    }
  };

  const handleSubmit = async () => {
    if (selectedShops.length < 1) {
      toast.error(t('shop_selection.select_minimum', 'Please select at least 1 shop'));
      return;
    }

    setSubmitting(true);
    try {
      if (isMockMode) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(t('shop_selection.mock_success', 'Mock Mode - Selections saved locally'));
      } else {
        // Insert shop selections
        const insertData = selectedShops.map(shop => ({
          appointment_id: appointmentId,
          shop_id: shop.id,
          priority_order: shop.priority_order,
          estimated_price: shop.estimated_price,
          distance_km: shop.distance_km,
        }));

        const { error: insertError } = await supabase
          .from('insurer_shop_selections')
          .insert(insertData);

        if (insertError) throw insertError;

        // Update appointment workflow stage
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ workflow_stage: 'shop_selection' })
          .eq('id', appointmentId);

        if (updateError) throw updateError;

        // Send email notification to customer
        try {
          await supabase.functions.invoke('send-customer-notification', {
            body: {
              appointmentId,
              notificationType: 'shop_selection',
            },
          });
          console.log('Customer notification sent');
        } catch (notifError) {
          console.error('Failed to send notification (non-blocking):', notifError);
        }

        toast.success(t('shop_selection.success', 'Shops selected and sent to customer'));
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving shop selections:', error);
      toast.error(t('shop_selection.error_saving', 'Failed to save shop selections'));
    } finally {
      setSubmitting(false);
    }
  };

  const filteredShops = shops.filter(shop =>
    shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    shop.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectionNumber = (shopId: string) => {
    const selected = selectedShops.find(s => s.id === shopId);
    return selected?.priority_order;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" />
            {t('shop_selection.title', 'Select Shops for Customer')}
          </DialogTitle>
          <DialogDescription>
            {t('shop_selection.select_description', 'Select 1 to 3 shops for the customer to choose from')}
          </DialogDescription>
          {customerLocation && (customerLocation.city || customerLocation.postal_code) && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-lg">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <span className="text-muted-foreground">{t('shop_selection.customer_location', 'Customer location')}:</span>{' '}
                <span className="font-medium">
                  {customerLocation.postal_code} {customerLocation.city}
                </span>
              </span>
            </div>
          )}
          {isMockMode && (
            <Badge variant="outline" className="w-fit bg-yellow-500/10 text-yellow-700 border-yellow-300">
              Mock Mode
            </Badge>
          )}
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('shop_selection.search_placeholder', 'Search shops...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected count */}
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">
              {t('shop_selection.selected_count', 'Selected: {{count}}/3', { count: selectedShops.length })}
            </p>
            {selectedShops.length >= 1 && (
              <Badge className="bg-green-500">
                <Check className="h-3 w-3 mr-1" />
                {t('shop_selection.ready', 'Ready')}
              </Badge>
            )}
          </div>

          {/* Shop list */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {loading ? (
                [1, 2, 3, 4].map(i => (
                  <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                ))
              ) : filteredShops.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {t('shop_selection.no_results', 'No shops found')}
                </p>
              ) : (
                filteredShops.map(shop => {
                  const selectionNumber = getSelectionNumber(shop.id);
                  const isSelected = !!selectionNumber;

                  return (
                    <div
                      key={shop.id}
                      onClick={() => handleShopToggle(shop)}
                      className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-bold">
                          {selectionNumber}
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          className="mt-1"
                          onCheckedChange={() => handleShopToggle(shop)}
                        />
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold truncate">{shop.name}</h4>
                            {shop.is_mobile_service && (
                              <Badge variant="secondary" className="text-xs">
                                <Car className="h-3 w-3 mr-1" />
                                Mobile
                              </Badge>
                            )}
                            {shop.adas_calibration_capability && (
                              <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-300">
                                ADAS
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-1">
                            {shop.address}, {shop.city} {shop.postal_code}
                          </p>
                          
                          <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className="flex items-center gap-1">
                              <StarRating rating={shop.rating || 0} size="sm" />
                              <span className="text-muted-foreground">({shop.total_reviews})</span>
                            </span>
                            
                            {shop.acceptance_rate !== undefined && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Award className="h-3 w-3" />
                                {(shop.acceptance_rate * 100).toFixed(0)}%
                              </span>
                            )}
                            
                            {shop.response_time_minutes !== undefined && (
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <Zap className="h-3 w-3" />
                                {shop.response_time_minutes}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:buttons.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={selectedShops.length < 1 || submitting}
          >
            {submitting ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {t('shop_selection.send_to_customer', 'Send to Customer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
