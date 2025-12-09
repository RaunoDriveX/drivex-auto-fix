import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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
  // Keep last 4 digits: +31 6 ***5678
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return '***';
  return '***' + cleaned.slice(-4);
}

function redactEmail(email: string): string {
  // Redact middle of email: jo***@example.com
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
    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('cf-connecting-ip') || 
                     'unknown';
    
    // Check rate limit
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

    // Validate tracking token format (should be 32 hex characters)
    if (tracking_token && !/^[a-f0-9]{32}$/i.test(tracking_token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid tracking token format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate job code format (should be 8 alphanumeric characters)
    if (job_code && !/^[A-Z0-9]{8}$/i.test(job_code)) {
      return new Response(
        JSON.stringify({ error: 'Invalid job code format' }),
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
        vehicle_info,
        short_code,
        tracking_token
      `);

    let appointment;
    let error;

    console.log('Lookup request from IP:', clientIp);

    if (tracking_token) {
      const result = await query.eq('tracking_token', tracking_token).maybeSingle();
      appointment = result.data;
      error = result.error;
    } else if (job_code) {
      // Search by short_code (first 8 characters of UUID)
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
    if (appointment && appointment.shop_id) {
      const { data } = await supabase
        .from('shops')
        .select('name, address, city, postal_code, phone, rating')
        .eq('id', appointment.shop_id)
        .maybeSingle();
      shopData = data;
    }

    // Fetch audit trail for status history
    const { data: statusHistory } = await supabase
      .from('job_status_audit')
      .select('old_status, new_status, status_changed_at, notes')
      .eq('appointment_id', appointment.id)
      .order('status_changed_at', { ascending: true });

    // Log access for audit purposes
    console.log(`Job ${appointment.id} accessed via ${tracking_token ? 'token' : 'code'} from IP: ${clientIp}`);

    // Return appointment with redacted PII to protect customer privacy
    return new Response(
      JSON.stringify({ 
        appointment: {
          id: appointment.id,
          customer_name: appointment.customer_name, // Keep name for personalization
          customer_email: redactEmail(appointment.customer_email),
          customer_phone: redactPhone(appointment.customer_phone),
          shop_name: appointment.shop_name,
          service_type: appointment.service_type,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          job_status: appointment.job_status,
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
          // Only return tracking token if they already have it
          tracking_token: tracking_token ? appointment.tracking_token : undefined,
          shops: shopData ? {
            name: shopData.name,
            address: shopData.address,
            city: shopData.city,
            postal_code: shopData.postal_code,
            phone: shopData.phone,
            rating: shopData.rating,
          } : null,
        },
        statusHistory: statusHistory || []
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
