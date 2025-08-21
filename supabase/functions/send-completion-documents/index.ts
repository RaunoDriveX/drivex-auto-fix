import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Resend } from 'npm:resend@4.0.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocumentDeliveryRequest {
  completionDocumentId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { completionDocumentId }: DocumentDeliveryRequest = await req.json();

    console.log(`Processing document delivery for completion document: ${completionDocumentId}`);

    // Get completion document details with appointment and insurer info
    const { data: completionDoc, error: docError } = await supabase
      .from('job_completion_documents')
      .select(`
        *,
        appointments!inner (
          id,
          customer_name,
          customer_email,
          insurer_name,
          service_type,
          total_cost,
          appointment_date,
          appointment_time,
          shop_name
        )
      `)
      .eq('id', completionDocumentId)
      .single();

    if (docError || !completionDoc) {
      throw new Error(`Completion document not found: ${docError?.message}`);
    }

    const appointment = completionDoc.appointments;
    if (!appointment.insurer_name) {
      console.log('No insurer specified for this appointment, skipping document delivery');
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'No insurer specified for this appointment' 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get insurer profile and webhook configuration
    const { data: insurerProfile } = await supabase
      .from('insurer_profiles')
      .select('id, insurer_name, email, contact_person')
      .eq('insurer_name', appointment.insurer_name)
      .single();

    if (!insurerProfile) {
      console.log(`No insurer profile found for: ${appointment.insurer_name}`);
      await updateDeliveryStatus(completionDocumentId, 'failed', 'email', {
        error: 'Insurer profile not found'
      });
      return new Response(JSON.stringify({ 
        success: false, 
        message: 'Insurer profile not found' 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for webhook configuration first
    const { data: webhookConfig } = await supabase
      .from('insurer_webhook_configs')
      .select('*')
      .eq('insurer_id', insurerProfile.id)
      .eq('is_active', true)
      .single();

    let deliveryMethod: string;
    let deliverySuccess = false;
    let deliveryResponse: any = {};

    // Try webhook delivery first if configured
    if (webhookConfig && webhookConfig.events_subscribed?.includes('job_completed')) {
      console.log(`Attempting webhook delivery to ${webhookConfig.webhook_url}`);
      
      try {
        const webhookPayload = {
          event_type: 'job_completion_documents',
          timestamp: new Date().toISOString(),
          data: {
            claim_id: appointment.id,
            appointment_id: appointment.id,
            customer_name: appointment.customer_name,
            service_type: appointment.service_type,
            completion_date: completionDoc.uploaded_at,
            invoice_file_path: completionDoc.invoice_file_path,
            completion_proof_path: completionDoc.completion_proof_path,
            total_cost: appointment.total_cost,
            shop_name: appointment.shop_name
          }
        };

        const response = await fetch(webhookConfig.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'DriveX-Webhooks/1.0'
          },
          body: JSON.stringify(webhookPayload),
          signal: AbortSignal.timeout(webhookConfig.timeout_seconds * 1000)
        });

        if (response.ok) {
          deliveryMethod = 'api';
          deliverySuccess = true;
          deliveryResponse = {
            status: response.status,
            webhook_url: webhookConfig.webhook_url,
            response_text: await response.text()
          };
          console.log('Webhook delivery successful');
        } else {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      } catch (webhookError) {
        console.error('Webhook delivery failed:', webhookError);
        deliveryResponse.webhook_error = webhookError.message;
        // Fall back to email delivery
      }
    }

    // Fall back to email delivery if webhook failed or not configured
    if (!deliverySuccess) {
      console.log('Attempting email delivery to insurer');
      
      try {
        // Get signed URLs for the files to include in email
        const { data: invoiceUrl } = await supabase.storage
          .from('invoices')
          .createSignedUrl(completionDoc.invoice_file_path, 24 * 60 * 60); // 24 hours

        const { data: proofUrl } = await supabase.storage
          .from('completion-proofs')
          .createSignedUrl(completionDoc.completion_proof_path, 24 * 60 * 60); // 24 hours

        const emailSubject = `Job Completion Documents - Claim ${appointment.id}`;
        const emailBody = `
          <h2>Job Completion Documents</h2>
          <p>Dear ${insurerProfile.contact_person || 'Claims Team'},</p>
          
          <p>The repair job has been completed and the following documents are now available:</p>
          
          <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3>Job Details</h3>
            <ul>
              <li><strong>Claim ID:</strong> ${appointment.id}</li>
              <li><strong>Customer:</strong> ${appointment.customer_name}</li>
              <li><strong>Service:</strong> ${appointment.service_type}</li>
              <li><strong>Shop:</strong> ${appointment.shop_name}</li>
              <li><strong>Scheduled Date:</strong> ${appointment.appointment_date} at ${appointment.appointment_time}</li>
              <li><strong>Total Cost:</strong> €${appointment.total_cost}</li>
              <li><strong>Completed:</strong> ${new Date(completionDoc.uploaded_at).toLocaleString()}</li>
            </ul>
          </div>
          
          <div style="background: #e8f5e8; padding: 20px; margin: 20px 0; border-radius: 8px;">
            <h3>📄 Documents Available</h3>
            <p><strong>Invoice:</strong> ${completionDoc.invoice_file_name}</p>
            <p><strong>Completion Proof:</strong> ${completionDoc.completion_proof_file_name}</p>
            
            ${invoiceUrl?.signedUrl && proofUrl?.signedUrl ? `
              <p style="margin-top: 20px;">
                <a href="${invoiceUrl.signedUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-right: 10px;">Download Invoice</a>
                <a href="${proofUrl.signedUrl}" style="background: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Proof Photo</a>
              </p>
              <p><small>Links expire in 24 hours</small></p>
            ` : '<p><em>Document links could not be generated. Please contact support.</em></p>'}
          </div>
          
          <p>This completes the repair process for claim ${appointment.id}. Please review the documents and update the claim status accordingly.</p>
          
          <p>Best regards,<br>
          DriveX Repair Network<br>
          <a href="mailto:claims@drivex.com">claims@drivex.com</a></p>
        `;

        const { data: emailResult, error: emailError } = await resend.emails.send({
          from: 'DriveX Claims <claims@drivex.com>',
          to: [insurerProfile.email],
          subject: emailSubject,
          html: emailBody,
        });

        if (emailError) {
          throw emailError;
        }

        deliveryMethod = 'email';
        deliverySuccess = true;
        deliveryResponse = {
          email_id: emailResult.id,
          recipient: insurerProfile.email,
          subject: emailSubject
        };
        console.log('Email delivery successful');

      } catch (emailError) {
        console.error('Email delivery failed:', emailError);
        deliveryResponse.email_error = emailError.message;
      }
    }

    // Update delivery status
    const status = deliverySuccess ? 'sent' : 'failed';
    await updateDeliveryStatus(completionDocumentId, status, deliveryMethod, deliveryResponse);

    console.log(`Document delivery ${status} via ${deliveryMethod} for completion document ${completionDocumentId}`);

    return new Response(JSON.stringify({
      success: deliverySuccess,
      deliveryMethod,
      completionDocumentId,
      timestamp: new Date().toISOString(),
      response: deliveryResponse
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in completion document delivery:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

async function updateDeliveryStatus(
  completionDocumentId: string,
  status: string,
  method: string,
  response: any
) {
  const { error } = await supabase
    .from('job_completion_documents')
    .update({
      insurer_delivery_status: status,
      insurer_delivery_method: method,
      insurer_delivery_response: response,
      sent_to_insurer_at: status === 'sent' ? new Date().toISOString() : null
    })
    .eq('id', completionDocumentId);

  if (error) {
    console.error('Error updating delivery status:', error);
  }
}

serve(handler);