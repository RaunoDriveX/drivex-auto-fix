import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { appointment_id } = await req.json();

    if (!appointment_id) {
      return new Response(
        JSON.stringify({ error: 'appointment_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Deleting appointment: ${appointment_id}`);

    // Delete related records first (respecting foreign keys)
    await supabase.from('job_offer_upsells').delete().eq('job_offer_id', appointment_id);
    await supabase.from('job_status_audit').delete().eq('appointment_id', appointment_id);
    await supabase.from('job_completion_documents').delete().eq('appointment_id', appointment_id);
    await supabase.from('insurance_claims').delete().eq('appointment_id', appointment_id);
    await supabase.from('customer_notification_preferences').delete().eq('appointment_id', appointment_id);
    await supabase.from('shop_availability').update({ appointment_id: null }).eq('appointment_id', appointment_id);
    
    // Delete job offers linked to this appointment
    await supabase.from('job_offers').delete().eq('appointment_id', appointment_id);

    // Finally delete the appointment
    const { data, error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', appointment_id)
      .select();

    if (error) {
      console.error('Error deleting appointment:', error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Appointment deleted:', data);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete appointment' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
