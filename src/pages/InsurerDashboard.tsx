import React, { useEffect } from 'react';
import { InsurerDashboard as InsurerDashboardComponent } from '@/components/insurer/InsurerDashboard';
import { InsurerJobsBoard } from '@/components/insurer/InsurerJobsBoard';
import { UserManagement } from '@/components/insurer/UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useInsurerAuth } from '@/hooks/useInsurerAuth';
import { LogOut, Building2 } from 'lucide-react';

export default function InsurerDashboard() {
  const { profile, userRole, loading, signOut, requireAuth, isAdmin } = useInsurerAuth();

  useEffect(() => {
    requireAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="jobs" className="w-full">
        <div className="border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-primary" />
                  <div>
                    <h1 className="text-lg font-semibold">{profile.insurer_name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {userRole ? `${userRole.full_name} • ${userRole.role === 'admin' ? 'Admin' : 'Claims User'}` : profile.contact_person}
                    </p>
                  </div>
                </div>
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="jobs">Live Jobs</TabsTrigger>
                  <TabsTrigger value="network">Shop Network</TabsTrigger>
                  {isAdmin() && <TabsTrigger value="users">User Management</TabsTrigger>}
                </TabsList>
              </div>
              <Button 
                variant="outline" 
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
        
        <TabsContent value="jobs" className="mt-0">
          <InsurerJobsBoard />
        </TabsContent>
        
        <TabsContent value="network" className="mt-0">
          <InsurerDashboardComponent />
        </TabsContent>
        
        {isAdmin() && (
          <TabsContent value="users" className="mt-0">
            <div className="container mx-auto px-4 py-6">
              <UserManagement />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}