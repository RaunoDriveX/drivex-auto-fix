import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { InsurerDashboard as InsurerDashboardComponent } from '@/components/insurer/InsurerDashboard';
import { InsurerJobsBoard } from '@/components/insurer/InsurerJobsBoard';
import { UserManagement } from '@/components/insurer/UserManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useInsurerAuth } from '@/hooks/useInsurerAuth';
import { LogOut, Building2 } from 'lucide-react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
export default function InsurerDashboard() {
  const { t } = useTranslation('insurer');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Check if in demo mode - only allow in development
  useEffect(() => {
    const isDevelopment = import.meta.env.MODE === 'development';
    const demoMode = isDevelopment && sessionStorage.getItem('demoMode') === 'true';
    setIsDemoMode(demoMode);
  }, []);

  // Use real auth hook
  const { profile, userRole, loading, signOut: authSignOut, requireAuth, isAdmin } = useInsurerAuth();

  useEffect(() => {
    // Only require auth if not in demo mode
    if (!isDemoMode) {
      requireAuth();
    }
  }, [isDemoMode]);

  // Create mock data for demo mode
  const mockProfile = {
    insurer_name: 'Demo Insurance Company',
    contact_person: 'Demo User',
    email: sessionStorage.getItem('demoEmail') || 'demo@insurance.com'
  };

  const mockUserRole = {
    full_name: 'Demo User',
    role: 'admin' as const
  };

  // Use mock or real data depending on mode
  const displayProfile = isDemoMode ? mockProfile : profile;
  const displayUserRole = isDemoMode ? mockUserRole : userRole;

  const handleSignOut = () => {
    if (isDemoMode) {
      // Demo mode - clear session storage and navigate
      sessionStorage.removeItem('demoMode');
      sessionStorage.removeItem('demoEmail');
      window.location.href = '/insurer-auth';
    } else {
      // Real auth - use the auth hook's signOut
      authSignOut();
    }
  };

  const checkIsAdmin = () => {
    if (isDemoMode) return true;
    return isAdmin();
  };

  // Show loading only for real auth mode
  if (!isDemoMode && loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Skip null check for demo mode
  if (!isDemoMode && !displayProfile) {
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
                    <h1 className="text-lg font-semibold">{displayProfile?.insurer_name}</h1>
                    <p className="text-sm text-muted-foreground">
                      {displayUserRole ? `${displayUserRole.full_name} • ${displayUserRole.role === 'admin' ? t('user_management.admin') : t('user_management.claims_user')}` : displayProfile?.contact_person}
                    </p>
                  </div>
                </div>
                {isDemoMode && (
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">
                    🧪 {t('demo_mode', { ns: 'shop' })}
                  </Badge>
                )}
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="jobs">{t('tabs.jobs')}</TabsTrigger>
                  <TabsTrigger value="network">{t('tabs.network')}</TabsTrigger>
                  {checkIsAdmin() && <TabsTrigger value="users">{t('tabs.users')}</TabsTrigger>}
                </TabsList>
              </div>
              <div className="flex items-center gap-3">
                <LanguageSwitcher />
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  {t('sign_out', { ns: 'shop' })}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <TabsContent value="jobs" className="mt-0">
          <InsurerJobsBoard />
        </TabsContent>
        
        <TabsContent value="network" className="mt-0">
          <InsurerDashboardComponent />
        </TabsContent>
        
        {checkIsAdmin() && (
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