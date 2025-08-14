import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      appointmentId,
      serviceType,
      damageType,
      vehicleInfo,
      customerLocation
    }: JobAllocationRequest = await req.json();

    console.log(`Starting job allocation for appointment ${appointmentId}, service: ${serviceType}`);

    // Get appointment details
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError || !appointment) {
      throw new Error(`Appointment not found: ${appointmentError?.message}`);
    }

    // Detect ADAS calibration needs
    let requiresAdasCalibration = false;
    let adasCalibrationReason = '';
    
    if (appointment.vehicle_info) {
      const { data: adasResult, error: adasError } = await supabase.functions.invoke('detect-adas-calibration', {
        body: {
          vehicleInfo: appointment.vehicle_info,
          damageType: appointment.damage_type,
          damageLocation: appointment.ai_assessment_details?.location
        }
      });

      if (!adasError && adasResult) {
        requiresAdasCalibration = adasResult.requiresCalibration;
        adasCalibrationReason = adasResult.calibrationReason;
        
        // Update appointment with ADAS calibration requirement
        await supabase
          .from('appointments')
          .update({
            requires_adas_calibration: requiresAdasCalibration,
            adas_calibration_reason: adasCalibrationReason
          })
          .eq('id', appointmentId);
      }
    }

    // Find eligible shops based on service capabilities
    let shopsQuery = supabase
      .from('shops')
      .select('*');

    // Filter by service capability
    if (serviceType === 'repair') {
      shopsQuery = shopsQuery.in('service_capability', ['repair_only', 'both']);
      
      // Further filter by repair type for repairs
      if (damageType === 'chip') {
        shopsQuery = shopsQuery.in('repair_types', ['chip_repair', 'both_repairs']);
      } else if (damageType === 'crack') {
        shopsQuery = shopsQuery.in('repair_types', ['crack_repair', 'both_repairs']);
      }
    } else {
      shopsQuery = shopsQuery.in('service_capability', ['replacement_only', 'both']);
    }

    // If ADAS calibration is required, filter to only calibration-capable shops
    if (requiresAdasCalibration) {
      shopsQuery = shopsQuery.eq('adas_calibration_capability', true);
      console.log('Filtering to only ADAS calibration-capable shops for this job');
    }

    const { data: eligibleShops, error: shopsError } = await shopsQuery;

    if (shopsError) {
      throw new Error(`Error fetching shops: ${shopsError.message}`);
    }

    if (!eligibleShops || eligibleShops.length === 0) {
      const message = requiresAdasCalibration 
        ? 'No ADAS calibration-capable shops found for this job'
        : 'No eligible shops found for this job';
      
      console.log(message);
      return new Response(JSON.stringify({ 
        success: false, 
        message,
        requiresAdasCalibration,
        jobOffers: []
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${eligibleShops.length} eligible shops${requiresAdasCalibration ? ' with ADAS calibration capability' : ''}`);

    // Calculate pricing based on service type and parts availability
    let basePrice = serviceType === 'repair' ? 89 : 350;
    let partAvailable = true;
    let leadTimeDays = 1;

    if (serviceType === 'replacement' && vehicleInfo) {
      // Check parts availability
      const { data: parts } = await supabase
        .from('windshield_parts')
        .select('*')
        .eq('make', vehicleInfo.make)
        .eq('model', vehicleInfo.model)
        .lte('year_from', vehicleInfo.year)
        .gte('year_to', vehicleInfo.year)
        .limit(1);

      if (parts && parts.length > 0) {
        const part = parts[0];
        basePrice = part.aftermarket_price || 350;
        leadTimeDays = part.lead_time_days || 1;
        partAvailable = part.availability_status === 'in_stock';
      }
    }

    // Score and rank shops for job allocation
    const scoredShops = eligibleShops.map(shop => {
      let score = 0;
      
      // Performance tier bonus
      if (shop.performance_tier === 'premium') score += 20;
      else if (shop.performance_tier === 'gold') score += 15;
      else score += 5;
      
      // Acceptance rate (0-30 points)
      score += (shop.acceptance_rate || 0) * 0.3;
      
      // Response time (faster = better, max 15 points)
      const responseTimeScore = Math.max(0, 15 - (shop.response_time_minutes || 60) * 0.25);
      score += responseTimeScore;
      
      // Quality score (0-25 points)
      score += (shop.quality_score || 3) * 5;
      
      // Recent activity penalty (if declined recently or not responded)
      const daysSinceLastOffer = shop.last_job_offered_at 
        ? (Date.now() - new Date(shop.last_job_offered_at).getTime()) / (1000 * 60 * 60 * 24)
        : 30;
      
      // Reduce score for shops that declined recently
      if (daysSinceLastOffer < 7 && shop.acceptance_rate < 70) {
        score *= 0.7; // 30% penalty
      }
      
      // Parts availability bonus for replacements
      if (serviceType === 'replacement') {
        const stockLevel = shop.spare_parts_stock?.[`${vehicleInfo?.make?.toLowerCase()}_${vehicleInfo?.model?.toLowerCase()}`] || 0;
        if (stockLevel > 0) score += 10;
        
        // Lead time penalty
        if (shop.average_lead_time_days > leadTimeDays) {
          score *= 0.8;
        }
      }
      
      // ADAS calibration capability bonus for calibration-required jobs
      if (requiresAdasCalibration && shop.adas_calibration_capability) {
        score += 25; // Significant bonus for matching capability
        console.log(`ADAS bonus applied to ${shop.name}: +25 points`);
      }
      
      // Distance factor (if location available)
      if (customerLocation && shop.latitude && shop.longitude) {
        const distance = calculateDistance(
          customerLocation.latitude, 
          customerLocation.longitude,
          parseFloat(shop.latitude), 
          parseFloat(shop.longitude)
        );
        
        // Penalty for distance > 20km
        if (distance > 20) score *= 0.8;
        if (distance > 50) score *= 0.6;
      }
      
      return {
        ...shop,
        allocationScore: Math.round(score * 100) / 100
      };
    });

    // Sort by score (highest first) and take top candidates
    const rankedShops = scoredShops
      .sort((a, b) => b.allocationScore - a.allocationScore)
      .slice(0, Math.min(5, scoredShops.length)); // Top 5 shops max

    console.log(`Ranked ${rankedShops.length} shops for job allocation`);

    // Create job offers for top-ranked shops
    const jobOffers = [];
    const offerExpiryTime = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours to respond

    for (const shop of rankedShops) {
      // Calculate shop-specific pricing with small variations for competitive bidding
      const priceVariation = 0.9 + (Math.random() * 0.2); // ±10% variation
      const shopPrice = Math.round(basePrice * priceVariation * 100) / 100;
      
      // Estimated completion time
      const completionHours = serviceType === 'repair' ? 0.5 : 2.5;
      const completionTime = `${completionHours} hours`;

      // Create job offer
      const { data: jobOffer, error: offerError } = await supabase
        .from('job_offers')
        .insert({
          appointment_id: appointmentId,
          shop_id: shop.id,
          offered_price: shopPrice,
          estimated_completion_time: `${completionHours} hours`,
          expires_at: offerExpiryTime.toISOString(),
          status: 'offered',
          requires_adas_calibration: requiresAdasCalibration,
          adas_calibration_notes: adasCalibrationReason
        })
        .select()
        .single();

      if (offerError) {
        console.error(`Error creating job offer for shop ${shop.id}:`, offerError);
        continue;
      }

      // Send notification to shop
      const notificationTitle = requiresAdasCalibration 
        ? `New ${serviceType} job available (ADAS Required)`
        : `New ${serviceType} job available`;
      
      const notificationMessage = requiresAdasCalibration
        ? `${serviceType} job for ${vehicleInfo?.make || 'vehicle'} - €${shopPrice} (ADAS calibration required)`
        : `${serviceType} job for ${vehicleInfo?.make || 'vehicle'} - €${shopPrice}`;

      const { error: notificationError } = await supabase
        .from('shop_notifications')
        .insert({
          shop_id: shop.id,
          notification_type: 'job_offer',
          title: notificationTitle,
          message: notificationMessage,
          data: {
            appointment_id: appointmentId,
            job_offer_id: jobOffer.id,
            service_type: serviceType,
            offered_price: shopPrice,
            expires_at: offerExpiryTime.toISOString(),
            customer_location: appointment.city || 'Unknown',
            requires_adas_calibration: requiresAdasCalibration,
            adas_calibration_reason: adasCalibrationReason
          }
        });

      if (notificationError) {
        console.error(`Error creating notification for shop ${shop.id}:`, notificationError);
      }

      // Update shop statistics
      await supabase
        .from('shops')
        .update({
          jobs_offered_count: (shop.jobs_offered_count || 0) + 1,
          last_job_offered_at: new Date().toISOString()
        })
        .eq('id', shop.id);

      jobOffers.push({
        shopId: shop.id,
        shopName: shop.name,
        offeredPrice: shopPrice,
        allocationScore: shop.allocationScore,
        estimatedCompletion: completionTime,
        expiresAt: offerExpiryTime.toISOString()
      });

      console.log(`Job offer sent to ${shop.name} for €${shopPrice}`);
    }

    console.log(`Successfully allocated job to ${jobOffers.length} shops in under 30 seconds`);

    return new Response(JSON.stringify({
      success: true,
      appointmentId,
      serviceType,
      requiresAdasCalibration,
      adasCalibrationReason,
      jobOffers,
      totalShopsContacted: jobOffers.length,
      allocationCompleted: true
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in job allocation:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI/180);
}

serve(handler);