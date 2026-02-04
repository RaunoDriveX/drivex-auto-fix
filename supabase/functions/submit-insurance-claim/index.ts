import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ClaimPacket {
  appointmentId: string;
  claimNumber: string;
  policyNumber: string;
  insurerName: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  damageType: string;
  damageSeverity: string;
  damageLocation: string;
  aiConfidenceScore: number;
  aiAssessmentDetails: any;
  damagePhotos: string[];
  estimatedCostMin: number;
  estimatedCostMax: number;
  recommendedAction: 'repair' | 'replacement';
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

async function submitClaimViaAPI(packet: ClaimPacket, insurerName: string) {
  console.log(`Attempting API submission for insurer: ${insurerName}`);
  
  // Mock API endpoints for different insurers
  const insurerAPIs: Record<string, string> = {
    'allianz': 'https://api.allianz.com/claims/submit',
    'axa': 'https://api.axa.com/claims/windshield',
    'ing': 'https://api.ing.nl/insurance/claims',
    'aegon': 'https://api.aegon.com/auto-glass-claims'
  };
  
  const apiUrl = insurerAPIs[insurerName.toLowerCase()];
  
  if (!apiUrl) {
    throw new Error(`No API endpoint configured for ${insurerName}`);
  }
  
  // Prepare claim data in insurer-specific format
  const claimData = {
    claim_number: packet.claimNumber,
    policy_number: packet.policyNumber,
    customer: {
      name: packet.customerName,
      email: packet.customerEmail,
      phone: packet.customerPhone
    },
    damage: {
      type: packet.damageType,
      severity: packet.damageSeverity,
      location: packet.damageLocation,
      ai_assessment: {
        confidence: packet.aiConfidenceScore,
        details: packet.aiAssessmentDetails,
        recommended_action: packet.recommendedAction
      }
    },
    cost_estimate: {
      min: packet.estimatedCostMin,
      max: packet.estimatedCostMax
    },
    documentation: {
      photos: packet.damagePhotos,
      submission_date: new Date().toISOString()
    }
  };
  
  // Simulate API call (in production, use actual insurer APIs)
  console.log('Submitting claim data:', claimData);
  
  // Mock successful response
  return {
    success: true,
    claim_id: `${insurerName.toUpperCase()}-${Date.now()}`,
    status: 'received',
    estimated_processing_time: '3-5 business days',
    reference_number: packet.claimNumber
  };
}

async function submitClaimViaEmail(packet: ClaimPacket) {
  console.log('Submitting claim via secure email');
  
  // Generate secure email with claim packet
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Insurance Claim Submission - ${packet.claimNumber}</h2>
      
      <h3>Policy Information</h3>
      <p><strong>Policy Number:</strong> ${packet.policyNumber}</p>
      <p><strong>Insurance Company:</strong> ${packet.insurerName}</p>
      
      <h3>Customer Information</h3>
      <p><strong>Name:</strong> ${packet.customerName}</p>
      <p><strong>Email:</strong> ${packet.customerEmail}</p>
      ${packet.customerPhone ? `<p><strong>Phone:</strong> ${packet.customerPhone}</p>` : ''}
      
      <h3>Damage Assessment</h3>
      <p><strong>Type:</strong> ${packet.damageType}</p>
      <p><strong>Severity:</strong> ${packet.damageSeverity}</p>
      <p><strong>Location:</strong> ${packet.damageLocation}</p>
      <p><strong>AI Confidence:</strong> ${(packet.aiConfidenceScore * 100).toFixed(0)}%</p>
      <p><strong>Recommended Action:</strong> ${packet.recommendedAction}</p>
      
      <h3>Cost Estimate</h3>
      <p><strong>Estimated Cost Range:</strong> €${packet.estimatedCostMin} - €${packet.estimatedCostMax}</p>
      
      <h3>Documentation</h3>
      <p><strong>Damage Photos:</strong> ${packet.damagePhotos.length} photos attached</p>
      <p><strong>AI Assessment Details:</strong> Available in system</p>
      
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        This claim was submitted automatically by DriveX Claims Processing System.
        Claim Number: ${packet.claimNumber}
      </p>
    </div>
  `;
  
  // Get insurer email (in production, this would be from a configuration table)
  const insurerEmails: Record<string, string> = {
    'allianz': 'claims@allianz.com',
    'axa': 'autoglass@axa.com',
    'ing': 'glassclaims@ing.nl',
    'aegon': 'windshield@aegon.com',
    'other': 'claims@insurance-processor.com'
  };
  
  const toEmail = insurerEmails[packet.insurerName.toLowerCase()] || insurerEmails.other;
  
  const { error } = await resend.emails.send({
    from: 'DriveX Claims <claims@drivex.com>',
    to: [toEmail],
    cc: [packet.customerEmail],
    subject: `Auto Glass Claim Submission - ${packet.claimNumber}`,
    html: emailContent,
    attachments: packet.damagePhotos.map((photo, index) => ({
      filename: `damage-photo-${index + 1}.jpg`,
      content: photo // In production, convert URLs to base64 or fetch files
    }))
  });
  
  if (error) {
    throw new Error(`Email submission failed: ${error.message}`);
  }
  
  return {
    success: true,
    method: 'email',
    sent_to: toEmail,
    sent_at: new Date().toISOString()
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const packet: ClaimPacket = await req.json();
    console.log('Processing claim submission:', packet.claimNumber);
    
    let submissionResult;
    let submissionMethod = 'api';
    
    try {
      // Try API submission first
      submissionResult = await submitClaimViaAPI(packet, packet.insurerName);
      console.log('API submission successful:', submissionResult);
    } catch (apiError) {
      console.log('API submission failed, falling back to email:', apiError);
      
      // Fallback to email submission
      submissionResult = await submitClaimViaEmail(packet);
      submissionMethod = 'email';
      console.log('Email submission successful:', submissionResult);
    }
    
    // Store the submitted claim in database
    const { data: claim, error: dbError } = await supabase
      .from('insurance_claims')
      .insert({
        appointment_id: packet.appointmentId,
        claim_number: packet.claimNumber,
        policy_number: packet.policyNumber,
        insurer_name: packet.insurerName,
        customer_name: packet.customerName,
        customer_email: packet.customerEmail,
        customer_phone: packet.customerPhone,
        damage_type: packet.damageType,
        damage_severity: packet.damageSeverity,
        damage_location: packet.damageLocation,
        ai_confidence_score: packet.aiConfidenceScore,
        ai_assessment_details: packet.aiAssessmentDetails,
        damage_photos: packet.damagePhotos,
        estimated_cost_min: packet.estimatedCostMin,
        estimated_cost_max: packet.estimatedCostMax,
        recommended_action: packet.recommendedAction,
        submission_method: submissionMethod,
        submission_status: 'submitted',
        submitted_at: new Date().toISOString(),
        api_response: submissionResult,
        email_sent_at: submissionMethod === 'email' ? new Date().toISOString() : null
      })
      .select()
      .single();
    
    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to store claim in database', details: dbError.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
    
    console.log('Claim stored successfully:', claim.id);
    
    return new Response(
      JSON.stringify({
        success: true,
        claimId: claim.id,
        claimNumber: packet.claimNumber,
        submissionMethod,
        submissionResult,
        message: `Claim submitted successfully via ${submissionMethod}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders }
      }
    );
    
  } catch (error: any) {
    console.error('Error in submit-insurance-claim function:', error);
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