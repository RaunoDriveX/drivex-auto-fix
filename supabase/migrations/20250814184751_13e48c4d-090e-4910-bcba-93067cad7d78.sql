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
  shop_id text NOT NULL UNIQUE,
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