-- Ensure short_code exists and is populated for customer tracking
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'short_code'
  ) THEN
    ALTER TABLE public.appointments ADD COLUMN short_code text;
  END IF;
END $$;

-- Backfill short_code for existing rows
UPDATE public.appointments
SET short_code = UPPER(SUBSTRING(id::text FROM 1 FOR 8))
WHERE short_code IS NULL OR short_code = '';

-- Index to speed up lookups by short code
CREATE INDEX IF NOT EXISTS idx_appointments_short_code ON public.appointments (short_code);

-- Trigger to auto-populate short_code on insert
CREATE OR REPLACE FUNCTION public.set_appointments_short_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.short_code IS NULL OR NEW.short_code = '' THEN
    NEW.short_code := UPPER(SUBSTRING(NEW.id::text FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_appointments_short_code ON public.appointments;
CREATE TRIGGER trg_set_appointments_short_code
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.set_appointments_short_code();