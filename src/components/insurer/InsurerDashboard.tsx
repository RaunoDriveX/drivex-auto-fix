import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('insurer');
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
          title: t('error_no_profile'),
          description: t('error_no_profile_hint'),
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
        title: t('error_load_data'),
        description: t('error_load_data'),
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
        title: t('preferred_shops.shop_added'),
        description: t('preferred_shops.shop_added_description')
      });

      fetchInsurerData();
      setSelectedShopId('');
      setSelectedPriority('1');

    } catch (error) {
      console.error('Error adding preferred shop:', error);
      toast({
        title: t('preferred_shops.error_add'),
        description: t('preferred_shops.error_add_description'),
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
        title: t('preferred_shops.shop_removed'),
        description: t('preferred_shops.shop_removed_description')
      });

      fetchInsurerData();

    } catch (error) {
      console.error('Error removing preferred shop:', error);
      toast({
        title: t('preferred_shops.error_remove'),
        description: t('preferred_shops.error_remove_description'),
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="p-6">{t('loading')}</div>;
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('profile_not_found_title')}</CardTitle>
            <CardDescription>
              {t('profile_not_found_description')}
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
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('network_description')} {profile.insurer_name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t('preferred_shops.title')}</CardTitle>
              <CardDescription>
                {t('preferred_shops.description')}
              </CardDescription>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('preferred_shops.add_shop')}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('preferred_shops.add_dialog_title')}</DialogTitle>
                  <DialogDescription>
                    {t('preferred_shops.add_dialog_description')}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>{t('preferred_shops.shop_label')}</Label>
                    <Select value={selectedShopId} onValueChange={setSelectedShopId}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('preferred_shops.select_shop')} />
                      </SelectTrigger>
                      <SelectContent>
                        {availableForSelection.map((shop) => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name} - {shop.city} ({shop.rating}⭐ • {shop.total_reviews} {t('preferred_shops.reviews')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>{t('preferred_shops.priority_label')}</Label>
                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">{t('preferred_shops.priority_1')}</SelectItem>
                        <SelectItem value="2">{t('preferred_shops.priority_2')}</SelectItem>
                        <SelectItem value="3">{t('preferred_shops.priority_3')}</SelectItem>
                        <SelectItem value="4">{t('preferred_shops.priority_4')}</SelectItem>
                        <SelectItem value="5">{t('preferred_shops.priority_5')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleAddPreferredShop} 
                    disabled={!selectedShopId || isAddingShop}
                    className="w-full"
                  >
                    {isAddingShop ? t('preferred_shops.adding') : t('preferred_shops.add_button')}
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
              <p>{t('preferred_shops.no_shops')}</p>
              <p className="text-sm">{t('preferred_shops.no_shops_hint')}</p>
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
                        {t('preferred_shops.priority')} {preferredShop.priority_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {preferredShop.shop.city} • {preferredShop.shop.rating}⭐ ({preferredShop.shop.total_reviews} {t('preferred_shops.reviews')})
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