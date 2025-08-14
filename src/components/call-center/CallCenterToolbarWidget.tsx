import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Phone, AlertCircle, Users, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ToolbarStats {
  urgentLeads: number;
  activeCallsToday: number;
  responseRate: number;
  recentActivity: {
    id: string;
    customer_name: string;
    activity_type: string;
    created_at: string;
  }[];
}

const CallCenterToolbarWidget = () => {
  const [stats, setStats] = useState<ToolbarStats>({
    urgentLeads: 0,
    activeCallsToday: 0,
    responseRate: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchToolbarStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchToolbarStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchToolbarStats = async () => {
    try {
      // Get urgent leads (past due date)
      const { data: urgentLeads } = await supabase
        .from('call_center_leads')
        .select('id')
        .lt('must_contact_by', new Date().toISOString())
        .in('status', ['new', 'contacted']);

      // Get today's activities
      const { data: todayActivities } = await supabase
        .from('call_center_activities')
        .select('*')
        .gte('created_at', new Date().toISOString().split('T')[0]);

      // Get recent activities with lead info
      const { data: recentActivities } = await supabase
        .from('call_center_activities')
        .select(`
          id,
          activity_type,
          created_at,
          lead:call_center_leads(customer_name)
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      // Get today's stats
      const { data: dailyStats } = await supabase
        .from('call_center_stats')
        .select('*')
        .eq('date', new Date().toISOString().split('T')[0])
        .single();

      const callsToday = todayActivities?.filter(a => 
        ['call_attempt', 'call_success'].includes(a.activity_type)
      ).length || 0;

      const responseRate = dailyStats?.calls_made 
        ? Math.round((dailyStats.calls_successful / dailyStats.calls_made) * 100)
        : 0;

      setStats({
        urgentLeads: urgentLeads?.length || 0,
        activeCallsToday: callsToday,
        responseRate,
        recentActivity: recentActivities?.map(a => ({
          id: a.id,
          customer_name: a.lead?.customer_name || 'Unknown',
          activity_type: a.activity_type,
          created_at: a.created_at
        })) || []
      });
    } catch (error) {
      console.error('Error fetching toolbar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 animate-pulse bg-muted rounded"></div>
        <div className="w-8 h-4 animate-pulse bg-muted rounded"></div>
      </div>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2 relative">
          <Phone className="h-4 w-4" />
          <span className="hidden sm:inline">Call Center</span>
          {stats.urgentLeads > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {stats.urgentLeads}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-foreground">AI Call Center</h4>
            <Button variant="ghost" size="sm" onClick={fetchToolbarStats}>
              Refresh
            </Button>
          </div>
          
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded bg-muted/50">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <AlertCircle className="h-3 w-3" />
                Urgent
              </div>
              <div className="text-lg font-bold text-destructive">{stats.urgentLeads}</div>
            </div>
            <div className="text-center p-2 rounded bg-muted/50">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Phone className="h-3 w-3" />
                Calls
              </div>
              <div className="text-lg font-bold text-foreground">{stats.activeCallsToday}</div>
            </div>
            <div className="text-center p-2 rounded bg-muted/50">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <TrendingUp className="h-3 w-3" />
                Rate
              </div>
              <div className="text-lg font-bold text-success">{stats.responseRate}%</div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h5 className="text-sm font-medium text-foreground mb-2">Recent Activity</h5>
            <div className="space-y-2">
              {stats.recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2">No recent activity</p>
              ) : (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-primary" />
                      <span className="font-medium text-foreground">{activity.customer_name}</span>
                    </div>
                    <div className="text-right text-muted-foreground">
                      <div>{activity.activity_type.replace('_', ' ')}</div>
                      <div>{formatDistanceToNow(new Date(activity.created_at))} ago</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <Button size="sm" className="w-full" asChild>
              <Link to="/shop-dashboard">View Full Dashboard</Link>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default CallCenterToolbarWidget;