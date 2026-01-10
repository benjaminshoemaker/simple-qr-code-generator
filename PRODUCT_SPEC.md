# Simple QR — Product Specification

## Problem Statement

QR code generators have become hostage-ware. The scam pattern:

1. User searches "free QR code generator"
2. Creates a dynamic QR code (destination URL can be changed later)
3. Prints 1,000 business cards, menus, or wedding invitations
4. 14-30 days later, the code stops working
5. User receives email: "Pay $35/mo or your code stays dead"
6. User is trapped — reprint everything or pay

This works because dynamic QR codes route through the provider's servers. They control the redirect. The switching cost (reprinting physical materials) is so high that users pay almost anything.

The rage is real: QR Code Generator Pro has 1.7/5 on Trustpilot with widespread "scam" accusations. Reddit communities (r/weddingplanning, r/graphic_design, r/assholedesign) are full of warnings about "QR code generator scams."

## Target Users

**Primary:**
- Small business owners (restaurants, salons, retail) putting QR codes on menus, signage, business cards
- Event planners and wedding couples using QR codes on invitations
- Marketers creating print campaigns with QR tracking
- Designers creating materials for clients

**User psychology:** These users often discover they've been scammed AFTER printing. They're angry and vocal. They actively warn others in communities. This creates organic distribution for an honest alternative.

**Communities:**
- r/smallbusiness (1.5M+ members)
- r/weddingplanning (800K+ members)
- r/graphic_design (4M+ members)
- r/marketing, r/qrcode
- Print shop communities, Etsy seller groups, restaurant owner Facebook groups

## Product Positioning

**"No hostage codes."**

- Static QR codes: Free forever, no account required
- Dynamic QR codes: You own them. Low subscription with explicit "never expires" guarantee
- Transparent pricing upfront, not hidden behind trial expiration

Alternative angles:
- "QR codes that don't break"
- "The anti-scam QR generator"
- "Own your QR codes"

## Platform

Web application only. No mobile app, no CLI.

## Core User Experience

### Static QR Code (Free, No Account)

1. User lands on homepage
2. Pastes a URL
3. Optionally adjusts: size, error correction level
4. Clicks "Generate"
5. QR code appears immediately (client-side generation)
6. Downloads as PNG or SVG
7. Done — no signup, no email capture required

### Dynamic QR Code (Paid, Account Required)

1. User signs up (email/password or Google OAuth)
2. Selects subscription plan, pays via Stripe
3. Creates new dynamic QR code:
   - Enters destination URL
   - Gets assigned short URL (e.g., `go.simpleqr.com/abc123`)
   - Downloads QR code pointing to short URL
4. Prints QR code on physical materials
5. Later, can:
   - Change destination URL without reprinting
   - View scan analytics (count, timestamps, countries)
   - Organize codes with folders/tags
   - Export scan data as CSV
6. Code never expires — works as long as the service exists

## MVP Features

### Static QR Codes (Free Tier)

- Generate QR code from any URL
- Download as PNG, SVG
- Customization: size, error correction level
- No account required
- Entirely client-side (no server costs)

### Dynamic QR Codes (Paid Tier)

- Create short URL redirect (e.g., `go.simpleqr.com/abc123`)
- Change destination URL anytime
- Basic scan analytics:
  - Scan count
  - Timestamp
  - Country (via IP geolocation)
- Folder/tagging for organization
- Export scan data as CSV

### Account & Billing

- Email/password authentication
- Google OAuth
- Stripe subscriptions

### Abuse Prevention

- Rate limiting per code
- Bot filtering for analytics accuracy
- Link safety checks (Google Safe Browsing API)
- Takedown workflow for malicious codes
- Terms of service covering abuse

## Data Persistence

| Data | Storage Needs |
|------|---------------|
| User accounts | Email, hashed password, OAuth tokens, subscription status |
| Dynamic QR codes | Short code, destination URL, owner, created/updated timestamps, folder/tags |
| Scan events | Code ID, timestamp, country, IP hash (for deduplication) |
| Subscriptions | Stripe customer ID, plan, status, billing cycle |

## Pricing

| Tier | Price | Includes |
|------|-------|----------|
| Free | $0 | Unlimited static QR codes, no account needed |
| Pro | $5/mo or $36/yr | 10 dynamic QR codes, analytics, short URLs |
| Business | $15/mo or $120/yr | Unlimited dynamic codes, priority support |

## Non-MVP (Post-Launch)

Explicitly out of scope for MVP:

- Bulk QR generation
- API access
- White-label/team features
- QR code design templates (fancy colors, gradients, custom shapes)
- vCard/WiFi/SMS QR types (URL-only for MVP)
- Mobile app
- Custom short URL domains (e.g., user's own domain)
- Pay-per-code pricing option
- Advanced analytics (device type, referrer, UTM parameter parsing)

These are upsell opportunities, not MVP requirements.

## Technical Considerations

These inform but do not constrain the technical specification:

- **Redirect reliability is critical.** If redirects go down, customers' printed materials break. Edge deployment recommended.
- **Redirect latency matters.** Users scanning expect instant load. Edge functions keep latency low globally.
- **Static QR is trivial.** Entire free tier can be client-side JavaScript. No server costs.
- **Dynamic QR scales linearly.** Each code is a database row + redirect. Minimal compute.

## Success Metrics

- Conversion rate: free static → paid dynamic
- Churn rate on paid plans
- Organic mentions in target communities (Reddit, Facebook groups)
- NPS / Trust signals (contrast with competitors' 1.7/5 ratings)

## Open Questions

None — proceed to technical specification.
