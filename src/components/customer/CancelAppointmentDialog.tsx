import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  shopId: string;
  appointmentDate: string;
  appointmentTime: string;
  onCancelSuccess: () => void;
}

const CANCEL_REASONS = [
  { value: "schedule_conflict", label: "Schedule conflict" },
  { value: "found_other_shop", label: "Found another shop" },
  { value: "too_expensive", label: "Cost too high" },
  { value: "damage_repaired", label: "Already repaired elsewhere" },
  { value: "vehicle_sold", label: "Sold the vehicle" },
  { value: "other", label: "Other reason" }
];

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  appointmentId,
  shopId,
  appointmentDate,
  appointmentTime,
  onCancelSuccess
}: CancelAppointmentDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [additionalNotes, setAdditionalNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!reason) {
      toast({
        title: "Reason Required",
        description: "Please select a reason for cancellation",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Update appointment status
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          status: 'cancelled',
          job_status: 'cancelled',
          notes: `Cancelled by customer. Reason: ${reason}. ${additionalNotes ? `Notes: ${additionalNotes}` : ''}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      // Free up the time slot
      await supabase
        .from('shop_availability')
        .update({ 
          is_available: true, 
          appointment_id: null 
        })
        .eq('shop_id', shopId)
        .eq('date', appointmentDate)
        .eq('time_slot', appointmentTime);

      // Create audit trail
      await supabase
        .from('job_status_audit')
        .insert({
          appointment_id: appointmentId,
          old_status: 'scheduled',
          new_status: 'cancelled',
          notes: `Customer cancelled. Reason: ${reason}`,
          changed_by_shop_id: null
        });

      toast({
        title: "Appointment Cancelled",
        description: "Your appointment has been cancelled successfully"
      });

      onCancelSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel appointment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Appointment</DialogTitle>
          <DialogDescription>
            Please let us know why you're cancelling this appointment.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This action cannot be undone. You'll need to create a new appointment if you change your mind.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Cancellation Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger id="reason">
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any additional information you'd like to share..."
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Keep Appointment
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleCancel} 
            disabled={!reason || loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cancel Appointment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
