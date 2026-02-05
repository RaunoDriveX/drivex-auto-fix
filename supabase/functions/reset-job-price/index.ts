import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { appointmentId } = await req.json();

    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: 'appointmentId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resetting price for appointment:', appointmentId);

    // Reset the total_cost to null so shop can re-submit
    const { error: updateError } = await supabase
      .from('appointments')
      .update({
        total_cost: null,
        workflow_stage: 'customer_handover'
      })
      .eq('id', appointmentId);

    if (updateError) {
      console.error('Error updating appointment:', updateError);
      throw updateError;
    }

    // Delete any existing cost estimates
    const { error: deleteError } = await supabase
      .from('insurer_cost_estimates')
      .delete()
      .eq('appointment_id', appointmentId);

    if (deleteError) {
      console.error('Error deleting cost estimates:', deleteError);
    }

    console.log('Price reset successfully for appointment:', appointmentId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Price reset - shop can now submit their price offer'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error resetting price:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to reset price' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
