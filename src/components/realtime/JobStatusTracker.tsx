import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle, AlertCircle, PlayCircle, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface JobStatusTrackerProps {
  appointmentId: string;
  className?: string;
}

interface JobStatus {
  job_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  job_started_at?: string;
  job_completed_at?: string;
  estimated_completion?: string;
  updated_at: string;
}

interface StatusAudit {
  id: string;
  old_status: string;
  new_status: string;
  status_changed_at: string;
  notes?: string;
  changed_by_shop_id: string;
}

const statusConfig = {
  scheduled: {
    icon: Clock,
    label: 'Scheduled',
    color: 'bg-blue-500',
    textColor: 'text-blue-700',
    bgColor: 'bg-blue-50',
    progress: 25
  },
  in_progress: {
    icon: PlayCircle,
    label: 'In Progress',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
    progress: 75
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
    progress: 100
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'bg-red-500',
    textColor: 'text-red-700',
    bgColor: 'bg-red-50',
    progress: 0
  }
};

export const JobStatusTracker: React.FC<JobStatusTrackerProps> = ({ 
  appointmentId, 
  className 
}) => {
  const [jobStatus, setJobStatus] = useState<JobStatus | null>(null);
  const [statusHistory, setStatusHistory] = useState<StatusAudit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobStatus();
    fetchStatusHistory();
    
    // Subscribe to real-time updates
    const appointmentChannel = supabase
      .channel('appointment-status-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments',
          filter: `id=eq.${appointmentId}`
        },
        (payload) => {
          console.log('Real-time appointment update:', payload);
          setJobStatus(payload.new as JobStatus);
        }
      )
      .subscribe();

    const auditChannel = supabase
      .channel('audit-log-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_status_audit',
          filter: `appointment_id=eq.${appointmentId}`
        },
        (payload) => {
          console.log('Real-time audit update:', payload);
          setStatusHistory(prev => [payload.new as StatusAudit, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentChannel);
      supabase.removeChannel(auditChannel);
    };
  }, [appointmentId]);

  const fetchJobStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('job_status, job_started_at, job_completed_at, estimated_completion, updated_at')
        .eq('id', appointmentId)
        .single();

      if (error) {
        console.error('Error fetching job status:', error);
        return;
      }

      setJobStatus(data);
    } catch (error) {
      console.error('Error fetching job status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatusHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('job_status_audit')
        .select(`
          id,
          old_status,
          new_status,
          status_changed_at,
          notes,
          changed_by_shop_id,
          shops!changed_by_shop_id(name)
        `)
        .eq('appointment_id', appointmentId)
        .order('status_changed_at', { ascending: false });

      if (error) {
        console.error('Error fetching status history:', error);
        return;
      }

      setStatusHistory(data || []);
    } catch (error) {
      console.error('Error fetching status history:', error);
    }
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-2 bg-muted rounded"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!jobStatus) {
    return (
      <Card className={cn("border-destructive", className)}>
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Status Unavailable
          </CardTitle>
          <CardDescription>
            Unable to load job status information.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const currentConfig = statusConfig[jobStatus.job_status];
  const StatusIcon = currentConfig.icon;

  return (
    <Card className={cn(currentConfig.bgColor, className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <StatusIcon className={cn("h-5 w-5", currentConfig.textColor)} />
            Job Status
          </span>
          <Badge variant="outline" className={currentConfig.textColor}>
            {currentConfig.label}
          </Badge>
        </CardTitle>
        <CardDescription>
          Real-time job progress tracking with audit history
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{currentConfig.progress}%</span>
          </div>
          <Progress value={currentConfig.progress} className="h-2" />
        </div>

        {/* Status Timeline */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Status Timeline</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {statusHistory.map((audit, index) => {
              const config = statusConfig[audit.new_status as keyof typeof statusConfig];
              const AuditIcon = config.icon;
              
              return (
                <div
                  key={audit.id}
                  className={cn(
                    "flex items-start gap-3 p-2 rounded-lg",
                    index === 0 ? "bg-background border" : "bg-background/50"
                  )}
                >
                  <div className={cn("rounded-full p-1", config.color)}>
                    <AuditIcon className="h-3 w-3 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium">
                        {audit.old_status ? 
                          `${statusConfig[audit.old_status as keyof typeof statusConfig]?.label} → ${config.label}` :
                          config.label
                        }
                      </p>
                      <time className="text-xs text-muted-foreground">
                        {format(new Date(audit.status_changed_at), 'HH:mm')}
                      </time>
                    </div>
                    {audit.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {audit.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            
            {statusHistory.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                No status history available
              </p>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t text-xs">
          {jobStatus.job_started_at && (
            <div>
              <span className="text-muted-foreground">Started:</span>
              <p className="font-medium">
                {format(new Date(jobStatus.job_started_at), 'MMM d, HH:mm')}
              </p>
            </div>
          )}
          
          {jobStatus.job_completed_at && (
            <div>
              <span className="text-muted-foreground">Completed:</span>
              <p className="font-medium">
                {format(new Date(jobStatus.job_completed_at), 'MMM d, HH:mm')}
              </p>
            </div>
          )}
          
          {jobStatus.estimated_completion && !jobStatus.job_completed_at && (
            <div>
              <span className="text-muted-foreground">Est. Completion:</span>
              <p className="font-medium">
                {format(new Date(jobStatus.estimated_completion), 'MMM d, HH:mm')}
              </p>
            </div>
          )}
          
          <div>
            <span className="text-muted-foreground">Last Updated:</span>
            <p className="font-medium">
              {format(new Date(jobStatus.updated_at), 'MMM d, HH:mm')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};