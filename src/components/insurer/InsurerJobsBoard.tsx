import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  MapPin,
  Pencil,
  Calendar,
  ChevronDown
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { JobStatusTracker } from '@/components/realtime/JobStatusTracker';
import { CompletionDocumentsViewer } from '@/components/insurer/CompletionDocumentsViewer';
import { DamageReportViewer } from '@/components/insurer/DamageReportViewer';
import { ShopSelectionDialog } from '@/components/insurer/ShopSelectionDialog';
import { ShopPriceOfferViewer } from '@/components/insurer/ShopPriceOfferViewer';
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
  car_type?: string;
  make?: string;
  model?: string;
  year?: string;
  licensePlate?: string;
  license_plate?: string;
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
  customer_phone?: string;
  customer_street?: string;
  customer_city?: string;
  customer_postal_code?: string;
  service_type: string;
  job_status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  status: string;
  appointment_date: string;
  appointment_time: string;
  appointment_confirmed_at?: string;
  shop_name: string;
  shop_id: string;
  total_cost: number | null;
  job_started_at?: string;
  job_completed_at?: string;
  created_at: string;
  updated_at: string;
  short_code?: string;
  notes?: string;
  insurer_name?: string;
  workflow_stage?: string;
  vehicle_info?: unknown;
  damage_type?: string;
  requires_adas_calibration?: boolean;
  job_offers?: Array<{
    id: string;
    offered_price: number;
    status: string;
    responded_at: string | null;
  }>;
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
  
  // Use the actual workflow_stage field from the database
  if (job.workflow_stage) {
    if (job.workflow_stage === 'cost_approval') return 'cost_approval';
    if (job.workflow_stage === 'damage_report') return 'damage_report';
    if (job.workflow_stage === 'customer_handover') return 'customer_handover';
    if (job.workflow_stage === 'shop_selection') return 'new';
  }
  
  // Fallback logic for legacy data
  if (job.job_status === 'in_progress') return 'cost_approval';
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
  const [shopSelectionEditMode, setShopSelectionEditMode] = useState(false);
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

      // Get jobs for this insurer with job offers
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          customer_name,
          customer_email,
          customer_phone,
          customer_street,
          customer_city,
          customer_postal_code,
          service_type,
          job_status,
          status,
          appointment_date,
          appointment_time,
          appointment_confirmed_at,
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
          workflow_stage,
          vehicle_info,
          damage_type,
          requires_adas_calibration,
          job_offers!appointment_id (
            id,
            offered_price,
            status,
            responded_at
          )
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

  const handleOpenShopSelection = (job: Job, editMode = false) => {
    setSelectedJobForAction(job);
    setShopSelectionEditMode(editMode);
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
    
    return { 
      reason: job.notes || t('jobs_board.no_reason_provided'),
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

  const getPriceDisplay = (job: Job) => {
    // If shop has accepted and price is confirmed
    if (job.total_cost && (job.job_status === 'scheduled' || job.job_status === 'in_progress' || job.job_status === 'completed')) {
      return {
        amount: `€${job.total_cost}`,
        status: 'accepted',
        badge: 'Price Submitted',
        badgeColor: 'bg-green-100 text-green-800 border-green-200'
      };
    }

    // If job offer exists but not yet accepted
    if (job.job_offers && job.job_offers.length > 0) {
      // Find the most recent offered price (could be multiple offers to different shops)
      const latestOffer = job.job_offers.find(offer => offer.status === 'offered')
        || job.job_offers[0]; // fallback to first offer

      if (latestOffer.status === 'offered') {
        return {
          amount: `€${latestOffer.offered_price}`,
          status: 'pending',
          badge: 'Awaiting Shop Response',
          badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      }

      if (latestOffer.status === 'accepted') {
        return {
          amount: `€${latestOffer.offered_price}`,
          status: 'accepted',
          badge: 'Price Submitted',
          badgeColor: 'bg-green-100 text-green-800 border-green-200'
        };
      }
    }

    // No price information available
    return {
      amount: '€ —',
      status: 'unknown',
      badge: 'Pending',
      badgeColor: 'bg-gray-100 text-gray-800 border-gray-200'
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
                  const carType = vehicleInfo?.carType || vehicleInfo?.car_type;
                  const licensePlate = vehicleInfo?.licensePlate || vehicleInfo?.license_plate;
                  const glassLabel = job.service_type ? getGlassLabel(job.service_type) : '';
                  const hasSelectionDetails = carType || glassLabel || job.damage_type || licensePlate;
                  
                  if (!hasSelectionDetails) return null;
                  
                  return (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {licensePlate && (
                        <Badge variant="outline" className="text-xs font-mono">
                          {licensePlate}
                        </Badge>
                      )}
                      {carType && (
                        <Badge variant="secondary" className="text-xs">
                          {getCarTypeLabel(carType)}
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

                {/* Customer confirmed appointment - always visible */}
                {job.appointment_confirmed_at && (
                  <div className="flex items-center justify-between text-sm py-2 border-b border-dashed mb-2">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {t('jobs_board.scheduled_for', 'Scheduled for')}
                    </span>
                    <span className="font-medium text-primary">
                      {format(new Date(job.appointment_date), isGerman ? 'd. MMM' : 'MMM d', 
                        isGerman ? { locale: de } : undefined)} {job.appointment_time?.substring(0, 5)}
                    </span>
                  </div>
                )}

                {/* Shop Selections - Show selected shops for customer */}
                {shopSelections[job.id] && shopSelections[job.id].length > 0 && (
                  <div className="mb-3 p-2 bg-muted/50 rounded-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Store className="h-3 w-3" />
                        {t('jobs_board.suggested_shops', 'Suggested Shops')}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleOpenShopSelection(job, true)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        {t('jobs_board.edit', 'Edit')}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {shopSelections[job.id].map((sel, idx) => (
                        <Badge key={sel.shop_id} variant="outline" className="text-xs">
                          {idx + 1}. {sel.shop_name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Collapsible Customer Details */}
                <Collapsible className="mb-3">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between px-2 h-8 text-xs text-muted-foreground hover:text-foreground border border-dashed">
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {t('jobs_board.case_details', 'Case Details')}
                      </span>
                      <ChevronDown className="h-3 w-3 transition-transform duration-200" />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-2 space-y-1 text-sm">
                    {(job.customer_street || job.customer_city) && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 mt-1 text-muted-foreground" />
                        <span>
                          {[job.customer_street, job.customer_postal_code, job.customer_city].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {job.customer_email && (
                      <div className="text-muted-foreground">
                        <span className="font-medium">{t('jobs_board.tracking_code', 'Tracking Code')}:</span> {job.short_code || '—'}
                      </div>
                    )}
                    <div className="text-muted-foreground">
                      <span className="font-medium">{t('jobs_board.created_on', 'Created')}:</span> {format(new Date(job.created_at), isGerman ? 'd. MMM yyyy' : 'MMM d, yyyy', isGerman ? { locale: de } : undefined)}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Scheduled:</span>
                    <p className="font-medium">
                      {format(new Date(job.appointment_date), 'MMM d')} at {job.appointment_time?.substring(0, 5)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-medium">{getPriceDisplay(job).amount}</p>
                      <Badge className={`text-xs ${getPriceDisplay(job).badgeColor} border`}>
                        {getPriceDisplay(job).badge}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                {job.job_started_at && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Started:</span>
                    <p className="font-medium">
                      {format(new Date(job.job_started_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                )}

                {/* Collapsible Damage Report Section - available after SmartScan and booking */}
                {(job.appointment_confirmed_at || job.workflow_stage === 'customer_handover' || job.workflow_stage === 'damage_report' || job.workflow_stage === 'cost_approval' || job.status === 'confirmed') && (
                  <Collapsible className="mt-3">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between px-2 h-8 text-xs text-muted-foreground hover:text-foreground border border-dashed">
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {t('damage_report.title', 'Damage Report')}
                        </span>
                        <ChevronDown className="h-3 w-3 transition-transform duration-200" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-2">
                      <DamageReportViewer appointmentId={job.id} damageType={job.damage_type} />
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Shop Price Offer - Show for jobs in damage_report stage */}
                {(job.workflow_stage === 'damage_report') && (
                  <div className="mt-3">
                    <ShopPriceOfferViewer
                      appointmentId={job.id}
                      shopName={job.shop_name}
                      onApproved={fetchJobs}
                      onRejected={fetchJobs}
                    />
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
                {/* Action buttons */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {selectedJob === job.id ? t('jobs_board.hide_status') : t('jobs_board.job_status')}
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
            isEditMode={shopSelectionEditMode}
            existingSelections={shopSelectionEditMode ? shopSelections[selectedJobForAction.id]?.map(s => ({
              shop_id: s.shop_id,
              priority_order: s.priority_order,
              estimated_price: s.estimated_price,
              distance_km: s.distance_km,
            })) : []}
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