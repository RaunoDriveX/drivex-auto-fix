-- Enable pg_cron extension for scheduling tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run reminder emails daily at 9 AM
-- This will check for appointments scheduled for the next day (24h ahead)
SELECT cron.schedule(
  'daily-appointment-reminders',
  '0 9 * * *', -- Daily at 9 AM
  $$
  SELECT
    net.http_post(
        url:='https://dsvmigyunbwdefibbpgm.supabase.co/functions/v1/send-reminder-email',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdm1pZ3l1bmJ3ZGVmaWJicGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMDQ5NDYsImV4cCI6MjA3MDU4MDk0Nn0.N0ZOb8xifA62nz1mF1Tmjx72Nrs-2WET0QUgNv5Df90"}'::jsonb,
        body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Update appointments table to track email statuses
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS confirmation_email_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reminder_email_sent boolean DEFAULT false;