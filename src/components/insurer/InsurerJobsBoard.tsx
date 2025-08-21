import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  PlayCircle, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  RefreshCw,
  Eye
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { JobStatusTracker } from '@/components/realtime/JobStatusTracker';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
  appointment_date: string;
  appointment_time: string;
  shop_name: string;
  shop_id: string;
  total_cost: number;
  job_started_at?: string;
  job_completed_at?: string;
  created_at: string;
  updated_at: string;
}

const statusConfig = {
  scheduled: { 
    icon: Clock, 
    color: 'bg-blue-100 text-blue-800', 
    label: 'Scheduled' 
  },
  in_progress: { 
    icon: PlayCircle, 
    color: 'bg-yellow-100 text-yellow-800', 
    label: 'In Progress' 
  },
  completed: { 
    icon: CheckCircle, 
    color: 'bg-green-100 text-green-800', 
    label: 'Completed' 
  },
  cancelled: { 
    icon: XCircle, 
    color: 'bg-red-100 text-red-800', 
    label: 'Cancelled' 
  }
};

export const InsurerJobsBoard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, statusFilter]);

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
          appointment_date,
          appointment_time,
          shop_name,
          shop_id,
          total_cost,
          job_started_at,
          job_completed_at,
          created_at,
          updated_at
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
    const channel = supabase
      .channel('insurer-jobs-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Real-time job update:', payload);
          setJobs(prevJobs => 
            prevJobs.map(job => 
              job.id === payload.new.id ? { ...job, ...payload.new } : job
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('New job created:', payload);
          setJobs(prevJobs => [payload.new as Job, ...prevJobs]);
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
        job.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(job => job.job_status === statusFilter);
    }

    setFilteredJobs(filtered);
  };

  const getStatusCounts = () => {
    return {
      all: jobs.length,
      scheduled: jobs.filter(j => j.job_status === 'scheduled').length,
      in_progress: jobs.filter(j => j.job_status === 'in_progress').length,
      completed: jobs.filter(j => j.job_status === 'completed').length,
      cancelled: jobs.filter(j => j.job_status === 'cancelled').length
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statusCounts = getStatusCounts();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Live Jobs Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time tracking of all repair jobs
          </p>
        </div>
        <Button onClick={fetchJobs} disabled={loading} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card 
          className={cn("cursor-pointer transition-colors", 
            statusFilter === 'all' && "ring-2 ring-primary")}
          onClick={() => setStatusFilter('all')}
        >
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{statusCounts.all}</div>
            <div className="text-sm text-muted-foreground">All Jobs</div>
          </CardContent>
        </Card>
        
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          const count = statusCounts[status as keyof typeof statusCounts];
          
          return (
            <Card 
              key={status}
              className={cn("cursor-pointer transition-colors",
                statusFilter === status && "ring-2 ring-primary")}
              onClick={() => setStatusFilter(status)}
            >
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Icon className="h-4 w-4" />
                  <div className="text-2xl font-bold">{count}</div>
                </div>
                <div className="text-sm text-muted-foreground">{config.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer name, email, shop, or job ID..."
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
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredJobs.map((job) => {
          const config = statusConfig[job.job_status];
          const StatusIcon = config.icon;
          
          return (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{job.customer_name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{job.service_type}</span>
                      <span>•</span>
                      <span>{job.shop_name}</span>
                    </CardDescription>
                  </div>
                  <Badge className={config.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {config.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Scheduled:</span>
                    <p className="font-medium">
                      {format(new Date(job.appointment_date), 'MMM d')} at {job.appointment_time}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cost:</span>
                    <p className="font-medium">€{job.total_cost}</p>
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
                
                {job.job_completed_at && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Completed:</span>
                    <p className="font-medium">
                      {format(new Date(job.job_completed_at), 'MMM d, HH:mm')}
                    </p>
                  </div>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setSelectedJob(selectedJob === job.id ? null : job.id)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  {selectedJob === job.id ? 'Hide Details' : 'View Details'}
                </Button>
                
                {selectedJob === job.id && (
                  <div className="mt-4">
                    <JobStatusTracker appointmentId={job.id} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredJobs.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No jobs found</h3>
            <p className="text-muted-foreground">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your filters'
                : 'No jobs have been created yet'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};