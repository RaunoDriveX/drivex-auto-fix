import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobResponseRequest {
  jobOfferId: string;
  response: 'accept' | 'decline';
  declineReason?: string;
  counterOffer?: number;
  notes?: string;
}

// Input validation schema
const JobResponseSchema = z.object({
  jobOfferId: z.string().uuid(),
  response: z.enum(['accept', 'decline']),
  declineReason: z.string().max(500).optional(),
  counterOffer: z.number().positive().max(999999).optional(),
  notes: z.string().max(1000).optional(),
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get authenticated user from Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Job response from user: ${user.email}`);

    // Verify user owns a shop
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('email', user.email)
      .single();

    if (shopError || !shop) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - no shop associated with this user' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate input
    const rawInput = await req.json();
    const validatedInput = JobResponseSchema.parse(rawInput);
    const {
      jobOfferId,
      response,
      declineReason,
      counterOffer,
      notes
    }: JobResponseRequest = validatedInput;

    console.log(`Processing ${response} response for job offer ${jobOfferId}`);

    // Get job offer details and verify ownership
    const { data: jobOffer, error: offerError } = await supabase
      .from('job_offers')
      .select(`
        *,
        appointments:appointment_id (*)
      `)
      .eq('id', jobOfferId)
      .eq('shop_id', shop.id)  // Verify this offer belongs to user's shop
      .single();

    if (offerError || !jobOffer) {
      return new Response(
        JSON.stringify({ error: 'Job offer not found or access denied' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (jobOffer.status !== 'offered') {
      throw new Error(`Job offer is no longer available (status: ${jobOffer.status})`);
    }

    // Check if offer has expired
    if (new Date() > new Date(jobOffer.expires_at)) {
      await supabase
        .from('job_offers')
        .update({ status: 'expired' })
        .eq('id', jobOfferId);
      
      throw new Error('Job offer has expired');
    }

    const responseTime = (Date.now() - new Date(jobOffer.offered_at).getTime()) / (1000 * 60); // in minutes

    // Update job offer status
    const updateData: any = {
      status: response === 'accept' ? 'accepted' : 'declined',
      responded_at: new Date().toISOString(),
      decline_reason: declineReason,
      notes: notes
    };

    if (counterOffer && response === 'accept') {
      updateData.offered_price = counterOffer;
    }

    const { error: updateError } = await supabase
      .from('job_offers')
      .update(updateData)
      .eq('id', jobOfferId);

    if (updateError) {
      throw new Error(`Failed to update job offer: ${updateError.message}`);
    }

    // Get current shop stats
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', jobOffer.shop_id)
      .single();

    if (shopError) {
      throw new Error(`Shop not found: ${shopError.message}`);
    }

    // Update shop performance metrics
    const newAcceptedCount = response === 'accept' 
      ? (shop.jobs_accepted_count || 0) + 1 
      : (shop.jobs_accepted_count || 0);
    
    const newDeclinedCount = response === 'decline' 
      ? (shop.jobs_declined_count || 0) + 1 
      : (shop.jobs_declined_count || 0);

    const totalResponses = newAcceptedCount + newDeclinedCount;
    const newAcceptanceRate = totalResponses > 0 ? (newAcceptedCount / totalResponses) * 100 : 0;

    // Calculate new average response time
    const currentResponseTime = shop.response_time_minutes || 0;
    const totalOffers = shop.jobs_offered_count || 1;
    const newAvgResponseTime = ((currentResponseTime * (totalOffers - 1)) + responseTime) / totalOffers;

    // Determine new performance tier based on metrics
    let newPerformanceTier = 'standard';
    if (newAcceptanceRate >= 90 && newAvgResponseTime <= 15 && (shop.quality_score || 0) >= 4.5) {
      newPerformanceTier = 'premium';
    } else if (newAcceptanceRate >= 80 && newAvgResponseTime <= 30 && (shop.quality_score || 0) >= 4.0) {
      newPerformanceTier = 'gold';
    }

    const { error: shopUpdateError } = await supabase
      .from('shops')
      .update({
        jobs_accepted_count: newAcceptedCount,
        jobs_declined_count: newDeclinedCount,
        acceptance_rate: Math.round(newAcceptanceRate * 100) / 100,
        response_time_minutes: Math.round(newAvgResponseTime * 100) / 100,
        performance_tier: newPerformanceTier
      })
      .eq('id', jobOffer.shop_id);

    if (shopUpdateError) {
      console.error('Failed to update shop metrics:', shopUpdateError);
    }

    if (response === 'accept') {
      // If accepted, cancel other pending offers for the same appointment
      const { error: cancelError } = await supabase
        .from('job_offers')
        .update({ status: 'expired' })
        .eq('appointment_id', jobOffer.appointment_id)
        .neq('id', jobOfferId)
        .in('status', ['offered']);

      if (cancelError) {
        console.error('Failed to cancel other offers:', cancelError);
      }

      // Update appointment with selected shop
      const { error: appointmentUpdateError } = await supabase
        .from('appointments')
        .update({
          shop_id: jobOffer.shop_id,
          shop_name: shop.name,
          status: 'confirmed',
          total_cost: counterOffer || jobOffer.offered_price
        })
        .eq('id', jobOffer.appointment_id);

      if (appointmentUpdateError) {
        console.error('Failed to update appointment:', appointmentUpdateError);
      }

      console.log(`Job accepted by ${shop.name} for €${counterOffer || jobOffer.offered_price}`);
    } else {
      console.log(`Job declined by ${shop.name}. Reason: ${declineReason || 'Not specified'}`);
    }

    // Send notification about response
    const { error: notificationError } = await supabase
      .from('shop_notifications')
      .insert({
        shop_id: jobOffer.shop_id,
        notification_type: 'job_update',
        title: `Job ${response === 'accept' ? 'accepted' : 'declined'}`,
        message: `You have ${response === 'accept' ? 'accepted' : 'declined'} the job offer`,
        data: {
          job_offer_id: jobOfferId,
          appointment_id: jobOffer.appointment_id,
          response: response,
          response_time_minutes: Math.round(responseTime * 100) / 100,
          new_performance_tier: newPerformanceTier
        }
      });

    if (notificationError) {
      console.error('Failed to create response notification:', notificationError);
    }

    return new Response(JSON.stringify({
      success: true,
      response: response,
      jobOfferId: jobOfferId,
      responseTimeMinutes: Math.round(responseTime * 100) / 100,
      newAcceptanceRate: Math.round(newAcceptanceRate * 100) / 100,
      newPerformanceTier: newPerformanceTier,
      message: response === 'accept' 
        ? 'Job accepted successfully! Appointment confirmed.' 
        : 'Job declined. Thank you for your response.'
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error processing job response:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

serve(handler);