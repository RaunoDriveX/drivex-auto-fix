import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Trash2, Car, Calendar, Clock, User, Building2 } from "lucide-react";
import { format } from "date-fns";
import { formatServiceType, formatInsurerName } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DeclinedJob {
  id: string;
  offered_price: number;
  decline_reason: string | null;
  responded_at: string | null;
  appointment: {
    id: string;
    customer_name: string;
    appointment_date: string;
    appointment_time: string;
    service_type: string;
    insurer_name: string | null;
    vehicle_info: any;
    short_code: string | null;
  } | null;
}

interface ShopDeclinedJobsProps {
  shopId: string;
}

const ShopDeclinedJobs = ({ shopId }: ShopDeclinedJobsProps) => {
  const [declinedJobs, setDeclinedJobs] = useState<DeclinedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeclinedJobs();
  }, [shopId]);

  const fetchDeclinedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('job_offers')
        .select(`
          id,
          offered_price,
          decline_reason,
          responded_at,
          appointment:appointments (
            id,
            customer_name,
            appointment_date,
            appointment_time,
            service_type,
            insurer_name,
            vehicle_info,
            short_code
          )
        `)
        .eq('shop_id', shopId)
        .eq('status', 'declined')
        .order('responded_at', { ascending: false });

      if (error) throw error;
      setDeclinedJobs(data || []);
    } catch (error: any) {
      console.error('Error fetching declined jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load declined jobs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    setDeleting(jobId);
    try {
      const { error } = await supabase
        .from('job_offers')
        .delete()
        .eq('id', jobId)
        .eq('shop_id', shopId);

      if (error) throw error;

      setDeclinedJobs(prev => prev.filter(job => job.id !== jobId));
      toast({
        title: "Deleted",
        description: "Declined job removed from history"
      });
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast({
        title: "Error",
        description: "Failed to delete job",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (declinedJobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-muted/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <Trash2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Declined Jobs</h3>
        <p className="text-muted-foreground">
          Jobs you decline will appear here for reference
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-4">
        {declinedJobs.length} declined job{declinedJobs.length !== 1 ? 's' : ''} in history
      </p>
      
      {declinedJobs.map((job) => (
        <Card key={job.id} className="border-muted">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                  Declined
                </Badge>
                {job.appointment?.insurer_name && (
                  <Badge variant="outline">
                    {formatInsurerName(job.appointment.insurer_name)}
                  </Badge>
                )}
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    disabled={deleting === job.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Declined Job</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently remove this job from your declined history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => handleDelete(job.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {job.appointment && (
              <>
                {job.appointment.short_code && (
                  <div className="text-xs mb-2">
                    <span className="text-muted-foreground">Tracking Code: </span>
                    <span className="font-mono font-bold text-primary">{job.appointment.short_code}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{job.appointment.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(job.appointment.appointment_date), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{job.appointment.appointment_time.slice(0, 5)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span>{formatServiceType(job.appointment.service_type)}</span>
                  </div>
                </div>

                {job.appointment.vehicle_info && (
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {job.appointment.vehicle_info.make} {job.appointment.vehicle_info.model} ({job.appointment.vehicle_info.year})
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Offered: </span>
                    <span className="font-medium">€{job.offered_price}</span>
                  </div>
                  {job.responded_at && (
                    <div className="text-xs text-muted-foreground">
                      Declined on {format(new Date(job.responded_at), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>

                {job.decline_reason && (
                  <div className="text-sm bg-muted/50 p-2 rounded">
                    <span className="text-muted-foreground">Reason: </span>
                    {job.decline_reason}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ShopDeclinedJobs;
