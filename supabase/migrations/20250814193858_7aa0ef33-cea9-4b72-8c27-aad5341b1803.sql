-- Update the Staapli 3 case with the new damage photos
UPDATE public.appointments 
SET damage_photos = ARRAY[
  '/lovable-uploads/ed59fd32-d43b-473f-a6ec-7572713adcab.png',
  '/lovable-uploads/cd947256-c018-4b4a-b033-e8b53f9ec6a7.png'
]
WHERE customer_email = 'sarah.mitchell@email.com';