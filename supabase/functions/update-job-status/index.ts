import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Zod schema for input validation
const UpdateStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  newStatus: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']),
  shopId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
  estimatedCompletion: z.string().datetime().optional()
});

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get authenticated user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const requestBody = await req.json();
    const validationResult = UpdateStatusSchema.safeParse(requestBody);

    if (!validationResult.success) {
      return new Response(JSON.stringify({ 
        error: 'Invalid request data',
        details: validationResult.error.errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      appointmentId,
      newStatus,
      shopId,
      notes,
      estimatedCompletion
    } = validationResult.data;

    // Verify shop ownership
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('id', shopId)
      .eq('email', user.email)
      .single();

    if (shopError || !shop) {
      return new Response(JSON.stringify({ 
        error: 'Unauthorized - you do not own this shop' 
      }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing status update: ${appointmentId} -> ${newStatus} by shop ${shopId}`);

    // Get current appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('shop_id', shopId)  // Ensure appointment belongs to this shop
      .single();

    if (appointmentError || !appointment) {
      return new Response(JSON.stringify({ 
        error: 'Appointment not found or access denied' 
      }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const currentStatus = appointment.job_status || 'scheduled';
    
    // Prevent invalid status transitions
    const validTransitions: Record<string, string[]> = {
      'scheduled': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': [], // No transitions from completed
      'cancelled': [] // No transitions from cancelled
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      return new Response(JSON.stringify({ 
        error: `Invalid status transition from ${currentStatus} to ${newStatus}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare update data
    const updateData: any = {
      job_status: newStatus,
      updated_at: new Date().toISOString()
    };

    // Add timestamps based on status
    if (newStatus === 'in_progress') {
      updateData.job_started_at = new Date().toISOString();
      if (estimatedCompletion) {
        updateData.estimated_completion = estimatedCompletion;
      }
    } else if (newStatus === 'completed') {
      updateData.job_completed_at = new Date().toISOString();
    }

    // Update appointment status
    const { error: updateError } = await supabase
      .from('appointments')
      .update(updateData)
      .eq('id', appointmentId);

    if (updateError) {
      throw new Error(`Failed to update appointment: ${updateError.message}`);
    }

    // Get the job offer ID for this appointment and shop
    const { data: jobOffer } = await supabase
      .from('job_offers')
      .select('id')
      .eq('appointment_id', appointmentId)
      .eq('shop_id', shopId)
      .single();

    // Create audit log entry
    const auditData = {
      appointment_id: appointmentId,
      job_offer_id: jobOffer?.id || null,
      claim_id: appointment.id,
      old_status: currentStatus,
      new_status: newStatus,
      status_changed_at: new Date().toISOString(),
      changed_by_shop_id: shopId,
      notes: notes || null,
      metadata: {
        estimated_completion: estimatedCompletion || null,
        user_agent: req.headers.get('user-agent'),
        ip_address: req.headers.get('x-forwarded-for') || 'unknown'
      }
    };

    const { data: auditLog, error: auditError } = await supabase
      .from('job_status_audit')
      .insert(auditData)
      .select()
      .single();

    if (auditError) {
      console.error('Failed to create audit log:', auditError);
    }

    // Send webhook notifications to insurer if applicable
    if (appointment.insurer_name) {
      try {
        await sendWebhookNotification(appointment, auditLog, newStatus);
      } catch (webhookError) {
        console.error('Webhook notification failed:', webhookError);
        // Don't fail the main operation if webhook fails
      }
    }

    console.log(`Successfully updated job status to ${newStatus} for appointment ${appointmentId}`);

    // Send customer notification
    try {
      const { error: notificationError } = await supabase.functions.invoke('send-job-notification', {
        body: {
          appointmentId,
          type: 'status_change',
          newStatus,
          settings: {
            email: true,
            sms: true,
            whatsapp: false
          }
        }
      });
      
      if (notificationError) {
        console.error('Failed to send customer notification:', notificationError);
      } else {
        console.log('Customer notification sent successfully');
      }
    } catch (notificationError) {
      console.error('Error sending customer notification:', notificationError);
    }

    return new Response(JSON.stringify({
      success: true,
      appointmentId,
      oldStatus: currentStatus,
      newStatus,
      timestamp: new Date().toISOString(),
      auditLogId: auditLog?.id
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error updating job status:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

async function sendWebhookNotification(appointment: any, auditLog: any, newStatus: string) {
  // Get insurer profile and webhook config
  const { data: insurerProfile } = await supabase
    .from('insurer_profiles')
    .select('id')
    .eq('insurer_name', appointment.insurer_name)
    .single();

  if (!insurerProfile) {
    console.log(`No insurer profile found for: ${appointment.insurer_name}`);
    return;
  }

  const { data: webhookConfig } = await supabase
    .from('insurer_webhook_configs')
    .select('webhook_url, webhook_secret_hash, events_subscribed, retry_attempts, timeout_seconds, is_active, id')
    .eq('insurer_id', insurerProfile.id)
    .eq('is_active', true)
    .single();

  if (!webhookConfig) {
    console.log(`No webhook config found for insurer: ${appointment.insurer_name}`);
    return;
  }

  // Check if this event type is subscribed
  if (!webhookConfig.events_subscribed?.includes('status_change') && 
      !(newStatus === 'completed' && webhookConfig.events_subscribed?.includes('job_completed'))) {
    console.log(`Event type not subscribed for insurer: ${appointment.insurer_name}`);
    return;
  }

  // Prepare webhook payload
  const webhookPayload = {
    event_type: 'job_status_update',
    timestamp: auditLog.status_changed_at,
    data: {
      claim_id: appointment.id,
      appointment_id: appointment.id,
      customer_name: appointment.customer_name,
      customer_email: appointment.customer_email,
      old_status: auditLog.old_status,
      new_status: auditLog.new_status,
      shop_id: auditLog.changed_by_shop_id,
      notes: auditLog.notes,
      job_started_at: appointment.job_started_at,
      job_completed_at: appointment.job_completed_at,
      estimated_completion: appointment.estimated_completion
    }
  };

  // Sign payload using stored hash (for verification only - secret must be stored by insurer)
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'DriveX-Webhooks/1.0'
  };

  // Note: We no longer have access to plaintext secret
  // Insurers must store the secret themselves and verify using the hash
  
  let attempt = 0;
  let lastError;
  
  while (attempt < webhookConfig.retry_attempts) {
    try {
      console.log(`Sending webhook to ${webhookConfig.webhook_url} (attempt ${attempt + 1})`);
      
      const response = await fetch(webhookConfig.webhook_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(webhookPayload),
        signal: AbortSignal.timeout(webhookConfig.timeout_seconds * 1000)
      });

      const responseText = await response.text();
      
      if (response.ok) {
        console.log(`Webhook sent successfully to ${appointment.insurer_name}`);
        
        // Update webhook success
        await supabase
          .from('insurer_webhook_configs')
          .update({ 
            last_success_at: new Date().toISOString() 
          })
          .eq('id', webhookConfig.id);

        // Update audit log with webhook success
        await supabase
          .from('job_status_audit')
          .update({
            webhook_sent_at: new Date().toISOString(),
            webhook_response: {
              status: response.status,
              response: responseText,
              attempt: attempt + 1,
              success: true
            }
          })
          .eq('id', auditLog.id);

        return; // Success, exit retry loop
        
      } else {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      
    } catch (error) {
      lastError = error;
      attempt++;
      console.error(`Webhook attempt ${attempt} failed:`, error);
      
      if (attempt < webhookConfig.retry_attempts) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  // All attempts failed
  console.error(`All webhook attempts failed for ${appointment.insurer_name}:`, lastError);
  
  // Update webhook failure
  await supabase
    .from('insurer_webhook_configs')
    .update({ 
      last_failure_at: new Date().toISOString() 
    })
    .eq('id', webhookConfig.id);

  // Update audit log with webhook failure
  await supabase
    .from('job_status_audit')
    .update({
      webhook_response: {
        error: lastError?.message || 'Unknown error',
        attempts: webhookConfig.retry_attempts,
        success: false
      }
    })
    .eq('id', auditLog.id);
}

serve(handler);