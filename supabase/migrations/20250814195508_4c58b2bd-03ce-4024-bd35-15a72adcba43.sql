-- Update the damage_photos for the existing appointment to use the correct image
UPDATE appointments 
SET damage_photos = ARRAY['/lovable-uploads/bf0cbf6d-e4c5-432b-a907-e9b97f43269f.png', '/lovable-uploads/bf0cbf6d-e4c5-432b-a907-e9b97f43269f.png']
WHERE id = 'eba0be48-0dd5-43c4-adfb-451d7a7db518';