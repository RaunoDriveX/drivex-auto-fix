import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useTranslation } from 'react-i18next';
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
  trackingToken?: string;
  onRescheduleClick?: () => void;
  onCancelClick?: () => void;
  horizontal?: boolean;
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

const statusIcons = {
  pending: Clock,
  awaiting_shop: Clock,
  awaiting_datetime: Calendar,
  awaiting_shop_confirmation: Clock,
  scheduled: Calendar,
  confirmed: CheckCircle,
  in_progress: Play,
  completed: CheckCircle,
  cancelled: XCircle
};

const statusColors = {
  pending: { color: 'text-muted-foreground', bgColor: 'bg-muted' },
  awaiting_shop: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
  awaiting_datetime: { color: 'text-orange-600', bgColor: 'bg-orange-100' },
  awaiting_shop_confirmation: { color: 'text-amber-600', bgColor: 'bg-amber-100' },
  scheduled: { color: 'text-blue-600', bgColor: 'bg-blue-100' },
  confirmed: { color: 'text-green-600', bgColor: 'bg-green-100' },
  in_progress: { color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  completed: { color: 'text-green-600', bgColor: 'bg-green-100' },
  cancelled: { color: 'text-red-600', bgColor: 'bg-red-100' }
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
  trackingToken,
  onRescheduleClick,
  onCancelClick,
  horizontal = false
}) => {
  const { t } = useTranslation('common');
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

    // Check if shop has been selected - either by shop_id or workflow_stage
    const shopIsSelected = (hasShopAssigned && shopId !== 'pending') || 
                           workflowStage === 'awaiting_shop_response' ||
                           workflowStage === 'damage_report' ||
                           workflowStage === 'cost_approval' ||
                           workflowStage === 'completed';

    // Show "Awaiting Shop Selection" for jobs without shop assignment
    if (!shopIsSelected) {
      steps.push({
        status: 'awaiting_shop',
        isCompleted: false,
        isCurrent: displayStatus === 'awaiting_shop',
        notes: 'Your insurer will select repair shops for you to choose from'
      });
      
      // Show "Waiting on date & time" as upcoming step
      steps.push({
        status: 'awaiting_datetime',
        isCompleted: false,
        isCurrent: false,
        notes: 'Select your preferred date and time for the appointment'
      });
      
      // Show "Confirmation by the Shop" as upcoming step
      steps.push({
        status: 'awaiting_shop_confirmation',
        isCompleted: false,
        isCurrent: false,
        notes: 'The shop will confirm your appointment'
      });
    } else {
      // Shop has been assigned by customer - mark awaiting shop as completed
      steps.push({
        status: 'awaiting_shop',
        isCompleted: true,
        isCurrent: false,
        notes: 'You have selected a repair shop'
      });
      
      // Check if customer has selected date/time
      const hasDateTimeSelected = hasCustomerConfirmedAppointment;
      
      // Check if shop has confirmed (accepted the job)
      const shopHasConfirmed = appointmentStatus === 'confirmed' || ['in_progress', 'completed'].includes(displayStatus);
      
      // Show "Waiting on date & time" step
      if (!hasDateTimeSelected) {
        // Customer needs to select date/time - this is the current step
        steps.push({
          status: 'awaiting_datetime',
          isCompleted: false,
          isCurrent: true,
          notes: 'Select your preferred date and time for the appointment'
        });
        
        // Show shop confirmation as upcoming
        steps.push({
          status: 'awaiting_shop_confirmation',
          isCompleted: false,
          isCurrent: false,
          notes: 'The shop will confirm your appointment after you select a time'
        });
      } else {
        // Date/time has been selected - mark as completed
        steps.push({
          status: 'awaiting_datetime',
          isCompleted: true,
          isCurrent: false,
          notes: 'You have selected your appointment date and time'
        });
        
        // Now show shop confirmation status
        if (!shopHasConfirmed) {
          steps.push({
            status: 'awaiting_shop_confirmation',
            isCompleted: false,
            isCurrent: true,
            notes: 'Waiting for the shop to confirm your appointment'
          });
        } else {
          // Shop has confirmed
          steps.push({
            status: 'awaiting_shop_confirmation',
            isCompleted: true,
            isCurrent: false,
            notes: 'The shop has confirmed your appointment'
          });
        }
      }
      
      // Add confirmed step (shop accepted the job)
      if (shopHasConfirmed) {
        steps.push({
          status: 'confirmed',
          timestamp: new Date().toISOString(),
          isCompleted: true,
          isCurrent: false,
          notes: 'Shop has accepted your job and confirmed the appointment'
        });
      }
      
      // Only show "Scheduled" step AFTER customer has confirmed their appointment time AND shop confirmed
      if (hasCustomerConfirmedAppointment && shopHasConfirmed) {
        steps.push({
          status: 'scheduled',
          timestamp: hasRealScheduledDate ? `${scheduledDate} ${scheduledTime}` : undefined,
          isCompleted: ['in_progress', 'completed'].includes(displayStatus),
          isCurrent: !['in_progress', 'completed'].includes(displayStatus),
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
          <CardTitle>{t('timeline.title')}</CardTitle>
          <CardDescription>{t('timeline.loading')}</CardDescription>
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

  // Horizontal layout - compact stepper style
  if (horizontal) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle className="text-lg">{t('timeline.title')}</CardTitle>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{t('timeline.progress')}</span>
              <span className="font-medium">{getStatusProgress()}%</span>
            </div>
          </div>
          <Progress value={getStatusProgress()} className="h-2 mt-2" />
        </CardHeader>
        <CardContent className="pt-0">
          {/* Horizontal timeline steps */}
          <div className="flex items-start justify-between overflow-x-auto pb-2">
            {timelineSteps.map((step, index) => {
              const colors = statusColors[step.status as keyof typeof statusColors] || statusColors.scheduled;
              const Icon = statusIcons[step.status as keyof typeof statusIcons] || Clock;
              const isLast = index === timelineSteps.length - 1;
              const statusLabel = t(`timeline.status.${step.status}`);

              return (
                <div key={step.status} className="flex flex-col items-center flex-1 min-w-0">
                  {/* Icon row with connector line */}
                  <div className="flex items-center w-full">
                    {/* Left connector */}
                    {index > 0 && (
                      <div 
                        className={cn(
                          "h-0.5 flex-1",
                          timelineSteps[index - 1]?.isCompleted ? "bg-primary" : "bg-muted"
                        )} 
                      />
                    )}
                    
                    {/* Status icon */}
                    <div 
                      className={cn(
                        "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0",
                        step.isCompleted || step.isCurrent 
                          ? `${colors.bgColor} ${colors.color} border-current` 
                          : "bg-muted text-muted-foreground border-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    
                    {/* Right connector */}
                    {!isLast && (
                      <div 
                        className={cn(
                          "h-0.5 flex-1",
                          step.isCompleted ? "bg-primary" : "bg-muted"
                        )} 
                      />
                    )}
                  </div>
                  
                  {/* Status label */}
                  <div className="text-center mt-2 px-1">
                    <p className={cn(
                      "text-xs font-medium leading-tight",
                      step.isCurrent ? "text-primary" : "text-muted-foreground"
                    )}>
                      {statusLabel}
                    </p>
                    {step.isCurrent && (
                      <Badge variant="outline" className="text-[10px] mt-1 px-1.5 py-0">
                        {t('timeline.current')}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('timeline.title')}
        </CardTitle>
        <CardDescription>
          {t('timeline.description')}
        </CardDescription>
        
        {/* Progress Bar */}
        <div className="space-y-2 mt-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{t('timeline.progress')}</span>
            <span>{getStatusProgress()}%</span>
          </div>
          <Progress value={getStatusProgress()} className="h-2" />
        </div>

        {isOverdue() && (
          <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-2 rounded mt-4">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">{t('timeline.overdue_message')}</span>
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
              {t('timeline.reschedule')}
            </Button>
            <Button 
              variant="outline" 
              onClick={onCancelClick}
              className="flex-1 text-destructive hover:text-destructive"
              size="sm"
            >
              {t('timeline.cancel')}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {timelineSteps.map((step, index) => {
            const colors = statusColors[step.status as keyof typeof statusColors] || statusColors.scheduled;
            const Icon = statusIcons[step.status as keyof typeof statusIcons] || Clock;
            const isLast = index === timelineSteps.length - 1;
            const statusLabel = t(`timeline.status.${step.status}`);

            return (
              <div key={step.status} className="flex gap-4">
                {/* Icon column with connector line */}
                <div className="flex flex-col items-center">
                  {/* Status icon */}
                  <div 
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0",
                      step.isCompleted || step.isCurrent 
                        ? `${colors.bgColor} ${colors.color} border-current` 
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
                      {statusLabel}
                    </h3>
                    {step.isCurrent && (
                      <Badge variant="outline" className="text-xs">
                        {t('timeline.current')}
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
              <h4 className="text-sm font-medium mb-4">{t('timeline.status_history')}</h4>
              <div className="space-y-3">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-medium">
                        {t(`timeline.status.${event.new_status}`, { defaultValue: event.new_status.replace('_', ' ') })}
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