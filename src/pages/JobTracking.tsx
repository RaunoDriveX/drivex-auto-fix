import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CustomerJobTimeline } from "@/components/customer/CustomerJobTimeline";
import { CustomerJobNotifications } from "@/components/customer/CustomerJobNotifications";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Car, 
  ExternalLink,
  Calendar,
  DollarSign
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

interface JobDetails {
  id: string;
  customer_name: string;
  service_type: string;
  damage_type?: string;
  appointment_date: string;
  appointment_time: string;
  job_status: string;
  job_started_at?: string;
  job_completed_at?: string;
  estimated_completion?: string;
  total_cost?: number;
  vehicle_info?: any;
  additional_notes?: string;
  shop_name: string;
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

  const getStatusProgress = (status: string) => {
    switch (status) {
      case 'scheduled': return 25;
      case 'in_progress': return 60;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
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

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Track Your Repair Job</h1>
          <p className="text-muted-foreground">
            Real-time updates for your windshield repair with {jobDetails.shop_name}
          </p>
        </div>

        {/* Current Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Current Status
              </CardTitle>
              <Badge 
                variant="secondary" 
                className={`${getStatusColor(jobDetails.job_status)} text-white`}
              >
                {jobDetails.job_status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{getStatusProgress(jobDetails.job_status)}%</span>
              </div>
              <Progress value={getStatusProgress(jobDetails.job_status)} />
            </div>
            
            {jobDetails.estimated_completion && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Estimated completion: {format(new Date(jobDetails.estimated_completion), 'PPpp')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Timeline */}
        <CustomerJobTimeline 
          appointmentId={jobDetails.id}
          currentStatus={jobDetails.job_status}
          startedAt={jobDetails.job_started_at}
          completedAt={jobDetails.job_completed_at}
          scheduledDate={jobDetails.appointment_date}
          scheduledTime={jobDetails.appointment_time}
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
                <p className="text-sm text-muted-foreground">Scheduled Date & Time</p>
                <p className="font-medium">
                  {format(new Date(`${jobDetails.appointment_date} ${jobDetails.appointment_time}`), 'PPpp')}
                </p>
              </div>
              
              <Separator />
              
              <div>
                <p className="text-sm text-muted-foreground">Service Type</p>
                <p className="font-medium">{jobDetails.service_type}</p>
                {jobDetails.damage_type && (
                  <p className="text-sm text-muted-foreground">{jobDetails.damage_type}</p>
                )}
              </div>
              {jobDetails.insurer_name && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Insurer</p>
                    <p className="font-medium">{jobDetails.insurer_name}</p>
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
                    <p className="font-medium">
                      {jobDetails.vehicle_info.year} {jobDetails.vehicle_info.make} {jobDetails.vehicle_info.model}
                    </p>
                  </div>
                </>
              )}
              
              {jobDetails.total_cost && (
              <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <DollarSign className="h-4 w-4" />
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
      </div>
    </div>
  );
}
