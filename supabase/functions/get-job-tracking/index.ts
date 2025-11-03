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
    const { tracking_token, job_code } = await req.json();

    if ((!tracking_token || typeof tracking_token !== 'string') && (!job_code || typeof job_code !== 'string')) {
      return new Response(
        JSON.stringify({ error: 'Provide tracking_token or job_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to bypass RLS and query with exact token match
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
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
      `);

    if (tracking_token) {
      query = query.eq('tracking_token', tracking_token);
    } else if (job_code) {
      // match first 8 chars of UUID id
      query = query.like('id', `${job_code.toLowerCase()}%`);
    }

    const { data: appointment, error } = await query.single();

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
