import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Calendar, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineProps {
  appointmentId: string;
  currentStatus: string;
  startedAt?: string;
  completedAt?: string;
  scheduledDate: string;
  scheduledTime: string;
  shopId: string;
  onRescheduleClick?: () => void;
  onCancelClick?: () => void;
}

interface TimelineEvent {
  id: string;
  appointment_id: string;
  old_status?: string;
  new_status: string;
  status_changed_at: string;
  notes?: string;
  changed_by_shop_id?: string;
  metadata?: any;
}

const statusConfig = {
  scheduled: {
    icon: Calendar,
    label: 'Scheduled',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Your appointment has been scheduled'
  },
  in_progress: {
    icon: Play,
    label: 'In Progress', 
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    description: 'Work has started on your vehicle'
  },
  completed: {
    icon: CheckCircle,
    label: 'Completed',
    color: 'text-green-600', 
    bgColor: 'bg-green-100',
    description: 'Your repair has been completed'
  },
  cancelled: {
    icon: XCircle,
    label: 'Cancelled',
    color: 'text-red-600',
    bgColor: 'bg-red-100', 
    description: 'This appointment was cancelled'
  }
};

export const CustomerJobTimeline: React.FC<TimelineProps> = ({
  appointmentId,
  currentStatus,
  startedAt,
  completedAt,
  scheduledDate,
  scheduledTime,
  shopId,
  onRescheduleClick,
  onCancelClick
}) => {
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTimelineEvents();
    setupRealtimeSubscription();
  }, [appointmentId]);

  const fetchTimelineEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('job_status_audit')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('status_changed_at', { ascending: true });

      if (error) throw error;
      
      setTimelineEvents(data || []);
    } catch (error) {
      console.error('Error fetching timeline events:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('timeline-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'job_status_audit',
          filter: `appointment_id=eq.${appointmentId}`
        },
        (payload) => {
          console.log('New timeline event:', payload);
          setTimelineEvents(prev => [...prev, payload.new as TimelineEvent]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const getTimelineSteps = () => {
    const steps = [
      {
        status: 'scheduled',
        timestamp: `${scheduledDate} ${scheduledTime}`,
        isCompleted: true,
        isCurrent: currentStatus === 'scheduled',
        notes: 'Appointment confirmed and scheduled'
      }
    ];

    if (startedAt || ['in_progress', 'completed'].includes(currentStatus)) {
      steps.push({
        status: 'in_progress',
        timestamp: startedAt || new Date().toISOString(),
        isCompleted: startedAt ? true : false,
        isCurrent: currentStatus === 'in_progress',
        notes: 'Technician has started working on your vehicle'
      });
    }

    if (completedAt || currentStatus === 'completed') {
      steps.push({
        status: 'completed',
        timestamp: completedAt || new Date().toISOString(), 
        isCompleted: completedAt ? true : false,
        isCurrent: currentStatus === 'completed',
        notes: 'Repair work has been completed successfully'
      });
    }

    if (currentStatus === 'cancelled') {
      steps.push({
        status: 'cancelled',
        timestamp: new Date().toISOString(),
        isCompleted: true,
        isCurrent: true,
        notes: 'This appointment was cancelled'
      });
    }

    return steps;
  };

  const isOverdue = () => {
    const scheduledDateTime = new Date(`${scheduledDate} ${scheduledTime}`);
    const now = new Date();
    return scheduledDateTime < now && currentStatus === 'scheduled';
  };

  const getStatusProgress = () => {
    switch (currentStatus) {
      case 'scheduled': return 25;
      case 'in_progress': return 60;
      case 'completed': return 100;
      case 'cancelled': return 0;
      default: return 0;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Job Timeline</CardTitle>
          <CardDescription>Loading timeline...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const timelineSteps = getTimelineSteps();

  const config = statusConfig[currentStatus as keyof typeof statusConfig];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Job Timeline
        </CardTitle>
        <CardDescription>
          Track your repair progress from start to finish
        </CardDescription>
        
        {/* Progress Bar */}
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{getStatusProgress()}%</span>
          </div>
          <Progress value={getStatusProgress()} className="h-2" />
        </div>

        {isOverdue() && (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded mt-4">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Your scheduled appointment time has passed. The shop will contact you soon.</span>
          </div>
        )}
        
        {/* Management Actions */}
        {currentStatus === 'scheduled' && onRescheduleClick && onCancelClick && (
          <div className="flex gap-3 mt-4">
            <Button 
              variant="outline" 
              onClick={onRescheduleClick}
              className="flex-1"
              size="sm"
            >
              Reschedule
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancelClick}
              className="flex-1 text-destructive hover:text-destructive"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {timelineSteps.map((step, index) => {
            const config = statusConfig[step.status as keyof typeof statusConfig];
            const Icon = config.icon;
            const isLast = index === timelineSteps.length - 1;

            return (
              <div key={step.status} className="relative">
                <div className="flex items-start space-x-4">
                  {/* Timeline connector line */}
                  {!isLast && (
                    <div 
                      className={cn(
                        "absolute left-4 top-8 w-0.5 h-12",
                        step.isCompleted ? "bg-primary" : "bg-muted"
                      )} 
                    />
                  )}
                  
                  {/* Status icon */}
                  <div 
                    className={cn(
                      "relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2",
                      step.isCompleted || step.isCurrent 
                        ? `${config.bgColor} ${config.color} border-current` 
                        : "bg-muted text-muted-foreground border-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  {/* Status content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={cn(
                        "text-sm font-medium",
                        step.isCurrent && "text-primary"
                      )}>
                        {config.label}
                      </h3>
                      {step.isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          Current
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-1">
                      {step.notes}
                    </p>
                    
                    {step.timestamp && step.isCompleted && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(step.timestamp), 'PPpp')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Status change history */}
        {timelineEvents.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
              <h4 className="text-sm font-medium mb-4">Status Change History</h4>
              <div className="space-y-3">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-medium">
                        Status changed to {event.new_status.replace('_', ' ')}
                      </p>
                      {event.notes && (
                        <p className="text-muted-foreground text-xs mt-1">
                          {event.notes}
                        </p>
                      )}
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {format(new Date(event.status_changed_at), 'MMM dd, HH:mm')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};