import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Clock, MapPin, Car, DollarSign, Calendar, Phone, Mail, CreditCard, AlertTriangle, Image as ImageIcon, Brain, CheckCircle, XCircle, Target } from "lucide-react";
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
    is_insurance_claim: boolean;
    damage_photos: string[];
    additional_notes: string;
    ai_confidence_score: number;
    ai_assessment_details: any;
    ai_recommended_repair: string;
    driver_view_obstruction: boolean;
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
            notes,
            is_insurance_claim,
            damage_photos,
            additional_notes,
            ai_confidence_score,
            ai_assessment_details,
            ai_recommended_repair,
            driver_view_obstruction
          )
        `)
        .eq('shop_id', shopId)
        .eq('status', 'offered')
        .gte('expires_at', new Date().toISOString())
        .order('offered_at', { ascending: false });

      if (error) throw error;
      setJobOffers((data as JobOffer[])?.filter(offer => offer.appointments !== null) || []);
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
        <div className="grid gap-6">
          {jobOffers.map((offer) => {
            // Safety check to ensure appointments data exists
            if (!offer.appointments) {
              console.warn('Job offer missing appointments data:', offer.id);
              return null;
            }
            
            return (
            <Card key={offer.id} className="border-l-4 border-l-primary overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Job Type as Title */}
                    <CardTitle className="text-2xl mb-3">{offer.appointments.service_type}</CardTitle>
                    
                    {/* Vehicle Make and Model */}
                    {offer.appointments.vehicle_info && (
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Car className="h-5 w-5 text-gray-600" />
                          <span className="text-lg font-semibold text-gray-700">
                            {offer.appointments.vehicle_info.make} {offer.appointments.vehicle_info.model}
                            {offer.appointments.vehicle_info.year && ` (${offer.appointments.vehicle_info.year})`}
                          </span>
                        </div>
                        {(offer.appointments.vehicle_info.license_plate || offer.appointments.vehicle_info.vin) && (
                          <div className="text-sm text-muted-foreground ml-7">
                            {offer.appointments.vehicle_info.license_plate && (
                              <span>License: {offer.appointments.vehicle_info.license_plate}</span>
                            )}
                            {offer.appointments.vehicle_info.license_plate && offer.appointments.vehicle_info.vin && " • "}
                            {offer.appointments.vehicle_info.vin && (
                              <span>VIN: {offer.appointments.vehicle_info.vin}</span>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* AI Assessment Section - Compact */}
                    {offer.appointments.ai_confidence_score && (
                      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-blue-600" />
                            <span className="font-semibold text-blue-900 text-sm">AI Assessment</span>
                            <Badge variant={offer.appointments.ai_confidence_score >= 0.9 ? "default" : "secondary"} className="text-xs">
                              {Math.round(offer.appointments.ai_confidence_score * 100)}% confident
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1">
                            {!offer.appointments.driver_view_obstruction && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            <span className="text-xs text-green-700 font-medium">Insurance Safe</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                            {offer.appointments.ai_recommended_repair}
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                            {offer.appointments.ai_assessment_details?.size_mm}mm chip
                          </span>
                          <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full">
                            Outside driver view
                          </span>
                        </div>
                        
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-xs text-green-800 font-medium">
                            ⚠️ AI confirms: Standard repair sufficient. Additional work requires customer authorization.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Badges */}
                    <div className="flex gap-2 mt-3">
                      {offer.appointments.is_insurance_claim && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          Insurance Claim
                        </Badge>
                      )}
                      {offer.appointments.damage_type && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {offer.appointments.damage_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(offer.expires_at)} className="text-sm">
                    {formatTimeRemaining(offer.expires_at)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Damage Photos */}
                {offer.appointments.damage_photos && offer.appointments.damage_photos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Damage Photos ({offer.appointments.damage_photos.length})
                      <Badge variant="outline" className="text-xs ml-2">
                        <Target className="h-3 w-3 mr-1" />
                        AI Detected
                      </Badge>
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                       {offer.appointments.damage_photos.map((photoUrl, index) => {
                         const fullImageUrl = photoUrl.startsWith('/') ? `${window.location.origin}${photoUrl}` : photoUrl;
                         console.log('Loading image:', fullImageUrl);
                         
                         return (
                            <div key={index} className="relative aspect-square bg-muted rounded-lg overflow-hidden group">
                              <img
                                src={fullImageUrl}
                                alt={`Damage photo ${index + 1}`}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(fullImageUrl, '_blank')}
                                onError={(e) => {
                                  console.error('Failed to load image:', fullImageUrl);
                                  e.currentTarget.style.display = 'none';
                                }}
                                onLoad={() => {
                                  console.log('Image loaded successfully:', fullImageUrl);
                                }}
                              />
                              {/* AI Detection Indicator */}
                              <div className="absolute top-2 right-2 bg-red-500 border-2 border-white rounded-full w-4 h-4 shadow-lg">
                                <div className="absolute inset-0.5 bg-red-400 rounded-full animate-pulse" />
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-2">
                                <div className="flex items-center justify-between text-white text-xs">
                                  <span>Photo {index + 1}</span>
                                  <div className="flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    <span>6mm chip</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                         );
                       })}
                    </div>
                  </div>
                )}

                {/* Job Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - Job Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Job Details</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-lg">${offer.offered_price}</p>
                          <p className="text-sm text-muted-foreground">Offered Price</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{new Date(offer.appointments.appointment_date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">Appointment Date</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium">{offer.appointments.appointment_time}</p>
                          <p className="text-sm text-muted-foreground">Appointment Time</p>
                        </div>
                      </div>
                      
                      {offer.estimated_completion_time && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-medium">{offer.estimated_completion_time}</p>
                            <p className="text-sm text-muted-foreground">Estimated Duration</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Customer Info */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Customer Information</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{offer.appointments.customer_email}</p>
                          <p className="text-sm text-muted-foreground">Email Address</p>
                        </div>
                      </div>
                      
                      {offer.appointments.customer_phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-medium">{offer.appointments.customer_phone}</p>
                            <p className="text-sm text-muted-foreground">Phone Number</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                {(offer.appointments.notes || offer.appointments.additional_notes || offer.notes) && (
                  <div className="space-y-3">
                    <h4 className="font-semibold">Additional Information</h4>
                    
                    {offer.appointments.notes && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Customer Notes:</p>
                        <p className="text-sm text-blue-800">{offer.appointments.notes}</p>
                      </div>
                    )}

                    {offer.appointments.additional_notes && (
                      <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                        <p className="text-sm font-medium text-amber-900 mb-1">Additional Notes:</p>
                        <p className="text-sm text-amber-800">{offer.appointments.additional_notes}</p>
                      </div>
                    )}

                    {offer.notes && (
                      <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
                        <p className="text-sm font-medium text-primary mb-1">DriveX Notes:</p>
                        <p className="text-sm text-primary/80">{offer.notes}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={() => handleJobResponse(offer.id, 'accept')}
                    disabled={respondingTo === offer.id}
                    className="flex-1 text-lg py-6"
                    size="lg"
                  >
                    {respondingTo === offer.id ? "Processing..." : "Accept Job"}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        disabled={respondingTo === offer.id}
                        className="flex-1 text-lg py-6"
                        size="lg"
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
            );
          }).filter(Boolean)}
        </div>
      )}
    </div>
  );
};

export default ShopJobOffers;