import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  appointmentId: string;
  notificationType: "shop_selection" | "cost_approval";
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { appointmentId, notificationType }: NotificationRequest = await req.json();

    if (!appointmentId || !notificationType) {
      return new Response(
        JSON.stringify({ error: "appointmentId and notificationType are required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from("appointments")
      .select("id, customer_name, customer_email, tracking_token, short_code, insurer_name, preferred_contact_method")
      .eq("id", appointmentId)
      .single();

    if (appointmentError || !appointment) {
      console.error("Error fetching appointment:", appointmentError);
      return new Response(
        JSON.stringify({ error: "Appointment not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!appointment.customer_email) {
      console.error("No customer email for appointment:", appointmentId);
      return new Response(
        JSON.stringify({ error: "Customer email not found" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build tracking URL
    const baseUrl = "https://drivex-auto-fix.lovable.app";
    const trackingUrl = `${baseUrl}/track/${appointment.tracking_token}`;

    let subject: string;
    let htmlContent: string;

    if (notificationType === "shop_selection") {
      // Fetch shop selections for details
      const { data: selections } = await supabase
        .from("insurer_shop_selections")
        .select(`
          priority_order,
          estimated_price,
          distance_km,
          shop_id
        `)
        .eq("appointment_id", appointmentId)
        .order("priority_order", { ascending: true });

      const shopCount = selections?.length || 0;

      subject = `Action Required: Choose Your Repair Shop - ${appointment.insurer_name || "DriveX"}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Choose Your Repair Shop</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0066cc 0%, #004999 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Choose Your Repair Shop</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hello ${appointment.customer_name || "Valued Customer"},</p>
            
            <p>Your insurance company has selected <strong>${shopCount} repair shop${shopCount !== 1 ? 's' : ''}</strong> for you to choose from for your windshield repair.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc;">
              <p style="margin: 0; font-weight: 600;">What you need to do:</p>
              <p style="margin: 10px 0 0 0;">Click the button below to view the shop options and select the one that works best for you.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">View Shop Options</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #0066cc;">${trackingUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              Tracking Code: <strong>${appointment.short_code || 'N/A'}</strong><br>
              This email was sent by ${appointment.insurer_name || "DriveX"} Glass Repair Network
            </p>
          </div>
        </body>
        </html>
      `;
    } else {
      // Cost approval notification
      const { data: estimate } = await supabase
        .from("insurer_cost_estimates")
        .select("total_cost, labor_cost, parts_cost")
        .eq("appointment_id", appointmentId)
        .single();

      const totalCost = estimate?.total_cost || 0;

      subject = `Action Required: Approve Repair Cost - ${appointment.insurer_name || "DriveX"}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Approve Repair Cost</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0066cc 0%, #004999 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Cost Estimate Ready</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px;">Hello ${appointment.customer_name || "Valued Customer"},</p>
            
            <p>The cost estimate for your windshield repair is now ready for your approval.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; border: 2px solid #0066cc;">
              <p style="margin: 0; color: #666; font-size: 14px;">Estimated Total</p>
              <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: 700; color: #0066cc;">€${totalCost.toFixed(2)}</p>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0066cc;">
              <p style="margin: 0; font-weight: 600;">What you need to do:</p>
              <p style="margin: 10px 0 0 0;">Click the button below to review the detailed breakdown and approve the cost to proceed with your repair.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${trackingUrl}" style="display: inline-block; background: #0066cc; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Review & Approve</a>
            </div>
            
            <p style="color: #666; font-size: 14px;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #0066cc;">${trackingUrl}</p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
            
            <p style="color: #666; font-size: 12px; text-align: center;">
              Tracking Code: <strong>${appointment.short_code || 'N/A'}</strong><br>
              This email was sent by ${appointment.insurer_name || "DriveX"} Glass Repair Network
            </p>
          </div>
        </body>
        </html>
      `;
    }

    // Send email
    console.log(`Sending ${notificationType} notification to ${appointment.customer_email}`);
    
    const emailResponse = await resend.emails.send({
      from: "DriveX Glass Repair <onboarding@resend.dev>",
      to: [appointment.customer_email],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${notificationType} notification sent`,
        emailId: emailResponse.id 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
