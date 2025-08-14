import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

interface TimeSlot {
  day: string;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

interface ShopAvailabilitySettingsProps {
  shopId: string;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const ShopAvailabilitySettings = ({ shopId }: ShopAvailabilitySettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [availability, setAvailability] = useState<TimeSlot[]>(
    DAYS_OF_WEEK.map(day => ({
      day,
      start_time: "09:00",
      end_time: "17:00",
      is_available: day !== 'Sunday'
    }))
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchBusinessHours();
  }, [shopId]);

  const fetchBusinessHours = async () => {
    try {
      const { data: shop, error } = await supabase
        .from('shops')
        .select('business_hours')
        .eq('id', shopId)
        .single();

      if (error) throw error;

      if (shop?.business_hours && Array.isArray(shop.business_hours)) {
        setAvailability(shop.business_hours as unknown as TimeSlot[]);
      }
    } catch (error: any) {
      console.error('Error fetching business hours:', error);
    }
  };

  const handleAvailabilityChange = (dayIndex: number, field: keyof TimeSlot, value: string | boolean) => {
    setAvailability(prev => prev.map((slot, index) => 
      index === dayIndex ? { ...slot, [field]: value } : slot
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('shops')
        .update({
          business_hours: availability as any,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopId);

      if (error) throw error;

      toast({
        title: "Availability updated",
        description: "Your shop availability has been updated successfully."
      });
    } catch (error: any) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Availability</CardTitle>
        <CardDescription>
          Set your operating hours for each day of the week. Changes take effect immediately for new job offers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {availability.map((slot, index) => (
              <div key={slot.day} className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2 min-w-[120px]">
                  <Checkbox
                    id={`available-${slot.day}`}
                    checked={slot.is_available}
                    onCheckedChange={(checked) => 
                      handleAvailabilityChange(index, 'is_available', checked as boolean)
                    }
                  />
                  <Label htmlFor={`available-${slot.day}`} className="font-medium">
                    {slot.day}
                  </Label>
                </div>

                {slot.is_available && (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`start-${slot.day}`} className="text-sm">From:</Label>
                      <Input
                        id={`start-${slot.day}`}
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => handleAvailabilityChange(index, 'start_time', e.target.value)}
                        className="w-32"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`end-${slot.day}`} className="text-sm">To:</Label>
                      <Input
                        id={`end-${slot.day}`}
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => handleAvailabilityChange(index, 'end_time', e.target.value)}
                        className="w-32"
                      />
                    </div>
                  </div>
                )}

                {!slot.is_available && (
                  <div className="flex-1 text-muted-foreground text-sm">
                    Closed
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update Availability"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShopAvailabilitySettings;