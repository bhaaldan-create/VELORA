# VELORA

**Beauty Revealed** — global beauty e-commerce for skincare, body care, hair care, and makeup, with an integrated Beauty Advisor for personalized guidance.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- Prisma + PostgreSQL (catalog database)
- Client cart (localStorage)
- Beauty Advisor (AI + local fallback, reads products from DB)

## Database

عيّني `DATABASE_URL` في `.env.local` إلى PostgreSQL (انظر `.env.example`)، ثم:

```bash
npm run db:migrate   # apply schema
npm run db:seed      # load categories + products
npm run db:studio    # browse data in Prisma Studio
```

- Runtime catalog: `src/lib/catalog.ts`
- Seed source: `src/data/products.ts` + `src/data/categories.ts`

## Scripts

```bash
npm run dev
npm run build
npm start
npm run mobile:sync      # Capacitor Android/iOS
npm run mobile:android
```

انظر `MOBILE.md` لخطوات بناء تطبيق المتاجر.
## Structure

```text
src/
  app/           # Routes: home, shop, product, cart, checkout, advisor, about
  components/    # Brand, layout, home, shop, cart, advisor, ui
  context/       # Cart state
  data/          # Products, categories, advisor logic
  constants/     # Brand tokens
  types/         # Shared TypeScript types
public/brand/    # Logo assets
```

## Categories

- Skincare
- Body Care
- Hair Care
- Makeup

## Beauty Advisor (AI)

Visit `/advisor`.

- Works immediately with a smart local advisor that recommends only Velora products.
- For full cloud AI, copy `.env.example` → `.env.local` and add:

```bash
OPENAI_API_KEY=sk-...
# or
GOOGLE_GENERATIVE_AI_API_KEY=...
```

Then restart `npm run dev`. The badge on the advisor page shows `AI · OpenAI` / `AI · Google Gemini`.

## Order emails

Checkout posts to `/api/orders` and emails the company inbox.

```bash
ORDER_EMAIL_TO=almassacompanyiraq@gmail.com
SMTP_USER=almassacompanyiraq@gmail.com
SMTP_PASS=your-gmail-app-password
```

Use a Gmail **App Password** (not the normal password).
