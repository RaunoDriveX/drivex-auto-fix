import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { format, addDays, isBefore, startOfDay } from "date-fns";
import { Loader2 } from "lucide-react";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  shopId: string;
  currentDate: string;
  currentTime: string;
  onRescheduleSuccess: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export function RescheduleDialog({
  open,
  onOpenChange,
  appointmentId,
  shopId,
  currentDate,
  currentTime,
  onRescheduleSuccess
}: RescheduleDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

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

  const handleReschedule = async () => {
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

      // Update appointment
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          appointment_date: formattedDate,
          appointment_time: selectedTime,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      // Update shop availability
      await supabase
        .from('shop_availability')
        .upsert({
          shop_id: shopId,
          date: formattedDate,
          time_slot: selectedTime,
          is_available: false,
          appointment_id: appointmentId
        });

      // Free up old slot
      await supabase
        .from('shop_availability')
        .update({ is_available: true, appointment_id: null })
        .eq('shop_id', shopId)
        .eq('date', currentDate)
        .eq('time_slot', currentTime);

      toast({
        title: "Success",
        description: "Your appointment has been rescheduled"
      });

      onRescheduleSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error rescheduling:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule appointment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const minDate = addDays(new Date(), 1); // Can't book same day

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Reschedule Appointment</DialogTitle>
          <DialogDescription>
            Select a new date and time for your appointment. Available slots are shown below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Select New Date</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => isBefore(date, startOfDay(minDate))}
              className="rounded-md border"
            />
          </div>

          {selectedDate && (
            <div className="space-y-2">
              <Label>Select Time Slot</Label>
              {fetchingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
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
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">New appointment time:</p>
              <p className="font-semibold">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')} at{' '}
                {format(new Date(`2000-01-01T${selectedTime}`), 'h:mm a')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleReschedule} disabled={!selectedDate || !selectedTime || loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
