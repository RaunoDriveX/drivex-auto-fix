import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  console.log('Job tracking function called - public endpoint');
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

    // Use service role to bypass RLS
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
        customer_email,
        customer_phone,
        insurer_name,
        additional_notes,
        created_at,
        total_cost,
        vehicle_info
      `);

    let appointment;
    let error;

    console.log('Lookup request:', { tracking_token, job_code });

    if (tracking_token) {
      const result = await query.eq('tracking_token', tracking_token).maybeSingle();
      appointment = result.data;
      error = result.error;
    } else if (job_code) {
      // Search by short_code (first 8 characters of UUID)
      console.log('Searching for job code:', job_code);
      const result = await query.eq('short_code', job_code.toUpperCase()).maybeSingle();
      console.log('Query result:', { data: result.data, error: result.error });
      appointment = result.data;
      error = result.error;
    }

    if (error || !appointment) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch shop details separately if appointment found
    if (appointment && appointment.shop_id) {
      const { data: shopData } = await supabase
        .from('shops')
        .select('name, address, city, postal_code, phone, email, rating')
        .eq('id', appointment.shop_id)
        .maybeSingle();
      
      if (shopData) {
        appointment.shops = shopData;
      }
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
