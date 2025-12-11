import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CustomerJobTimeline } from "@/components/customer/CustomerJobTimeline";
import { CustomerJobNotifications } from "@/components/customer/CustomerJobNotifications";
import { RescheduleDialog } from "@/components/customer/RescheduleDialog";
import { CancelAppointmentDialog } from "@/components/customer/CancelAppointmentDialog";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { formatInsurerName, formatServiceType } from "@/lib/utils";
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
    vin?: string;
  };
  additional_notes?: string;
  shop_name: string;
  shop_id: string;
  insurer_name?: string;
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
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  useEffect(() => {
    if (appointmentId) {
      fetchJobDetails();
    }
  }, [appointmentId]);

  const fetchJobDetails = async () => {
    if (!appointmentId) return;

    try {
      // Use secure edge function instead of direct RLS query
      const isShortCode = appointmentId.length === 8;
      const { data, error } = await supabase.functions.invoke('get-job-tracking', {
        body: isShortCode ? { job_code: appointmentId } : { tracking_token: appointmentId }
      });

      if (error) throw error;
      
      if (data?.error) {
        throw new Error(data.error);
      }

      setJobDetails(data.appointment);
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
          <h1 className="text-2xl font-bold text-destructive mb-4">Job Not Found</h1>
          <p className="text-muted-foreground">
            The job tracking link may be invalid or expired. Please check the link and try again.
          </p>
        </div>
      </div>
    );
  }

  const shop = jobDetails.shops;
  const isCancelled = jobDetails.job_status === 'cancelled' || jobDetails.status === 'cancelled';

  // Show only cancelled message for cancelled jobs
  if (isCancelled) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/" className="gap-2">
                <Home className="h-4 w-4" />
                Back to Home
              </Link>
            </Button>
          </div>
          
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Track Your Repair Job</h1>
          </div>

          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <XCircle className="h-5 w-5" />
            <AlertTitle>This Job Has Been Cancelled</AlertTitle>
            <AlertDescription>
              This appointment was cancelled. Please create a new appointment if you still need service.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/" className="gap-2">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Track Your Repair Job</h1>
          <p className="text-muted-foreground">
            Real-time updates for your windshield repair with {jobDetails.shop_name}
          </p>
        </div>

        {/* Job Timeline */}
        <CustomerJobTimeline
          appointmentId={jobDetails.id}
          currentStatus={jobDetails.job_status}
          startedAt={jobDetails.job_started_at}
          completedAt={jobDetails.job_completed_at}
          scheduledDate={jobDetails.appointment_date}
          scheduledTime={jobDetails.appointment_time}
          shopId={jobDetails.shop_id}
          onRescheduleClick={() => setRescheduleOpen(true)}
          onCancelClick={() => setCancelOpen(true)}
        />

        <div className="grid md:grid-cols-2 gap-6">
          {/* Shop Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shop Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">{shop?.name || jobDetails.shop_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Authorized repair facility
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
                        Open in Google Maps <ExternalLink className="h-3 w-3" />
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
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Service Type</p>
                <p className="font-medium">{formatServiceType(jobDetails.service_type)}</p>
                {jobDetails.damage_type && (
                  <p className="text-sm text-muted-foreground">{jobDetails.damage_type}</p>
                )}
              </div>
              {jobDetails.insurer_name && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Insurer</p>
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
                      Vehicle Information
                    </p>
                    <div className="space-y-1 mt-2">
                      <p className="font-medium">
                        {jobDetails.vehicle_info.year} {jobDetails.vehicle_info.make} {jobDetails.vehicle_info.model}
                      </p>
                      {jobDetails.vehicle_info.licensePlate && (
                        <p className="text-sm text-muted-foreground">
                          License Plate: {jobDetails.vehicle_info.licensePlate}
                        </p>
                      )}
                      {jobDetails.vehicle_info.vin && (
                        <p className="text-sm text-muted-foreground">
                          VIN: {jobDetails.vehicle_info.vin}
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
              
              {jobDetails.total_cost && (
              <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Estimated Cost
                    </p>
                    <p className="font-medium">
                      {jobDetails.total_cost !== undefined && jobDetails.total_cost !== null ? `€${jobDetails.total_cost}` : 'Not yet available'}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Customer Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Your Contact Information</CardTitle>
              <CardDescription>
                Keep your contact details up to date
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{jobDetails.customer_name}</p>
              </div>
              
              <Separator />
              
              {jobDetails.customer_email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
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
                      <p className="text-sm text-muted-foreground">Phone</p>
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
