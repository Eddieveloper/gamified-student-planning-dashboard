# BloomU

BloomU is a student planning dashboard built with Next.js, Drizzle ORM, and PostgreSQL.

## Deploy with Vercel and Supabase

1. Import this repository into Vercel.
2. Create or connect a Supabase integration from the Vercel project settings.
3. Ensure the integration provides `POSTGRES_URL` (or `DATABASE_URL`) to the project.
4. Deploy once, then create the tables with `npm run db:push` using the same connection string.

For local development, copy `.env.example` to `.env.local` and set `DATABASE_URL` to your Supabase PostgreSQL connection string. Do not commit `.env.local`.

## Development

```bash
npm install
npm run db:push
npm run dev
```

The app uses its own cookie-based application auth. The Supabase publishable key is not required because Supabase is being used as the PostgreSQL database.