import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  
  record.count++;
  return record.count > RATE_LIMIT;
}

Deno.serve(async (req) => {
  console.log('Customer selection confirmation function called');
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    if (isRateLimited(clientIp)) {
      console.warn(`Rate limit exceeded for IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { tracking_token, action, shop_id, appointment_date, appointment_time } = await req.json();

    // Validate tracking token
    if (!tracking_token || typeof tracking_token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Tracking token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tracking tokens can be hex (32 chars) or base64-like (32 chars with alphanumeric, dashes, underscores)
    if (!/^[a-zA-Z0-9_-]{32}$/.test(tracking_token)) {
      console.log('Invalid tracking token format:', tracking_token);
      return new Response(
        JSON.stringify({ error: 'Invalid tracking token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action - now includes 'select_shop_and_schedule'
    const validActions = ['select_shop', 'approve_cost', 'select_shop_and_schedule'];
    if (!action || !validActions.includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use select_shop, select_shop_and_schedule, or approve_cost' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get appointment by tracking token
    const { data: appointment, error: fetchError } = await supabase
      .from('appointments')
      .select('id, workflow_stage, customer_shop_selection, customer_cost_approved')
      .eq('tracking_token', tracking_token)
      .maybeSingle();

    if (fetchError || !appointment) {
      console.log(`Appointment not found for token from IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Appointment not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle combined shop + schedule selection (NEW - Phase 2)
    if (action === 'select_shop_and_schedule') {
      // Validate required fields
      if (!shop_id || typeof shop_id !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Shop ID is required for shop selection' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!appointment_date || !appointment_time) {
        return new Response(
          JSON.stringify({ error: 'Appointment date and time are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(appointment_date)) {
        return new Response(
          JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate time format (HH:MM:SS)
      if (!/^\d{2}:\d{2}:\d{2}$/.test(appointment_time)) {
        return new Response(
          JSON.stringify({ error: 'Invalid time format. Use HH:MM:SS' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check workflow stage
      if (appointment.workflow_stage !== 'shop_selection') {
        return new Response(
          JSON.stringify({ error: 'Shop selection is not available for this appointment' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Already selected
      if (appointment.customer_shop_selection) {
        return new Response(
          JSON.stringify({ error: 'Shop has already been selected' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify shop is one of the offered options
      const { data: validSelection } = await supabase
        .from('insurer_shop_selections')
        .select('id, estimated_price')
        .eq('appointment_id', appointment.id)
        .eq('shop_id', shop_id)
        .maybeSingle();

      if (!validSelection) {
        return new Response(
          JSON.stringify({ error: 'Selected shop is not one of the available options' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get shop details for the update
      const { data: shopDetails } = await supabase
        .from('shops')
        .select('name')
        .eq('id', shop_id)
        .maybeSingle();

      // Update appointment with shop selection AND schedule in one step
      // Set workflow_stage to 'awaiting_shop_response' - waiting for shop to accept
      // Also update shop_id and shop_name so the job is properly assigned
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          shop_id: shop_id,
          shop_name: shopDetails?.name || 'Selected Shop',
          customer_shop_selection: shop_id,
          customer_shop_selected_at: new Date().toISOString(),
          appointment_date: appointment_date,
          appointment_time: appointment_time,
          appointment_confirmed_at: new Date().toISOString(),
          workflow_stage: 'awaiting_shop_response',
          total_cost: validSelection.estimated_price,
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.id);

      if (updateError) {
        console.error('Error updating shop selection and schedule:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save shop selection and schedule' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Book the time slot in shop_availability
      await supabase
        .from('shop_availability')
        .upsert({
          shop_id: shop_id,
          date: appointment_date,
          time_slot: appointment_time,
          is_available: false,
          appointment_id: appointment.id
        });

      // Create a job offer for the selected shop so they can accept/decline
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      const { error: offerError } = await supabase
        .from('job_offers')
        .insert({
          appointment_id: appointment.id,
          shop_id: shop_id,
          offered_price: validSelection.estimated_price || 0,
          status: 'offered',
          expires_at: expiresAt.toISOString(),
          notes: `Customer selected shop and scheduled for ${appointment_date} at ${appointment_time}`
        });

      if (offerError) {
        console.error('Error creating job offer:', offerError);
        // Non-blocking - log but continue
      }

      // Send notification to shop
      try {
        await supabase
          .from('shop_notifications')
          .insert({
            shop_id: shop_id,
            notification_type: 'new_job_offer',
            title: 'New Job Offer',
            message: `Customer has selected your shop and scheduled for ${appointment_date} at ${appointment_time}`,
            data: {
              appointment_id: appointment.id,
              appointment_date,
              appointment_time,
              estimated_price: validSelection.estimated_price
            }
          });
      } catch (notifError) {
        console.error('Failed to create shop notification:', notifError);
      }

      console.log(`Shop ${shop_id} selected with schedule ${appointment_date} ${appointment_time} for appointment ${appointment.id} from IP: ${clientIp}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Shop selected and appointment scheduled successfully. Waiting for shop confirmation.',
          next_stage: 'awaiting_shop_response'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle legacy select_shop action (without scheduling)
    if (action === 'select_shop') {
      // Validate shop_id is provided
      if (!shop_id || typeof shop_id !== 'string') {
        return new Response(
          JSON.stringify({ error: 'Shop ID is required for shop selection' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check workflow stage
      if (appointment.workflow_stage !== 'shop_selection') {
        return new Response(
          JSON.stringify({ error: 'Shop selection is not available for this appointment' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Already selected
      if (appointment.customer_shop_selection) {
        return new Response(
          JSON.stringify({ error: 'Shop has already been selected' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify shop is one of the offered options
      const { data: validSelection } = await supabase
        .from('insurer_shop_selections')
        .select('id')
        .eq('appointment_id', appointment.id)
        .eq('shop_id', shop_id)
        .maybeSingle();

      if (!validSelection) {
        return new Response(
          JSON.stringify({ error: 'Selected shop is not one of the available options' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update appointment with shop selection
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          customer_shop_selection: shop_id,
          customer_shop_selected_at: new Date().toISOString(),
          workflow_stage: 'awaiting_smartscan',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.id);

      if (updateError) {
        console.error('Error updating shop selection:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save shop selection' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Shop ${shop_id} selected for appointment ${appointment.id} from IP: ${clientIp}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Shop selected successfully',
          next_stage: 'awaiting_smartscan'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'approve_cost') {
      // Check workflow stage
      if (appointment.workflow_stage !== 'cost_approval') {
        return new Response(
          JSON.stringify({ error: 'Cost approval is not available for this appointment' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Already approved
      if (appointment.customer_cost_approved) {
        return new Response(
          JSON.stringify({ error: 'Cost has already been approved' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify cost estimate exists
      const { data: costEstimate } = await supabase
        .from('insurer_cost_estimates')
        .select('id')
        .eq('appointment_id', appointment.id)
        .maybeSingle();

      if (!costEstimate) {
        return new Response(
          JSON.stringify({ error: 'No cost estimate found for this appointment' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update appointment with cost approval
      // After customer approves cost, the job is ready for work - set job_status to 'scheduled'
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          customer_cost_approved: true,
          customer_cost_approved_at: new Date().toISOString(),
          job_status: 'scheduled',
          workflow_stage: 'scheduled',
          updated_at: new Date().toISOString()
        })
        .eq('id', appointment.id);

      if (updateError) {
        console.error('Error updating cost approval:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to save cost approval' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Cost approved for appointment ${appointment.id} from IP: ${clientIp}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Cost approved successfully. Job is now scheduled.',
          next_stage: 'scheduled'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing customer selection:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
