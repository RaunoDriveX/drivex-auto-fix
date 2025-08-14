import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, Car, DollarSign, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JobOffer {
  id: string;
  appointment_id: string;
  offered_price: number;
  status: string;
  expires_at: string;
  estimated_completion_time: string | null;
  notes: string;
  appointments: {
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    service_type: string;
    damage_type: string;
    appointment_date: string;
    appointment_time: string;
    vehicle_info: any;
    notes: string;
  };
}

interface ShopJobOffersProps {
  shopId: string;
}

const ShopJobOffers = ({ shopId }: ShopJobOffersProps) => {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchJobOffers();
  }, [shopId]);

  const fetchJobOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('job_offers')
        .select(`
          *,
          appointments (
            customer_name,
            customer_email,
            customer_phone,
            service_type,
            damage_type,
            appointment_date,
            appointment_time,
            vehicle_info,
            notes
          )
        `)
        .eq('shop_id', shopId)
        .eq('status', 'offered')
        .gte('expires_at', new Date().toISOString())
        .order('offered_at', { ascending: false });

      if (error) throw error;
      setJobOffers((data as JobOffer[]) || []);
    } catch (error: any) {
      console.error('Error fetching job offers:', error);
      toast({
        title: "Error",
        description: "Failed to load job offers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJobResponse = async (jobOfferId: string, response: 'accept' | 'decline') => {
    setRespondingTo(jobOfferId);

    try {
      const { error } = await supabase.functions.invoke('handle-job-response', {
        body: {
          jobOfferId,
          response,
          declineReason: response === 'decline' ? declineReason : undefined
        }
      });

      if (error) throw error;

      toast({
        title: response === 'accept' ? "Job Accepted" : "Job Declined",
        description: response === 'accept' 
          ? "You have successfully accepted this job offer." 
          : "You have declined this job offer."
      });

      // Refresh job offers
      fetchJobOffers();
      setDeclineReason("");
    } catch (error: any) {
      console.error('Error responding to job offer:', error);
      toast({
        title: "Error",
        description: "Failed to respond to job offer",
        variant: "destructive"
      });
    } finally {
      setRespondingTo(null);
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const getStatusColor = (expiresAt: string) => {
    const now = new Date();
    const expires = new Date(expiresAt);
    const diff = expires.getTime() - now.getTime();
    const hoursRemaining = diff / (1000 * 60 * 60);
    
    if (hoursRemaining <= 1) return "destructive";
    if (hoursRemaining <= 6) return "secondary";
    return "default";
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading job offers...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Active Job Offers</CardTitle>
          <CardDescription>
            Review and respond to job offers. You have limited time to accept or decline each offer.
          </CardDescription>
        </CardHeader>
      </Card>

      {jobOffers.length === 0 ? (
        <Card>
          <CardContent className="py-6">
            <div className="text-center text-muted-foreground">
              <p>No active job offers at the moment.</p>
              <p className="text-sm mt-2">New offers will appear here when available.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {jobOffers.map((offer) => (
            <Card key={offer.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{offer.appointments.service_type}</CardTitle>
                    <CardDescription>
                      {offer.appointments.damage_type && `${offer.appointments.damage_type} - `}
                      Customer: {offer.appointments.customer_name}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusColor(offer.expires_at)}>
                    {formatTimeRemaining(offer.expires_at)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">${offer.offered_price}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(offer.appointments.appointment_date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{offer.appointments.appointment_time}</span>
                  </div>
                  
                  {offer.estimated_completion_time && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Est. {offer.estimated_completion_time}</span>
                    </div>
                  )}
                </div>

                {offer.appointments.vehicle_info && (
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {offer.appointments.vehicle_info.make} {offer.appointments.vehicle_info.model} 
                      {offer.appointments.vehicle_info.year && ` (${offer.appointments.vehicle_info.year})`}
                    </span>
                  </div>
                )}

                {offer.appointments.notes && (
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm"><strong>Customer Notes:</strong> {offer.appointments.notes}</p>
                  </div>
                )}

                {offer.notes && (
                  <div className="bg-primary/5 p-3 rounded-md">
                    <p className="text-sm"><strong>DriveX Notes:</strong> {offer.notes}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleJobResponse(offer.id, 'accept')}
                    disabled={respondingTo === offer.id}
                    className="flex-1"
                  >
                    {respondingTo === offer.id ? "Processing..." : "Accept Job"}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        disabled={respondingTo === offer.id}
                        className="flex-1"
                      >
                        Decline
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Decline Job Offer</AlertDialogTitle>
                        <AlertDialogDescription>
                          Please provide a reason for declining this job offer (optional).
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      
                      <div className="space-y-2">
                        <Label htmlFor="decline-reason">Reason for declining</Label>
                        <Textarea
                          id="decline-reason"
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          placeholder="e.g., Fully booked, outside service area, etc."
                        />
                      </div>
                      
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleJobResponse(offer.id, 'decline')}
                          disabled={respondingTo === offer.id}
                        >
                          Decline Job
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopJobOffers;