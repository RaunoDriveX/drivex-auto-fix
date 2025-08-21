import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertTriangle 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface JobStatusControlsProps {
  appointmentId: string;
  currentStatus: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  shopId: string;
  onStatusUpdate?: (newStatus: string) => void;
}

const statusActions = {
  scheduled: [
    {
      status: 'in_progress',
      label: 'Start Job',
      icon: PlayCircle,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      description: 'Mark this job as in progress'
    }
  ],
  in_progress: [
    {
      status: 'completed',
      label: 'Complete Job',
      icon: CheckCircle,
      color: 'bg-green-500 hover:bg-green-600',
      description: 'Mark this job as completed'
    }
  ],
  completed: [],
  cancelled: []
};

export const JobStatusControls: React.FC<JobStatusControlsProps> = ({
  appointmentId,
  currentStatus,
  shopId,
  onStatusUpdate
}) => {
  const [updating, setUpdating] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState<any>(null);

  const availableActions = statusActions[currentStatus] || [];

  const handleStatusUpdate = async (newStatus: string, actionNotes?: string) => {
    setUpdating(newStatus);
    
    try {
      const { data, error } = await supabase.functions.invoke('update-job-status', {
        body: {
          appointmentId,
          newStatus,
          shopId,
          notes: actionNotes || notes || undefined
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Status Updated",
        description: `Job status changed to ${newStatus.replace('_', ' ')}`
      });

      onStatusUpdate?.(newStatus);
      setNotes('');
      setSelectedAction(null);

    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update job status",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  const handleCancelJob = () => {
    handleStatusUpdate('cancelled', 'Job cancelled by shop');
  };

  if (availableActions.length === 0 && currentStatus !== 'scheduled' && currentStatus !== 'in_progress') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Job Status Controls
          </CardTitle>
          <CardDescription>
            This job is {currentStatus.replace('_', ' ')} - no further actions available
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Job Status Controls
          </span>
          <Badge variant="outline">
            {currentStatus.replace('_', ' ').toUpperCase()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Update the job status and notify the insurer in real-time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="space-y-3">
          {availableActions.map((action) => {
            const ActionIcon = action.icon;
            const isUpdating = updating === action.status;
            
            return (
              <Dialog key={action.status}>
                <DialogTrigger asChild>
                  <Button
                    className={cn("w-full justify-start gap-2", action.color)}
                    disabled={updating !== null}
                    onClick={() => setSelectedAction(action)}
                  >
                    <ActionIcon className="h-4 w-4" />
                    {isUpdating ? 'Updating...' : action.label}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <ActionIcon className="h-5 w-5" />
                      {action.label}
                    </DialogTitle>
                    <DialogDescription>
                      {action.description}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status-notes">Notes (optional)</Label>
                      <Textarea
                        id="status-notes"
                        placeholder="Add any notes about this status change..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleStatusUpdate(action.status)}
                        disabled={updating !== null}
                        className="flex-1"
                      >
                        {updating === action.status ? 'Updating...' : `Confirm ${action.label}`}
                      </Button>
                      <DialogTrigger asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogTrigger>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>

        {/* Cancel Action (available for scheduled and in_progress) */}
        {(currentStatus === 'scheduled' || currentStatus === 'in_progress') && (
          <div className="pt-2 border-t">
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
                  disabled={updating !== null}
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Job
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Cancel Job
                  </DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel this job? This action cannot be undone and the insurer will be notified immediately.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cancel-notes">Reason for cancellation</Label>
                    <Textarea
                      id="cancel-notes"
                      placeholder="Please provide a reason for cancelling this job..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="mt-1"
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCancelJob}
                      disabled={updating !== null || !notes.trim()}
                      variant="destructive"
                      className="flex-1"
                    >
                      {updating === 'cancelled' ? 'Cancelling...' : 'Confirm Cancellation'}
                    </Button>
                    <DialogTrigger asChild>
                      <Button variant="outline">Keep Job</Button>
                    </DialogTrigger>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {/* Status Info */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded">
          <p className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Status updates are sent to the insurer within 5 seconds and logged for auditing
          </p>
        </div>
      </CardContent>
    </Card>
  );
};