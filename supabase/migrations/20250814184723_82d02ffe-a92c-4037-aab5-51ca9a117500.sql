-- Create gamification and rewards system
CREATE TYPE public.achievement_type AS ENUM (
  'speed_demon', 'quality_master', 'reliable_partner', 'volume_champion',
  'customer_favorite', 'innovation_leader', 'consistency_king', 'early_adopter'
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS public.shop_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id text NOT NULL,
  achievement_type achievement_type NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  points_value integer NOT NULL DEFAULT 0,
  earned_at timestamp with time zone NOT NULL DEFAULT now(),
  data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(shop_id, achievement_type)
);

-- Create rewards tracking table
CREATE TABLE IF NOT EXISTS public.shop_rewards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id text NOT NULL,
  total_points integer DEFAULT 0,
  lifetime_earnings numeric(12,2) DEFAULT 0.00,
  monthly_bonus numeric(10,2) DEFAULT 0.00,
  streak_days integer DEFAULT 0,
  best_streak_days integer DEFAULT 0,
  level_tier text DEFAULT 'bronze',
  next_level_points integer DEFAULT 500,
  referral_bonus numeric(10,2) DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create monthly leaderboard table
CREATE TABLE IF NOT EXISTS public.monthly_leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shop_id text NOT NULL,
  month_year text NOT NULL, -- Format: YYYY-MM
  points_earned integer DEFAULT 0,
  jobs_completed integer DEFAULT 0,
  customer_rating_avg numeric(3,2) DEFAULT 0.00,
  response_time_avg numeric(8,2) DEFAULT 0.00,
  leaderboard_rank integer,
  bonus_earned numeric(10,2) DEFAULT 0.00,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(shop_id, month_year)
);

-- Add gamification columns to shops table
ALTER TABLE public.shops 
ADD COLUMN IF NOT EXISTS total_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS level_tier text DEFAULT 'bronze',
ADD COLUMN IF NOT EXISTS monthly_bonus_rate numeric(4,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS special_badges text[] DEFAULT '{}';

-- Enable RLS on new tables
ALTER TABLE public.shop_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_leaderboard ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Shops can view their own achievements" 
ON public.shop_achievements 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage achievements" 
ON public.shop_achievements 
FOR ALL 
USING (true);

CREATE POLICY "Shops can view their own rewards" 
ON public.shop_rewards 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage rewards" 
ON public.shop_rewards 
FOR ALL 
USING (true);

CREATE POLICY "Anyone can view leaderboard" 
ON public.monthly_leaderboard 
FOR SELECT 
USING (true);

CREATE POLICY "System can manage leaderboard" 
ON public.monthly_leaderboard 
FOR ALL 
USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shop_achievements_shop_id ON public.shop_achievements(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_achievements_type ON public.shop_achievements(achievement_type);
CREATE INDEX IF NOT EXISTS idx_shop_rewards_shop_id ON public.shop_rewards(shop_id);
CREATE INDEX IF NOT EXISTS idx_monthly_leaderboard_month ON public.monthly_leaderboard(month_year);
CREATE INDEX IF NOT EXISTS idx_monthly_leaderboard_rank ON public.monthly_leaderboard(leaderboard_rank);

-- Create trigger for rewards updated_at
CREATE TRIGGER update_shop_rewards_updated_at
BEFORE UPDATE ON public.shop_rewards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert initial rewards records for existing shops
INSERT INTO public.shop_rewards (shop_id, total_points, level_tier)
SELECT id, 0, 'bronze'
FROM public.shops
ON CONFLICT (shop_id) DO NOTHING;

-- Update existing shops with initial gamification data
UPDATE public.shops 
SET 
  total_points = CASE 
    WHEN id = 'dxc' THEN 2500  -- Premium shop with high performance
    WHEN id = 'cgc' THEN 1800  -- Good performance
    WHEN id = 'rgm' THEN 1200  -- Decent performance
    ELSE 500
  END,
  level_tier = CASE 
    WHEN id = 'dxc' THEN 'platinum'
    WHEN id = 'cgc' THEN 'gold'
    WHEN id = 'rgm' THEN 'silver'
    ELSE 'bronze'
  END,
  monthly_bonus_rate = CASE 
    WHEN id = 'dxc' THEN 15.00  -- 15% bonus on earnings
    WHEN id = 'cgc' THEN 10.00  -- 10% bonus
    WHEN id = 'rgm' THEN 7.50   -- 7.5% bonus
    ELSE 2.50  -- 2.5% bonus for bronze
  END,
  current_streak = CASE 
    WHEN id = 'dxc' THEN 28  -- 28 day streak
    WHEN id = 'cgc' THEN 15  -- 15 day streak
    WHEN id = 'rgm' THEN 8   -- 8 day streak
    ELSE 0
  END,
  special_badges = CASE 
    WHEN id = 'dxc' THEN ARRAY['top_performer', 'customer_champion', 'speed_master']
    WHEN id = 'cgc' THEN ARRAY['reliable_partner', 'quality_focused']
    WHEN id = 'rgm' THEN ARRAY['mobile_expert']
    ELSE ARRAY[]::text[]
  END;

-- Update rewards table with initial data
UPDATE public.shop_rewards 
SET 
  total_points = CASE 
    WHEN shop_id = 'dxc' THEN 2500
    WHEN shop_id = 'cgc' THEN 1800
    WHEN shop_id = 'rgm' THEN 1200
    ELSE 500
  END,
  level_tier = CASE 
    WHEN shop_id = 'dxc' THEN 'platinum'
    WHEN shop_id = 'cgc' THEN 'gold'
    WHEN shop_id = 'rgm' THEN 'silver'
    ELSE 'bronze'
  END,
  next_level_points = CASE 
    WHEN shop_id = 'dxc' THEN 5000  -- Next level: diamond
    WHEN shop_id = 'cgc' THEN 2500  -- Next level: platinum
    WHEN shop_id = 'rgm' THEN 2000  -- Next level: gold
    ELSE 1000  -- Next level: silver
  END,
  streak_days = CASE 
    WHEN shop_id = 'dxc' THEN 28
    WHEN shop_id = 'cgc' THEN 15
    WHEN shop_id = 'rgm' THEN 8
    ELSE 0
  END,
  best_streak_days = CASE 
    WHEN shop_id = 'dxc' THEN 45
    WHEN shop_id = 'cgc' THEN 22
    WHEN shop_id = 'rgm' THEN 12
    ELSE 0
  END,
  lifetime_earnings = CASE 
    WHEN shop_id = 'dxc' THEN 45600.00
    WHEN shop_id = 'cgc' THEN 28400.00
    WHEN shop_id = 'rgm' THEN 18200.00
    ELSE 3200.00
  END,
  monthly_bonus = CASE 
    WHEN shop_id = 'dxc' THEN 1250.00
    WHEN shop_id = 'cgc' THEN 850.00
    WHEN shop_id = 'rgm' THEN 420.00
    ELSE 75.00
  END;

-- Insert sample achievements
INSERT INTO public.shop_achievements (shop_id, achievement_type, title, description, points_value, data) VALUES
('dxc', 'speed_demon', 'Speed Demon', 'Respond to job offers in under 5 minutes', 200, '{"response_time": 2.5, "threshold": 5}'),
('dxc', 'quality_master', 'Quality Master', 'Maintain 4.8+ star rating for 30 days', 300, '{"rating": 4.9, "days": 30}'),
('dxc', 'volume_champion', 'Volume Champion', 'Complete 50+ jobs in a month', 400, '{"jobs_completed": 67, "month": "2024-12"}'),
('cgc', 'reliable_partner', 'Reliable Partner', 'Accept 85%+ of job offers', 250, '{"acceptance_rate": 87.2}'),
('cgc', 'customer_favorite', 'Customer Favorite', 'Receive 5 perfect ratings in a row', 200, '{"perfect_ratings": 5}'),
('rgm', 'innovation_leader', 'Innovation Leader', 'Be among first 10 shops to adopt new features', 150, '{"feature": "mobile_service", "rank": 3}');

-- Insert current month leaderboard data
INSERT INTO public.monthly_leaderboard (shop_id, month_year, points_earned, jobs_completed, customer_rating_avg, response_time_avg, leaderboard_rank, bonus_earned) VALUES
('dxc', '2025-01', 850, 23, 4.89, 12.20, 1, 450.00),
('cgc', '2025-01', 620, 18, 4.81, 15.80, 2, 285.00),
('rgm', '2025-01', 480, 15, 4.62, 8.50, 3, 180.00),
('glx', '2025-01', 320, 12, 4.35, 25.00, 4, 95.00),
('ps1', '2025-01', 280, 10, 4.48, 22.30, 5, 75.00);