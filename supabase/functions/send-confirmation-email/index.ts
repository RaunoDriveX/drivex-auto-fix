import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConfirmationEmailRequest {
  appointmentId: string;
  jobCode?: string;
  customerName: string;
  customerEmail: string;
  shopName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceType: string;
  totalCost?: number;
}

// Input validation schema
const ConfirmationEmailSchema = z.object({
  appointmentId: z.string().uuid(),
  jobCode: z.string().optional(),
  customerName: z.string().min(1).max(200),
  customerEmail: z.string().email().max(255),
  shopName: z.string().min(1).max(200),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  serviceType: z.string().max(100),
  totalCost: z.number().positive().max(999999).optional(),
});

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate input
    const rawInput = await req.json();
    const validatedInput = ConfirmationEmailSchema.parse(rawInput);
    
    const {
      appointmentId,
      jobCode,
      customerName,
      customerEmail,
      shopName,
      appointmentDate,
      appointmentTime,
      serviceType,
      totalCost,
    }: ConfirmationEmailRequest = validatedInput;

    console.log("Sending confirmation email for appointment:", appointmentId);

    // Format the date and time for display
    const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const displayJobCode = jobCode || appointmentId.slice(0, 8).toUpperCase();

    const emailResponse = await resend.emails.send({
      from: "DriveX <noreply@resend.dev>",
      to: [customerEmail],
      subject: `Appointment Confirmation - ${serviceType} at ${shopName}`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px;">Appointment Confirmed!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Your windshield ${serviceType} is scheduled</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${customerName},</h2>
            
            <p>Great news! Your windshield ${serviceType} appointment has been confirmed. Here are the details:</p>
            
            <div style="background: white; padding: 25px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Appointment Details</h3>
              
              <div style="display: grid; grid-template-columns: 120px 1fr; gap: 10px; margin: 15px 0;">
                <strong>Service:</strong> <span>${serviceType}</span>
                <strong>Shop:</strong> <span>${shopName}</span>
                <strong>Date:</strong> <span>${formattedDate}</span>
                <strong>Time:</strong> <span>${appointmentTime}</span>
                ${totalCost ? `<strong>Total Cost:</strong> <span>€${totalCost.toFixed(2)}</span>` : ''}
                <strong>Job ID:</strong> <span style="font-family: monospace; font-weight: bold; color: #667eea;">${displayJobCode}</span>
              </div>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #1976d2; margin-top: 0;">Track Your Job:</h4>
              <p style="margin: 10px 0;">Use your Job ID to track your repair status in real-time:</p>
              <div style="text-align: center; margin: 15px 0;">
                <a href="https://88284c8a-502c-486d-8904-4b118b55e5dd.lovableproject.com/track/${displayJobCode}" 
                   style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Track My Job
                </a>
              </div>
            </div>
            
            <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="color: #f57c00; margin-top: 0;">What to expect:</h4>
              <ul style="margin: 0; padding-left: 20px;">
                <li>You'll receive a reminder 24 hours before your appointment</li>
                <li>Please arrive 10 minutes early</li>
                <li>Bring your insurance documents if applicable</li>
                <li>The ${serviceType} typically takes 1-2 hours</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p>Need to reschedule or have questions?</p>
              <p style="color: #666; font-size: 14px;">Contact ${shopName} directly or reply to this email.</p>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">Thanks for choosing DriveX for your windshield needs!</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.7;">This is an automated confirmation email.</p>
          </div>
        </div>
      `,
    });

    console.log("Confirmation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error sending confirmation email:", error);
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