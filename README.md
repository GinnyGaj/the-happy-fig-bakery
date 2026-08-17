# The Happy Fig

A warm, unhurried microbakery website for a North London home baker. Customers
browse the week's menu and pre-order for Saturday pickup; the owner manages
the menu, order form, and orders from a small admin portal.

Built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase.

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create a Supabase project** at [supabase.com](https://supabase.com).

3. **Run the schema** — open the Supabase SQL editor and run [`supabase/schema.sql`](supabase/schema.sql). This creates all tables, the `decrement_stock` function, and Row-Level Security policies.

4. **Create an admin user** — in Supabase, go to Authentication → Users → Add User, and create an email/password account for the bakery owner. This is the only login the admin portal supports.

5. **Set environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from your Supabase project's API settings.

6. **Run the dev server**

   ```bash
   npm run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000).

## Using it

- **Customers** browse `/order`. The menu only appears once an admin has published a weekly menu and opened the form.
- **Admin** signs in at `/admin/login`, then:
  - **Menu Management** (`/admin/menu`) — add bakes to the item library, then tick which ones make up this week's menu and publish.
  - **Form Settings** (`/admin/form-settings`) — toggle orders open/closed and set the announcement banner.
  - **Orders** (`/admin/orders`) — search orders, expand for special instructions, and download a CSV.

## Notes on scope

- WhatsApp reminders are out of scope for this build — the collection instructions shown on the confirmation page are static copy, and the `whatsapp_settings`/`whatsapp_logs` tables exist in the schema for a future Twilio integration.
- Per-item stock limits exist in the schema (`stock_limits`, `decrement_stock`) and orders decrement stock automatically, but there's no admin UI yet to set initial stock counts — insert rows directly in Supabase for now if you want sold-out badges to work.
- The PRD's original RLS policy made `orders` publicly readable; this build restricts `SELECT` on orders to authenticated admins only, since customer names, WhatsApp numbers, and order contents shouldn't be exposed to anonymous requests.
- Item images are optional — cards fall back to placeholder text if `image_url` is empty.

## Design system

All colours, type, spacing, and component patterns follow the project's design brief: oat-paper background, clay-rose primary, dusty-sage secondary, Fraunces for display type, Karla for body text, one soft "paper" shadow, and rounded-full buttons throughout. Tokens live in [`app/globals.css`](app/globals.css).

## Deploying

Push to GitHub and import the repo on [Vercel](https://vercel.com/new). Add the two Supabase environment variables in the Vercel project settings before the first deploy.
