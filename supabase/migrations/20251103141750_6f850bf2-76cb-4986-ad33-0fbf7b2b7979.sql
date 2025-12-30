-- Fix function search path for the notification preferences trigger function
CREATE OR REPLACE FUNCTION update_customer_notification_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;