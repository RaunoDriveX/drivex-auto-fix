-- Add AI assessment fields to the appointments table
ALTER TABLE appointments 
ADD COLUMN ai_confidence_score NUMERIC(3,2) DEFAULT 0.85,
ADD COLUMN ai_assessment_details JSONB DEFAULT '{}',
ADD COLUMN ai_recommended_repair TEXT DEFAULT 'chip_repair',
ADD COLUMN driver_view_obstruction BOOLEAN DEFAULT false;

-- Update the existing appointment with AI assessment data
UPDATE appointments 
SET 
  ai_confidence_score = 0.92,
  ai_assessment_details = '{
    "damage_type": "chip_repair",
    "severity": "minor",
    "size_mm": 6,
    "location": "driver_side_lower",
    "driver_view_affected": false,
    "insurance_covered": true,
    "recommendation": "Standard chip repair using UV resin injection",
    "alternative_options": [],
    "confidence_factors": ["clear_damage_boundaries", "appropriate_size", "non_critical_location"]
  }',
  ai_recommended_repair = 'chip_repair',
  driver_view_obstruction = false
WHERE id = 'eba0be48-0dd5-43c4-adfb-451d7a7db518';