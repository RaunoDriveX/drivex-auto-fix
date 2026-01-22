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

    const { tracking_token, action, shop_id } = await req.json();

    // Validate tracking token
    if (!tracking_token || typeof tracking_token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Tracking token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tracking tokens are 32 alphanumeric characters
    if (!/^[a-zA-Z0-9]{32}$/.test(tracking_token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tracking token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate action
    if (!action || !['select_shop', 'approve_cost'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use select_shop or approve_cost' }),
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
      // After cost approval, job moves to 'damage_report' stage for the insurer to review
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          customer_cost_approved: true,
          customer_cost_approved_at: new Date().toISOString(),
          workflow_stage: 'damage_report',
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
          message: 'Cost approved successfully',
          next_stage: 'damage_report'
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