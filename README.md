# BloomU

BloomU is a student planning dashboard built with Next.js, Drizzle ORM, and PostgreSQL.

## Deploy with Vercel and Supabase

1. Import this repository into Vercel.
2. Create or connect a Supabase integration from the Vercel project settings.
3. Add `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to Vercel.
4. Add `SUPABASE_SERVICE_ROLE_KEY` for the demo account seed route. Keep this server-only key private.
5. Deploy once, then create the tables with `npm run db:push` using the same connection string.
6. In Supabase **Authentication → Providers → Email**, choose whether email confirmation is required.

For local development, copy `.env.example` to `.env.local` and set the Supabase values. Do not commit `.env.local`.

## Development

```bash
npm install
npm run db:push
npm run dev
```

Authentication uses Supabase Auth. The `users` table stores the app profile and uses the matching Supabase Auth user ID.

The demo button requires `SUPABASE_SERVICE_ROLE_KEY` because it creates the confirmed demo user server-side. Never expose that key to the browser or commit it.