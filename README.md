# Keepa — Premium Black & Gold Store

A React + Supabase starter e-commerce storefront with:
- Customer shopping cart and guest checkout
- Server-side order creation and price validation
- WhatsApp order-summary handoff (customer must press Send)
- Admin login, product/category management, order management and store settings
- Supabase Storage for product images
- Manual payment handling (no payment gateway or QR flow)

## 1. Requirements
- Node.js 20 or newer
- A Supabase project
- GitHub account
- Cloudflare account for deployment

## 2. Run locally
```bash
npm install
cp .env.example .env
```
Edit `.env` with your Supabase project URL and anon/publishable key, then:
```bash
npm run dev
```

## 3. Set up Supabase
1. Create a Supabase project.
2. Open SQL Editor and run `supabase/schema.sql`.
3. Copy Project URL and anon/publishable key into `.env`.
4. Deploy the Edge Function:
```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase functions deploy create-order
```
The function uses the platform-provided `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` secrets. Do not put the service-role key in frontend `.env` or GitHub.

## 4. Create the first admin
Create the user in Supabase Dashboard → Authentication → Users → Add user.
Then, in the SQL Editor, grant admin role to that exact user ID:
```sql
-- Replace the UUID with the user ID from Authentication → Users.
update auth.users
set raw_app_meta_data =
  coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"admin"}'::jsonb
where id = 'REPLACE-WITH-USER-UUID';
```
The role is stored in `app_metadata`, not user-editable `user_metadata`.
Sign in at `/admin`.

## 5. Configure the store
In `/admin` → Store settings:
- Set store name
- Set WhatsApp number in international format with country code, digits only (example: 919876543210)
- Set tagline and announcement
- Set Instagram URL

Products can be added from `/admin` → Products. Product images are limited to JPG, PNG or WebP up to 5 MB. CSV bulk import is not included in this first version.

## 6. Order flow
The Edge Function validates product IDs, current prices, active status and stock before saving an order. It snapshots the price and item name in `order_items`. Then the browser opens a prefilled WhatsApp message. The customer must manually press Send.

Important: opening WhatsApp does not prove that the message was sent. The admin dashboard records the website order as New regardless. Contact the customer manually.

No payment is collected or verified by this application. Admin payment status is a manual record only.

## 7. Deploy frontend to Cloudflare Pages
1. Push this project to a GitHub repository.
2. In Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git.
3. Select the repository.
4. Build command: `npm run build`
5. Build output directory: `dist`
6. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
7. Deploy.

For React Router, add `public/_redirects` with:
```
/* /index.html 200
```

## 8. Production security checklist
- Use a strong unique admin password and enable MFA for the admin account.
- Keep RLS enabled; never expose service-role keys.
- Review Supabase Auth settings and allowed redirect URLs.
- Restrict CORS on the Edge Function to your actual production domain before launch.
- Add CAPTCHA/rate limiting to public order creation before advertising the store.
- Configure backups and monitor Supabase storage/database usage.
- Test all RLS policies with anonymous and admin sessions.
- The initial implementation does not decrement inventory automatically. Update stock after the client confirms an order, or implement a reservation/decrement workflow before production.
- Add privacy policy, terms, shipping/returns policy and customer support details before launch.
- This starter has no automated customer email/SMS notifications, courier integration, GST invoicing or bulk CSV import.

## 9. Important commercial note
Free tiers have quotas and provider terms. Confirm current terms for the client's intended commercial use and expected traffic. The application code is provided as a starter; test and harden it before handling real customer data.
