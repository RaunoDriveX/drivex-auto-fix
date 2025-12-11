import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

    console.log('Starting database cleanup...');

    // Delete in order respecting foreign key constraints
    const tables = [
      'job_offer_upsells',
      'job_status_audit', 
      'job_completion_documents',
      'insurance_claims',
      'job_offers',
      'customer_notification_preferences',
      'appointments'
    ];

    const results: Record<string, number> = {};

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
        .select();
      
      if (error) {
        console.error(`Error clearing ${table}:`, error);
        results[table] = -1;
      } else {
        results[table] = data?.length || 0;
        console.log(`Cleared ${results[table]} records from ${table}`);
      }
    }

    // Also clear shop_availability records that were linked to appointments
    const { data: availData, error: availError } = await supabase
      .from('shop_availability')
      .delete()
      .not('appointment_id', 'is', null)
      .select();
    
    if (availError) {
      console.error('Error clearing shop_availability:', availError);
      results['shop_availability'] = -1;
    } else {
      results['shop_availability'] = availData?.length || 0;
      console.log(`Cleared ${results['shop_availability']} linked availability records`);
    }

    console.log('Database cleanup complete:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'All job data cleared',
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error during cleanup:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to clear database' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
