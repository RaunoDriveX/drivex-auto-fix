import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { 
  Bell, 
  Mail, 
  MessageSquare, 
  Phone, 
  Settings,
  Check,
  Send
} from 'lucide-react';

interface NotificationProps {
  appointmentId: string;
}

interface NotificationSettings {
  email: boolean;
  sms: boolean; 
  whatsapp: boolean;
}

export const CustomerJobNotifications: React.FC<NotificationProps> = ({ 
  appointmentId 
}) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: true,
    sms: false,
    whatsapp: false
  });
  const [testLoading, setTestLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, [appointmentId]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_notification_preferences')
        .select('*')
        .eq('appointment_id', appointmentId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          email: data.email_enabled,
          sms: data.sms_enabled,
          whatsapp: data.whatsapp_enabled
        });
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateNotificationSettings = async (newSettings: NotificationSettings) => {
    try {
      // Upsert preferences to database
      const { error } = await supabase
        .from('customer_notification_preferences')
        .upsert({
          appointment_id: appointmentId,
          email_enabled: newSettings.email,
          sms_enabled: newSettings.sms,
          whatsapp_enabled: newSettings.whatsapp
        }, {
          onConflict: 'appointment_id'
        });

      if (error) throw error;

      setSettings(newSettings);
      toast({
        title: "Settings Updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating notification settings:', error);
      toast({
        title: "Error",
        description: "Failed to update notification settings.",
        variant: "destructive"
      });
    }
  };

  const sendTestNotification = async () => {
    setTestLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-job-notification', {
        body: {
          appointmentId,
          type: 'test',
          settings
        }
      });

      if (error) throw error;

      toast({
        title: "Test Notification Sent",
        description: "Check your enabled notification channels for the test message.",
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast({
        title: "Error", 
        description: "Failed to send test notification.",
        variant: "destructive"
      });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Choose how you want to receive updates about your repair job
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            <div className="h-16 bg-muted animate-pulse rounded" />
            <div className="h-16 bg-muted animate-pulse rounded" />
            <div className="h-16 bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            {/* Notification Types */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Notification Channels
              </h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <div>
                      <Label htmlFor="email-notifications" className="text-sm font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive updates via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={settings.email}
                    onCheckedChange={(checked) => 
                      updateNotificationSettings({ ...settings, email: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-green-600" />
                    <div>
                      <Label htmlFor="sms-notifications" className="text-sm font-medium">
                        SMS Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive text messages for urgent updates
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="sms-notifications" 
                    checked={settings.sms}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings({ ...settings, sms: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <div>
                      <Label htmlFor="whatsapp-notifications" className="text-sm font-medium">
                        WhatsApp Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receive updates via WhatsApp
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="whatsapp-notifications"
                    checked={settings.whatsapp}
                    onCheckedChange={(checked) =>
                      updateNotificationSettings({ ...settings, whatsapp: checked })
                    }
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* What you'll receive */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">You'll be notified when:</h4>
              <div className="space-y-2">
                {[
                  'Your appointment is confirmed',
                  'Work begins on your vehicle', 
                  'Your repair is completed',
                  'There are any delays or changes',
                  'Your vehicle is ready for pickup'
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="h-3 w-3 text-green-600" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Test notification */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium">Test Notifications</h4>
                <p className="text-xs text-muted-foreground">
                  Send a test message to verify your settings
                </p>
              </div>
              <Button
                onClick={sendTestNotification}
                disabled={testLoading || (!settings.email && !settings.sms && !settings.whatsapp)}
                size="sm"
                variant="outline"
              >
                {testLoading ? (
                  <>Sending...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Test
                  </>
                )}
              </Button>
            </div>

            {/* Current settings summary */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">Active Channels:</span>
              </div>
              <div className="flex gap-2">
                {settings.email && <Badge variant="secondary">Email</Badge>}
                {settings.sms && <Badge variant="secondary">SMS</Badge>}
                {settings.whatsapp && <Badge variant="secondary">WhatsApp</Badge>}
                {!settings.email && !settings.sms && !settings.whatsapp && (
                  <Badge variant="outline">No notifications enabled</Badge>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};