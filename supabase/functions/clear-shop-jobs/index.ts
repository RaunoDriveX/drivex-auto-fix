// Supabase Edge Function: clear-shop-jobs
// Clears all job offers for a specific shop (requires authentication)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.39.3";

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
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !ANON_KEY) {
      throw new Error("Missing required environment variables.");
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with user's JWT to verify identity
    const supabaseAuth = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const shopId: string | undefined = body?.shop_id;

    if (!shopId) {
      return new Response(
        JSON.stringify({ error: "'shop_id' is required in request body" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify user owns this shop
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    
    const { data: shop, error: shopError } = await supabaseAdmin
      .from('shops')
      .select('id, email')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return new Response(
        JSON.stringify({ error: "Shop not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Verify the authenticated user owns this shop
    if (shop.email !== user.email) {
      console.warn(`Unauthorized deletion attempt: user ${user.email} tried to delete jobs for shop ${shopId}`);
      return new Response(
        JSON.stringify({ error: "You do not have permission to manage this shop" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Delete all job offers for this shop
    const { data: deletedOffers, error: deleteError } = await supabaseAdmin
      .from('job_offers')
      .delete()
      .eq('shop_id', shopId)
      .select();

    if (deleteError) throw deleteError;

    console.log(`Shop ${shopId} cleared ${deletedOffers?.length || 0} job offers by user ${user.email}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        deleted_count: deletedOffers?.length || 0,
        message: `Cleared ${deletedOffers?.length || 0} job offers for your shop`
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (err) {
    console.error("clear-shop-jobs error:", err);
    return new Response(
      JSON.stringify({ error: "An error occurred while processing your request" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
