import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication (cron job or authorized system call)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log("Running appointment reminder check...");

    // Get appointments scheduled for tomorrow (24 hours from now)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('appointment_date', tomorrowDate)
      .eq('status', 'confirmed');

    if (error) {
      console.error("Error fetching appointments:", error);
      throw error;
    }

    console.log(`Found ${appointments?.length || 0} appointments for tomorrow`);

    const emailPromises = appointments?.map(async (appointment) => {
      const formattedDate = new Date(appointment.appointment_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      try {
        const emailResponse = await resend.emails.send({
          from: "DriveX Reminders <noreply@resend.dev>",
          to: [appointment.customer_email],
          subject: `Reminder: Your ${appointment.service_type} appointment tomorrow`,
          html: `
            <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <div style="background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">Appointment Reminder</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your appointment is tomorrow!</p>
              </div>
              
              <div style="padding: 30px; background: #f8f9fa;">
                <h2 style="color: #333; margin-bottom: 20px;">Hello ${appointment.customer_name},</h2>
                
                <p>This is a friendly reminder that your windshield ${appointment.service_type} appointment is scheduled for <strong>tomorrow</strong>.</p>
                
                <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <h3 style="color: #ff6b35; margin-top: 0; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Appointment Details</h3>
                  
                  <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin: 15px 0;">
                    <strong>Service:</strong> <span>${appointment.service_type}</span>
                    <strong>Shop:</strong> <span>${appointment.shop_name}</span>
                    <strong>Date:</strong> <span>${formattedDate}</span>
                    <strong>Time:</strong> <span>${appointment.appointment_time}</span>
                    ${appointment.total_cost ? `<strong>Total Cost:</strong> <span>€${appointment.total_cost}</span>` : ''}
                    <strong>Reference:</strong> <span>${appointment.id.slice(0, 8).toUpperCase()}</span>
                  </div>
                </div>
                
                <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                  <h4 style="color: #856404; margin-top: 0;">Preparation Checklist:</h4>
                  <ul style="margin: 0; padding-left: 20px; color: #856404;">
                    <li>Arrive 10 minutes early</li>
                    <li>Bring your insurance documents</li>
                    <li>Remove any items from your dashboard</li>
                    <li>Check the weather (for mobile services)</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <div style="background: #d1ecf1; padding: 15px; border-radius: 8px; border-left: 4px solid #17a2b8;">
                    <p style="margin: 0; color: #0c5460;"><strong>Need to reschedule?</strong></p>
                    <p style="margin: 5px 0 0 0; color: #0c5460; font-size: 14px;">Contact ${appointment.shop_name} as soon as possible.</p>
                  </div>
                </div>
              </div>
              
              <div style="background: #333; color: white; padding: 20px; text-align: center;">
                <p style="margin: 0; font-size: 14px;">We look forward to seeing you tomorrow!</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">DriveX - Your trusted windshield experts</p>
              </div>
            </div>
          `,
        });

        console.log(`Reminder email sent to ${appointment.customer_email}:`, emailResponse);
        return { appointmentId: appointment.id, success: true, emailResponse };
      } catch (emailError) {
        console.error(`Failed to send reminder email to ${appointment.customer_email}:`, emailError);
        return { appointmentId: appointment.id, success: false, error: emailError.message };
      }
    }) || [];

    const results = await Promise.all(emailPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    console.log(`Reminder emails sent: ${successCount} successful, ${failureCount} failed`);

    return new Response(JSON.stringify({
      success: true,
      processed: appointments?.length || 0,
      sent: successCount,
      failed: failureCount,
      results
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in reminder email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);