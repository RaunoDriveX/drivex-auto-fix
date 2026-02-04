import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { vehicleInfo, damageType, damageLocation } = await req.json();
    
    if (!vehicleInfo || !vehicleInfo.make || !vehicleInfo.year) {
      return new Response(JSON.stringify({ 
        error: 'Vehicle make and year are required' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Call the database function to detect ADAS calibration needs
    const { data: requiresCalibration, error } = await supabase
      .rpc('detect_adas_calibration_needs', {
        vehicle_make: vehicleInfo.make,
        vehicle_model: vehicleInfo.model || '',
        vehicle_year: parseInt(vehicleInfo.year),
        damage_type: damageType || 'chip_repair',
        damage_location: damageLocation || ''
      });

    if (error) {
      console.error('Error detecting ADAS calibration needs:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to detect calibration needs' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let calibrationReason = '';
    if (requiresCalibration) {
      const year = parseInt(vehicleInfo.year);
      const make = vehicleInfo.make.toUpperCase();
      
      if (year >= 2015 && (damageType === 'windshield_replacement' || damageType === 'replacement')) {
        calibrationReason = `${vehicleInfo.year} ${vehicleInfo.make} requires ADAS recalibration after windshield replacement`;
      } else if (damageLocation && (damageLocation.toLowerCase().includes('driver') || damageLocation.toLowerCase().includes('center'))) {
        calibrationReason = `Damage in driver view area requires ADAS recalibration for ${vehicleInfo.year} ${vehicleInfo.make}`;
      } else if (['TESLA', 'BMW', 'MERCEDES', 'AUDI', 'VOLVO', 'SUBARU'].includes(make) && year >= 2010) {
        calibrationReason = `${vehicleInfo.make} vehicles require ADAS recalibration for most windshield work`;
      } else if (['HONDA', 'TOYOTA', 'NISSAN', 'ACURA', 'LEXUS', 'INFINITI'].includes(make) && year >= 2018) {
        calibrationReason = `${vehicleInfo.year} ${vehicleInfo.make} requires ADAS recalibration for windshield repairs`;
      }
    }

    console.log('ADAS calibration detection result:', {
      vehicle: `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`,
      damageType,
      damageLocation,
      requiresCalibration,
      calibrationReason
    });

    return new Response(JSON.stringify({
      requiresCalibration,
      calibrationReason
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in detect-adas-calibration function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});