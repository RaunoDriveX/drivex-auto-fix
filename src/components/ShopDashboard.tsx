import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StarRating } from "@/components/ui/star-rating";
import { toast } from "sonner";
import { Clock, MapPin, Car, Euro, TrendingUp, Award, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface JobOffer {
  id: string;
  appointment_id: string;
  offered_price: number;
  estimated_completion_time: string | null;
  status: string;
  offered_at: string;
  expires_at: string;
  appointments?: {
    customer_name: string;
    service_type: string;
    appointment_date: string;
    appointment_time: string;
    damage_type?: string;
    vehicle_info?: any;
  };
}

interface ShopStats {
  id: string;
  name: string;
  acceptance_rate: number;
  response_time_minutes: number;
  quality_score: number;
  performance_tier: string;
  jobs_offered_count: number;
  jobs_accepted_count: number;
  rating: number;
  total_reviews: number;
}

const ShopDashboard = () => {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [shopStats, setShopStats] = useState<ShopStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [responseLoading, setResponseLoading] = useState<string | null>(null);

  // Mock shop ID - in real implementation, this would come from authentication
  const shopId = "dxc";

  useEffect(() => {
    fetchJobOffers();
    fetchShopStats();
  }, []);

  const fetchJobOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('job_offers')
        .select(`
          *,
          appointments (
            customer_name,
            service_type,
            appointment_date,
            appointment_time,
            damage_type,
            vehicle_info
          )
        `)
        .eq('shop_id', shopId)
        .in('status', ['offered'])
        .order('offered_at', { ascending: false });

      if (error) throw error;
      setJobOffers((data as JobOffer[]) || []);
    } catch (error) {
      console.error('Error fetching job offers:', error);
    }
  };

  const fetchShopStats = async () => {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('id', shopId)
        .single();

      if (error) throw error;
      setShopStats(data);
    } catch (error) {
      console.error('Error fetching shop stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobResponse = async (jobOfferId: string, response: 'accept' | 'decline', declineReason?: string) => {
    setResponseLoading(jobOfferId);
    
    try {
      const { error } = await supabase.functions.invoke('handle-job-response', {
        body: {
          jobOfferId,
          response,
          declineReason
        }
      });

      if (error) throw error;

      toast.success(`Job ${response === 'accept' ? 'accepted' : 'declined'} successfully!`);
      
      // Refresh data
      await fetchJobOffers();
      await fetchShopStats();
      
    } catch (error: any) {
      console.error('Error responding to job:', error);
      toast.error(error.message || 'Failed to respond to job offer');
    } finally {
      setResponseLoading(null);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const getPerformanceTierColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'gold': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="grid gap-6">
              <div className="h-40 bg-muted rounded"></div>
              <div className="h-60 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Shop Dashboard - {shopStats?.name}</h1>
        
        {/* Performance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Acceptance Rate</p>
                  <p className="text-2xl font-bold">{shopStats?.acceptance_rate.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg Response Time</p>
                  <p className="text-2xl font-bold">{shopStats?.response_time_minutes.toFixed(0)}m</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Quality Score</p>
                  <div className="flex items-center gap-2">
                    <StarRating rating={shopStats?.quality_score || 0} size="sm" />
                    <span className="text-lg font-bold">{shopStats?.quality_score.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge className={`px-2 py-1 ${getPerformanceTierColor(shopStats?.performance_tier || 'standard')}`}>
                  {shopStats?.performance_tier || 'Standard'} Tier
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {shopStats?.jobs_accepted_count}/{shopStats?.jobs_offered_count} jobs completed
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Active Job Offers */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Active Job Offers ({jobOffers.length})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {jobOffers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No active job offers at the moment.</p>
                <p className="text-sm">New jobs will appear here when they match your capabilities.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobOffers.map((offer) => (
                  <Card key={offer.id} className="border-primary/20">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {offer.appointments?.service_type} Service
                          </h3>
                          <p className="text-muted-foreground">
                            Customer: {offer.appointments?.customer_name}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-600">
                            €{offer.offered_price.toFixed(2)}
                          </div>
                          <Badge variant="outline" className="mt-1">
                            {formatTimeRemaining(offer.expires_at)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Date & Time</p>
                            <p className="text-sm font-medium">
                              {new Date(offer.appointments?.appointment_date || '').toLocaleDateString()}
                            </p>
                            <p className="text-sm">{offer.appointments?.appointment_time}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Service Type</p>
                            <p className="text-sm font-medium">{offer.appointments?.service_type}</p>
                            <p className="text-xs">Est. {offer.estimated_completion_time}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Damage Type</p>
                            <p className="text-sm font-medium">
                              {offer.appointments?.damage_type || 'To be assessed'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Offered</p>
                            <p className="text-sm font-medium">
                              {new Date(offer.offered_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => handleJobResponse(offer.id, 'accept')}
                          disabled={responseLoading === offer.id}
                          className="flex-1"
                        >
                          {responseLoading === offer.id ? 'Processing...' : 'Accept Job'}
                        </Button>
                        
                        <Button 
                          variant="outline"
                          onClick={() => handleJobResponse(offer.id, 'decline', 'Not available at this time')}
                          disabled={responseLoading === offer.id}
                          className="flex-1"
                        >
                          Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ShopDashboard;