-- Update the damage_photos for the existing appointment to use the new generated images
UPDATE appointments 
SET damage_photos = ARRAY['/damage-photo-1.jpg', '/damage-photo-2.jpg']
WHERE id = 'eba0be48-0dd5-43c4-adfb-451d7a7db518';