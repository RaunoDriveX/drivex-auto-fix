-- Fix search path security warnings for existing functions
ALTER FUNCTION public.update_updated_at_column() SECURITY DEFINER SET search_path = '';
ALTER FUNCTION public.update_shop_rating() SECURITY DEFINER SET search_path = '';