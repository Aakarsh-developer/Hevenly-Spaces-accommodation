-- Seed demo owners in auth so sample room rows have valid foreign keys
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  seed.email,
  crypt(seed.password, gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', seed.name, 'role', 'owner'),
  now(),
  now(),
  '',
  '',
  '',
  ''
FROM (
  VALUES
    ('demo.owner1@havenly.local', 'Demo Owner One', 'Password123!'),
    ('demo.owner2@havenly.local', 'Demo Owner Two', 'Password123!')
) AS seed(email, name, password)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users existing WHERE existing.email = seed.email
);

WITH demo_owners AS (
  SELECT p.id, p.name, p.email
  FROM public.profiles p
  WHERE p.email IN ('demo.owner1@havenly.local', 'demo.owner2@havenly.local')
)
INSERT INTO public.rooms (
  owner_id,
  title,
  description,
  price,
  city,
  area,
  college,
  latitude,
  longitude,
  images,
  facilities,
  room_type,
  status,
  approval_status,
  rating,
  review_count,
  nearby_places
)
SELECT
  owner.id,
  room.title,
  room.description,
  room.price,
  room.city,
  room.area,
  room.college,
  room.latitude,
  room.longitude,
  room.images,
  room.facilities,
  room.room_type,
  room.status,
  'approved',
  room.rating,
  room.review_count,
  room.nearby_places
FROM demo_owners owner
JOIN (
  VALUES
    (
      'Sunrise Studio Near Delhi University',
      'Bright private studio with attached bathroom, fast WiFi, study desk, and a short auto ride to North Campus.',
      14500,
      'Delhi',
      'Kamla Nagar',
      'Delhi University',
      28.6806,
      77.2040,
      ARRAY[
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200'
      ]::text[],
      ARRAY['WiFi', 'AC', 'Furnished', 'Geyser', 'Kitchen']::text[],
      'single',
      'available',
      4.6,
      18,
      ARRAY['Delhi University North Campus', 'Kamla Nagar Market', 'Metro Station']::text[],
      'demo.owner1@havenly.local'
    ),
    (
      'Green Nest Shared Flat in Koramangala',
      'Affordable shared apartment with balcony, washing machine, and easy access to startup offices and cafes.',
      9800,
      'Bengaluru',
      'Koramangala',
      'Christ University',
      12.9352,
      77.6245,
      ARRAY[
        'https://images.unsplash.com/photo-1494526585095-c41746248156?w=1200',
        'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200'
      ]::text[],
      ARRAY['WiFi', 'Laundry', 'Kitchen', 'Parking', 'CCTV']::text[],
      'shared',
      'available',
      4.3,
      11,
      ARRAY['Christ University', 'Forum Mall', '80 Feet Road']::text[],
      'demo.owner1@havenly.local'
    ),
    (
      'Lakeview PG by Powai',
      'Modern furnished room with housekeeping support, peaceful view, and direct bus connectivity to campus.',
      16500,
      'Mumbai',
      'Powai',
      'IIT Bombay',
      19.1197,
      72.9050,
      ARRAY[
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200',
        'https://images.unsplash.com/photo-1448630360428-65456885c650?w=1200'
      ]::text[],
      ARRAY['WiFi', 'AC', 'CCTV', 'Power Backup', 'Furnished']::text[],
      'single',
      'occupied',
      4.8,
      27,
      ARRAY['IIT Bombay Main Gate', 'Powai Lake', 'Hiranandani Gardens']::text[],
      'demo.owner2@havenly.local'
    ),
    (
      'Budget Student Room in Viman Nagar',
      'Compact and comfortable room ideal for students who want quick access to coaching centers and airport road.',
      8700,
      'Pune',
      'Viman Nagar',
      'Symbiosis',
      18.5679,
      73.9143,
      ARRAY[
        'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=1200',
        'https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?w=1200'
      ]::text[],
      ARRAY['WiFi', 'Parking', 'Geyser', 'Laundry']::text[],
      'shared',
      'available',
      4.1,
      9,
      ARRAY['Symbiosis Campus', 'Phoenix Marketcity', 'Airport Road']::text[],
      'demo.owner2@havenly.local'
    ),
    (
      'Premium Studio at Salt Lake',
      'Spacious studio with premium interiors, secure access, and a dedicated study corner for focused work.',
      15500,
      'Kolkata',
      'Salt Lake',
      'Techno India University',
      22.5764,
      88.4345,
      ARRAY[
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&sat=-100',
        'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?w=1200'
      ]::text[],
      ARRAY['WiFi', 'AC', 'Power Backup', 'Furnished', 'Kitchen']::text[],
      'single',
      'available',
      4.7,
      15,
      ARRAY['Sector V', 'City Centre', 'College Bus Stop']::text[],
      'demo.owner1@havenly.local'
    ),
    (
      'Cozy Room Near Banjara Hills',
      'Quiet single room in a gated property with flexible meal plan options and smooth commute routes.',
      13200,
      'Hyderabad',
      'Banjara Hills',
      'University of Hyderabad',
      17.4156,
      78.4347,
      ARRAY[
        'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=1200&fit=crop',
        'https://images.unsplash.com/photo-1484101403633-562f891dc89a?w=1200'
      ]::text[],
      ARRAY['WiFi', 'CCTV', 'Parking', 'Kitchen', 'Geyser']::text[],
      'single',
      'available',
      4.4,
      13,
      ARRAY['Banjara Hills Road No. 12', 'Metro Station', 'Supermarket']::text[],
      'demo.owner2@havenly.local'
    )
) AS room(
  title,
  description,
  price,
  city,
  area,
  college,
  latitude,
  longitude,
  images,
  facilities,
  room_type,
  status,
  rating,
  review_count,
  nearby_places,
  owner_email
)
  ON owner.email = room.owner_email
WHERE NOT EXISTS (
  SELECT 1 FROM public.rooms existing WHERE existing.title = room.title
);
