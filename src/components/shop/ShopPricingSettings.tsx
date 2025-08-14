import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface PricingRule {
  id?: string;
  service_type: string;
  damage_type: string;
  base_price: number;
  estimated_duration_minutes: number;
  description: string;
}

interface ShopPricingSettingsProps {
  shopId: string;
}

const SERVICE_TYPES = ['repair', 'replacement', 'both'];
const DAMAGE_TYPES = [
  'windshield_chip', 'windshield_crack', 'windshield_replacement',
  'side_window', 'rear_window', 'sunroof', 'other'
];

const ShopPricingSettings = ({ shopId }: ShopPricingSettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [newRule, setNewRule] = useState<PricingRule>({
    service_type: 'repair',
    damage_type: 'windshield_chip',
    base_price: 0,
    estimated_duration_minutes: 60,
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPricingRules();
  }, [shopId]);

  const fetchPricingRules = async () => {
    try {
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('shop_id', shopId)
        .order('service_type', { ascending: true });

      if (error) throw error;
      setPricingRules(data || []);
    } catch (error: any) {
      console.error('Error fetching pricing rules:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing settings",
        variant: "destructive"
      });
    }
  };

  const handleAddRule = async () => {
    if (!newRule.base_price || newRule.base_price <= 0) {
      toast({
        title: "Invalid price",
        description: "Please enter a valid price",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('service_pricing')
        .insert([{
          shop_id: shopId,
          ...newRule
        }]);

      if (error) throw error;

      toast({
        title: "Pricing rule added",
        description: "New pricing rule has been added successfully."
      });

      // Reset form and refresh data
      setNewRule({
        service_type: 'repair',
        damage_type: 'windshield_chip',
        base_price: 0,
        estimated_duration_minutes: 60,
        description: ''
      });
      fetchPricingRules();
    } catch (error: any) {
      console.error('Error adding pricing rule:', error);
      toast({
        title: "Error",
        description: "Failed to add pricing rule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('service_pricing')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;

      toast({
        title: "Pricing rule deleted",
        description: "Pricing rule has been removed successfully."
      });

      fetchPricingRules();
    } catch (error: any) {
      console.error('Error deleting pricing rule:', error);
      toast({
        title: "Error",
        description: "Failed to delete pricing rule",
        variant: "destructive"
      });
    }
  };

  const formatServiceType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const formatDamageType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Service Pricing</CardTitle>
          <CardDescription>
            Set your pricing for different service types and damage types. Changes take effect immediately for new job offers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Service Type</Label>
                <Select
                  value={newRule.service_type}
                  onValueChange={(value) => setNewRule(prev => ({ ...prev, service_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {formatServiceType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Damage Type</Label>
                <Select
                  value={newRule.damage_type}
                  onValueChange={(value) => setNewRule(prev => ({ ...prev, damage_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAMAGE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {formatDamageType(type)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Base Price ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newRule.base_price || ''}
                  onChange={(e) => setNewRule(prev => ({ 
                    ...prev, 
                    base_price: parseFloat(e.target.value) || 0 
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min="15"
                  step="15"
                  value={newRule.estimated_duration_minutes}
                  onChange={(e) => setNewRule(prev => ({ 
                    ...prev, 
                    estimated_duration_minutes: parseInt(e.target.value) || 60 
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={newRule.description}
                onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details about this service..."
              />
            </div>

            <Button onClick={handleAddRule} disabled={loading} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              {loading ? "Adding..." : "Add Pricing Rule"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Current Pricing Rules</CardTitle>
          <CardDescription>
            Your active pricing rules for different services
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pricingRules.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              No pricing rules set up yet. Add your first pricing rule above.
            </div>
          ) : (
            <div className="space-y-4">
              {pricingRules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{formatServiceType(rule.service_type)}</Badge>
                      <Badge variant="secondary">{formatDamageType(rule.damage_type)}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p><strong>Price:</strong> ${rule.base_price}</p>
                      <p><strong>Duration:</strong> {rule.estimated_duration_minutes} minutes</p>
                      {rule.description && <p><strong>Notes:</strong> {rule.description}</p>}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteRule(rule.id!)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopPricingSettings;