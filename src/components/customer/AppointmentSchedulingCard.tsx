import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { Loader2, CalendarCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppointmentSchedulingCardProps {
  appointmentId: string;
  shopId: string;
  shopName: string;
  trackingToken?: string;
  onScheduleSuccess: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export function AppointmentSchedulingCard({
  appointmentId,
  shopId,
  shopName,
  trackingToken,
  onScheduleSuccess
}: AppointmentSchedulingCardProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  useEffect(() => {
    if (selectedDate && shopId && shopId !== 'pending') {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate, shopId]);

  const fetchAvailableSlots = async (date: Date) => {
    setFetchingSlots(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      // Fetch shop availability for the selected date
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
        for (let minute of ['00', '30']) {
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
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive"
      });
    } finally {
      setFetchingSlots(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedDate || !selectedTime) {
      toast({
        title: "Incomplete Selection",
        description: "Please select both a date and time",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // Update appointment with customer-confirmed date/time
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          appointment_date: formattedDate,
          appointment_time: selectedTime,
          appointment_confirmed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      // Update shop availability to mark slot as booked
      await supabase
        .from('shop_availability')
        .upsert({
          shop_id: shopId,
          date: formattedDate,
          time_slot: selectedTime,
          is_available: false,
          appointment_id: appointmentId
        });

      toast({
        title: "Appointment Scheduled!",
        description: `Your appointment is confirmed for ${format(selectedDate, 'EEEE, MMMM d, yyyy')} at ${format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}`
      });

      onScheduleSuccess();
    } catch (error: any) {
      console.error('Error scheduling appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to schedule appointment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const minDate = addDays(new Date(), 1); // Can't book same day

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <CalendarCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Schedule Your Appointment</CardTitle>
            <CardDescription>
              The shop has accepted your job. Please select a date and time that works for you.
            </CardDescription>
          </div>
        </div>
        <Badge variant="secondary" className="w-fit mt-2">
          {shopName}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Select Your Preferred Date
          </Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => isBefore(date, startOfDay(minDate))}
            className={cn("rounded-md border pointer-events-auto")}
          />
        </div>

        {selectedDate && (
          <div className="space-y-2">
            <Label>Select Time Slot</Label>
            {fetchingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Select value={selectedTime} onValueChange={setSelectedTime}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an available time" />
                </SelectTrigger>
                <SelectContent>
                  {availableSlots
                    .filter(slot => slot.available)
                    .map(slot => (
                      <SelectItem key={slot.time} value={slot.time}>
                        {format(new Date(`2000-01-01T${slot.time}`), 'h:mm a')}
                      </SelectItem>
                    ))}
                  {availableSlots.filter(slot => slot.available).length === 0 && (
                    <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                      No available slots for this date
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {selectedDate && selectedTime && (
          <div className="rounded-lg bg-background p-4 border">
            <p className="text-sm text-muted-foreground">Your selected appointment:</p>
            <p className="font-semibold text-lg">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </p>
            <p className="text-primary font-medium">
              {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
            </p>
          </div>
        )}

        <Button 
          onClick={handleSchedule} 
          disabled={!selectedDate || !selectedTime || loading}
          className="w-full"
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Confirm Appointment
        </Button>
      </CardContent>
    </Card>
  );
}
