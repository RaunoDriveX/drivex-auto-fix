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
    <Card className="border-border bg-card">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
            2
          </div>
          <CardTitle className="text-lg font-semibold">
            Choose Date & Time at {shopName}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left side - Calendar */}
          <div className="flex-1 space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CalendarCheck className="h-4 w-4" />
              Select Date
            </Label>
            <div className="border rounded-lg p-4 bg-background">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => isBefore(date, startOfDay(minDate))}
                className="pointer-events-auto w-full"
                classNames={{
                  months: "flex flex-col w-full",
                  month: "space-y-4 w-full",
                  caption: "flex justify-center pt-1 relative items-center h-10",
                  caption_label: "text-sm font-semibold",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-input hover:bg-accent",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] text-center flex-1",
                  row: "flex w-full mt-2",
                  cell: "flex-1 h-9 text-sm p-0 relative flex items-center justify-center [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center rounded-md hover:bg-accent transition-colors",
                  day_range_end: "day-range-end",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground rounded-md",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "day-outside text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </div>

          {/* Right side - Time slot and summary */}
          <div className="lg:w-80 space-y-4">
            <div className="space-y-3">
              <Label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Clock className="h-4 w-4" />
                Select Time Slot
              </Label>
              {fetchingSlots ? (
                <div className="flex items-center justify-center py-8 border rounded-lg">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                  <SelectTrigger className="w-full h-11 border-2 border-primary/20 focus:border-primary">
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
              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <p className="text-sm text-muted-foreground">Your appointment summary:</p>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">{shopName}</p>
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

        <Button 
          onClick={handleSchedule} 
          disabled={!selectedDate || !selectedTime || loading}
          className="w-full h-12 text-base font-medium"
          size="lg"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <CalendarCheck className="mr-2 h-5 w-5" />
          Confirm Shop & Appointment
        </Button>
      </CardContent>
    </Card>
  );
}
