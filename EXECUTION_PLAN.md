# Execution Plan: Simple QR

## Overview

| Metric | Value |
|--------|-------|
| Phases | 5 |
| Steps  | 15 |
| Tasks  | 28 |

## Phase Flow

```
Phase 1: Foundation (Setup & Static QR)
    ↓
Phase 2: Authentication & Database
    ↓
Phase 3: Dynamic QR Core
    ↓
Phase 4: Billing
    ↓
Phase 5: Analytics & Polish
```

---

## Phase 1: Foundation

**Goal:** Project scaffolding deployed to Vercel with working static QR generator.

### Pre-Phase Setup

Human must complete before agents begin:

- [ ] Create GitHub repository for the project
- [ ] Create Vercel account (if not exists)
- [ ] Connect GitHub repo to Vercel
- [ ] Add Neon database via Vercel integration (creates DATABASE_URL)

---

### Step 1.1: Project Scaffolding

#### Task 1.1.A: Initialize Next.js Project

**What:** Create Next.js 14+ project with TypeScript, Tailwind, and app router.

**Acceptance Criteria:**
- [x] Next.js 14+ project created with `create-next-app`
- [x] TypeScript configured with strict mode
- [x] Tailwind CSS installed and configured
- [x] App router structure in place (`app/` directory)
- [x] Project runs locally with `npm run dev`

**Files:**
- Create: `package.json` — project dependencies
- Create: `tsconfig.json` — TypeScript configuration
- Create: `tailwind.config.ts` — Tailwind configuration
- Create: `app/layout.tsx` — root layout
- Create: `app/page.tsx` — homepage placeholder

**Depends On:** None

**Spec Reference:** Tech Stack

---

#### Task 1.1.B: Configure Project Structure

**What:** Set up folder structure and base configurations for the application.

**Acceptance Criteria:**
- [x] `components/ui/` directory created with button and input components
- [x] `lib/` directory created with `utils.ts` (cn helper for Tailwind)
- [x] `.env.example` created with placeholder environment variables
- [x] `.gitignore` includes `.env.local` and node_modules
- [x] ESLint and Prettier configured

**Files:**
- Create: `components/ui/button.tsx` — reusable button component
- Create: `components/ui/input.tsx` — reusable input component
- Create: `lib/utils.ts` — utility functions
- Create: `.env.example` — environment variable template
- Modify: `.gitignore` — add environment files

**Depends On:** Task 1.1.A

**Spec Reference:** File Structure

---

### Step 1.2: Static QR Generator

#### Task 1.2.A: Build QR Generator Component

**What:** Create client-side QR code generator using the `qrcode` library.

**Acceptance Criteria:**
- [x] `qrcode` npm package installed
- [x] QR generator component accepts URL input
- [x] QR code renders in real-time as user types
- [x] Error correction level selector works (L, M, Q, H)
- [x] Size selector works (128, 256, 512, 1024 pixels)

**Files:**
- Create: `components/qr-generator.tsx` — QR generator component
- Modify: `package.json` — add qrcode dependency

**Depends On:** Task 1.1.B

**Spec Reference:** Static QR Codes (Free Tier)

---

#### Task 1.2.B: Add Download Functionality

**What:** Enable downloading QR codes as PNG and SVG files.

**Acceptance Criteria:**
- [x] "Download PNG" button downloads QR as PNG file
- [x] "Download SVG" button downloads QR as SVG file
- [x] Downloaded files have descriptive names (e.g., `qr-code-{timestamp}.png`)
- [x] Downloads work in Chrome, Firefox, and Safari

**Files:**
- Modify: `components/qr-generator.tsx` — add download buttons and logic

**Depends On:** Task 1.2.A

**Spec Reference:** Static QR Codes (Free Tier)

---

### Step 1.3: Homepage

#### Task 1.3.A: Build Marketing Homepage

**What:** Create the homepage with static QR generator and value proposition.

**Acceptance Criteria:**
- [x] Hero section with headline "No hostage codes" and subheadline
- [x] Static QR generator prominently featured
- [x] Brief explanation of free vs. paid tiers
- [x] Call-to-action for paid features (links to pricing/signup)
- [x] Responsive design works on mobile and desktop

**Files:**
- Modify: `app/page.tsx` — homepage content
- Create: `app/(marketing)/layout.tsx` — marketing pages layout

**Depends On:** Task 1.2.B

**Spec Reference:** Core User Experience - Static QR Code

---

#### Task 1.3.B: Build Pricing Page

**What:** Create pricing page with tier comparison.

**Acceptance Criteria:**
- [x] Three tiers displayed: Free, Pro ($5/mo), Business ($15/mo)
- [x] Feature comparison table shows what each tier includes
- [x] Annual pricing option shown with discount
- [x] CTA buttons for each tier (Free: use now, Paid: sign up)
- [x] Page accessible at `/pricing`

**Files:**
- Create: `app/(marketing)/pricing/page.tsx` — pricing page

**Depends On:** Task 1.3.A

**Spec Reference:** Pricing

---

### Phase 1 Checkpoint

**Automated:**
- [x] `npm run build` succeeds
- [x] `npm run lint` passes
- [x] TypeScript compilation has no errors

**Manual Verification:**
- [ ] Homepage loads and displays QR generator
- [ ] Enter any URL and QR code appears
- [ ] Download PNG and SVG — both files open correctly
- [ ] Pricing page displays all tiers
- [ ] Site is deployed and accessible on Vercel

---

## Phase 2: Authentication & Database

**Goal:** User signup/login working with Neon database.

### Pre-Phase Setup

Human must complete before agents begin:

- [ ] Verify DATABASE_URL is set in Vercel environment variables
- [ ] Create Google OAuth credentials at console.cloud.google.com
- [ ] Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to Vercel env vars
- [ ] Generate NEXTAUTH_SECRET (`openssl rand -base64 32`) and add to env vars
- [ ] Set NEXTAUTH_URL to production URL

---

### Step 2.1: Database Setup

#### Task 2.1.A: Configure Drizzle ORM

**What:** Set up Drizzle ORM with Neon database connection.

**Acceptance Criteria:**
- [x] `drizzle-orm` and `@neondatabase/serverless` installed
- [x] `drizzle.config.ts` configured for Neon
- [x] Database client created in `lib/db/index.ts`
- [x] Connection works (verified by running a simple query)
- [x] `drizzle-kit` installed for migrations

**Files:**
- Create: `lib/db/index.ts` — database client
- Create: `drizzle.config.ts` — Drizzle configuration
- Modify: `package.json` — add dependencies and db scripts

**Depends On:** None (Phase 2 start)

**Spec Reference:** Tech Stack - Drizzle ORM

---

#### Task 2.1.B: Create Database Schema

**What:** Define all database tables using Drizzle schema.

**Acceptance Criteria:**
- [x] `users` table schema defined with all fields from spec
- [x] `subscriptions` table schema defined
- [x] `qrCodes` table schema defined with indexes
- [x] `folders` table schema defined
- [x] `tags` and `qrCodeTags` junction table defined
- [x] `scanEvents` table schema defined with indexes
- [x] Migration generated and applied successfully

**Files:**
- Create: `lib/db/schema.ts` — all table definitions
- Create: `drizzle/` — migrations directory (generated)

**Depends On:** Task 2.1.A

**Spec Reference:** Data Models

---

### Step 2.2: Authentication

#### Task 2.2.A: Configure NextAuth

**What:** Set up NextAuth.js with Drizzle adapter.

**Acceptance Criteria:**
- [x] `next-auth` v5 and `@auth/drizzle-adapter` installed
- [x] Auth configuration created in `lib/auth.ts`
- [x] NextAuth API route set up at `app/api/auth/[...nextauth]/route.ts`
- [x] Session strategy set to JWT
- [x] Session callback includes user ID

**Files:**
- Create: `lib/auth.ts` — NextAuth configuration
- Create: `app/api/auth/[...nextauth]/route.ts` — auth API route
- Modify: `package.json` — add auth dependencies

**Depends On:** Task 2.1.B

**Spec Reference:** Authentication & Authorization - NextAuth.js Configuration

---

#### Task 2.2.B: Implement Email/Password Auth

**What:** Add credentials provider for email/password authentication.

**Acceptance Criteria:**
- [x] CredentialsProvider configured in NextAuth
- [x] Password hashing with bcrypt on signup
- [x] Password verification on login
- [x] User created in database on signup
- [x] Error handling for invalid credentials

**Files:**
- Modify: `lib/auth.ts` — add CredentialsProvider
- Create: `lib/auth-utils.ts` — password hashing utilities
- Modify: `package.json` — add bcrypt

**Depends On:** Task 2.2.A

**Spec Reference:** Authentication & Authorization

---

#### Task 2.2.C: Implement Google OAuth

**What:** Add Google provider for OAuth authentication.

**Acceptance Criteria:**
- [x] GoogleProvider configured in NextAuth
- [x] Google login creates user in database if not exists
- [x] Google login links to existing account by email
- [x] OAuth tokens stored via Drizzle adapter

**Files:**
- Modify: `lib/auth.ts` — add GoogleProvider

**Depends On:** Task 2.2.A

**Spec Reference:** Authentication & Authorization

---

### Step 2.3: Auth UI

#### Task 2.3.A: Build Login Page

**What:** Create login page with email/password and Google OAuth.

**Acceptance Criteria:**
- [x] Login form with email and password fields
- [x] "Sign in with Google" button
- [x] Form validation with error messages
- [x] Redirect to dashboard on successful login
- [x] Link to signup page
- [x] Page accessible at `/login`

**Files:**
- Create: `app/(auth)/login/page.tsx` — login page
- Create: `app/(auth)/layout.tsx` — auth pages layout

**Depends On:** Task 2.2.B, Task 2.2.C

**Spec Reference:** Core User Experience - Dynamic QR Code

---

#### Task 2.3.B: Build Signup Page

**What:** Create signup page with email/password and Google OAuth.

**Acceptance Criteria:**
- [x] Signup form with email, password, and confirm password fields
- [x] "Sign up with Google" button
- [x] Form validation (email format, password strength, password match)
- [x] Redirect to dashboard on successful signup
- [x] Link to login page
- [x] Page accessible at `/signup`

**Files:**
- Create: `app/(auth)/signup/page.tsx` — signup page
- Create: `app/api/auth/signup/route.ts` — signup API endpoint

**Depends On:** Task 2.3.A

**Spec Reference:** Core User Experience - Dynamic QR Code

---

#### Task 2.3.C: Protected Dashboard Layout

**What:** Create authenticated layout that redirects unauthenticated users.

**Acceptance Criteria:**
- [x] Dashboard layout checks for session
- [x] Unauthenticated users redirected to `/login`
- [x] Layout includes navigation sidebar
- [x] User email displayed in header
- [x] Logout button works

**Files:**
- Create: `app/(dashboard)/layout.tsx` — protected dashboard layout
- Create: `middleware.ts` — auth middleware for protected routes

**Depends On:** Task 2.3.B

**Spec Reference:** File Structure

---

### Phase 2 Checkpoint

**Automated:**
- [x] All tests pass
- [x] `npm run build` succeeds
- [x] Database migrations applied

**Manual Verification:**
- [ ] Sign up with email/password — user created in database
- [ ] Log out and log back in — session works
- [ ] Sign up with Google — OAuth flow completes
- [ ] Access dashboard while logged out — redirects to login
- [ ] Access dashboard while logged in — shows dashboard layout

---

## Phase 3: Dynamic QR Core

**Goal:** Users can create, edit, and organize dynamic QR codes with working redirects.

### Pre-Phase Setup

Human must complete before agents begin:

- [x] Decide on short URL domain (e.g., simpleqr.com/go/ or separate subdomain)
- [x] No additional setup required

---

### Step 3.1: QR Code CRUD

#### Task 3.1.A: Create QR Code API

**What:** Implement API endpoints for creating and listing QR codes.

**Acceptance Criteria:**
- [x] `POST /api/qr` creates a new QR code
- [x] Short code generated as random 8-character alphanumeric
- [x] Destination URL validated (must be valid URL)
- [x] `GET /api/qr` lists user's QR codes with pagination
- [x] Response includes short URL (e.g., `{domain}/go/{code}`)
- [x] Only authenticated users can access endpoints

**Files:**
- Create: `app/api/qr/route.ts` — create and list endpoints
- Create: `lib/qr.ts` — QR code utilities (short code generation)

**Depends On:** None (Phase 3 start)

**Spec Reference:** API Contracts - QR Codes

---

#### Task 3.1.B: Update and Delete QR Code API

**What:** Implement API endpoints for updating and deleting QR codes.

**Acceptance Criteria:**
- [x] `PATCH /api/qr/[id]` updates destination URL, name, folder, isActive
- [x] `DELETE /api/qr/[id]` removes QR code
- [x] Only owner can update/delete (403 for non-owners)
- [x] 404 returned for non-existent codes
- [x] Zod validation for request bodies

**Files:**
- Create: `app/api/qr/[id]/route.ts` — update and delete endpoints

**Depends On:** Task 3.1.A

**Spec Reference:** API Contracts - QR Codes

---

### Step 3.2: Redirect Service

#### Task 3.2.A: Build Edge Redirect Function

**What:** Create edge function that handles QR code redirects.

**Acceptance Criteria:**
- [x] `GET /go/[code]` redirects to destination URL
- [x] Response is 302 redirect with Location header
- [x] Lookup uses database query
- [x] 404 page shown for non-existent codes
- [x] 410 page shown for deactivated codes (isActive=false)
- [x] Function configured for edge runtime

**Files:**
- Create: `app/go/[code]/route.ts` — edge redirect function
- Create: `app/go/[code]/not-found.tsx` — 404 page
- Create: `app/go/[code]/gone.tsx` — 410 page

**Depends On:** Task 3.1.A

**Spec Reference:** Redirect Service (Edge Function)

---

#### Task 3.2.B: Add Scan Event Logging

**What:** Log scan events asynchronously when QR codes are scanned.

**Acceptance Criteria:**
- [x] Scan event logged with timestamp, country, and IP hash
- [x] Country extracted from Vercel `request.geo`
- [x] IP hashed with SHA-256 (not stored raw)
- [x] Logging is async (does not block redirect)
- [x] `scanCount` incremented on QR code record
- [x] Bot user agents filtered out (not logged)

**Files:**
- Modify: `app/go/[code]/route.ts` — add scan logging
- Create: `lib/analytics.ts` — scan logging utilities

**Depends On:** Task 3.2.A

**Spec Reference:** Scan Events, Bot Filtering

---

### Step 3.3: QR Dashboard

#### Task 3.3.A: Build QR Code List View

**What:** Create dashboard page showing user's QR codes.

**Acceptance Criteria:**
- [x] Dashboard page at `/dashboard` lists all QR codes
- [x] Each QR code shows: name, short URL, destination, scan count
- [x] "Create New" button opens creation flow
- [x] QR codes sortable by date created, scan count
- [x] Pagination works for users with many codes
- [x] Empty state shown when no codes exist

**Files:**
- Create: `app/(dashboard)/dashboard/page.tsx` — QR list page
- Create: `components/qr-card.tsx` — QR code card component

**Depends On:** Task 3.1.B

**Spec Reference:** Core User Experience - Dynamic QR Code

---

#### Task 3.3.B: Build QR Creation Flow

**What:** Create modal or page for creating new dynamic QR codes.

**Acceptance Criteria:**
- [x] Form with destination URL input (required)
- [x] Optional name field
- [x] Optional folder selector
- [x] URL validation before submission
- [x] QR code preview shown after creation
- [x] Download buttons for PNG/SVG
- [x] Short URL displayed and copyable

**Files:**
- Create: `components/qr-create-modal.tsx` — QR creation modal
- Modify: `app/(dashboard)/dashboard/page.tsx` — integrate modal

**Depends On:** Task 3.3.A

**Spec Reference:** Core User Experience - Dynamic QR Code

---

#### Task 3.3.C: Build QR Edit View

**What:** Create page for viewing and editing a single QR code.

**Acceptance Criteria:**
- [x] Page at `/qr/[id]` shows QR code details
- [x] Editable fields: destination URL, name, folder
- [x] QR code image displayed with download options
- [x] Toggle for active/inactive status
- [x] Delete button with confirmation
- [x] Changes saved via API

**Files:**
- Create: `app/(dashboard)/qr/[id]/page.tsx` — QR detail page

**Depends On:** Task 3.3.B

**Spec Reference:** Core User Experience - Dynamic QR Code

---

### Step 3.4: Organization

#### Task 3.4.A: Implement Folders

**What:** Add folder management for organizing QR codes.

**Acceptance Criteria:**
- [x] `POST /api/folders` creates a folder
- [x] `GET /api/folders` lists folders with QR count
- [x] `DELETE /api/folders/[id]` removes folder (moves QR codes to no-folder)
- [x] Dashboard can filter by folder
- [x] Folder selector in QR creation/edit

**Files:**
- Create: `app/api/folders/route.ts` — folder endpoints
- Create: `app/api/folders/[id]/route.ts` — delete endpoint
- Create: `components/folder-sidebar.tsx` — folder list component
- Modify: `app/(dashboard)/dashboard/page.tsx` — add folder filter

**Depends On:** Task 3.3.C

**Spec Reference:** API Contracts - Folders

---

#### Task 3.4.B: Implement Tags

**What:** Add tagging system for QR codes.

**Acceptance Criteria:**
- [x] `POST /api/tags` creates a tag
- [x] `GET /api/tags` lists user's tags
- [x] `POST /api/qr/[id]/tags` adds tag to QR code
- [x] `DELETE /api/qr/[id]/tags/[tagId]` removes tag
- [x] Tags displayed on QR cards
- [x] Tag selector in QR edit view

**Files:**
- Create: `app/api/tags/route.ts` — tag endpoints
- Create: `app/api/qr/[id]/tags/route.ts` — QR tag endpoints
- Create: `app/api/qr/[id]/tags/[tagId]/route.ts` — remove tag
- Create: `components/tag-input.tsx` — tag selector component
- Modify: `components/qr-card.tsx` — display tags

**Depends On:** Task 3.4.A

**Spec Reference:** API Contracts - Tags

---

### Phase 3 Checkpoint

**Automated:**
- [x] All tests pass
- [x] `npm run build` succeeds

**Manual Verification:**
- [ ] Create a QR code — appears in dashboard
- [ ] Scan QR code (or visit short URL) — redirects correctly
- [ ] Edit destination URL — redirect goes to new URL
- [ ] Deactivate QR code — shows 410 page on scan
- [ ] Create folders and move QR codes between them
- [ ] Add and remove tags from QR codes

---

## Phase 4: Billing

**Goal:** Stripe integration complete with subscription enforcement.

### Pre-Phase Setup

Human must complete before agents begin:

- [ ] Create Stripe account at stripe.com
- [ ] Create products in Stripe: "Pro" and "Business"
- [ ] Create prices: Pro monthly ($5), Pro annual ($36), Business monthly ($15), Business annual ($120)
- [ ] Add STRIPE_SECRET_KEY to Vercel env vars
- [ ] Add STRIPE_WEBHOOK_SECRET to Vercel env vars (after creating webhook)
- [ ] Add STRIPE_PRO_MONTHLY_PRICE_ID, STRIPE_PRO_ANNUAL_PRICE_ID, STRIPE_BUSINESS_MONTHLY_PRICE_ID, STRIPE_BUSINESS_ANNUAL_PRICE_ID to env vars

---

### Step 4.1: Stripe Integration

#### Task 4.1.A: Set Up Stripe Client

**What:** Configure Stripe SDK and create checkout session endpoint.

**Acceptance Criteria:**
- [x] `stripe` npm package installed
- [x] Stripe client configured in `lib/stripe.ts`
- [x] `POST /api/stripe/checkout` creates checkout session
- [x] Checkout redirects to Stripe payment page
- [x] Success and cancel URLs configured

**Files:**
- Create: `lib/stripe.ts` — Stripe client and helpers
- Create: `app/api/stripe/checkout/route.ts` — checkout endpoint
- Modify: `package.json` — add stripe dependency

**Depends On:** None (Phase 4 start)

**Spec Reference:** Account & Billing

---

#### Task 4.1.B: Implement Stripe Webhooks

**What:** Handle Stripe webhook events for subscription lifecycle.

**Acceptance Criteria:**
- [x] `POST /api/stripe/webhook` receives Stripe events
- [x] Webhook signature verified
- [x] `checkout.session.completed` creates subscription record
- [x] `customer.subscription.updated` updates subscription status
- [x] `customer.subscription.deleted` marks subscription canceled
- [x] `invoice.payment_failed` updates status to past_due

**Files:**
- Create: `app/api/stripe/webhook/route.ts` — webhook handler

**Depends On:** Task 4.1.A

**Spec Reference:** Stripe Webhooks

---

### Step 4.2: Subscription Enforcement

#### Task 4.2.A: Add Subscription Checks to API

**What:** Enforce subscription requirements on dynamic QR endpoints.

**Acceptance Criteria:**
- [x] `requireSubscription` helper checks for active subscription
- [x] `checkQrLimit` enforces Pro plan 10-code limit
- [x] `POST /api/qr` returns 403 if no subscription
- [x] `POST /api/qr` returns 403 if Pro limit reached
- [x] Business plan has no limit

**Files:**
- Create: `lib/subscription.ts` — subscription helpers
- Modify: `app/api/qr/route.ts` — add subscription checks

**Depends On:** Task 4.1.B

**Spec Reference:** Subscription Enforcement

---

#### Task 4.2.B: Build Billing UI

**What:** Create billing page for subscription management.

**Acceptance Criteria:**
- [x] Billing page at `/billing` shows current plan
- [x] Non-subscribers see upgrade prompts with plan options
- [x] Subscribers see plan details and usage (X of 10 codes for Pro)
- [x] "Manage Subscription" links to Stripe customer portal
- [x] Cancel flow works via Stripe portal

**Files:**
- Create: `app/(dashboard)/billing/page.tsx` — billing page
- Create: `app/api/stripe/portal/route.ts` — customer portal redirect

**Depends On:** Task 4.2.A

**Spec Reference:** Core User Experience - Dynamic QR Code

---

### Phase 4 Checkpoint

**Automated:**
- [x] All tests pass
- [x] `npm run build` succeeds

**Manual Verification:**
- [x] Without subscription: cannot create dynamic QR code
- [x] Complete Stripe checkout (use test mode)
- [x] After subscription: can create QR codes
- [x] Pro plan: blocked at 10 codes
- [x] Billing page shows correct plan and usage
- [x] Customer portal accessible

---

## Phase 5: Analytics & Polish

**Goal:** Analytics dashboard working, abuse prevention in place, ready for launch.

### Pre-Phase Setup

Human must complete before agents begin:

- [ ] Create Google Safe Browsing API key at console.cloud.google.com
- [ ] Add GOOGLE_SAFE_BROWSING_API_KEY to Vercel env vars
- [ ] Set up Vercel KV for rate limiting (or Upstash Redis)
- [ ] Add KV_REST_API_URL and KV_REST_API_TOKEN to env vars

---

### Step 5.1: Analytics

#### Task 5.1.A: Build Analytics API

**What:** Create API endpoints for QR code analytics.

**Acceptance Criteria:**
- [x] `GET /api/qr/[id]/analytics` returns scan data
- [x] Response includes: totalScans, scansByDay, scansByCountry
- [x] Date range filtering with `from` and `to` query params
- [x] Only owner can access analytics
- [x] Efficient queries with proper indexes

**Files:**
- Create: `app/api/qr/[id]/analytics/route.ts` — analytics endpoint

**Depends On:** None (Phase 5 start)

**Spec Reference:** API Contracts - Get Analytics

---

#### Task 5.1.B: Build Analytics Dashboard

**What:** Create analytics view for individual QR codes.

**Acceptance Criteria:**
- [ ] Analytics section on QR detail page (`/qr/[id]`)
- [ ] Total scan count displayed prominently
- [ ] Line chart showing scans over time
- [ ] Table/chart showing scans by country
- [ ] Date range picker for filtering

**Files:**
- Modify: `app/(dashboard)/qr/[id]/page.tsx` — add analytics section
- Create: `components/analytics-chart.tsx` — chart component

**Depends On:** Task 5.1.A

**Spec Reference:** Core User Experience - Dynamic QR Code

---

#### Task 5.1.C: Implement CSV Export

**What:** Add ability to export scan data as CSV.

**Acceptance Criteria:**
- [ ] `GET /api/qr/[id]/analytics/export` returns CSV file
- [ ] CSV includes: timestamp, country
- [ ] Date range filtering supported
- [ ] Response headers set for file download
- [ ] Large exports stream data (don't load all in memory)

**Files:**
- Create: `app/api/qr/[id]/analytics/export/route.ts` — CSV export endpoint
- Modify: `app/(dashboard)/qr/[id]/page.tsx` — add export button

**Depends On:** Task 5.1.A

**Spec Reference:** API Contracts - Export Analytics CSV

---

### Step 5.2: Abuse Prevention

#### Task 5.2.A: Implement Rate Limiting

**What:** Add rate limiting to redirect endpoint.

**Acceptance Criteria:**
- [ ] `@upstash/ratelimit` configured with Vercel KV
- [ ] Redirect endpoint limited to 100 requests/minute per IP
- [ ] 429 response returned when limit exceeded
- [ ] Rate limit headers included in response

**Files:**
- Create: `lib/ratelimit.ts` — rate limiting configuration
- Modify: `app/go/[code]/route.ts` — add rate limiting
- Modify: `package.json` — add @upstash/ratelimit, @vercel/kv

**Depends On:** Task 5.1.C

**Spec Reference:** Rate Limiting

---

#### Task 5.2.B: Implement Link Safety Checks

**What:** Check URLs against Google Safe Browsing API.

**Acceptance Criteria:**
- [ ] `checkUrlSafety` function queries Safe Browsing API
- [ ] Called on QR code creation and URL update
- [ ] Malicious URLs rejected with 400 response
- [ ] Error message explains why URL was rejected
- [ ] API errors logged but don't block creation (fail open)

**Files:**
- Create: `lib/safe-browsing.ts` — Safe Browsing API client
- Modify: `app/api/qr/route.ts` — add safety check on create
- Modify: `app/api/qr/[id]/route.ts` — add safety check on update

**Depends On:** Task 5.2.A

**Spec Reference:** Link Safety Checks

---

### Step 5.3: Final Polish

#### Task 5.3.A: Error Handling

**What:** Add comprehensive error handling and user feedback.

**Acceptance Criteria:**
- [ ] Global error boundary catches unhandled errors
- [ ] API errors return consistent JSON format
- [ ] Form validation errors displayed inline
- [ ] Loading states shown during async operations
- [ ] Toast notifications for success/error feedback

**Files:**
- Create: `app/error.tsx` — global error boundary
- Create: `components/ui/toast.tsx` — toast notification component
- Create: `lib/errors.ts` — error handling utilities

**Depends On:** Task 5.2.B

**Spec Reference:** Edge Cases & Boundary Conditions

---

#### Task 5.3.B: Settings Page

**What:** Create user settings page for account management.

**Acceptance Criteria:**
- [ ] Settings page at `/settings`
- [ ] Display user email and name
- [ ] Allow name update
- [ ] Show connected OAuth providers
- [ ] Link to billing page

**Files:**
- Create: `app/(dashboard)/settings/page.tsx` — settings page
- Create: `app/api/user/route.ts` — user update endpoint

**Depends On:** Task 5.3.A

**Spec Reference:** File Structure

---

### Phase 5 Checkpoint

**Automated:**
- [ ] All tests pass
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes

**Manual Verification:**
- [ ] Analytics show scan data correctly
- [ ] CSV export downloads valid file
- [ ] Rate limiting works (hit endpoint 100+ times rapidly)
- [ ] Malicious URL rejected (test with known bad URL)
- [ ] Error states display properly
- [ ] Settings page allows updates
- [ ] Full user journey works: signup → subscribe → create QR → scan → view analytics

---

## Appendix: Task Dependency Graph

```
Phase 1
├── 1.1.A → 1.1.B → 1.2.A → 1.2.B → 1.3.A → 1.3.B

Phase 2
├── 2.1.A → 2.1.B → 2.2.A ┬→ 2.2.B ┬→ 2.3.A → 2.3.B → 2.3.C
                          └→ 2.2.C ┘

Phase 3
├── 3.1.A ┬→ 3.1.B → 3.3.A → 3.3.B → 3.3.C → 3.4.A → 3.4.B
          └→ 3.2.A → 3.2.B

Phase 4
├── 4.1.A → 4.1.B → 4.2.A → 4.2.B

Phase 5
├── 5.1.A → 5.1.B
          → 5.1.C → 5.2.A → 5.2.B → 5.3.A → 5.3.B
```
