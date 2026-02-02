import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { StarRating } from '@/components/ui/star-rating';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { MapPin, Car, Wrench, Check, Clock, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import type { MockShopSelection } from '@/lib/mockData';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface ShopAndScheduleCardProps {
  shops: MockShopSelection[];
  appointmentId: string;
  trackingToken?: string;
  onSuccess: () => void;
  isLoading?: boolean;
  isMockMode?: boolean;
}

export function ShopAndScheduleCard({ 
  shops, 
  appointmentId,
  trackingToken,
  onSuccess,
  isLoading, 
  isMockMode 
}: ShopAndScheduleCardProps) {
  const { t } = useTranslation('common');
  const [selectedShop, setSelectedShop] = useState<MockShopSelection | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (selectedShop && selectedDate) {
      fetchAvailableSlots(selectedShop.shop_id, selectedDate);
    } else {
      setAvailableSlots([]);
      setSelectedTime("");
    }
  }, [selectedShop, selectedDate]);

  const fetchAvailableSlots = async (shopId: string, date: Date) => {
    if (isMockMode) {
      // Generate mock slots for demo
      const slots: TimeSlot[] = [];
      for (let hour = 8; hour <= 17; hour++) {
        for (const minute of ['00', '30']) {
          slots.push({
            time: `${hour.toString().padStart(2, '0')}:${minute}:00`,
            available: Math.random() > 0.3 // 70% available for demo
          });
        }
      }
      setAvailableSlots(slots);
      return;
    }

    setFetchingSlots(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const { data: availability, error } = await supabase
        .from('shop_availability')
        .select('time_slot, is_available')
        .eq('shop_id', shopId)
        .eq('date', formattedDate)
        .order('time_slot', { ascending: true });

      if (error) throw error;

      // Generate time slots from 8 AM to 5 PM
      const slots: TimeSlot[] = [];
      for (let hour = 8; hour <= 17; hour++) {
        for (const minute of ['00', '30']) {
          const time = `${hour.toString().padStart(2, '0')}:${minute}:00`;
          const slot = availability?.find(a => a.time_slot === time);
          slots.push({
            time,
            available: slot ? slot.is_available : true
          });
        }
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      toast.error('Failed to load available time slots');
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleShopSelect = (shop: MockShopSelection) => {
    setSelectedShop(shop);
    setSelectedDate(undefined);
    setSelectedTime("");
  };

  const handleConfirmClick = () => {
    if (!selectedShop || !selectedDate || !selectedTime) {
      toast.error('Please select a shop, date, and time');
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!selectedShop || !selectedDate || !selectedTime) return;
    
    setSubmitting(true);
    try {
      if (isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success('Mock Mode - Selection and schedule saved locally');
        setConfirmDialogOpen(false);
        onSuccess();
        return;
      }

      if (!trackingToken) {
        throw new Error('Missing tracking token');
      }

      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Call the edge function with the new combined action
      const { data, error } = await supabase.functions.invoke('confirm-customer-selection', {
        body: {
          tracking_token: trackingToken,
          action: 'select_shop_and_schedule',
          shop_id: selectedShop.shop_id,
          appointment_date: formattedDate,
          appointment_time: selectedTime
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || 'Failed to confirm selection');
      }

      toast.success('Shop and appointment time confirmed!');
      setConfirmDialogOpen(false);
      onSuccess();
    } catch (error: any) {
      console.error('Error confirming selection:', error);
      toast.error(error.message || 'Failed to confirm selection');
    } finally {
      setSubmitting(false);
    }
  };

  const minDate = addDays(new Date(), 1);

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
                {t('customer_confirmation.select_shop_and_time_title', 'Choose Your Repair Shop & Time')}
              </CardTitle>
              <CardDescription>
                {t('customer_confirmation.select_shop_and_time_description', 'Select a shop and schedule your appointment in one step')}
              </CardDescription>
            </div>
          </div>
          {isMockMode && (
            <Badge variant="outline" className="w-fit bg-yellow-500/10 text-yellow-700 border-yellow-300">
              Mock Mode
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 1: Shop Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">1</span>
              {t('customer_confirmation.step_select_shop', 'Select a Shop')}
            </Label>
            <ScrollArea className="h-auto max-h-[400px] pr-2">
              <div className="space-y-3 pb-2">
                {shops
                  .sort((a, b) => a.priority_order - b.priority_order)
                  .map((shop, index) => (
                    <div
                      key={shop.id}
                      onClick={() => handleShopSelect(shop)}
                      className={cn(
                        "relative p-4 rounded-lg border-2 transition-all cursor-pointer hover:border-primary/50 hover:shadow-md",
                        selectedShop?.shop_id === shop.shop_id
                          ? 'border-primary bg-primary/10'
                          : index === 0
                            ? 'border-primary/30 bg-primary/5'
                            : 'border-border bg-card'
                      )}
                    >
                      {index === 0 && !selectedShop && (
                        <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground text-xs">
                          {t('customer_confirmation.recommended', 'Recommended')}
                        </Badge>
                      )}
                      {selectedShop?.shop_id === shop.shop_id && (
                        <Badge className="absolute top-1/2 -translate-y-1/2 right-4 bg-green-500 text-white text-xs">
                          <Check className="h-3 w-3 mr-1" />
                          {t('customer_confirmation.selected', 'Selected')}
                        </Badge>
                      )}
                      
                      <div className="flex items-start justify-between gap-3 mt-1">
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground truncate">{shop.name}</h3>
                            {shop.is_mobile_service && (
                              <Badge variant="secondary" className="text-xs shrink-0">
                                <Car className="h-3 w-3 mr-1" />
                                {t('customer_confirmation.mobile_service', 'Mobile')}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1 shrink-0">
                              <MapPin className="h-3.5 w-3.5" />
                              {shop.distance_km.toFixed(1)} km
                            </span>
                            <span className="flex items-center gap-1">
                              <StarRating rating={shop.rating} size="sm" />
                              <span className="text-xs">({shop.total_reviews})</span>
                            </span>
                          </div>
                          
                          <p className="text-sm text-muted-foreground truncate">
                            {shop.address}, {shop.city}
                          </p>
                          
                          {shop.adas_calibration_capability && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-300">
                              <Check className="h-3 w-3 mr-1" />
                              {t('customer_confirmation.adas_capable', 'ADAS Calibration Available')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </div>

          {/* Step 2: Date & Time Selection - Only show after shop is selected */}
          {selectedShop && (
            <div className="space-y-4 border-t pt-6">
              <Label className="text-sm font-medium flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
                {t('customer_confirmation.step_select_time', 'Choose Date & Time at')} {selectedShop.name}
              </Label>
              
              {/* Contained Date & Time Selection Card */}
              <div className="rounded-lg border bg-background p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Calendar */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      {t('customer_confirmation.select_date', 'Select Date')}
                    </Label>
                    <div className="rounded-md border p-3 bg-card">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => isBefore(date, startOfDay(minDate))}
                        className="pointer-events-auto mx-auto"
                        classNames={{
                          months: "flex flex-col",
                          month: "space-y-4",
                          caption: "flex justify-center pt-1 relative items-center h-10",
                          caption_label: "text-sm font-semibold",
                          nav: "space-x-1 flex items-center",
                          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse",
                          head_row: "flex w-full justify-between",
                          head_cell: "text-muted-foreground rounded-md w-10 font-normal text-[0.8rem] text-center",
                          row: "flex w-full justify-between mt-2",
                          cell: "h-10 w-10 text-sm p-0 relative flex items-center justify-center",
                          day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-md hover:bg-accent transition-colors",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
                          day_today: "bg-accent text-accent-foreground",
                          day_outside: "day-outside text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-50",
                          day_hidden: "invisible",
                        }}
                      />
                    </div>
                  </div>

                  {/* Right: Time Slot and Summary */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {t('customer_confirmation.select_time', 'Select Time Slot')}
                      </Label>
                      {fetchingSlots ? (
                        <div className="flex items-center justify-center py-8 border rounded-lg bg-card">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : (
                        <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                          <SelectTrigger className="w-full h-11 border-2 border-primary/20 focus:border-primary bg-card">
                            <SelectValue placeholder={selectedDate ? "Choose an available time" : "Select a date first"} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSlots
                              .filter(slot => slot.available)
                              .map(slot => (
                                <SelectItem key={slot.time} value={slot.time}>
                                  {format(new Date(`2000-01-01T${slot.time}`), 'h:mm a')}
                                </SelectItem>
                              ))}
                            {selectedDate && availableSlots.filter(slot => slot.available).length === 0 && (
                              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                                No available slots for this date
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    {/* Appointment Summary */}
                    {selectedDate && selectedTime && (
                      <div className="rounded-lg bg-muted/30 p-4 border space-y-3">
                        <p className="text-sm text-muted-foreground">Your appointment summary:</p>
                        <div className="space-y-1">
                          <p className="font-semibold text-foreground">{selectedShop.name}</p>
                          <p className="text-sm text-muted-foreground">{selectedShop.address}, {selectedShop.city}</p>
                        </div>
                        <div className="space-y-1 pt-2 border-t">
                          <p className="font-medium text-foreground">
                            {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                          </p>
                          <p className="text-primary font-semibold">
                            {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Button */}
          <Button 
            onClick={handleConfirmClick}
            disabled={!selectedShop || !selectedDate || !selectedTime || submitting}
            className="w-full"
            size="lg"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Check className="h-4 w-4 mr-2" />
            {t('customer_confirmation.confirm_shop_and_time', 'Confirm Shop & Appointment')}
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('customer_confirmation.confirm_selection_title', 'Confirm Your Selection')}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {t('customer_confirmation.confirm_shop_time_message', 'You are about to book the following appointment:')}
              </p>
              {selectedShop && selectedDate && selectedTime && (
                <div className="p-4 bg-muted rounded-lg mt-3 space-y-2">
                  <p className="font-semibold text-foreground">{selectedShop.name}</p>
                  <p className="text-sm">{selectedShop.address}, {selectedShop.city}</p>
                  <div className="pt-2 border-t border-border">
                    <p className="font-medium text-foreground">
                      {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-primary font-medium">
                      {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
                    </p>
                  </div>
                </div>
              )}
              <p className="text-sm mt-3">
                {t('customer_confirmation.confirm_shop_time_note', 'The shop will be notified and will confirm your appointment shortly.')}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              {t('buttons.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {t('customer_confirmation.confirm_booking', 'Confirm Booking')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
