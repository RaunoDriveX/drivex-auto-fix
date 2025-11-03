// Supabase Edge Function: clear-shop-jobs
// Clears all job offers for a specific shop (for testing purposes)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const shopId: string | undefined = body?.shop_id;

    if (!shopId) {
      return new Response(
        JSON.stringify({ error: "'shop_id' is required in request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Delete all job offers for this shop
    const { data: deletedOffers, error: deleteError } = await supabaseAdmin
      .from('job_offers')
      .delete()
      .eq('shop_id', shopId)
      .select();

    if (deleteError) throw deleteError;

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_count: deletedOffers?.length || 0,
        message: `Cleared ${deletedOffers?.length || 0} job offers for shop ${shopId}`
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("clear-shop-jobs error:", err);
    return new Response(
      JSON.stringify({ error: err?.message ?? "Unexpected error" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
