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
  CreditCard,
  Store,
  Calculator,
  MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { JobStatusTracker } from '@/components/realtime/JobStatusTracker';
import { CompletionDocumentsViewer } from '@/components/insurer/CompletionDocumentsViewer';
import { DamageReportViewer } from '@/components/insurer/DamageReportViewer';
import { ShopSelectionDialog } from '@/components/insurer/ShopSelectionDialog';
import { CostEstimationDialog } from '@/components/insurer/CostEstimationDialog';
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

interface VehicleInfo {
  carType?: string;
  make?: string;
  model?: string;
  year?: string;
}

interface ShopSelection {
  shop_id: string;
  shop_name: string;
  priority_order: number;
  distance_km?: number;
  estimated_price?: number;
}

interface Job {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_street?: string;
  customer_city?: string;
  customer_postal_code?: string;
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
  damage_type?: string | null;
  vehicle_info?: VehicleInfo | null;
  workflow_stage?: string;
  requires_adas_calibration?: boolean;
}

// Helper to safely parse vehicle_info from JSON
const parseVehicleInfo = (info: unknown): VehicleInfo | null => {
  if (!info || typeof info !== 'object') return null;
  return info as VehicleInfo;
};

// Helper to get display label for glass type (service_type)
const getGlassLabel = (serviceType: string): string => {
  const glassMap: Record<string, string> = {
    'windshield': 'Front Windshield',
    'windshield_replacement': 'Front Windshield',
    'windshield_repair': 'Front Windshield',
    'side_window': 'Side Window',
    'rear_window': 'Rear Windshield',
    'front': 'Front Windshield',
    'side': 'Side Window',
    'rear': 'Rear Windshield',
    'repair': 'Front Windshield'
  };
  return glassMap[serviceType.toLowerCase()] || 'Front Windshield';
};

// Helper to get display label for damage type
const getDamageLabel = (damageType: string): string => {
  const damageMap: Record<string, string> = {
    'chip': 'Stone chip',
    'stone_chip': 'Stone chip',
    'crack': 'Crack',
    'shattered': 'Shattered'
  };
  return damageMap[damageType.toLowerCase()] || damageType;
};

// Helper to get display label for car type
const getCarTypeLabel = (carType: string): string => {
  const carMap: Record<string, string> = {
    'passenger': 'Passenger car',
    'suv': 'SUV',
    'van': 'Van',
    'truck': 'Truck'
  };
  return carMap[carType.toLowerCase()] || carType;
};

type WorkflowStage = 'new' | 'customer_handover' | 'damage_report' | 'cost_approval' | 'completed';

const hasAiAssessment = (details: unknown): boolean => {
  if (!details) return false;
  if (typeof details !== 'object') return false;
  return Object.keys(details as object).length > 0;
};

const getWorkflowStage = (job: Job): WorkflowStage => {
  if (job.job_status === 'completed') return 'completed';
  if (job.job_status === 'cancelled') return 'completed';
  if (job.job_status === 'in_progress') return 'cost_approval';
  
  if (hasAiAssessment(job.ai_assessment_details)) return 'damage_report';
  
  if (job.status === 'accepted' || job.status === 'confirmed') return 'customer_handover';
  
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
  const [shopSelections, setShopSelections] = useState<Record<string, ShopSelection[]>>({});
  
  // Dialog states for customer confirmation actions
  const [shopSelectionOpen, setShopSelectionOpen] = useState(false);
  const [costEstimationOpen, setCostEstimationOpen] = useState(false);
  const [selectedJobForAction, setSelectedJobForAction] = useState<Job | null>(null);
  
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

      const { data: insurerProfile } = await supabase
        .from('insurer_profiles')
        .select('insurer_name')
        .eq('email', user.email)
        .single();

      if (!insurerProfile) return;

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
          ai_assessment_details,
          damage_type,
          vehicle_info,
          workflow_stage,
          requires_adas_calibration
        `)
        .eq('insurer_name', insurerProfile.insurer_name)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching jobs:', error);
        return;
      }

      const jobsList = (data || []) as unknown as Job[];
      setJobs(jobsList);
      
      // Fetch shop selections for all jobs
      if (jobsList.length > 0) {
        const jobIds = jobsList.map(j => j.id);
        const { data: selectionsData } = await supabase
          .from('insurer_shop_selections')
          .select(`
            appointment_id,
            shop_id,
            priority_order,
            distance_km,
            estimated_price
          `)
          .in('appointment_id', jobIds)
          .order('priority_order', { ascending: true });
        
        if (selectionsData) {
          // Fetch shop names
          const shopIds = [...new Set(selectionsData.map(s => s.shop_id))];
          const { data: shopsData } = await supabase
            .from('shops')
            .select('id, name')
            .in('id', shopIds);
          
          const shopNameMap: Record<string, string> = {};
          shopsData?.forEach(shop => {
            shopNameMap[shop.id] = shop.name;
          });
          
          // Group by appointment_id
          const selectionsMap: Record<string, ShopSelection[]> = {};
          selectionsData.forEach(sel => {
            if (!selectionsMap[sel.appointment_id]) {
              selectionsMap[sel.appointment_id] = [];
            }
            selectionsMap[sel.appointment_id].push({
              shop_id: sel.shop_id,
              shop_name: shopNameMap[sel.shop_id] || sel.shop_id,
              priority_order: sel.priority_order,
              distance_km: sel.distance_km,
              estimated_price: sel.estimated_price
            });
          });
          setShopSelections(selectionsMap);
        }
      }
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

    if (searchTerm) {
      filtered = filtered.filter(job => 
        job.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.shop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.short_code && job.short_code.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.job_status === statusFilter);
    }

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

  const handleOpenShopSelection = (job: Job) => {
    setSelectedJobForAction(job);
    setShopSelectionOpen(true);
  };

  const handleOpenCostEstimation = (job: Job) => {
    setSelectedJobForAction(job);
    setCostEstimationOpen(true);
  };

  const handleDialogSuccess = () => {
    fetchJobs();
    setSelectedJobForAction(null);
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

  // Determine which actions are available for a job
  const getAvailableActions = (job: Job) => {
    const stage = getWorkflowStage(job);
    const workflowStage = job.workflow_stage || 'new';
    
    return {
      canSelectShops: stage === 'new' && workflowStage === 'new',
      canAddCostEstimate: stage === 'damage_report' || (stage === 'customer_handover' && workflowStage !== 'shop_selection')
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

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredJobs.map((job) => {
          const config = statusConfig[job.job_status];
          const cancellationInfo = getCancellationInfo(job);
          const workflowStage = getWorkflowStage(job);
          const actions = getAvailableActions(job);
          
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

                {/* Customer Selection Details */}
                {(() => {
                  const vehicleInfo = parseVehicleInfo(job.vehicle_info);
                  const glassLabel = job.service_type ? getGlassLabel(job.service_type) : '';
                  const hasSelectionDetails = vehicleInfo?.carType || glassLabel || job.damage_type;
                  
                  if (!hasSelectionDetails) return null;
                  
                  return (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {vehicleInfo?.carType && (
                        <Badge variant="secondary" className="text-xs">
                          {getCarTypeLabel(vehicleInfo.carType)}
                        </Badge>
                      )}
                      {glassLabel && (
                        <Badge variant="secondary" className="text-xs">
                          {glassLabel}
                        </Badge>
                      )}
                      {job.damage_type && (
                        <Badge variant="secondary" className="text-xs">
                          {getDamageLabel(job.damage_type)}
                        </Badge>
                      )}
                    </div>
                  );
                })()}

                {/* Details grid */}
                <div className="space-y-2 text-sm">
                  {/* Customer Location */}
                  {(job.customer_street || job.customer_city) && (
                    <div className="flex items-start justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {t('jobs_board.customer_location')}
                      </span>
                      <span className="font-medium text-right max-w-[60%]">
                        {job.customer_postal_code} {job.customer_city}
                      </span>
                    </div>
                  )}

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

                {/* Suggested Shops - shown when shops have been selected */}
                {shopSelections[job.id] && shopSelections[job.id].length > 0 && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
                    <div className="flex items-center gap-2 mb-2">
                      <Store className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">{t('jobs_board.suggested_shops', 'Suggested Shops')}</span>
                    </div>
                    <div className="space-y-1.5">
                      {shopSelections[job.id].map((sel, idx) => (
                        <div key={sel.shop_id} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span className="font-medium">{sel.shop_name}</span>
                          </span>
                          <span className="text-muted-foreground text-xs">
                            {sel.distance_km && `${sel.distance_km.toFixed(1)} km`}
                            {sel.distance_km && sel.estimated_price && ' • '}
                            {sel.estimated_price && `€${sel.estimated_price}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Damage Report Document - shown inline for new cases */}
                {workflowStage === 'new' && (
                  <div className="mt-3">
                    <DamageReportViewer appointmentId={job.id} />
                  </div>
                )}

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
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {selectedJob === job.id ? t('jobs_board.hide_details') : t('jobs_board.view_details')}
                  </Button>
                  
                  {/* Select Shops button - for new jobs */}
                  {actions.canSelectShops && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleOpenShopSelection(job)}
                    >
                      <Store className="h-4 w-4 mr-2" />
                      {t('jobs_board.select_shops', 'Select Shops')}
                    </Button>
                  )}
                  
                  {/* Add Cost Estimate button - for jobs with damage report */}
                  {actions.canAddCostEstimate && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleOpenCostEstimation(job)}
                    >
                      <Calculator className="h-4 w-4 mr-2" />
                      {t('jobs_board.add_estimate', 'Add Estimate')}
                    </Button>
                  )}
                  
                  {/* Delete button for cancelled jobs OR new jobs without shop selection */}
                  {(job.job_status === 'cancelled' || job.status === 'cancelled' || workflowStage === 'new') && (
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
                            {workflowStage === 'new' 
                              ? t('jobs_board.remove_new_job_confirm', 'This job has not been assigned to a shop yet. Are you sure you want to delete it?')
                              : t('jobs_board.remove_job_confirm')
                            }
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

      {/* Shop Selection Dialog */}
      {selectedJobForAction && (
        <>
          <ShopSelectionDialog
            open={shopSelectionOpen}
            onOpenChange={setShopSelectionOpen}
            appointmentId={selectedJobForAction.id}
            onSuccess={handleDialogSuccess}
            customerLocation={{
              street: selectedJobForAction.customer_street,
              city: selectedJobForAction.customer_city,
              postal_code: selectedJobForAction.customer_postal_code,
            }}
          />
          <CostEstimationDialog
            open={costEstimationOpen}
            onOpenChange={setCostEstimationOpen}
            appointmentId={selectedJobForAction.id}
            serviceType={selectedJobForAction.service_type}
            requiresAdas={selectedJobForAction.requires_adas_calibration}
            onSuccess={handleDialogSuccess}
          />
        </>
      )}
    </div>
  );
};