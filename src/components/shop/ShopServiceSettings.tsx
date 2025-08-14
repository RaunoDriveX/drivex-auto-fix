import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

interface ShopServiceSettingsProps {
  shopData: any;
  onUpdate: (email: string) => void;
}

const ShopServiceSettings = ({ shopData, onUpdate }: ShopServiceSettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service_capability: shopData?.service_capability || 'both',
    repair_types: shopData?.repair_types || 'both_repairs',
    is_mobile_service: shopData?.is_mobile_service || false,
    is_certified: shopData?.is_certified || false,
    insurance_approved: shopData?.insurance_approved || true,
    adas_calibration_capability: shopData?.adas_calibration_capability || false,
    average_lead_time_days: shopData?.average_lead_time_days || 1,
    special_badges: shopData?.special_badges || []
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('shops')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', shopData.id);

      if (error) throw error;

      toast({
        title: "Services updated",
        description: "Your shop services have been updated successfully."
      });

      onUpdate(shopData.email);
    } catch (error: any) {
      console.error('Error updating services:', error);
      toast({
        title: "Error",
        description: "Failed to update service settings",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBadgeToggle = (badge: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      special_badges: checked 
        ? [...prev.special_badges, badge]
        : prev.special_badges.filter(b => b !== badge)
    }));
  };

  const availableBadges = [
    'eco_friendly',
    'fast_service',
    'mobile_service',
    'insurance_specialist',
    'certified_technician',
    'luxury_vehicle_specialist',
    'fleet_service',
    'emergency_service'
  ];

  const formatBadgeName = (badge: string) => {
    return badge.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Settings</CardTitle>
        <CardDescription>
          Configure your shop's service capabilities and specializations. Changes take effect immediately for new job offers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Service Capability</Label>
              <Select
                value={formData.service_capability}
                onValueChange={(value) => setFormData(prev => ({ ...prev, service_capability: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="repair_only">Repair Only</SelectItem>
                  <SelectItem value="replacement_only">Replacement Only</SelectItem>
                  <SelectItem value="both">Both Repair & Replacement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Repair Types</Label>
              <Select
                value={formData.repair_types}
                onValueChange={(value) => setFormData(prev => ({ ...prev, repair_types: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="windshield_only">Windshield Only</SelectItem>
                  <SelectItem value="side_rear_only">Side/Rear Only</SelectItem>
                  <SelectItem value="both_repairs">All Glass Types</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Average Lead Time (days)</Label>
            <Select
              value={formData.average_lead_time_days.toString()}
              onValueChange={(value) => setFormData(prev => ({ ...prev, average_lead_time_days: parseInt(value) }))}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 5, 7, 10, 14].map(days => (
                  <SelectItem key={days} value={days.toString()}>
                    {days} {days === 1 ? 'day' : 'days'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Service Features</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="mobile_service"
                  checked={formData.is_mobile_service}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_mobile_service: checked as boolean }))
                  }
                />
                <Label htmlFor="mobile_service">Mobile Service Available</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="certified"
                  checked={formData.is_certified}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_certified: checked as boolean }))
                  }
                />
                <Label htmlFor="certified">Certified Technicians</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="insurance"
                  checked={formData.insurance_approved}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, insurance_approved: checked as boolean }))
                  }
                />
                <Label htmlFor="insurance">Insurance Approved</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="adas_calibration"
                  checked={formData.adas_calibration_capability}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, adas_calibration_capability: checked as boolean }))
                  }
                />
                <Label htmlFor="adas_calibration">ADAS Calibration Equipment</Label>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Special Badges</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableBadges.map(badge => (
                <div key={badge} className="flex items-center space-x-2">
                  <Checkbox
                    id={badge}
                    checked={formData.special_badges.includes(badge)}
                    onCheckedChange={(checked) => handleBadgeToggle(badge, checked as boolean)}
                  />
                  <Label htmlFor={badge}>{formatBadgeName(badge)}</Label>
                </div>
              ))}
            </div>
            
            {formData.special_badges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Label className="text-sm">Selected badges:</Label>
                {formData.special_badges.map(badge => (
                  <Badge key={badge} variant="secondary" className="text-xs">
                    {formatBadgeName(badge)}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Updating..." : "Update Service Settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShopServiceSettings;