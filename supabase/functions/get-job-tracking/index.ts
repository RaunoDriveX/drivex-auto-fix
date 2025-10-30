import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { tracking_token } = await req.json();

    if (!tracking_token || typeof tracking_token !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Valid tracking_token is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to bypass RLS and query with exact token match
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        id,
        job_status,
        estimated_completion,
        job_started_at,
        job_completed_at,
        appointment_date,
        appointment_time,
        service_type,
        damage_type,
        shop_name,
        shop_id,
        customer_name,
        additional_notes,
        created_at,
        shops:shop_id (
          name,
          address,
          city,
          postal_code,
          phone,
          email,
          rating
        )
      `)
      .eq('tracking_token', tracking_token)
      .single();

    if (error || !appointment) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch audit trail for status history
    const { data: statusHistory } = await supabase
      .from('job_status_audit')
      .select('old_status, new_status, status_changed_at, notes')
      .eq('appointment_id', appointment.id)
      .order('status_changed_at', { ascending: true });

    return new Response(
      JSON.stringify({ 
        appointment,
        statusHistory: statusHistory || []
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching job tracking:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
