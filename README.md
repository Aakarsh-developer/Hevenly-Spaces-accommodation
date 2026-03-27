# Havenly Spaces

Student housing platform with Supabase auth, room listings, bookings, chat, reviews, moderation, analytics, maps, and email notifications.

## Local app setup

1. Install dependencies.
2. Add your Supabase project values in `.env`.
3. Run the app with `npm run dev`.

## Supabase setup

Apply all migrations so the database contains:

- profiles and roles
- rooms, bookings, reviews, wishlists, reports
- moderation fields
- seeded demo owners and demo rooms

If you are using the Supabase CLI, run:

```bash
supabase db push
```

## Demo owner accounts

After applying the seed migration, these accounts should exist:

- `demo.owner1@havenly.local`
- `demo.owner2@havenly.local`

Password for both:

```text
Password123!
```

## Admin access

There is no built-in admin password in the repo. Promote a real user once in Supabase SQL Editor:

```sql
select id, email from auth.users order by created_at desc;

delete from public.user_roles where user_id = 'YOUR_USER_ID';
insert into public.user_roles (user_id, role) values ('YOUR_USER_ID', 'admin');
```

Then log in with that user and open:

```text
/admin
```

You can also use:

```text
/system-setup
```

for the in-app setup checklist.

## Email notifications

Two Supabase Edge Functions are included:

- `send-booking-request-email`
- `send-admin-new-user-email`

Set these Supabase secrets before deploying functions:

- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL`
- `ADMIN_ALERT_EMAIL`

Deploy with:

```bash
supabase functions deploy send-booking-request-email
supabase functions deploy send-admin-new-user-email
```

The app will:

- email the room owner when a booking request is created
- email the admin alert address when a new user registers

## Maps

Room detail pages now use an interactive Leaflet map with OpenStreetMap tiles. Coordinates are stored on each room row and used directly in the UI.

## Verify everything

1. Apply migrations.
2. Run the app.
3. Check Home and Explore for seeded rooms.
4. Open a room detail page and confirm the map renders.
5. Sign up a new user and verify the admin email alert.
6. Send a booking request and verify the owner email alert.
7. Log in as admin and review `/admin` plus `/system-setup`.
