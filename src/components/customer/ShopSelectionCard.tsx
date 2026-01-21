import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StarRating } from '@/components/ui/star-rating';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin, Car, Wrench, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';
import type { MockShopSelection } from '@/lib/mockData';

interface ShopSelectionCardProps {
  shops: MockShopSelection[];
  onSelect: (shopId: string) => Promise<void>;
  isLoading?: boolean;
  isMockMode?: boolean;
}

export function ShopSelectionCard({ shops, onSelect, isLoading, isMockMode }: ShopSelectionCardProps) {
  const { t } = useTranslation('common');
  const [selectedShop, setSelectedShop] = useState<MockShopSelection | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSelectClick = (shop: MockShopSelection) => {
    setSelectedShop(shop);
    setConfirmDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedShop) return;
    
    setSubmitting(true);
    try {
      await onSelect(selectedShop.shop_id);
      if (isMockMode) {
        toast.success(t('customer_confirmation.mock_mode_notice', 'Mock Mode - Selection saved locally'));
      } else {
        toast.success(t('customer_confirmation.shop_selected', 'Shop selected successfully'));
      }
      setConfirmDialogOpen(false);
    } catch (error) {
      toast.error(t('customer_confirmation.error_selecting', 'Failed to select shop'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {t('customer_confirmation.select_shop_title', 'Choose Your Repair Shop')}
              </CardTitle>
              <CardDescription>
                {t('customer_confirmation.select_shop_description', 'Your insurer has pre-selected 3 shops for you')}
              </CardDescription>
            </div>
          </div>
          {isMockMode && (
            <Badge variant="outline" className="w-fit bg-yellow-500/10 text-yellow-700 border-yellow-300">
              Mock Mode
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {shops
            .sort((a, b) => a.priority_order - b.priority_order)
            .map((shop, index) => (
              <div
                key={shop.id}
                className={`relative p-4 rounded-lg border-2 transition-all hover:border-primary/50 hover:shadow-md ${
                  index === 0 ? 'border-primary/30 bg-primary/5' : 'border-border bg-card'
                }`}
              >
                {index === 0 && (
                  <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">
                    {t('customer_confirmation.recommended', 'Recommended')}
                  </Badge>
                )}
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{shop.name}</h3>
                      {shop.is_mobile_service && (
                        <Badge variant="secondary" className="text-xs">
                          <Car className="h-3 w-3 mr-1" />
                          {t('customer_confirmation.mobile_service', 'Mobile')}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {shop.distance_km.toFixed(1)} km
                      </span>
                      <span className="flex items-center gap-1">
                        <StarRating rating={shop.rating} size="sm" />
                        <span className="ml-1">({shop.total_reviews})</span>
                      </span>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {shop.address}, {shop.city}
                    </p>
                    
                    {shop.adas_calibration_capability && (
                      <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-300">
                        <Check className="h-3 w-3 mr-1" />
                        {t('customer_confirmation.adas_capable', 'ADAS Calibration Available')}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">€{shop.estimated_price}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('customer_confirmation.estimated', 'Estimated')}
                      </p>
                    </div>
                    <Button
                      onClick={() => handleSelectClick(shop)}
                      variant={index === 0 ? 'default' : 'outline'}
                      className="w-full sm:w-auto"
                    >
                      {t('customer_confirmation.select_this_shop', 'Select This Shop')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('customer_confirmation.confirm_selection_title', 'Confirm Shop Selection')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('customer_confirmation.confirm_selection_message', 'You are about to select:')}
              </p>
              {selectedShop && (
                <div className="p-3 bg-muted rounded-lg mt-2">
                  <p className="font-semibold">{selectedShop.name}</p>
                  <p className="text-sm">{selectedShop.address}, {selectedShop.city}</p>
                  <p className="text-lg font-bold mt-1">€{selectedShop.estimated_price}</p>
                </div>
              )}
              <p className="text-sm mt-3">
                {t('customer_confirmation.confirm_selection_note', 'Once confirmed, the shop will be notified and will contact you to schedule the repair.')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              {t('buttons.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={submitting}>
              {submitting ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {t('customer_confirmation.confirm_selection', 'Confirm Selection')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
