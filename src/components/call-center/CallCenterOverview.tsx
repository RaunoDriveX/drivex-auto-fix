import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Phone, Clock, Users, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Lead {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  status: string;
  priority_level: number;
  created_at: string;
  must_contact_by: string;
  damage_description: string;
  initial_message: string;
}

interface Activity {
  id: string;
  activity_type: string;
  status: string;
  summary: string;
  duration_seconds: number;
  created_at: string;
  lead: {
    customer_name: string;
    customer_phone: string;
  };
}

interface Stats {
  leads_received: number;
  leads_contacted: number;
  leads_converted: number;
  average_response_time_minutes: number;
  calls_made: number;
  calls_successful: number;
}

const CallCenterOverview = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCallCenterData();
  }, []);

  const fetchCallCenterData = async () => {
    try {
      setLoading(true);

      // Fetch recent leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('call_center_leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (leadsError) throw leadsError;

      // Fetch recent activities with lead info
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('call_center_activities')
        .select(`
          *,
          lead:call_center_leads(customer_name, customer_phone)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (activitiesError) throw activitiesError;

      // Fetch today's stats
      const { data: statsData, error: statsError } = await supabase
        .from('call_center_stats')
        .select('*')
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      if (statsError && statsError.code !== 'PGRST116') throw statsError;

      setLeads(leadsData || []);
      setRecentActivities(activitiesData || []);
      setStats(statsData || {
        leads_received: 0,
        leads_contacted: 0,
        leads_converted: 0,
        average_response_time_minutes: 0,
        calls_made: 0,
        calls_successful: 0
      });
    } catch (error) {
      console.error('Error fetching call center data:', error);
      toast({
        title: "Error",
        description: "Failed to load call center data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-primary text-primary-foreground';
      case 'contacted': return 'bg-secondary text-secondary-foreground';
      case 'scheduled': return 'bg-accent text-accent-foreground';
      case 'qualified': return 'bg-success text-success-foreground';
      case 'converted': return 'bg-success text-success-foreground';
      case 'lost': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 3) return 'text-destructive';
    if (priority <= 6) return 'text-foreground';
    return 'text-muted-foreground';
  };

  const isUrgent = (mustContactBy: string) => {
    return new Date(mustContactBy) < new Date();
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-4 bg-muted rounded"></div>
                <div className="h-8 bg-muted rounded"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">AI Call Center</h2>
          <p className="text-muted-foreground">Customer contact management and activity tracking</p>
        </div>
        <Button onClick={fetchCallCenterData} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leads Today</CardTitle>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold text-foreground">{stats?.leads_received || 0}</span>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contacted</CardTitle>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-success" />
              <span className="text-2xl font-bold text-foreground">{stats?.leads_contacted || 0}</span>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Converted</CardTitle>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <span className="text-2xl font-bold text-foreground">{stats?.leads_converted || 0}</span>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Response</CardTitle>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-accent" />
              <span className="text-2xl font-bold text-foreground">{Math.round(stats?.average_response_time_minutes || 0)}m</span>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Calls Made</CardTitle>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold text-foreground">{stats?.calls_made || 0}</span>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-success" />
              <span className="text-2xl font-bold text-foreground">
                {stats?.calls_made ? Math.round((stats.calls_successful / stats.calls_made) * 100) : 0}%
              </span>
            </div>
          </CardHeader>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Recent Leads</CardTitle>
            <CardDescription>Latest customer contacts requiring attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {leads.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No leads yet</p>
            ) : (
              leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{lead.customer_name}</span>
                      <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
                      {isUrgent(lead.must_contact_by) && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{lead.customer_phone}</p>
                    <p className="text-xs text-muted-foreground">
                      Created {formatDistanceToNow(new Date(lead.created_at))} ago
                    </p>
                    {lead.damage_description && (
                      <p className="text-sm text-foreground">{lead.damage_description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-medium ${getPriorityColor(lead.priority_level)}`}>
                      Priority {lead.priority_level}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Contact by {new Date(lead.must_contact_by).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground">Recent Activities</CardTitle>
            <CardDescription>Latest AI call center actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No activities yet</p>
            ) : (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 border border-border rounded-lg">
                  <div className="mt-1">
                    {activity.activity_type === 'call_success' && <Phone className="h-4 w-4 text-success" />}
                    {activity.activity_type === 'call_attempt' && <Phone className="h-4 w-4 text-primary" />}
                    {activity.activity_type === 'voicemail' && <Phone className="h-4 w-4 text-accent" />}
                    {activity.activity_type === 'email_sent' && <CheckCircle className="h-4 w-4 text-secondary" />}
                    {activity.activity_type === 'inspection_scheduled' && <CheckCircle className="h-4 w-4 text-success" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{activity.lead?.customer_name}</span>
                      <Badge variant="outline">{activity.activity_type.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{activity.lead?.customer_phone}</p>
                    {activity.summary && (
                      <p className="text-sm text-foreground">{activity.summary}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(activity.created_at))} ago</span>
                      {activity.duration_seconds && (
                        <span>{Math.round(activity.duration_seconds / 60)}m duration</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CallCenterOverview;