import React from 'react';
import { InsurerDashboard as InsurerDashboardComponent } from '@/components/insurer/InsurerDashboard';
import { InsurerJobsBoard } from '@/components/insurer/InsurerJobsBoard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InsurerDashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Tabs defaultValue="jobs" className="w-full">
        <div className="border-b">
          <div className="container mx-auto">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="jobs">Live Jobs</TabsTrigger>
              <TabsTrigger value="network">Shop Network</TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <TabsContent value="jobs" className="mt-0">
          <InsurerJobsBoard />
        </TabsContent>
        
        <TabsContent value="network" className="mt-0">
          <InsurerDashboardComponent />
        </TabsContent>
      </Tabs>
    </div>
  );
}