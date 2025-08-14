import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface ShopLocationSettingsProps {
  shopData: any;
  onUpdate: (email: string) => void;
}

const ShopLocationSettings = ({ shopData, onUpdate }: ShopLocationSettingsProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    latitude: '',
    longitude: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (shopData) {
      setFormData({
        id: shopData.id || '',
        name: shopData.name || '',
        address: shopData.address || '',
        city: shopData.city || '',
        postal_code: shopData.postal_code || '',
        phone: shopData.phone || '',
        email: shopData.email || '',
        website: shopData.website || '',
        description: shopData.description || '',
        latitude: shopData.latitude?.toString() || '',
        longitude: shopData.longitude?.toString() || ''
      });
    } else {
      // Get user email from auth for new shops
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user?.email) {
          setFormData(prev => ({
            ...prev,
            email: user.email!,
            id: user.email! // Use email as ID for new shops
          }));
        }
      });
    }
  }, [shopData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.address || !formData.city || !formData.postal_code) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (name, address, city, postal code).",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        id: formData.id,
        name: formData.name,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        phone: formData.phone || null,
        email: formData.email,
        website: formData.website || null,
        description: formData.description || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };

      let result;
      if (shopData) {
        // Update existing shop
        result = await supabase
          .from('shops')
          .update(updateData)
          .eq('id', shopData.id);
      } else {
        // Create new shop
        result = await supabase
          .from('shops')
          .insert([updateData]);
      }

      if (result.error) throw result.error;

      toast({
        title: "Success",
        description: shopData ? "Shop information updated successfully!" : "Shop profile created successfully!"
      });

      onUpdate(formData.email);
    } catch (error: any) {
      console.error('Error saving shop data:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save shop information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shop Location & Contact Information</CardTitle>
        <CardDescription>
          {shopData ? "Update your shop's location and contact details" : "Set up your shop's location and contact details to get started"}. Changes take effect immediately for new job offers.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Shop Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="website">Website (optional)</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Shop Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Brief description of your shop and services"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude (for precise location)</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
                placeholder="e.g., 59.4370"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude (for precise location)</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
                placeholder="e.g., 24.7536"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : shopData ? "Update Location Settings" : "Create Shop Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ShopLocationSettings;