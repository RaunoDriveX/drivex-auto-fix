import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const JobAllocationSchema = z.object({
  appointmentId: z.string().uuid(),
  serviceType: z.enum(['repair', 'replacement']),
  damageType: z.string().max(100).optional(),
  vehicleInfo: z.object({
    make: z.string().max(100),
    model: z.string().max(100),
    year: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  }).optional(),
  customerLocation: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }).optional(),
  insurerName: z.string().max(200).optional(),
});

interface JobAllocationRequest {
  appointmentId: string;
  serviceType: 'repair' | 'replacement';
  damageType?: string;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
  };
  customerLocation?: {
    latitude: number;
    longitude: number;
  };
  insurerName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Allocating job for appointment');

    // Validate input
    const rawInput = await req.json();
    const validatedInput = JobAllocationSchema.parse(rawInput);
    
    const {
      appointmentId,
      serviceType,
      damageType,
      vehicleInfo,
      customerLocation,
      insurerName
    }: JobAllocationRequest = validatedInput;

    console.log(`Starting job allocation for appointment ${appointmentId}, service: ${serviceType}`);

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError) {
      console.error('Error fetching appointment:', appointmentError);
      throw appointmentError;
    }

    // Check ADAS calibration needs
    let requiresAdasCalibration = false;
    if (vehicleInfo) {
      try {
        const { data: adasCheck, error: adasError } = await supabase.functions.invoke('detect-adas-calibration', {
          body: {
            vehicleMake: vehicleInfo.make,
            vehicleModel: vehicleInfo.model,
            vehicleYear: vehicleInfo.year,
            damageType: damageType || appointment.damage_type,
            damageLocation: appointment.damage_location || ''
          }
        });

        if (!adasError && adasCheck) {
          requiresAdasCalibration = adasCheck.requiresCalibration;
          console.log(`ADAS calibration required: ${requiresAdasCalibration}`);
        }
      } catch (adasError) {
        console.error('Error checking ADAS requirements:', adasError);
      }
    }

    // Fetch preferred shops for this insurer
    let preferredShopIds: string[] = [];
    if (insurerName || appointment.insurer_name) {
      const { data: insurerProfile } = await supabase
        .from('insurer_profiles')
        .select('id')
        .eq('insurer_name', insurerName || appointment.insurer_name)
        .single();

      if (insurerProfile) {
        const { data: preferredShops } = await supabase
          .from('insurer_preferred_shops')
          .select('shop_id')
          .eq('insurer_id', insurerProfile.id)
          .eq('is_active', true);

        preferredShopIds = preferredShops?.map(ps => ps.shop_id) || [];
        console.log(`Found ${preferredShopIds.length} preferred shops for insurer`);
      }
    }

    // Build query for eligible shops
    let shopsQuery = supabase
      .from('shops')
      .select('*')
      .eq('insurance_approved', true);

    // Filter by service capability
    if (serviceType === 'repair') {
      shopsQuery = shopsQuery.in('service_capability', ['repair_only', 'both']);
      if (damageType) {
        if (damageType.includes('chip')) {
          shopsQuery = shopsQuery.in('repair_types', ['chip_repair', 'both_repairs']);
        } else if (damageType.includes('crack')) {
          shopsQuery = shopsQuery.in('repair_types', ['crack_repair', 'both_repairs']);
        }
      }
    } else {
      shopsQuery = shopsQuery.in('service_capability', ['replacement_only', 'both']);
    }

    // Filter by ADAS capability if needed
    if (requiresAdasCalibration) {
      shopsQuery = shopsQuery.eq('adas_calibration_capability', true);
    }

    const { data: eligibleShops, error: shopsError } = await shopsQuery;

    if (shopsError) {
      console.error('Error fetching shops:', shopsError);
      throw shopsError;
    }

    if (!eligibleShops || eligibleShops.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No eligible shops found for this service type'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${eligibleShops.length} eligible shops`);

    // Filter for qualified shops
    const qualifiedShops = [];
    for (const shop of eligibleShops) {
      const { data: isQualified } = await supabase.rpc('shop_has_qualified_technicians', {
        _shop_id: shop.id,
        _service_type: serviceType,
        _damage_type: damageType || null,
        _vehicle_type: null
      });

      if (isQualified) {
        qualifiedShops.push(shop);
      }
    }

    console.log(`${qualifiedShops.length} shops have qualified technicians`);

    if (qualifiedShops.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No shops with qualified technicians found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Calculate pricing and lead times
    const basePrice = serviceType === 'replacement' ? 350 : 80;
    const adasUpcharge = requiresAdasCalibration ? 150 : 0;
    const estimatedLeadTime = 2; // days

    // Separate preferred and non-preferred shops
    const preferredShops = qualifiedShops.filter(s => preferredShopIds.includes(s.id));
    const nonPreferredShops = qualifiedShops.filter(s => !preferredShopIds.includes(s.id));

    // Score and rank shops
    const scoreShop = (shop: any, isPreferred: boolean) => {
      let score = 0;

      // Preference bonus (highest weight)
      if (isPreferred) score += 1000;

      // Performance tier
      const tierScores: Record<string, number> = {
        'platinum': 100,
        'gold': 75,
        'silver': 50,
        'standard': 25
      };
      score += tierScores[shop.performance_tier] || 0;

      // Acceptance rate
      score += (shop.acceptance_rate || 0) * 50;

      // Response time (lower is better)
      const responseTimeScore = Math.max(0, 50 - (shop.response_time_minutes || 0));
      score += responseTimeScore;

      // Quality score
      score += (shop.quality_score || 5) * 8;

      // Parts availability (if needed)
      if (shop.spare_parts_stock && serviceType === 'replacement') {
        score += 20;
      }

      // ADAS capability bonus
      if (requiresAdasCalibration && shop.adas_calibration_capability) {
        score += 30;
      }

      // Distance penalty (if location provided)
      if (customerLocation && shop.latitude && shop.longitude) {
        const distance = calculateDistance(
          customerLocation.latitude,
          customerLocation.longitude,
          shop.latitude,
          shop.longitude
        );
        score -= Math.min(distance * 2, 50); // Cap distance penalty at 50
      }

      return score;
    };

    const rankedShops = [
      ...preferredShops.map(shop => ({
        shop,
        score: scoreShop(shop, true),
        isPreferred: true
      })),
      ...nonPreferredShops.map(shop => ({
        shop,
        score: scoreShop(shop, false),
        isPreferred: false
      }))
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Take top 5

    console.log(`Ranked top ${rankedShops.length} shops by allocation score`);

    // Create job offers
    const jobOffers = [];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (24 * 60 * 60 * 1000)); // 24 hours

    for (const rankedShop of rankedShops) {
      const shop = rankedShop.shop;
      const offeredPrice = basePrice + adasUpcharge;

      const { data: jobOffer, error: offerError } = await supabase
        .from('job_offers')
        .insert({
          appointment_id: appointmentId,
          shop_id: shop.id,
          offered_price: offeredPrice,
          estimated_completion_time: `${estimatedLeadTime} days`,
          status: 'offered',
          expires_at: expiresAt.toISOString(),
          requires_adas_calibration: requiresAdasCalibration,
          is_preferred_shop: rankedShop.isPreferred,
          notes: `Allocation score: ${rankedShop.score.toFixed(2)}`
        })
        .select()
        .single();

      if (offerError) {
        console.error(`Error creating job offer for shop ${shop.id}:`, offerError);
        continue;
      }

      // Create notification for the shop
      await supabase
        .from('shop_notifications')
        .insert({
          shop_id: shop.id,
          notification_type: 'job_offer',
          title: 'New Job Offer',
          message: `New ${serviceType} job offer for ${vehicleInfo?.year || ''} ${vehicleInfo?.make || ''} ${vehicleInfo?.model || ''}`,
          data: {
            appointment_id: appointmentId,
            job_offer_id: jobOffer.id,
            service_type: serviceType,
            price: offeredPrice,
            expires_at: expiresAt.toISOString()
          }
        });

      // Update shop statistics
      await supabase
        .from('shops')
        .update({
          jobs_offered_count: (shop.jobs_offered_count || 0) + 1,
          last_job_offered_at: now.toISOString()
        })
        .eq('id', shop.id);

      jobOffers.push({
        jobOfferId: jobOffer.id,
        shopId: shop.id,
        shopName: shop.name,
        offeredPrice,
        isPreferred: rankedShop.isPreferred
      });
    }

    console.log(`Created ${jobOffers.length} job offers`);

    return new Response(JSON.stringify({
      success: true,
      allocatedShops: jobOffers.length,
      jobOffers
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in job allocation:', error);
    
    // Handle validation errors specifically
    if (error.name === 'ZodError') {
      return new Response(JSON.stringify({
        error: 'Invalid input data',
        details: error.errors
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

serve(handler);
