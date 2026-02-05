import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, MapPin, Car, DollarSign, Calendar, Phone, Mail, CreditCard, AlertTriangle, Image as ImageIcon, Brain, CheckCircle, XCircle, Target, Plus, FileText, ChevronDown, Send, Edit2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import JobOfferUpsells from "./JobOfferUpsells";
import { AdasCalibrationAlert } from "./AdasCalibrationAlert";
import PartsFitmentAlert from "./PartsFitmentAlert";
import { DamageReportViewer } from "@/components/insurer/DamageReportViewer";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ShopPriceOfferDialog } from "./ShopPriceOfferDialog";

interface JobOffer {
  id: string;
  appointment_id: string;
  shop_id: string;
  offered_price: number;
  status: string;
  expires_at: string;
  estimated_completion_time: string | null;
  notes: string;
  offered_at?: string;
  responded_at?: string;
  requires_adas_calibration?: boolean;
  adas_calibration_notes?: string;
  is_direct_booking?: boolean;
  is_insurer_selection?: boolean;
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
    short_code?: string;
    customer_shop_selection?: string;
    workflow_stage?: string;
    appointment_confirmed_at?: string;
    total_cost?: number;
  };
}

interface ShopJobOffersProps {
  shopId: string;
  shop?: any;
}

const ShopJobOffers = ({ shopId, shop }: ShopJobOffersProps) => {
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<JobOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [priceOfferDialogOpen, setPriceOfferDialogOpen] = useState(false);
  const [selectedJobForPricing, setSelectedJobForPricing] = useState<JobOffer | null>(null);
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const { toast } = useToast();
  const { t } = useTranslation(['shop', 'common', 'forms']);

  useEffect(() => {
    fetchJobOffers();
    
    // Subscribe to realtime updates for job offers and appointments
    const jobOffersChannel = supabase
      .channel(`job-offers-${shopId}`)
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'job_offers', filter: `shop_id=eq.${shopId}` },
        () => {
          console.log('Job offer updated, refetching...');
          fetchJobOffers();
        }
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'appointments', filter: `shop_id=eq.${shopId}` },
        () => {
          console.log('New appointment created, refetching...');
          fetchJobOffers();
        }
      )
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `shop_id=eq.${shopId}` },
        () => {
          console.log('Appointment updated, refetching...');
          fetchJobOffers();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(jobOffersChannel);
    };
  }, [shopId]);

  const fetchJobOffers = async () => {
    try {
      // Fetch pending job offers (from insurance routing via job_offers table)
      const { data: offersData, error: offersError } = await supabase
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
            driver_view_obstruction,
            short_code,
            appointment_confirmed_at
          )
        `)
        .eq('shop_id', shopId)
        .eq('status', 'offered')
        .gte('expires_at', new Date().toISOString())
        .order('offered_at', { ascending: false });

      if (offersError) throw offersError;

      // Fetch insurer shop selections where this shop has been suggested (new workflow)
      const { data: insurerSelections, error: selectionsError } = await supabase
        .from('insurer_shop_selections')
        .select(`
          id,
          appointment_id,
          shop_id,
          priority_order,
          estimated_price,
          distance_km,
          created_at,
          appointments (
            id,
            shop_id,
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
            driver_view_obstruction,
            short_code,
            customer_shop_selection,
            workflow_stage,
            appointment_confirmed_at
          )
        `)
        .eq('shop_id', shopId);

      if (selectionsError) throw selectionsError;

      console.log('Insurer selections found for shop:', shopId, insurerSelections?.length || 0);
      
      // Transform insurer selections to JobOffer format
      // Only show pending ones where customer hasn't selected yet AND appointment not yet assigned to this shop
      const insurerSelectionsAsOffers: JobOffer[] = (insurerSelections || [])
        .filter((selection: any) => {
          const appointment = selection.appointments;
          if (!appointment) {
            console.log('Selection has no appointment:', selection.id);
            return false;
          }
          // Only show if appointment is still pending (shop_id = 'pending') and workflow is shop_selection
          const shouldShow = appointment.shop_id === 'pending' && appointment.workflow_stage === 'shop_selection';
          console.log('Selection filter:', selection.id, 'shop_id:', appointment.shop_id, 'workflow_stage:', appointment.workflow_stage, 'shouldShow:', shouldShow);
          return shouldShow;
        })
        .map((selection: any) => {
          const appointmentDate = new Date(selection.appointments.appointment_date);
          appointmentDate.setHours(16, 0, 0, 0);
          
          return {
            id: `selection-${selection.id}`,
            appointment_id: selection.appointment_id,
            shop_id: selection.shop_id,
            offered_price: selection.estimated_price || 0,
            status: 'offered',
            offered_at: selection.created_at,
            expires_at: appointmentDate.toISOString(),
            estimated_completion_time: null,
            notes: '',
            appointments: selection.appointments,
            is_direct_booking: false,
            is_insurer_selection: true
          };
        });
      
      // Get ALL appointment IDs that have any job offers for this shop (any status)
      // This prevents showing direct bookings when a job offer exists (even if declined)
      const { data: allOffersForShop, error: allOffersError } = await supabase
        .from('job_offers')
        .select('appointment_id')
        .eq('shop_id', shopId);
      
      if (allOffersError) throw allOffersError;
      
      const appointmentIdsWithAnyOffers = new Set(
        (allOffersForShop || []).map((offer: any) => offer.appointment_id).filter(Boolean)
      );

      // Also exclude appointments already shown via insurer selections
      const insurerSelectionAppointmentIds = new Set(
        insurerSelectionsAsOffers.map(o => o.appointment_id)
      );

      // Fetch pending direct bookings (no job offer created)
      const { data: directBookings, error: directError } = await supabase
        .from('appointments')
        .select('*')
        .eq('shop_id', shopId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (directError) throw directError;
      
      // Filter out appointments that have ANY job offers or insurer selections to avoid duplicates
      const filteredDirectBookings = (directBookings || []).filter(
        booking => !appointmentIdsWithAnyOffers.has(booking.id) && !insurerSelectionAppointmentIds.has(booking.id)
      );

      // Transform direct bookings to match JobOffer structure
      const directBookingsAsOffers: JobOffer[] = filteredDirectBookings.map(booking => {
        // Set expires_at to appointment date at 16:00
        const appointmentDate = new Date(booking.appointment_date);
        appointmentDate.setHours(16, 0, 0, 0);
        
        return {
          id: booking.id,
          appointment_id: booking.id,
          shop_id: booking.shop_id,
          offered_price: booking.total_cost || 0,
          status: 'offered',
          offered_at: booking.created_at,
          expires_at: appointmentDate.toISOString(),
          estimated_completion_time: null,
          notes: '',
          appointments: booking,
          is_direct_booking: true
        };
      });

      // Combine all offer types
      const allOffers: JobOffer[] = [
        ...((offersData as JobOffer[])?.filter(offer => offer.appointments !== null) || []),
        ...insurerSelectionsAsOffers,
        ...directBookingsAsOffers
      ].sort((a, b) => new Date(b.offered_at || 0).getTime() - new Date(a.offered_at || 0).getTime());

      setJobOffers(allOffers);

      // Fetch accepted jobs from job offers
      const { data: acceptedData, error: acceptedError } = await supabase
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
            driver_view_obstruction,
            short_code,
            appointment_confirmed_at,
            workflow_stage,
            total_cost
          )
        `)
        .eq('shop_id', shopId)
        .eq('status', 'accepted')
        .order('offered_at', { ascending: false });

      if (acceptedError) throw acceptedError;
      
      // Get appointment IDs that have accepted job offers
      const acceptedAppointmentIds = new Set(
        (acceptedData || []).map((offer: any) => offer.appointment_id).filter(Boolean)
      );
      
      // Fetch confirmed direct bookings that DON'T have an associated job offer
      const { data: confirmedBookings, error: confirmedError } = await supabase
        .from('appointments')
        .select('*')
        .eq('shop_id', shopId)
        .in('status', ['confirmed', 'pending'])
        .in('workflow_stage', ['customer_handover', 'shop_selection', 'damage_report', 'cost_approval'])
        .order('created_at', { ascending: false });

      if (confirmedError) throw confirmedError;

      // Filter out confirmed bookings that already have an accepted job offer to avoid duplicates
      const filteredConfirmedBookings = (confirmedBookings || []).filter(
        booking => !acceptedAppointmentIds.has(booking.id)
      );

      // Check which confirmed bookings came from insurer selections
      const { data: confirmedInsurerSelections } = await supabase
        .from('insurer_shop_selections')
        .select('appointment_id')
        .eq('shop_id', shopId);
      
      const acceptedInsurerSelectionIds = new Set(
        (confirmedInsurerSelections || []).map((s: any) => s.appointment_id)
      );

      // Transform confirmed bookings to match JobOffer structure
      const confirmedBookingsAsJobs: JobOffer[] = filteredConfirmedBookings.map(booking => ({
        id: booking.id,
        appointment_id: booking.id,
        shop_id: booking.shop_id,
        offered_price: booking.total_cost || 0,
        status: 'accepted',
        offered_at: booking.created_at,
        responded_at: booking.updated_at,
        expires_at: '',
        estimated_completion_time: null,
        notes: '',
        appointments: booking,
        is_direct_booking: !acceptedInsurerSelectionIds.has(booking.id),
        is_insurer_selection: acceptedInsurerSelectionIds.has(booking.id)
      }));

      // Combine both types
      const allAccepted: JobOffer[] = [
        ...((acceptedData as JobOffer[])?.filter(offer => offer.appointments !== null) || []),
        ...confirmedBookingsAsJobs
      ].sort((a, b) => new Date(b.offered_at || 0).getTime() - new Date(a.offered_at || 0).getTime());

      setAcceptedJobs(allAccepted);
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
      // Check the type of offer
      const offer = jobOffers.find(o => o.id === jobOfferId);
      const isDirectBooking = offer?.is_direct_booking;
      const isInsurerSelection = offer?.is_insurer_selection;
      
      // Get the edited price or use the original
      const finalPrice = editedPrices[jobOfferId] ?? offer?.offered_price ?? 0;

      if (isDirectBooking) {
        // Handle direct booking - update appointment status directly
        if (response === 'accept') {
          const { error } = await supabase
            .from('appointments')
            .update({ 
              status: 'confirmed',
              total_cost: finalPrice,
              workflow_stage: 'damage_report'
            })
            .eq('id', jobOfferId);
          
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('appointments')
            .update({ 
              status: 'cancelled',
              notes: declineReason || 'Declined by shop'
            })
            .eq('id', jobOfferId);
          
          if (error) throw error;
        }
      } else if (isInsurerSelection || offer?.appointment_id) {
        // Handle insurer selection or job offers with appointment - update appointment
        const appointmentId = offer?.appointment_id;
        if (!appointmentId) throw new Error('No appointment ID found');

        if (response === 'accept') {
          // Update the appointment with shop info and move to damage_report stage
          const { error: appointmentError } = await supabase
            .from('appointments')
            .update({ 
              shop_id: shopId,
              shop_name: shop?.name || 'Selected Shop',
              status: 'confirmed',
              total_cost: finalPrice,
              workflow_stage: 'damage_report'
            })
            .eq('id', appointmentId);
          
          if (appointmentError) throw appointmentError;
          
          // Also update the job offer if it exists
          if (!isInsurerSelection && !jobOfferId.startsWith('selection-')) {
            await supabase
              .from('job_offers')
              .update({
                status: 'accepted',
                responded_at: new Date().toISOString(),
                offered_price: finalPrice
              })
              .eq('id', jobOfferId);
          }
        } else {
          if (isInsurerSelection) {
            // Remove the shop from insurer selections for this appointment
            const selectionId = jobOfferId.replace('selection-', '');
            const { error } = await supabase
              .from('insurer_shop_selections')
              .delete()
              .eq('id', selectionId);
            
            if (error) throw error;
          } else {
            // Handle job offer decline via edge function
            const { error } = await supabase.functions.invoke('handle-job-response', {
              body: {
                jobOfferId,
                response,
                declineReason: declineReason || undefined
              }
            });

            if (error) throw error;
          }
        }
      } else {
        // Handle job offer (insurance routing via job_offers table) - call edge function
        const { error } = await supabase.functions.invoke('handle-job-response', {
          body: {
            jobOfferId,
            response,
            declineReason: response === 'decline' ? declineReason : undefined,
            offeredPrice: response === 'accept' ? finalPrice : undefined
          }
        });

        if (error) throw error;
      }

      toast({
        title: response === 'accept' ? t('offers.job_accepted_title') : t('offers.job_declined_title'),
        description: response === 'accept' 
          ? t('offers.job_accepted_description')
          : t('offers.job_declined_description')
      });

      // Clear edited price and refresh
      setEditedPrices(prev => {
        const newPrices = { ...prev };
        delete newPrices[jobOfferId];
        return newPrices;
      });
      fetchJobOffers();
      setDeclineReason("");
    } catch (error: any) {
      console.error('Error responding to job offer:', error);
      toast({
        title: t('offers.error_title'),
        description: t('offers.response_error'),
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
            <p className="mt-2 text-muted-foreground">{t('offers.loading_offers')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending">
            {t('offers.pending_offers')}
            {jobOffers.length > 0 && (
              <Badge variant="secondary" className="ml-2">{jobOffers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="accepted">
            {t('offers.accepted_jobs')}
            {acceptedJobs.length > 0 && (
              <Badge variant="default" className="ml-2">{acceptedJobs.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {jobOffers.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-muted-foreground">
                  <p>{t('offers.no_offers')}</p>
                  <p className="text-sm mt-2">{t('offers.new_offers_hint')}</p>
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
                    <CardTitle className="text-2xl mb-2">{offer.appointments.service_type}</CardTitle>
                    
                    {/* Tracking Code */}
                    {offer.appointments.short_code && (
                      <div className="text-xs mb-3">
                        <span className="text-muted-foreground">{t('offers.tracking_code')}:</span>
                        <span className="ml-2 font-mono font-bold text-primary">{offer.appointments.short_code}</span>
                      </div>
                    )}
                    
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
                              <span>{t('offers.license')}: {offer.appointments.vehicle_info.license_plate}</span>
                            )}
                            {offer.appointments.vehicle_info.license_plate && offer.appointments.vehicle_info.vin && " • "}
                            {offer.appointments.vehicle_info.vin && (
                              <span>{t('offers.vin')}: {offer.appointments.vehicle_info.vin}</span>
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
                            <span className="font-semibold text-blue-900 text-sm">{t('offers.ai_assessment')}</span>
                            <Badge variant={offer.appointments.ai_confidence_score >= 0.9 ? "default" : "secondary"} className="text-xs">
                              {Math.round(offer.appointments.ai_confidence_score * 100)}% {t('offers.confident')}
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
                          {t('offers.insurance_claim')}
                        </Badge>
                      )}
                       {offer.appointments.damage_type && (
                         <Badge variant="outline" className="flex items-center gap-1">
                           <AlertTriangle className="h-3 w-3" />
                           {t(`damage_types.${offer.appointments.damage_type.toLowerCase()}`, { ns: 'common', defaultValue: offer.appointments.damage_type })}
                         </Badge>
                       )}
                       {offer.requires_adas_calibration && (
                         <Badge variant="destructive" className="text-xs">
                           {t('offers.adas_required', { ns: 'insurer', defaultValue: 'ADAS Required' })}
                         </Badge>
                       )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Damage Photos */}
                {offer.appointments.damage_photos && offer.appointments.damage_photos.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      {t('offers.damage_photos')} ({offer.appointments.damage_photos.length})
                      <Badge variant="outline" className="text-xs ml-2">
                        <Target className="h-3 w-3 mr-1" />
                        {t('offers.ai_assessment')}
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
                      <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-950/20">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-medium">$</span>
                            <Input
                              type="number"
                              value={editedPrices[offer.id] ?? offer.offered_price}
                              onChange={(e) => setEditedPrices(prev => ({
                                ...prev,
                                [offer.id]: parseFloat(e.target.value) || 0
                              }))}
                              className="w-32 font-medium text-lg h-9 border-green-300 focus:border-green-500 focus:ring-green-500"
                              min={0}
                              step={0.01}
                            />
                            {editedPrices[offer.id] !== undefined && editedPrices[offer.id] !== offer.offered_price && (
                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-300">
                                <Edit2 className="h-3 w-3 mr-1" />
                                Edited
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-green-700 dark:text-green-400 mt-1 font-medium">{t('offers.your_price_offer', 'Your Price Offer')}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">
                            {offer.is_insurer_selection 
                              ? t('time.tbd', { ns: 'common' })
                              : new Date(offer.appointments.appointment_date).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">Appointment Date</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-orange-600" />
                        <div>
                          <p className="font-medium">
                            {offer.is_insurer_selection 
                              ? t('time.tbd', { ns: 'common' })
                              : offer.appointments.appointment_time.substring(0, 5)}
                          </p>
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

                {/* Damage Report Section - available after customer has booked */}
                {offer.appointments.appointment_confirmed_at && (
                  <Collapsible className="mt-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between px-3 h-10 text-sm text-muted-foreground hover:text-foreground border border-dashed">
                        <span className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {t('offers.damage_report', 'Damage Report')}
                        </span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <DamageReportViewer 
                        appointmentId={offer.appointment_id} 
                        damageType={offer.appointments.damage_type} 
                      />
                    </CollapsibleContent>
                  </Collapsible>
                )}

                  {/* Parts Fitment Alert */}
                  {offer.appointments.vehicle_info?.make && offer.appointments.vehicle_info?.year && offer.appointments.damage_type && (
                    <PartsFitmentAlert
                      vehicleInfo={{
                        make: offer.appointments.vehicle_info.make,
                        model: offer.appointments.vehicle_info.model,
                        year: parseInt(offer.appointments.vehicle_info.year) || new Date().getFullYear()
                      }}
                      damageType={offer.appointments.damage_type}
                      jobOfferId={offer.id}
                      shopId={offer.shop_id}
                      onPartsSourced={fetchJobOffers}
                    />
                  )}

                  {/* ADAS Calibration Alert */}
                  <AdasCalibrationAlert
                    requiresCalibration={offer.requires_adas_calibration || false}
                    calibrationReason={offer.adas_calibration_notes || undefined}
                    shopHasCapability={shop?.adas_calibration_capability || false}
                    onDecline={() => handleJobResponse(offer.id, 'decline')}
                  />

                 {/* Upsell Services Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Additional Services
                  </h4>
                  <JobOfferUpsells 
                    jobOfferId={offer.id} 
                    shopId={offer.shop_id}
                    onUpsellsChange={fetchJobOffers}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    onClick={() => handleJobResponse(offer.id, 'accept')}
                    disabled={respondingTo === offer.id}
                    className="flex-1 text-lg py-6"
                    size="lg"
                  >
                    {respondingTo === offer.id ? t('offers.processing') : t('offers.accept_job')}
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        disabled={respondingTo === offer.id}
                        className="flex-1 text-lg py-6"
                        size="lg"
                      >
                        {t('offers.decline')}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t('offers.decline')} {t('offers.title', { defaultValue: 'Job Offer' })}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t('offers.decline_placeholder')}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      
                      <div className="space-y-2">
                        <Label htmlFor="decline-reason">{t('offers.decline_reason')}</Label>
                        <Textarea
                          id="decline-reason"
                          value={declineReason}
                          onChange={(e) => setDeclineReason(e.target.value)}
                          placeholder={t('offers.decline_placeholder')}
                        />
                      </div>
                       
                       <AlertDialogFooter>
                         <AlertDialogCancel>{t('cancel', { ns: 'common' })}</AlertDialogCancel>
                         <AlertDialogAction
                           onClick={() => handleJobResponse(offer.id, 'decline')}
                           disabled={respondingTo === offer.id}
                         >
                           {t('offers.confirm_decline')}
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
        </TabsContent>

        <TabsContent value="accepted" className="mt-6">
          {acceptedJobs.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <div className="text-center text-muted-foreground">
                  <p>No accepted jobs yet.</p>
                  <p className="text-sm mt-2">Accepted jobs will appear here.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {acceptedJobs.map((offer) => {
                if (!offer.appointments) {
                  console.warn('Job offer missing appointments data:', offer.id);
                  return null;
                }
                
                return (
                  <Card key={offer.id} className="border-l-4 border-l-green-500 overflow-hidden">
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-2xl mb-2">{offer.appointments.service_type}</CardTitle>
                          
                          {/* Tracking Code */}
                          {offer.appointments.short_code && (
                            <div className="text-xs mb-3">
                              <span className="text-muted-foreground">Tracking Code:</span>
                              <span className="ml-2 font-mono font-bold text-primary">{offer.appointments.short_code}</span>
                            </div>
                          )}
                          
                          {offer.appointments.vehicle_info && (
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center gap-2">
                                <Car className="h-5 w-5 text-gray-600" />
                                <span className="text-lg font-semibold text-gray-700">
                                  {offer.appointments.vehicle_info.make} {offer.appointments.vehicle_info.model}
                                  {offer.appointments.vehicle_info.year && ` (${offer.appointments.vehicle_info.year})`}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex gap-2 mt-3">
                            <Badge variant="default" className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {t('calendar.status.accepted')}
                            </Badge>
                            {offer.appointments.is_insurance_claim && (
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <CreditCard className="h-3 w-3" />
                                {t('offers.insurance_claim')}
                              </Badge>
                            )}
                            {offer.appointments.damage_type && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {t(`damage_types.${offer.appointments.damage_type.toLowerCase()}`, { ns: 'common', defaultValue: offer.appointments.damage_type })}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <h4 className="font-semibold text-lg">Job Details</h4>
                          
                          {/* Price Section - Editable when no price set yet */}
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              {offer.appointments.total_cost ? (
                                <>
                                  <p className="font-medium text-lg">€{offer.appointments.total_cost}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {offer.appointments.workflow_stage === 'cost_approval' 
                                      ? 'Approved by Insurer' 
                                      : offer.appointments.workflow_stage === 'damage_report'
                                        ? 'Pending Insurer Review'
                                        : 'Your Price Offer'}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="font-medium text-lg text-muted-foreground">Not set</p>
                                  <p className="text-sm text-muted-foreground">Click to set price</p>
                                </>
                              )}
                            </div>
                            {/* Edit price button - always visible when in customer_handover or damage_report without submitted price */}
                            {(offer.appointments.workflow_stage === 'customer_handover' || offer.appointments.workflow_stage === 'damage_report') && !offer.appointments.total_cost && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedJobForPricing(offer);
                                  setPriceOfferDialogOpen(true);
                                }}
                              >
                                Set Price
                              </Button>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">
                                {offer.is_insurer_selection && !offer.appointments.appointment_confirmed_at
                                  ? t('time.tbd', { ns: 'common' })
                                  : new Date(offer.appointments.appointment_date).toLocaleDateString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {offer.appointments.appointment_confirmed_at 
                                  ? 'Customer Confirmed' 
                                  : 'Appointment Date'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <Clock className="h-5 w-5 text-orange-600" />
                            <div>
                              <p className="font-medium">
                                {offer.is_insurer_selection && !offer.appointments.appointment_confirmed_at
                                  ? t('time.tbd', { ns: 'common' })
                                  : offer.appointments.appointment_time.substring(0, 5)}
                              </p>
                              <p className="text-sm text-muted-foreground">Appointment Time</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="font-semibold text-lg">Customer Information</h4>
                          
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-blue-600" />
                            <div>
                              <p className="font-medium">{offer.appointments.customer_name}</p>
                              <p className="text-sm text-muted-foreground">{offer.appointments.customer_email}</p>
                            </div>
                          </div>
                          
                          {offer.appointments.customer_phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">{offer.appointments.customer_phone}</p>
                                <p className="text-sm text-muted-foreground">Phone</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Price Action Section - Shows appropriate UI based on workflow state */}
                      {(offer.appointments.workflow_stage === 'customer_handover' || offer.appointments.workflow_stage === 'damage_report') && !offer.appointments.total_cost && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-amber-900">{t('offers.price_offer_required', 'Price Offer Required')}</h4>
                                <p className="text-sm text-amber-700">{t('offers.price_offer_description', 'Set your pricing in Job Details above, then confirm to send for insurer review')}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setSelectedJobForPricing(offer);
                                  setPriceOfferDialogOpen(true);
                                }}
                                className="gap-2"
                              >
                                <DollarSign className="h-4 w-4" />
                                {t('offers.set_price', 'Set Price')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show submitted price badge when price is submitted and awaiting approval */}
                      {(offer.appointments.workflow_stage === 'customer_handover' || offer.appointments.workflow_stage === 'damage_report') && offer.appointments.total_cost && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-blue-600" />
                            <div>
                              <h4 className="font-semibold text-blue-900">{t('offers.price_submitted', 'Price Submitted')}: €{offer.appointments.total_cost}</h4>
                              <p className="text-sm text-blue-700">
                                {t('offers.awaiting_insurer_approval', 'Awaiting insurer approval')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Show approved status when in cost_approval */}
                      {offer.appointments.workflow_stage === 'cost_approval' && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div>
                              <h4 className="font-semibold text-green-900">{t('offers.insurer_approved', 'Insurer Approved')}: €{offer.appointments.total_cost}</h4>
                              <p className="text-sm text-green-700">
                                {t('offers.awaiting_customer_confirmation', 'Awaiting customer confirmation')}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Damage Report Section - always available for accepted jobs */}
                      <Collapsible className="mt-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm" className="w-full justify-between px-3 h-10 text-sm text-muted-foreground hover:text-foreground border border-dashed">
                            <span className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              {t('offers.damage_report', 'Damage Report')}
                            </span>
                            <ChevronDown className="h-4 w-4 transition-transform duration-200" />
                          </Button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="pt-3">
                          <DamageReportViewer 
                            appointmentId={offer.appointment_id} 
                            damageType={offer.appointments.damage_type} 
                          />
                        </CollapsibleContent>
                      </Collapsible>
                    </CardContent>
                  </Card>
                );
              }).filter(Boolean)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Price Offer Dialog */}
      {selectedJobForPricing && (
        <ShopPriceOfferDialog
          open={priceOfferDialogOpen}
          onOpenChange={setPriceOfferDialogOpen}
          appointmentId={selectedJobForPricing.appointment_id}
          shopId={shopId}
          currentGlassType={selectedJobForPricing.appointments.service_type}
          currentDamageType={selectedJobForPricing.appointments.damage_type}
          onSuccess={() => {
            fetchJobOffers();
            setSelectedJobForPricing(null);
          }}
        />
      )}
     </div>
   );
 };
 
 export default ShopJobOffers;