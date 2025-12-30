-- Create customer notification preferences table
CREATE TABLE IF NOT EXISTS customer_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  whatsapp_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(appointment_id)
);

-- Enable RLS
ALTER TABLE customer_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Allow anyone to view and manage preferences for their appointment (public tracking page)
CREATE POLICY "Anyone can view notification preferences"
  ON customer_notification_preferences
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert notification preferences"
  ON customer_notification_preferences
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update notification preferences"
  ON customer_notification_preferences
  FOR UPDATE
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customer_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_notification_preferences_updated_at
  BEFORE UPDATE ON customer_notification_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_customer_notification_preferences_updated_at();