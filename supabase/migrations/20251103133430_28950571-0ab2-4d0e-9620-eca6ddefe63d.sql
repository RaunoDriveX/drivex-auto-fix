-- Add short_code column for quick job lookups
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS short_code TEXT;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_appointments_short_code ON appointments(short_code);

-- Create function to auto-generate short code from ID
CREATE OR REPLACE FUNCTION generate_short_code()
RETURNS TRIGGER AS $$
BEGIN
  -- Extract first 8 characters of UUID (before first dash)
  NEW.short_code := UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-populate short_code on insert
DROP TRIGGER IF EXISTS set_short_code ON appointments;
CREATE TRIGGER set_short_code
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION generate_short_code();

-- Update existing records with short codes
UPDATE appointments 
SET short_code = UPPER(SUBSTRING(id::TEXT, 1, 8))
WHERE short_code IS NULL;