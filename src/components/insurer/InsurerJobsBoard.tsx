import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Clock, 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Search,
  RefreshCw,
  Eye,
  Trash2,
  AlertTriangle,
  FileText,
  Users,
  ClipboardCheck,
  CreditCard
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { JobStatusTracker } from '@/components/realtime/JobStatusTracker';
import { CompletionDocumentsViewer } from '@/components/insurer/CompletionDocumentsViewer';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Job {
  id: string;
  customer_name: string;
  customer_email: string;
  service_type: string;
  job_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  status: string;
  appointment_date: string;
  appointment_time: string;
  shop_name: string;
  shop_id: string;
  total_cost: number;
  job_started_at?: string;
  job_completed_at?: string;
  created_at: string;
  updated_at: string;
  short_code?: string;
  notes?: string;
  insurer_name?: string;
  ai_assessment_details?: unknown;
}

type WorkflowStage = 'new' | 'customer_handover' | 'damage_report' | 'cost_approval' | 'completed';

// Map job statuses to workflow stages
// - 'new': Shop hasn't accepted yet (status is not 'accepted' or 'confirmed')
// - 'customer_handover': Shop accepted, awaiting customer action
// - 'damage_report': Has SmartScan AI assessment (ai_assessment_details present)
// - 'cost_approval': Job in progress, awaiting cost approval
// - 'completed': Job finished
const getWorkflowStage = (job: Job): WorkflowStage => {
  if (job.job_status === 'completed') return 'completed';
  if (job.job_status === 'cancelled') return 'completed'; // Show cancelled in completed tab
  if (job.job_status === 'in_progress') return 'cost_approval';
  
  // If has AI assessment from SmartScan, show in damage_report stage
  if (job.ai_assessment_details) return 'damage_report';
  
  // If shop has accepted the job
  if (job.status === 'accepted' || job.status === 'confirmed') return 'customer_handover';
  
  // Default: new incoming jobs (shop hasn't accepted yet)
  return 'new';
};

const workflowStageConfig: Record<WorkflowStage, { icon: React.ElementType }> = {
  new: { icon: FileText },
  customer_handover: { icon: Users },
  damage_report: { icon: ClipboardCheck },
  cost_approval: { icon: CreditCard },
  completed: { icon: CheckCircle }
};

const getStatusConfig = (t: (key: string) => string) => ({
  scheduled: { 
    icon: Clock, 
    color: 'bg-blue-100 text-blue-800 border-blue-200', 
    label: t('jobs_board.scheduled')
  },
  in_progress: { 
    icon: PlayCircle, 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
    label: t('jobs_board.in_progress')
  },
  completed: { 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-800 border-green-200', 
    label: t('jobs_board.completed')
  },
  cancelled: { 
    icon: XCircle, 
    color: 'bg-red-100 text-red-800 border-red-200', 
    label: t('jobs_board.cancelled')
  }
});

export const InsurerJobsBoard: React.FC = () => {
  const { t, i18n } = useTranslation('insurer');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeWorkflowStage, setActiveWorkflowStage] = useState<WorkflowStage | 'all'>('all');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  
  const statusConfig = getStatusConfig(t);
  const isGerman = i18n.language === 'de';

  const workflowStages: WorkflowStage[] = ['new', 'customer_handover', 'damage_report', 'cost_approval', 'completed'];

  useEffect(() => {
    fetchJobs();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter, activeWorkflowStage]);

  const fetchJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return;

      // Get insurer profile
      const { data: insurerProfile } = await supabase
        .from('insurer_profiles')
        .select('insurer_name')
        .eq('email', user.email)
        .single();

      if (!insurerProfile) return;

      // Get jobs for this insurer
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          customer_name,
          customer_email,
          service_type,
          job_status,
          status,
          appointment_date,
          appointment_time,
          shop_name,
          shop_id,
          total_cost,
          job_started_at,
          job_completed_at,
          created_at,
          updated_at,
          short_code,
          notes,
          insurer_name,
          ai_assessment_details
        `)
        .eq('insurer_name', insurerProfile.insurer_name)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }

      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const getCurrentInsurerName = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) return null;

      const { data: insurerProfile } = await supabase
        .from('insurer_profiles')
        .select('insurer_name')
        .eq('email', user.email)
        .single();

      return insurerProfile?.insurer_name || null;
    };

    const channel = supabase
      .channel('insurer-jobs-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments'
        },
        async (payload) => {
          const insurerName = await getCurrentInsurerName();
          if (insurerName && payload.new.insurer_name === insurerName) {
            setJobs(prevJobs =>
              prevJobs.map(job =>
                job.id === payload.new.id ? { ...job, ...payload.new } : job
              )
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments'
        },
        async (payload) => {
          const insurerName = await getCurrentInsurerName();
          if (insurerName && payload.new.insurer_name === insurerName) {
            setJobs(prevJobs => {
              const exists = prevJobs.some(job => job.id === payload.new.id);
              if (exists) return prevJobs;
              return [payload.new as Job, ...prevJobs];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filterJobs = () => {
    let filtered = jobs;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.short_code && job.short_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.job_status === statusFilter);
    }

    // Filter by workflow stage
    if (activeWorkflowStage !== 'all') {
      filtered = filtered.filter(job => getWorkflowStage(job) === activeWorkflowStage);
    }

    setFilteredJobs(filtered);
  };

  const getWorkflowStageCounts = () => {
    const counts: Record<WorkflowStage | 'all', number> = {
      all: jobs.length,
      new: 0,
      customer_handover: 0,
      damage_report: 0,
      cost_approval: 0,
      completed: 0
    };

    jobs.forEach(job => {
      const stage = getWorkflowStage(job);
      counts[stage]++;
    });

    return counts;
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      setJobs(prev => prev.filter(j => j.id !== jobId));
      toast({
        title: t('jobs_board.job_removed'),
        description: t('jobs_board.job_removed_description')
      });
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast({
        title: t('jobs_board.error_remove'),
        description: t('jobs_board.error_remove_description'),
        variant: "destructive"
      });
    }
  };

  const getCancellationInfo = (job: Job): { reason: string; shop: string } | null => {
    if (job.job_status !== 'cancelled' && job.status !== 'cancelled') return null;
    
    let reason = job.notes || '';
    const reasonMatch = reason.match(/Reason:\s*(.+)$/i);
    if (reasonMatch) {
      reason = reasonMatch[1];
    }
    
    return { 
      reason: reason || t('jobs_board.no_reason_provided'),
      shop: job.shop_name
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const workflowCounts = getWorkflowStageCounts();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('jobs_board.title')}</h1>
          <p className="text-muted-foreground">
            {t('jobs_board.description')}
          </p>
        </div>
        <Button onClick={fetchJobs} disabled={loading} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('jobs_board.refresh')}
        </Button>
      </div>

      {/* Workflow Stage Tabs */}
      <div className="flex flex-wrap gap-2">
        {workflowStages.map((stage) => {
          const config = workflowStageConfig[stage];
          const Icon = config.icon;
          const count = workflowCounts[stage];
          const isActive = activeWorkflowStage === stage;
          
          return (
            <button
              key={stage}
              onClick={() => setActiveWorkflowStage(isActive ? 'all' : stage)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                isActive 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
              )}
            >
              <Icon className="h-4 w-4" />
              {t(`workflow_stages.${stage}`)}
              <span className={cn(
                "ml-1 px-2 py-0.5 rounded-full text-xs font-bold",
                isActive ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('jobs_board.search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('jobs_board.all_statuses')}</SelectItem>
            <SelectItem value="scheduled">{t('jobs_board.scheduled')}</SelectItem>
            <SelectItem value="in_progress">{t('jobs_board.in_progress')}</SelectItem>
            <SelectItem value="completed">{t('jobs_board.completed')}</SelectItem>
            <SelectItem value="cancelled">{t('jobs_board.cancelled')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Grid - Redesigned Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredJobs.map((job) => {
          const config = statusConfig[job.job_status];
          const cancellationInfo = getCancellationInfo(job);
          
          return (
            <Card key={job.id} className={cn(
              "hover:shadow-lg transition-all border-l-4",
              job.job_status === 'scheduled' && "border-l-blue-500",
              job.job_status === 'in_progress' && "border-l-yellow-500",
              job.job_status === 'completed' && "border-l-green-500",
              (job.job_status === 'cancelled' || job.status === 'cancelled') && "border-l-red-500 bg-red-50/30"
            )}>
              <CardContent className="p-4">
                {/* Header with name and status */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg text-foreground">
                    {job.customer_name}
                  </h3>
                  <Badge className={cn("text-xs", config.color)}>
                    {config.label}
                  </Badge>
                </div>

                {/* Insurance company */}
                <p className="text-sm text-muted-foreground mb-2">
                  {job.insurer_name || 'Versicherung'}
                </p>

                {/* Details grid */}
                <div className="space-y-2 text-sm">
                  {/* Insurance number - using customer email as proxy */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('jobs_board.insurance_number')}</span>
                    <span className="font-medium">{job.customer_email.split('@')[0]}</span>
                  </div>

                  {/* Tracking code */}
                  {job.short_code && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">{t('jobs_board.tracking_code')}</span>
                      <span className="font-mono font-bold text-primary">{job.short_code}</span>
                    </div>
                  )}

                  {/* Created date */}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{t('jobs_board.created_on')}</span>
                    <span className="font-medium">
                      {format(new Date(job.created_at), isGerman ? 'd. MMM yyyy' : 'MMM d, yyyy', 
                        isGerman ? { locale: de } : undefined)}
                    </span>
                  </div>
                </div>

                {/* Cancellation Alert */}
                {cancellationInfo && (
                  <Alert variant="destructive" className="mt-3 py-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {t('jobs_board.declined_by', { 
                        shop: cancellationInfo.shop, 
                        reason: cancellationInfo.reason 
                      })}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {selectedJob === job.id ? t('jobs_board.hide_details') : t('jobs_board.view_details')}
                  </Button>
                  
                  {/* Delete button for cancelled jobs */}
                  {(job.job_status === 'cancelled' || job.status === 'cancelled') && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('jobs_board.remove_job')}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t('jobs_board.remove_job_confirm')}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('jobs_board.cancel')}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteJob(job.id)}>
                            {t('jobs_board.remove_job')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Expanded details */}
                {selectedJob === job.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <JobStatusTracker appointmentId={job.id} />
                    <CompletionDocumentsViewer appointmentId={job.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty state */}
      {filteredJobs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">{t('jobs_board.no_jobs')}</h3>
            <p className="text-muted-foreground">
              {t('jobs_board.no_jobs_description')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
