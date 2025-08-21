import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.55.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  appointmentId: string;
  type: 'status_change' | 'delay' | 'test';
  newStatus?: string;
  delayMinutes?: number;
  settings?: {
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
}

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId, type, newStatus, delayMinutes, settings }: NotificationRequest = await req.json();

    console.log('Processing notification request:', { appointmentId, type, newStatus });

    // Fetch appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        shops (
          name,
          phone,
          address,
          city
        )
      `)
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Appointment not found');
    }

    console.log('Found appointment:', appointment);

    // Prepare notification content based on type
    let subject = '';
    let emailContent = '';
    let smsContent = '';

    switch (type) {
      case 'status_change':
        subject = `Job Update: ${newStatus?.replace('_', ' ')} - ${appointment.shops?.name}`;
        emailContent = generateStatusChangeEmail(appointment, newStatus!);
        smsContent = `DriveX Update: Your repair job is now ${newStatus?.replace('_', ' ')}. View details: ${getTrackingUrl(appointmentId)}`;
        break;

      case 'delay':
        subject = `Appointment Delayed - ${appointment.shops?.name}`;
        emailContent = generateDelayEmail(appointment, delayMinutes!);
        smsContent = `DriveX: Your appointment is delayed by ${delayMinutes} minutes. New ETA will be updated shortly.`;
        break;

      case 'test':
        subject = `Test Notification - DriveX Job Tracking`;
        emailContent = generateTestEmail(appointment);
        smsContent = `DriveX Test: Notifications are working! Track your job: ${getTrackingUrl(appointmentId)}`;
        break;

      default:
        throw new Error('Invalid notification type');
    }

    const results: any[] = [];

    // Send email if enabled
    if (settings?.email !== false && appointment.customer_email) {
      try {
        const emailResult = await resend.emails.send({
          from: "DriveX <notifications@drivex.com>",
          to: [appointment.customer_email],
          subject,
          html: emailContent,
        });

        console.log('Email sent:', emailResult);
        results.push({ channel: 'email', success: true, result: emailResult });
      } catch (emailError) {
        console.error('Email error:', emailError);
        results.push({ channel: 'email', success: false, error: emailError.message });
      }
    }

    // SMS notifications (placeholder - would integrate with SMS provider)
    if (settings?.sms && appointment.customer_phone) {
      try {
        // This would integrate with an SMS provider like Twilio
        console.log('SMS would be sent to:', appointment.customer_phone, 'Content:', smsContent);
        results.push({ channel: 'sms', success: true, message: 'SMS would be sent (not implemented)' });
      } catch (smsError) {
        console.error('SMS error:', smsError);
        results.push({ channel: 'sms', success: false, error: smsError.message });
      }
    }

    // WhatsApp notifications (placeholder - would integrate with WhatsApp Business API)
    if (settings?.whatsapp && appointment.customer_phone) {
      try {
        // This would integrate with WhatsApp Business API
        console.log('WhatsApp would be sent to:', appointment.customer_phone, 'Content:', smsContent);
        results.push({ channel: 'whatsapp', success: true, message: 'WhatsApp would be sent (not implemented)' });
      } catch (whatsappError) {
        console.error('WhatsApp error:', whatsappError);
        results.push({ channel: 'whatsapp', success: false, error: whatsappError.message });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      appointmentId 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error('Error in send-job-notification function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      },
    });
  }
};

function getTrackingUrl(appointmentId: string): string {
  return `${Deno.env.get("SITE_URL") || 'https://your-domain.com'}/track/${appointmentId}`;
}

function generateStatusChangeEmail(appointment: any, newStatus: string): string {
  const statusMessages = {
    scheduled: 'has been scheduled and confirmed',
    in_progress: 'is now in progress - our technician has started working on your vehicle',
    completed: 'has been completed successfully',
    cancelled: 'has been cancelled'
  };

  const nextSteps = {
    scheduled: 'Please arrive at the scheduled time. We will notify you of any changes.',
    in_progress: 'Our experienced technician is working on your repair. We will update you when completed.',
    completed: 'Your vehicle is ready for pickup! Please contact the shop to arrange collection.',
    cancelled: 'If you have any questions, please contact the shop directly.'
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .status { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .details { background: #f5f5f5; padding: 15px; border-radius: 8px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Job Status Update</h1>
          <p>Hello ${appointment.customer_name},</p>
        </div>
        
        <div class="status">
          <h2>Your repair job ${statusMessages[newStatus as keyof typeof statusMessages] || 'has been updated'}</h2>
          <p><strong>Status:</strong> ${newStatus.replace('_', ' ').toUpperCase()}</p>
        </div>
        
        <div class="details">
          <h3>Job Details:</h3>
          <p><strong>Shop:</strong> ${appointment.shops?.name}</p>
          <p><strong>Service:</strong> ${appointment.service_type}</p>
          <p><strong>Vehicle:</strong> ${appointment.vehicle_info?.year || ''} ${appointment.vehicle_info?.make || ''} ${appointment.vehicle_info?.model || ''}</p>
          <p><strong>Appointment:</strong> ${appointment.appointment_date} at ${appointment.appointment_time}</p>
        </div>
        
        <p>${nextSteps[newStatus as keyof typeof nextSteps] || 'Thank you for choosing DriveX.'}</p>
        
        <a href="${getTrackingUrl(appointment.id)}" class="button">Track Your Job</a>
        
        <p>If you have any questions, please contact ${appointment.shops?.name} directly${appointment.shops?.phone ? ` at ${appointment.shops.phone}` : ''}.</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">
          This is an automated notification from DriveX. You can update your notification preferences in your job tracking page.
        </p>
      </div>
    </body>
    </html>
  `;
}

function generateDelayEmail(appointment: any, delayMinutes: number): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .delay-notice { background: #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .details { background: #f5f5f5; padding: 15px; border-radius: 8px; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Appointment Delayed</h1>
          <p>Hello ${appointment.customer_name},</p>
        </div>
        
        <div class="delay-notice">
          <h2>Your appointment has been delayed by approximately ${delayMinutes} minutes</h2>
          <p>We sincerely apologize for any inconvenience this may cause.</p>
        </div>
        
        <div class="details">
          <h3>Updated Details:</h3>
          <p><strong>Shop:</strong> ${appointment.shops?.name}</p>
          <p><strong>Original Time:</strong> ${appointment.appointment_date} at ${appointment.appointment_time}</p>
          <p><strong>Estimated Delay:</strong> ${delayMinutes} minutes</p>
        </div>
        
        <p>We will keep you updated with any further changes. The shop will contact you directly if needed.</p>
        
        <a href="${getTrackingUrl(appointment.id)}" class="button">Track Your Job</a>
        
        <p>Thank you for your patience and understanding.</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">
          This is an automated notification from DriveX.
        </p>
      </div>
    </body>
    </html>
  `;
}

function generateTestEmail(appointment: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .test-notice { background: #d4edda; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Test Notification</h1>
          <p>Hello ${appointment.customer_name},</p>
        </div>
        
        <div class="test-notice">
          <h2>✓ Your notifications are working perfectly!</h2>
          <p>This is a test message to confirm your notification settings are configured correctly.</p>
        </div>
        
        <p>You will receive similar notifications when:</p>
        <ul>
          <li>Your appointment status changes</li>
          <li>Work begins or completes on your vehicle</li>
          <li>There are any delays or updates</li>
        </ul>
        
        <a href="${getTrackingUrl(appointment.id)}" class="button">View Your Job</a>
        
        <p>Thank you for using DriveX job tracking!</p>
        
        <hr>
        <p style="font-size: 12px; color: #666;">
          This was a test notification from DriveX.
        </p>
      </div>
    </body>
    </html>
  `;
}

serve(handler);