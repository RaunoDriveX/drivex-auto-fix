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
        additional_notes,
        created_at,
        total_cost,
        vehicle_info,
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

    let appointment;
    let error;

    if (tracking_token) {
      const result = await query.eq('tracking_token', tracking_token).maybeSingle();
      appointment = result.data;
      error = result.error;
    } else if (job_code) {
      // Search by first 8 characters of UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      // User provides first 8 chars, we add the dash for proper UUID matching
      const formattedCode = `${job_code.toLowerCase()}-`;
      console.log('Searching for job code:', job_code, 'formatted as:', formattedCode);
      
      // Since UUID is stored as uuid type, we need to use text casting
      // The .ilike() doesn't work on uuid columns, so we search using the pattern
      const { data: allAppointments, error: fetchError } = await supabase
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
          total_cost,
          vehicle_info,
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
      
      if (fetchError) {
        error = fetchError;
      } else if (allAppointments) {
        // Filter in memory by checking if ID starts with the code
        appointment = allAppointments.find(apt => 
          apt.id.toLowerCase().startsWith(formattedCode)
        );
        if (!appointment) {
          error = { message: 'No matching appointment found' };
        }
      }
    }

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
