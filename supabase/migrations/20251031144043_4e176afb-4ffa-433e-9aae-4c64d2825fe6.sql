-- Remove overly permissive RLS policies that allow USING (true)
-- These policies allow any authenticated user to manipulate sensitive data

-- 1. Monthly Leaderboard - Remove system can manage policy
DROP POLICY IF EXISTS "System can manage leaderboard" ON public.monthly_leaderboard;

-- 2. Job Offers - Remove system can manage policy (keep shop-specific policy)
DROP POLICY IF EXISTS "System can manage job offers" ON public.job_offers;

-- 3. Shop Achievements - Remove system can manage policy
DROP POLICY IF EXISTS "System can manage achievements" ON public.shop_achievements;

-- 4. Shop Rewards - Remove system can manage policy
DROP POLICY IF EXISTS "System can manage rewards" ON public.shop_rewards;

-- 5. Call Center Stats - Remove system can manage policy
DROP POLICY IF EXISTS "System can manage all stats" ON public.call_center_stats;

-- 6. Insurer Profiles - Remove system can manage policy
DROP POLICY IF EXISTS "System can manage insurer profiles" ON public.insurer_profiles;

-- 7. Parts Fitment Requirements - Remove system can manage policy
DROP POLICY IF EXISTS "System can manage parts fitment requirements" ON public.parts_fitment_requirements;

-- 8. Parts Sourcing Requests - Remove system can manage policy
DROP POLICY IF EXISTS "System can manage all sourcing requests" ON public.parts_sourcing_requests;

-- 9. Job Completion Documents - Remove system can manage policy
DROP POLICY IF EXISTS "System can manage all completion documents" ON public.job_completion_documents;

-- 10. Job Status Audit - Remove system can manage policy
DROP POLICY IF EXISTS "System can manage all audit logs" ON public.job_status_audit;

-- 11. Insurer Users - Remove system can manage policy
DROP POLICY IF EXISTS "System can manage insurer users" ON public.insurer_users;

-- Remove plaintext webhook secret storage
-- Only keep the hash for verification
ALTER TABLE public.insurer_webhook_configs 
DROP COLUMN IF EXISTS webhook_secret;

-- Note: These operations should now only be performed via edge functions
-- using the service role key, not by regular authenticated users