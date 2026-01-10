# Simple QR — Technical Specification

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Next.js 14+ (App Router) | Full-stack in one project, excellent edge support, server components for dynamic features, client components for static QR generation |
| Hosting | Vercel | Native Next.js support, edge functions for redirects, 1M edge invocations/mo free, excellent uptime |
| Database | Neon (PostgreSQL) | Serverless Postgres, Vercel integration, generous free tier, scales to zero |
| ORM | Drizzle ORM | Type-safe, lightweight, fast cold starts, excellent Neon/Postgres support |
| Authentication | NextAuth.js v5 | Standard for Next.js, supports email/password + OAuth, session management |
| Payments | Stripe | Industry standard, good developer experience, handles subscriptions |
| QR Generation | `qrcode` npm package | Client-side, lightweight, PNG/SVG output, configurable error correction |
| IP Geolocation | Vercel `request.geo` | Free, no external API, available in edge functions |
| Styling | Tailwind CSS | Fast to build, utility-first, good defaults |

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                  VERCEL                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Next.js Application                               │   │
│  │                                                                       │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │   │
│  │  │   Static Pages  │  │  Server Routes  │  │    API Routes       │   │   │
│  │  │                 │  │                 │  │                     │   │   │
│  │  │  - Homepage     │  │  - Dashboard    │  │  - /api/auth/*      │   │   │
│  │  │  - Pricing      │  │  - QR Manager   │  │  - /api/qr/*        │   │   │
│  │  │  - Static QR    │  │  - Analytics    │  │  - /api/stripe/*    │   │   │
│  │  │    Generator    │  │  - Settings     │  │                     │   │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘   │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     Edge Functions                                    │   │
│  │                                                                       │   │
│  │  /go/[code]  →  Redirect service (low latency, global)               │   │
│  │               - Lookup destination URL                                │   │
│  │               - Log scan event (async)                                │   │
│  │               - 302 redirect                                          │   │
│  │                                                                       │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL SERVICES                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │      Neon       │  │     Stripe      │  │   Google Safe Browsing     │  │
│  │   (PostgreSQL)  │  │   (Payments)    │  │   (Link Safety Checks)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Request Flows

**Static QR Generation (Free)**
```
Browser → Client-side JS → qrcode library → PNG/SVG download
(No server involved)
```

**Dynamic QR Creation (Paid)**
```
Browser → POST /api/qr → Validate subscription → Generate short code → Save to DB → Return QR
```

**QR Scan (Redirect)**
```
Scanner → GET /go/abc123 → Edge Function → DB lookup → Log scan (async) → 302 redirect
```

## Data Models

### Users

```typescript
// drizzle schema
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: timestamp('email_verified'),
  passwordHash: varchar('password_hash', { length: 255 }), // null if OAuth-only
  name: varchar('name', { length: 255 }),
  image: varchar('image', { length: 500 }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### Subscriptions

```typescript
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).notNull(),
  stripePriceId: varchar('stripe_price_id', { length: 255 }).notNull(),
  plan: varchar('plan', { length: 50 }).notNull(), // 'pro' | 'business'
  status: varchar('status', { length: 50 }).notNull(), // 'active' | 'canceled' | 'past_due'
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

### QR Codes

```typescript
export const qrCodes = pgTable('qr_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  shortCode: varchar('short_code', { length: 20 }).notNull().unique(), // e.g., 'abc123'
  destinationUrl: varchar('destination_url', { length: 2000 }).notNull(),
  name: varchar('name', { length: 255 }), // user-friendly label
  folderId: uuid('folder_id').references(() => folders.id),
  isActive: boolean('is_active').default(true).notNull(),
  scanCount: integer('scan_count').default(0).notNull(), // denormalized for fast reads
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  shortCodeIdx: uniqueIndex('short_code_idx').on(table.shortCode),
  userIdIdx: index('user_id_idx').on(table.userId),
}));
```

### Folders

```typescript
export const folders = pgTable('folders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

### Tags

```typescript
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
});

export const qrCodeTags = pgTable('qr_code_tags', {
  qrCodeId: uuid('qr_code_id').references(() => qrCodes.id).notNull(),
  tagId: uuid('tag_id').references(() => tags.id).notNull(),
}, (table) => ({
  pk: primaryKey(table.qrCodeId, table.tagId),
}));
```

### Scan Events

```typescript
export const scanEvents = pgTable('scan_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  qrCodeId: uuid('qr_code_id').references(() => qrCodes.id).notNull(),
  scannedAt: timestamp('scanned_at').defaultNow().notNull(),
  country: varchar('country', { length: 2 }), // ISO 3166-1 alpha-2
  ipHash: varchar('ip_hash', { length: 64 }), // SHA-256 for deduplication, not stored raw
}, (table) => ({
  qrCodeIdIdx: index('scan_qr_code_id_idx').on(table.qrCodeId),
  scannedAtIdx: index('scan_scanned_at_idx').on(table.scannedAt),
}));
```

### NextAuth Tables

NextAuth requires additional tables for sessions, accounts, and verification tokens. Use `@auth/drizzle-adapter` which provides these schemas.

## API Contracts

### Authentication

Handled by NextAuth.js. Routes auto-generated at `/api/auth/*`.

### QR Codes

**Create QR Code**
```
POST /api/qr

Request:
{
  "destinationUrl": "https://example.com",
  "name": "My Business Card",         // optional
  "folderId": "uuid"                   // optional
}

Response (201):
{
  "id": "uuid",
  "shortCode": "abc123",
  "shortUrl": "https://go.simpleqr.com/abc123",
  "destinationUrl": "https://example.com",
  "name": "My Business Card",
  "createdAt": "2024-01-15T10:00:00Z"
}

Errors:
- 401: Not authenticated
- 403: Subscription required / QR limit reached
- 400: Invalid URL
```

**List QR Codes**
```
GET /api/qr?folderId=uuid&page=1&limit=20

Response (200):
{
  "data": [
    {
      "id": "uuid",
      "shortCode": "abc123",
      "shortUrl": "https://go.simpleqr.com/abc123",
      "destinationUrl": "https://example.com",
      "name": "My Business Card",
      "scanCount": 142,
      "isActive": true,
      "createdAt": "2024-01-15T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

**Update QR Code**
```
PATCH /api/qr/[id]

Request:
{
  "destinationUrl": "https://new-url.com",  // optional
  "name": "Updated Name",                    // optional
  "folderId": "uuid",                        // optional, null to remove
  "isActive": false                          // optional
}

Response (200):
{ ...updated QR code object }

Errors:
- 401: Not authenticated
- 403: Not owner
- 404: Not found
```

**Delete QR Code**
```
DELETE /api/qr/[id]

Response (204): No content

Errors:
- 401: Not authenticated
- 403: Not owner
- 404: Not found
```

**Get Analytics**
```
GET /api/qr/[id]/analytics?from=2024-01-01&to=2024-01-31

Response (200):
{
  "totalScans": 142,
  "scansByDay": [
    { "date": "2024-01-15", "count": 12 },
    { "date": "2024-01-16", "count": 8 }
  ],
  "scansByCountry": [
    { "country": "US", "count": 89 },
    { "country": "GB", "count": 23 }
  ]
}
```

**Export Analytics CSV**
```
GET /api/qr/[id]/analytics/export?from=2024-01-01&to=2024-01-31

Response (200):
Content-Type: text/csv
Content-Disposition: attachment; filename="analytics-abc123.csv"

timestamp,country
2024-01-15T10:30:00Z,US
2024-01-15T11:45:00Z,GB
...
```

### Folders

**Create Folder**
```
POST /api/folders

Request:
{ "name": "Marketing Campaigns" }

Response (201):
{ "id": "uuid", "name": "Marketing Campaigns", "createdAt": "..." }
```

**List Folders**
```
GET /api/folders

Response (200):
{
  "data": [
    { "id": "uuid", "name": "Marketing Campaigns", "qrCount": 5 }
  ]
}
```

**Delete Folder**
```
DELETE /api/folders/[id]

Response (204): No content
(QR codes in folder are moved to no-folder, not deleted)
```

### Tags

**Create Tag**
```
POST /api/tags
{ "name": "urgent" }
```

**List Tags**
```
GET /api/tags
```

**Add Tag to QR**
```
POST /api/qr/[id]/tags
{ "tagId": "uuid" }
```

**Remove Tag from QR**
```
DELETE /api/qr/[id]/tags/[tagId]
```

### Stripe Webhooks

```
POST /api/stripe/webhook

Handles:
- checkout.session.completed → Create subscription record
- customer.subscription.updated → Update subscription status
- customer.subscription.deleted → Mark subscription canceled
- invoice.payment_failed → Update status to past_due
```

### Redirect Service (Edge Function)

```
GET /go/[code]

Logic:
1. Lookup shortCode in database
2. If not found → 404 page
3. If isActive=false → 410 Gone page
4. Log scan event (async, don't block redirect)
5. Return 302 redirect to destinationUrl

Response:
- 302 redirect with Location header
- 404: Code not found
- 410: Code deactivated
```

## Authentication & Authorization

### NextAuth.js Configuration

```typescript
// auth.ts
export const authConfig = {
  providers: [
    CredentialsProvider({
      // Email/password login
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' }
      },
      authorize: async (credentials) => {
        // Verify password hash
        // Return user or null
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  adapter: DrizzleAdapter(db),
  session: { strategy: 'jwt' },
  callbacks: {
    session: ({ session, token }) => ({
      ...session,
      user: { ...session.user, id: token.sub }
    }),
  },
};
```

### Authorization Rules

| Resource | Rule |
|----------|------|
| Static QR generation | Public, no auth required |
| Create dynamic QR | Authenticated + active subscription |
| View/edit/delete QR | Owner only (userId matches) |
| View analytics | Owner only |
| Manage folders/tags | Owner only |

### Subscription Enforcement

```typescript
// middleware or API route helper
async function requireSubscription(userId: string) {
  const subscription = await db.query.subscriptions.findFirst({
    where: and(
      eq(subscriptions.userId, userId),
      eq(subscriptions.status, 'active')
    )
  });

  if (!subscription) {
    throw new Error('Subscription required');
  }

  return subscription;
}

async function checkQrLimit(userId: string, plan: string) {
  if (plan === 'business') return; // unlimited

  const count = await db.select({ count: count() })
    .from(qrCodes)
    .where(eq(qrCodes.userId, userId));

  if (count[0].count >= 10) { // Pro plan limit
    throw new Error('QR code limit reached');
  }
}
```

## Abuse Prevention

### Rate Limiting

```typescript
// Using Vercel KV or upstash/ratelimit
import { Ratelimit } from '@upstash/ratelimit';
import { kv } from '@vercel/kv';

const ratelimit = new Ratelimit({
  redis: kv,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute per IP
});

// Apply to redirect endpoint
const { success } = await ratelimit.limit(ip);
if (!success) return new Response('Too many requests', { status: 429 });
```

### Bot Filtering for Analytics

```typescript
// In redirect edge function
const userAgent = request.headers.get('user-agent') || '';
const isBot = /bot|crawler|spider|crawling/i.test(userAgent);

if (!isBot) {
  // Only log human scans
  await logScanEvent(qrCodeId, country, ipHash);
}
```

### Link Safety Checks

```typescript
// On QR creation and URL update
async function checkUrlSafety(url: string): Promise<boolean> {
  const response = await fetch(
    `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${SAFE_BROWSING_API_KEY}`,
    {
      method: 'POST',
      body: JSON.stringify({
        client: { clientId: 'simpleqr', clientVersion: '1.0.0' },
        threatInfo: {
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING', 'UNWANTED_SOFTWARE'],
          platformTypes: ['ANY_PLATFORM'],
          threatEntryTypes: ['URL'],
          threatEntries: [{ url }]
        }
      })
    }
  );

  const data = await response.json();
  return !data.matches || data.matches.length === 0;
}
```

### Takedown Workflow

Store abuse reports in database. For MVP, manual review via admin dashboard or direct database access.

```typescript
export const abuseReports = pgTable('abuse_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  qrCodeId: uuid('qr_code_id').references(() => qrCodes.id).notNull(),
  reporterEmail: varchar('reporter_email', { length: 255 }),
  reason: text('reason'),
  status: varchar('status', { length: 50 }).default('pending'), // pending | reviewed | actioned
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

## Key Dependencies

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "next-auth": "^5.0.0-beta",
    "@auth/drizzle-adapter": "^1.0.0",
    "drizzle-orm": "^0.29.0",
    "@neondatabase/serverless": "^0.9.0",
    "stripe": "^14.0.0",
    "qrcode": "^1.5.0",
    "@upstash/ratelimit": "^1.0.0",
    "@vercel/kv": "^1.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "drizzle-kit": "^0.20.0",
    "typescript": "^5.0.0",
    "@types/qrcode": "^1.5.0",
    "tailwindcss": "^3.4.0"
  }
}
```

## Implementation Sequence

### Phase 1: Foundation (Setup & Static QR)
1. Initialize Next.js project with TypeScript and Tailwind
2. Set up project structure (app router, components, lib)
3. Deploy to Vercel, connect Neon database
4. Implement static QR generator (client-side only)
5. Build homepage with static QR tool

### Phase 2: Authentication & Database
1. Set up Drizzle ORM with Neon
2. Create database schema, run migrations
3. Implement NextAuth with email/password
4. Add Google OAuth provider
5. Build signup/login pages
6. Protected dashboard layout

### Phase 3: Dynamic QR Core
1. Build QR creation flow (form, API, database)
2. Implement redirect edge function at /go/[code]
3. Add scan event logging
4. Build QR management dashboard (list, edit, delete)
5. Implement folder organization
6. Add tagging system

### Phase 4: Billing
1. Set up Stripe products and prices
2. Implement checkout flow
3. Build Stripe webhook handler
4. Add subscription enforcement to API routes
5. Build billing management page (view plan, cancel)
6. Implement QR code limits for Pro plan

### Phase 5: Analytics & Polish
1. Build analytics API endpoints
2. Create analytics dashboard UI (charts, tables)
3. Implement CSV export
4. Add abuse prevention (rate limiting, bot filtering, Safe Browsing)
5. Build pricing page
6. Error handling and edge cases
7. Final testing and launch prep

## Edge Cases & Boundary Conditions

| Scenario | Handling |
|----------|----------|
| Short code collision | Generate random 8-char code, retry on collision (probability negligible with 62^8 combinations) |
| User deletes account | Soft delete QR codes (keep redirects working) or hard delete with warning |
| Subscription lapses | QR codes stay active but user can't edit. Prompt to resubscribe. |
| Destination URL changes to malicious | Run Safe Browsing check on every update, not just creation |
| Database unavailable during redirect | Cache hot codes at edge (Vercel KV) with 5-min TTL |
| Scan event logging fails | Fire-and-forget async logging; redirect must never fail |
| CSV export with 100k+ rows | Stream response, don't load all in memory |
| Invalid URL submitted | Validate URL format client-side and server-side with zod |

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://...@neon.tech/simpleqr

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://simpleqr.com
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_BUSINESS_PRICE_ID=price_...

# Abuse Prevention
GOOGLE_SAFE_BROWSING_API_KEY=...

# Rate Limiting (Vercel KV or Upstash)
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

## File Structure

```
simple-qr-code-generator/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx              # Homepage with static QR tool
│   │   ├── pricing/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx    # QR code list
│   │   ├── qr/[id]/page.tsx      # QR detail + analytics
│   │   ├── settings/page.tsx     # Account settings
│   │   ├── billing/page.tsx      # Subscription management
│   │   └── layout.tsx            # Protected layout
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── go/[code]/route.ts        # Edge redirect function
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── qr/route.ts           # Create, list
│   │   ├── qr/[id]/route.ts      # Get, update, delete
│   │   ├── qr/[id]/analytics/route.ts
│   │   ├── folders/route.ts
│   │   ├── tags/route.ts
│   │   └── stripe/webhook/route.ts
│   └── layout.tsx
├── components/
│   ├── ui/                       # Reusable UI components
│   ├── qr-generator.tsx          # Static QR tool (client)
│   ├── qr-card.tsx               # QR code display card
│   └── analytics-chart.tsx
├── lib/
│   ├── db/
│   │   ├── index.ts              # Drizzle client
│   │   └── schema.ts             # All table definitions
│   ├── auth.ts                   # NextAuth config
│   ├── stripe.ts                 # Stripe helpers
│   └── utils.ts
├── drizzle.config.ts
├── middleware.ts                 # Auth protection
└── .env.local
```
