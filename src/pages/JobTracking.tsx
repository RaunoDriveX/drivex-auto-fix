import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CustomerJobTimeline } from "@/components/customer/CustomerJobTimeline";
import { CustomerJobNotifications } from "@/components/customer/CustomerJobNotifications";
import { RescheduleDialog } from "@/components/customer/RescheduleDialog";
import { CancelAppointmentDialog } from "@/components/customer/CancelAppointmentDialog";
import { ShopAndScheduleCard } from "@/components/customer/ShopAndScheduleCard";
import { CostApprovalCard } from "@/components/customer/CostApprovalCard";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useMockMode } from "@/hooks/useMockMode";
import { mockJobStages, MockShopSelection, MockCostEstimate } from "@/lib/mockData";
import { useTranslation } from 'react-i18next';
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatInsurerName, formatServiceType, formatDamageType } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Car, 
  ExternalLink,
  Calendar,
  Home,
  XCircle
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface JobDetails {
  id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  service_type: string;
  damage_type?: string;
  appointment_date: string;
  appointment_time: string;
  job_status: string;
  status?: string;
  notes?: string;
  job_started_at?: string;
  job_completed_at?: string;
  estimated_completion?: string;
  total_cost?: number;
  vehicle_info?: {
    year?: number;
    make?: string;
    model?: string;
    licensePlate?: string;
    license_plate?: string;
    vin?: string;
    vehicle_type?: string;
  };
  additional_notes?: string;
  shop_name: string;
  shop_id: string;
  insurer_name?: string;
  workflow_stage?: string;
  customer_shop_selection?: string;
  customer_cost_approved?: boolean;
  tracking_token?: string;
  is_insurer_assigned?: boolean;
  appointment_confirmed_at?: string;
  shops?: {
    name: string;
    phone?: string;
    address: string;
    city: string;
    postal_code: string;
    email?: string;
  };
}

export default function JobTracking() {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const { isMockMode } = useMockMode();
  const { t } = useTranslation('common');
  
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  
  // Customer confirmation states
  const [pendingShopSelections, setPendingShopSelections] = useState<MockShopSelection[] | null>(null);
  const [pendingCostEstimate, setPendingCostEstimate] = useState<MockCostEstimate | null>(null);
  const [confirmationLoading, setConfirmationLoading] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchJobDetails();
    }
  }, [appointmentId, isMockMode]);

  const fetchJobDetails = async () => {
    if (!appointmentId) return;

    // Mock mode handling
    if (isMockMode && appointmentId.startsWith('mock-')) {
      const mockJob = mockJobStages[appointmentId];
      if (mockJob) {
        setJobDetails({
          id: mockJob.id,
          customer_name: mockJob.customer_name,
          customer_email: mockJob.customer_email,
          service_type: mockJob.service_type,
          damage_type: mockJob.damage_type,
          appointment_date: '2025-01-25',
          appointment_time: '10:00',
          job_status: 'scheduled',
          shop_name: 'Mock Shop',
          shop_id: 'mock-shop-1',
          workflow_stage: mockJob.workflow_stage,
          customer_shop_selection: mockJob.customer_shop_selection,
          customer_cost_approved: mockJob.customer_cost_approved,
          vehicle_info: mockJob.vehicle_info
        });
        
        if (mockJob.workflow_stage === 'shop_selection' && mockJob.shop_selections) {
          setPendingShopSelections(mockJob.shop_selections);
        }
        
        if (mockJob.workflow_stage === 'cost_approval' && mockJob.cost_estimate) {
          setPendingCostEstimate(mockJob.cost_estimate);
        }
        
        setLoading(false);
        return;
      }
    }

    try {
      const isShortCode = appointmentId.length === 8;
      const { data, error } = await supabase.functions.invoke('get-job-tracking', {
        body: isShortCode ? { job_code: appointmentId } : { tracking_token: appointmentId }
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      setJobDetails(data.appointment);
      
      // Set pending selections/estimates from API response
      if (data.pendingShopSelections) {
        setPendingShopSelections(data.pendingShopSelections);
      }
      
      if (data.pendingCostEstimate) {
        setPendingCostEstimate(data.pendingCostEstimate);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      toast({
        title: "Error",
        description: "Unable to fetch job details. Please check your link and try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle shop selection is now combined with scheduling in ShopAndScheduleCard
  // This handler is kept for mock mode compatibility
  const handleShopSelect = async (shopId: string) => {
    if (!jobDetails?.tracking_token && !isMockMode) {
      toast({
        title: "Error",
        description: "Unable to confirm selection. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setConfirmationLoading(true);
    
    try {
      if (isMockMode) {
        // Mock mode - just update local state
        setPendingShopSelections(null);
        if (jobDetails) {
          setJobDetails({
            ...jobDetails,
            customer_shop_selection: shopId,
            workflow_stage: 'awaiting_shop_response'
          });
        }
        return;
      }

      // Real mode now uses select_shop_and_schedule action in ShopAndScheduleCard
      await fetchJobDetails();
      
      toast({
        title: "Shop Selected",
        description: "Your shop selection has been confirmed."
      });
    } catch (error: any) {
      console.error('Error selecting shop:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to confirm shop selection.",
        variant: "destructive"
      });
    } finally {
      setConfirmationLoading(false);
    }
  };

  const handleCostApprove = async () => {
    if (!jobDetails?.tracking_token && !isMockMode) {
      toast({
        title: "Error",
        description: "Unable to approve cost. Please try again.",
        variant: "destructive"
      });
      return;
    }

    setConfirmationLoading(true);
    
    try {
      if (isMockMode) {
        // Mock mode - just update local state
        setPendingCostEstimate(null);
        if (jobDetails) {
          setJobDetails({
            ...jobDetails,
            customer_cost_approved: true,
            workflow_stage: 'approved'
          });
        }
        return;
      }

      const { data, error } = await supabase.functions.invoke('confirm-customer-selection', {
        body: {
          tracking_token: jobDetails!.tracking_token,
          action: 'approve_cost'
        }
      });

      if (error || data?.error) {
        throw new Error(data?.error || 'Failed to approve cost');
      }

      // Refresh job details
      await fetchJobDetails();
      
      toast({
        title: "Cost Approved",
        description: "Your cost approval has been confirmed."
      });
    } catch (error: any) {
      console.error('Error approving cost:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve cost.",
        variant: "destructive"
      });
    } finally {
      setConfirmationLoading(false);
    }
  };

  const formatAddress = (shop: any) => {
    if (!shop) return 'Address not available';
    return `${shop.address}, ${shop.city} ${shop.postal_code}`;
  };

  const getGoogleMapsLink = (shop: any) => {
    if (!shop) return '#';
    const address = formatAddress(shop);
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!jobDetails) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto text-center py-12">
          <h1 className="text-2xl font-bold text-destructive mb-4">{t('job_tracking.job_not_found_title')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('job_tracking.job_not_found_description')}
          </p>
          <Button asChild>
            <Link to="/" className="gap-2">
              <Home className="h-4 w-4" />
              {t('job_tracking.back_to_home')}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const shop = jobDetails.shops;
  const isCancelled = jobDetails.job_status === 'cancelled' || jobDetails.status === 'cancelled';
  
  // Determine if customer actions are needed
  // Combined shop + schedule selection when in 'shop_selection' stage
  const needsShopAndSchedule = pendingShopSelections && 
    pendingShopSelections.length > 0 && 
    !jobDetails.customer_shop_selection &&
    jobDetails.workflow_stage === 'shop_selection';
    
  const needsCostApproval = pendingCostEstimate && 
    !jobDetails.customer_cost_approved &&
    jobDetails.workflow_stage === 'cost_approval';

  // Show waiting message when in awaiting_shop_response stage
  const isAwaitingShopResponse = jobDetails.workflow_stage === 'awaiting_shop_response';

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="gap-2">
              <Home className="h-4 w-4" />
              {t('job_tracking.back_to_home')}
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            {isMockMode && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Mock Mode
              </Badge>
            )}
            <LanguageSwitcher />
          </div>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{t('job_tracking.title')}</h1>
          <p className="text-muted-foreground">
            {t('job_tracking.subtitle', { shopName: jobDetails.shop_name })}
          </p>
        </div>

        {/* Cancelled Job Alert */}
        {isCancelled && (
          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <XCircle className="h-5 w-5" />
            <AlertTitle>{t('job_tracking.cancelled_title')}</AlertTitle>
            <AlertDescription>
              {t('job_tracking.cancelled_description')}
            </AlertDescription>
          </Alert>
        )}

        {/* Customer Action Cards with Timeline - Two column layout when shop selection is needed */}
        {needsShopAndSchedule ? (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Shop Selection Card */}
            <div className="flex-1 min-w-0">
              <ShopAndScheduleCard
                shops={pendingShopSelections!}
                appointmentId={jobDetails.id}
                trackingToken={jobDetails.tracking_token}
                onSuccess={fetchJobDetails}
                isLoading={confirmationLoading}
                isMockMode={isMockMode}
              />
            </div>
            
            {/* Right: Job Timeline (sticky on desktop) */}
            <div className="lg:w-80 xl:w-96 shrink-0">
              <div className="lg:sticky lg:top-4">
                <CustomerJobTimeline
                  appointmentId={jobDetails.id}
                  currentStatus={jobDetails.job_status}
                  appointmentStatus={jobDetails.status}
                  workflowStage={jobDetails.workflow_stage}
                  startedAt={jobDetails.job_started_at}
                  completedAt={jobDetails.job_completed_at}
                  scheduledDate={jobDetails.appointment_date}
                  scheduledTime={jobDetails.appointment_time}
                  shopId={jobDetails.shop_id}
                  hasShopAssigned={jobDetails.shop_id !== 'pending' && !!jobDetails.shop_id}
                  appointmentConfirmedAt={jobDetails.appointment_confirmed_at}
                  onRescheduleClick={() => setRescheduleOpen(true)}
                  onCancelClick={() => setCancelOpen(true)}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Waiting for shop response message */}
            {isAwaitingShopResponse && (
              <Alert className="border-blue-200 bg-blue-50">
                <Clock className="h-5 w-5 text-blue-600" />
                <AlertTitle className="text-blue-800">{t('job_tracking.awaiting_shop_title')}</AlertTitle>
                <AlertDescription className="text-blue-700">
                  {t('job_tracking.awaiting_shop_description')}
                </AlertDescription>
              </Alert>
            )}

            {needsCostApproval && (
              <CostApprovalCard
                estimate={pendingCostEstimate!}
                shopName={jobDetails.shop_name}
                onApprove={handleCostApprove}
                isLoading={confirmationLoading}
                isMockMode={isMockMode}
              />
            )}

            {/* Job Timeline - Full width when no shop selection needed */}
            <CustomerJobTimeline
              appointmentId={jobDetails.id}
              currentStatus={jobDetails.job_status}
              appointmentStatus={jobDetails.status}
              workflowStage={jobDetails.workflow_stage}
              startedAt={jobDetails.job_started_at}
              completedAt={jobDetails.job_completed_at}
              scheduledDate={jobDetails.appointment_date}
              scheduledTime={jobDetails.appointment_time}
              shopId={jobDetails.shop_id}
              hasShopAssigned={jobDetails.shop_id !== 'pending' && !!jobDetails.shop_id}
              appointmentConfirmedAt={jobDetails.appointment_confirmed_at}
              onRescheduleClick={() => setRescheduleOpen(true)}
              onCancelClick={() => setCancelOpen(true)}
            />
          </>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Shop Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {t('job_tracking.shop_details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold">{shop?.name || jobDetails.shop_name}</h3>
                  {jobDetails.is_insurer_assigned && (
                    <Badge variant="secondary" className="text-xs">
                      {t('job_tracking.selected_by_insurance')}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('job_tracking.authorized_facility')}
                </p>
              </div>
              
              {shop?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <a 
                    href={`tel:${shop.phone}`}
                    className="text-primary hover:underline"
                  >
                    {shop.phone}
                  </a>
                </div>
              )}
              
              {shop?.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <a 
                    href={`mailto:${shop.email}`}
                    className="text-primary hover:underline"
                  >
                    {shop.email}
                  </a>
                </div>
              )}
              
              {shop && (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm">{formatAddress(shop)}</p>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="p-0 h-auto"
                      asChild
                    >
                      <a 
                        href={getGoogleMapsLink(shop)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        {t('job_tracking.open_in_maps')} <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('job_tracking.appointment_details')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('job_tracking.service_type')}</p>
                <p className="font-medium">{formatServiceType(jobDetails.service_type)}</p>
                {jobDetails.damage_type && (
                  <p className="text-sm text-muted-foreground">{formatDamageType(jobDetails.damage_type)}</p>
                )}
              </div>
              {jobDetails.insurer_name && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('job_tracking.insurer')}</p>
                    <p className="font-medium">{formatInsurerName(jobDetails.insurer_name)}</p>
                  </div>
                </>
              )}
              
              {jobDetails.vehicle_info && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      {t('job_tracking.vehicle_info')}
                    </p>
                    <div className="space-y-1 mt-2">
                      {(jobDetails.vehicle_info.year || jobDetails.vehicle_info.make || jobDetails.vehicle_info.model) && (
                        <p className="font-medium">
                          {jobDetails.vehicle_info.year} {jobDetails.vehicle_info.make} {jobDetails.vehicle_info.model}
                        </p>
                      )}
                      {(jobDetails.vehicle_info.licensePlate || jobDetails.vehicle_info.license_plate) && (
                        <p className="text-sm text-muted-foreground">
                          {t('job_tracking.license_plate')}: {jobDetails.vehicle_info.licensePlate || jobDetails.vehicle_info.license_plate}
                        </p>
                      )}
                      {jobDetails.vehicle_info.vin && (
                        <p className="text-sm text-muted-foreground">
                          {t('job_tracking.vin')}: {jobDetails.vehicle_info.vin}
                        </p>
                      )}
                      {jobDetails.vehicle_info.vehicle_type && (
                        <p className="text-sm text-muted-foreground capitalize">
                          {t('job_tracking.vehicle_type')}: {jobDetails.vehicle_info.vehicle_type}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
              
            </CardContent>
          </Card>

          {/* Customer Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t('job_tracking.your_contact_info')}</CardTitle>
              <CardDescription>
                {t('job_tracking.keep_contact_updated')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('job_tracking.name')}</p>
                <p className="font-medium">{jobDetails.customer_name}</p>
              </div>
              
              <Separator />
              
              {jobDetails.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{t('job_tracking.email')}</p>
                    <a 
                      href={`mailto:${jobDetails.customer_email}`}
                      className="text-primary hover:underline"
                    >
                      {jobDetails.customer_email}
                    </a>
                  </div>
                </div>
              )}
              
              {jobDetails.customer_phone && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">{t('job_tracking.phone')}</p>
                      <a 
                        href={`tel:${jobDetails.customer_phone}`}
                        className="text-primary hover:underline"
                      >
                        {jobDetails.customer_phone}
                      </a>
                    </div>
                  </div>
                </>
              )}
              
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  Need to update your contact details? Contact the shop directly.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications */}
        <CustomerJobNotifications appointmentId={jobDetails.id} />
        
        {jobDetails.additional_notes && (
          <Card>
            <CardHeader>
              <CardTitle>Additional Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{jobDetails.additional_notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Reschedule Dialog */}
        <RescheduleDialog
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          appointmentId={jobDetails.id}
          shopId={jobDetails.shop_id}
          currentDate={jobDetails.appointment_date}
          currentTime={jobDetails.appointment_time}
          onRescheduleSuccess={fetchJobDetails}
        />

        {/* Cancel Dialog */}
        <CancelAppointmentDialog
          open={cancelOpen}
          onOpenChange={setCancelOpen}
          appointmentId={jobDetails.id}
          shopId={jobDetails.shop_id}
          appointmentDate={jobDetails.appointment_date}
          appointmentTime={jobDetails.appointment_time}
          onCancelSuccess={fetchJobDetails}
        />
      </div>
    </div>
  );
}