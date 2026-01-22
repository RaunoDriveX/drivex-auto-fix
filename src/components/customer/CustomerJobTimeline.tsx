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
  appointmentStatus?: string;
  workflowStage?: string;
  startedAt?: string;
  completedAt?: string;
  scheduledDate: string;
  scheduledTime: string;
  shopId: string;
  hasShopAssigned?: boolean;
  appointmentConfirmedAt?: string;
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
  pending: {
    icon: Clock,
    label: 'Report Submitted',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
    description: 'Your damage report is being processed'
  },
  awaiting_shop: {
    icon: Clock,
    label: 'Awaiting Shop Selection',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Your insurer will select repair shops for you'
  },
  scheduled: {
    icon: Calendar,
    label: 'Scheduled',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: 'Your appointment has been scheduled'
  },
  confirmed: {
    icon: CheckCircle,
    label: 'Confirmed',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    description: 'Shop has accepted your job'
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
  appointmentStatus,
  workflowStage,
  startedAt,
  completedAt,
  scheduledDate,
  scheduledTime,
  shopId,
  hasShopAssigned = false,
  appointmentConfirmedAt,
  onRescheduleClick,
  onCancelClick
}) => {
  // Check if customer has confirmed their appointment time
  const hasCustomerConfirmedAppointment = !!appointmentConfirmedAt;
  
  // Check if we have a real scheduled date (not a placeholder)
  const hasRealScheduledDate = hasCustomerConfirmedAppointment && 
    scheduledDate && 
    scheduledDate !== 'Not scheduled' && 
    scheduledTime !== 'TBD' &&
    shopId !== 'pending';

  // Determine display status based on workflow stage and actual status
  const getDisplayStatus = () => {
    if (currentStatus === 'cancelled') return 'cancelled';
    if (currentStatus === 'completed') return 'completed';
    if (currentStatus === 'in_progress') return 'in_progress';
    if (appointmentStatus === 'confirmed') return 'confirmed';
    
    // For pending/new jobs without shop assignment
    if (!hasShopAssigned || shopId === 'pending') {
      return 'awaiting_shop';
    }
    
    return currentStatus;
  };
  
  const displayStatus = getDisplayStatus();
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
    const steps: Array<{
      status: string;
      timestamp?: string;
      isCompleted: boolean;
      isCurrent: boolean;
      notes: string;
    }> = [];

    // Always show the initial "Report Submitted" step
    steps.push({
      status: 'pending',
      isCompleted: true,
      isCurrent: false,
      notes: 'Your damage report has been submitted'
    });

    // Show "Awaiting Shop Selection" for jobs without shop assignment
    if (!hasShopAssigned || shopId === 'pending') {
      steps.push({
        status: 'awaiting_shop',
        isCompleted: false,
        isCurrent: displayStatus === 'awaiting_shop',
        notes: 'Your insurer will select repair shops for you to choose from'
      });
    } else {
      // Shop has been assigned
      
      // Add confirmed step (shop accepted the job) BEFORE scheduled
      if (appointmentStatus === 'confirmed' || ['in_progress', 'completed'].includes(displayStatus)) {
        steps.push({
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          isCompleted: true,
          isCurrent: !hasCustomerConfirmedAppointment && displayStatus === 'confirmed',
          notes: 'Shop has accepted your job and confirmed the appointment'
        });
      }
      
      // Only show "Scheduled" step AFTER customer has confirmed their appointment time
      if (hasCustomerConfirmedAppointment) {
        steps.push({
          status: 'scheduled',
          timestamp: hasRealScheduledDate ? `${scheduledDate} ${scheduledTime}` : undefined,
          isCompleted: ['in_progress', 'completed'].includes(displayStatus),
          isCurrent: hasCustomerConfirmedAppointment && !['in_progress', 'completed'].includes(displayStatus),
          notes: `Your appointment is scheduled for ${format(new Date(`${scheduledDate} ${scheduledTime}`), 'PPpp')}`
        });
      }

      if (startedAt || ['in_progress', 'completed'].includes(displayStatus)) {
        steps.push({
          status: 'in_progress',
          timestamp: startedAt || undefined,
          isCompleted: startedAt ? true : false,
          isCurrent: displayStatus === 'in_progress',
          notes: 'Technician has started working on your vehicle'
        });
      }

      if (completedAt || displayStatus === 'completed') {
        steps.push({
          status: 'completed',
          timestamp: completedAt || undefined, 
          isCompleted: completedAt ? true : false,
          isCurrent: displayStatus === 'completed',
          notes: 'Repair work has been completed successfully'
        });
      }
    }

    if (displayStatus === 'cancelled') {
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
    // Only show overdue if there's an actual scheduled date/time set and shop is assigned
    if (!hasRealScheduledDate || !hasShopAssigned || shopId === 'pending') {
      return false;
    }
    const scheduledDateTime = new Date(`${scheduledDate} ${scheduledTime}`);
    const now = new Date();
    return scheduledDateTime < now && displayStatus === 'scheduled';
  };

  const getStatusProgress = () => {
    // Progress based on actual flow: Report -> Confirmed -> Scheduled -> In Progress -> Completed
    if (displayStatus === 'cancelled') return 0;
    if (displayStatus === 'completed') return 100;
    if (displayStatus === 'in_progress') return 75;
    if (hasCustomerConfirmedAppointment) return 60; // Customer scheduled
    if (displayStatus === 'confirmed' || appointmentStatus === 'confirmed') return 40; // Shop confirmed
    if (hasShopAssigned && shopId !== 'pending') return 25; // Shop assigned
    if (displayStatus === 'awaiting_shop') return 10;
    return 5;
  };

  // Only show management actions if customer has scheduled and job not yet in progress
  const showManagementActions = hasShopAssigned && 
    shopId !== 'pending' && 
    hasCustomerConfirmedAppointment &&
    !['in_progress', 'completed', 'cancelled'].includes(displayStatus) && 
    onRescheduleClick && 
    onCancelClick;

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

  const config = statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.scheduled;

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
        
        {/* Management Actions - only show if shop is assigned and not yet confirmed */}
        {showManagementActions && (
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
        <div className="space-y-0">
          {timelineSteps.map((step, index) => {
            const config = statusConfig[step.status as keyof typeof statusConfig];
            const Icon = config.icon;
            const isLast = index === timelineSteps.length - 1;

            return (
              <div key={step.status} className="flex gap-4">
                {/* Icon column with connector line */}
                <div className="flex flex-col items-center">
                  {/* Status icon */}
                  <div 
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0",
                      step.isCompleted || step.isCurrent 
                        ? `${config.bgColor} ${config.color} border-current` 
                        : "bg-muted text-muted-foreground border-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  
                  {/* Connector line */}
                  {!isLast && (
                    <div 
                      className={cn(
                        "w-0.5 flex-1 min-h-8",
                        step.isCompleted ? "bg-primary" : "bg-muted"
                      )} 
                    />
                  )}
                </div>
                
                {/* Status content */}
                <div className="flex-1 min-w-0 pb-6">
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