import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Simple in-memory rate limiting (resets on function cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // requests per window
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_WINDOW_MS });
    return false;
  }
  
  record.count++;
  if (record.count > RATE_LIMIT) {
    return true;
  }
  
  return false;
}

function redactPhone(phone: string | null): string | null {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '***';
  return '***' + cleaned.slice(-4);
}

function redactEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 2) return '***@' + (domain || '***');
  return local.slice(0, 2) + '***@' + domain;
}

Deno.serve(async (req) => {
  console.log('Job tracking function called - public endpoint with rate limiting');
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
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '3600' } }
      );
    }

    const { tracking_token, job_code } = await req.json();

    if ((!tracking_token || typeof tracking_token !== 'string') && (!job_code || typeof job_code !== 'string')) {
      return new Response(
        JSON.stringify({ error: 'Provide tracking_token or job_code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Tracking tokens can be hex or base64-like (32 chars with alphanumeric, dashes, underscores)
    if (tracking_token && !/^[a-zA-Z0-9_-]{32}$/.test(tracking_token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tracking token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (job_code && !/^[A-Z0-9]{8}$/i.test(job_code)) {
      return new Response(
        JSON.stringify({ error: 'Invalid job code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('appointments')
      .select(`
        id,
        job_status,
        status,
        notes,
        estimated_completion,
        job_started_at,
        job_completed_at,
        appointment_date,
        appointment_time,
        appointment_confirmed_at,
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
        vehicle_info,
        short_code,
        tracking_token,
        workflow_stage,
        customer_shop_selection,
        customer_cost_approved
      `);

    let appointment;
    let error;

    console.log('Lookup request from IP:', clientIp);

    if (tracking_token) {
      const result = await query.eq('tracking_token', tracking_token).maybeSingle();
      appointment = result.data;
      error = result.error;
    } else if (job_code) {
      const result = await query.eq('short_code', job_code.toUpperCase()).maybeSingle();
      appointment = result.data;
      error = result.error;
    }

    if (error || !appointment) {
      console.log(`Job tracking lookup failed for token/code from IP: ${clientIp}`);
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch shop details separately if appointment found (public info only)
    let shopData = null;
    if (appointment && appointment.shop_id && appointment.shop_id !== 'pending') {
      const { data } = await supabase
        .from('shops')
        .select('name, address, city, postal_code, phone, rating, email')
        .eq('id', appointment.shop_id)
        .maybeSingle();
      shopData = data;
      console.log('Shop lookup result:', data ? 'found' : 'not found', 'for shop_id:', appointment.shop_id);
    }

    // Check if this shop was assigned via insurer selection
    let isInsurerAssigned = false;
    if (appointment && appointment.shop_id && appointment.shop_id !== 'pending') {
      const { data: insurerSelection } = await supabase
        .from('insurer_shop_selections')
        .select('id')
        .eq('appointment_id', appointment.id)
        .eq('shop_id', appointment.shop_id)
        .maybeSingle();
      isInsurerAssigned = !!insurerSelection;
    }

    // Fetch audit trail for status history
    const { data: statusHistory } = await supabase
      .from('job_status_audit')
      .select('old_status, new_status, status_changed_at, notes')
      .eq('appointment_id', appointment.id)
      .order('status_changed_at', { ascending: true });

    // Fetch pending shop selections if workflow_stage is 'shop_selection'
    let pendingShopSelections = null;
    if (appointment.workflow_stage === 'shop_selection' && !appointment.customer_shop_selection) {
      const { data: selections } = await supabase
        .from('insurer_shop_selections')
        .select(`
          id,
          shop_id,
          priority_order,
          estimated_price,
          distance_km,
          created_at
        `)
        .eq('appointment_id', appointment.id)
        .order('priority_order', { ascending: true });

      if (selections && selections.length > 0) {
        // Fetch shop details for each selection
        const shopIds = selections.map(s => s.shop_id);
        const { data: shops } = await supabase
          .from('shops')
          .select('id, name, address, city, postal_code, phone, rating')
          .in('id', shopIds);

        const shopMap = new Map((shops || []).map(s => [s.id, s]));
        
        pendingShopSelections = selections.map(sel => {
          const shop = shopMap.get(sel.shop_id);
          return {
            id: sel.id,
            shop_id: sel.shop_id,
            name: shop?.name || 'Unknown Shop',
            address: shop?.address || '',
            city: shop?.city || '',
            distance_km: sel.distance_km || 0,
            estimated_price: sel.estimated_price || 0,
            rating: shop?.rating || 0,
            total_reviews: 0, // Not tracked in shops table
            priority_order: sel.priority_order,
            isMobileService: false, // Not tracked yet
            adasCalibrationCapability: false // Not tracked yet
          };
        });
      }
    }

    // Fetch pending cost estimate if workflow_stage is 'cost_approval'
    let pendingCostEstimate = null;
    if (appointment.workflow_stage === 'cost_approval' && !appointment.customer_cost_approved) {
      const { data: estimate } = await supabase
        .from('insurer_cost_estimates')
        .select(`
          id,
          line_items,
          labor_cost,
          parts_cost,
          total_cost,
          notes,
          created_at
        `)
        .eq('appointment_id', appointment.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (estimate) {
        pendingCostEstimate = {
          id: estimate.id,
          line_items: estimate.line_items || [],
          labor_cost: estimate.labor_cost || 0,
          parts_cost: estimate.parts_cost || 0,
          total_cost: estimate.total_cost || 0,
          notes: estimate.notes,
          created_at: estimate.created_at
        };
      }
    }

    console.log(`Job ${appointment.id} accessed via ${tracking_token ? 'token' : 'code'} from IP: ${clientIp}`);

    return new Response(
      JSON.stringify({ 
        appointment: {
          id: appointment.id,
          customer_name: appointment.customer_name,
          customer_email: redactEmail(appointment.customer_email),
          customer_phone: redactPhone(appointment.customer_phone),
          shop_name: appointment.shop_name,
          service_type: appointment.service_type,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          job_status: appointment.job_status,
          status: appointment.status,
          notes: appointment.notes,
          damage_type: appointment.damage_type,
          estimated_completion: appointment.estimated_completion,
          job_started_at: appointment.job_started_at,
          job_completed_at: appointment.job_completed_at,
          vehicle_info: appointment.vehicle_info,
          short_code: appointment.short_code,
          insurer_name: appointment.insurer_name,
          additional_notes: appointment.additional_notes,
          total_cost: appointment.total_cost,
          created_at: appointment.created_at,
          workflow_stage: appointment.workflow_stage,
          customer_shop_selection: appointment.customer_shop_selection,
          customer_cost_approved: appointment.customer_cost_approved,
          tracking_token: appointment.tracking_token,
          shop_id: appointment.shop_id,
          is_insurer_assigned: isInsurerAssigned,
          appointment_confirmed_at: appointment.appointment_confirmed_at,
          shops: shopData ? {
            name: shopData.name,
            address: shopData.address,
            city: shopData.city,
            postal_code: shopData.postal_code,
            phone: shopData.phone,
            email: shopData.email,
            rating: shopData.rating,
          } : null,
        },
        statusHistory: statusHistory || [],
        pendingShopSelections,
        pendingCostEstimate
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching job tracking:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred while processing your request' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
