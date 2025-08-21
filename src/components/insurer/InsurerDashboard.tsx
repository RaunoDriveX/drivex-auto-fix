import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Shop {
  id: string;
  name: string;
  city: string;
  rating: number;
  total_reviews: number;
}

interface PreferredShop {
  id: string;
  shop_id: string;
  priority_level: number;
  shop: Shop;
}

interface InsurerProfile {
  id: string;
  insurer_name: string;
  email: string;
  contact_person?: string;
  phone?: string;
}

export const InsurerDashboard: React.FC = () => {
  const [profile, setProfile] = useState<InsurerProfile | null>(null);
  const [preferredShops, setPreferredShops] = useState<PreferredShop[]>([]);
  const [availableShops, setAvailableShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('1');
  const [isAddingShop, setIsAddingShop] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsurerData();
  }, []);

  const fetchInsurerData = async () => {
    try {
      // Get current user's insurer profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      const { data: profileData } = await supabase
        .from('insurer_profiles')
        .select('*')
        .eq('email', user.email)
        .single();

      if (!profileData) {
        toast({
          title: "No insurer profile found",
          description: "Please contact support to set up your insurer profile.",
          variant: "destructive"
        });
        return;
      }

      setProfile(profileData);

      // Get preferred shops
      const { data: preferredData } = await supabase
        .from('insurer_preferred_shops')
        .select(`
          *,
          shop:shops(id, name, city, rating, total_reviews)
        `)
        .eq('insurer_id', profileData.id)
        .eq('is_active', true)
        .order('priority_level');

      setPreferredShops(preferredData || []);

      // Get all available shops
      const { data: shopsData } = await supabase
        .from('shops')
        .select('id, name, city, rating, total_reviews')
        .order('name');

      setAvailableShops(shopsData || []);

    } catch (error) {
      console.error('Error fetching insurer data:', error);
      toast({
        title: "Error loading data",
        description: "Failed to load insurer dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPreferredShop = async () => {
    if (!selectedShopId || !profile) return;

    setIsAddingShop(true);
    try {
      const { error } = await supabase
        .from('insurer_preferred_shops')
        .insert({
          insurer_id: profile.id,
          shop_id: selectedShopId,
          priority_level: parseInt(selectedPriority),
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Shop added",
        description: "Preferred shop has been added successfully"
      });

      fetchInsurerData();
      setSelectedShopId('');
      setSelectedPriority('1');

    } catch (error) {
      console.error('Error adding preferred shop:', error);
      toast({
        title: "Error adding shop",
        description: "Failed to add preferred shop",
        variant: "destructive"
      });
    } finally {
      setIsAddingShop(false);
    }
  };

  const handleRemovePreferredShop = async (preferredShopId: string) => {
    try {
      const { error } = await supabase
        .from('insurer_preferred_shops')
        .update({ is_active: false })
        .eq('id', preferredShopId);

      if (error) throw error;

      toast({
        title: "Shop removed",
        description: "Preferred shop has been removed"
      });

      fetchInsurerData();

    } catch (error) {
      console.error('Error removing preferred shop:', error);
      toast({
        title: "Error removing shop",
        description: "Failed to remove preferred shop",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-6">Loading insurer dashboard...</div>;
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Insurer Profile Not Found</CardTitle>
            <CardDescription>
              Your insurer profile is not set up. Please contact support to get started.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const alreadyPreferredShops = preferredShops.map(ps => ps.shop_id);
  const availableForSelection = availableShops.filter(shop => 
    !alreadyPreferredShops.includes(shop.id)
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Insurer Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your preferred shop network for {profile.insurer_name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Preferred Shop Network</CardTitle>
              <CardDescription>
                Manage your network of preferred repair shops. Jobs will be routed to these shops first.
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Shop
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Preferred Shop</DialogTitle>
                  <DialogDescription>
                    Select a shop to add to your preferred network
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Shop</Label>
                    <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a shop" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableForSelection.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name} - {shop.city} ({shop.rating}⭐ • {shop.total_reviews} reviews)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority Level</Label>
                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Highest Priority</SelectItem>
                        <SelectItem value="2">2 - High Priority</SelectItem>
                        <SelectItem value="3">3 - Medium Priority</SelectItem>
                        <SelectItem value="4">4 - Low Priority</SelectItem>
                        <SelectItem value="5">5 - Lowest Priority</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleAddPreferredShop} 
                    disabled={!selectedShopId || isAddingShop}
                    className="w-full"
                  >
                    {isAddingShop ? "Adding..." : "Add to Preferred Network"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {preferredShops.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No preferred shops configured yet</p>
              <p className="text-sm">Add shops to your network to ensure jobs are routed to them first</p>
            </div>
          ) : (
            <div className="space-y-3">
              {preferredShops.map((preferredShop) => (
                <div 
                  key={preferredShop.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{preferredShop.shop.name}</h3>
                      <Badge variant="outline">
                        Priority {preferredShop.priority_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {preferredShop.shop.city} • {preferredShop.shop.rating}⭐ ({preferredShop.shop.total_reviews} reviews)
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePreferredShop(preferredShop.id)}
                  >
                    <Trash2 className="w-4 h-4" />
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