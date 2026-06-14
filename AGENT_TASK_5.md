# Max Virtual EA — Autonomous Build Task 5
# Cursor Agent mode. Work independently. Do not stop for confirmation.
# This is the P7 SaaS Launch task.

## CONTEXT
Project: Max Virtual EA — converting from personal tool to multi-tenant SaaS
Stack: Next.js 14, Tailwind, Neon DB, Vercel, Anthropic API, Stripe, Resend
Completed: P1 through P6
Now building: P7 — Multi-user auth, Stripe billing, onboarding, public landing page

## WORKING RULES
- Run `npm run build` after every task — fix before moving on
- Log everything in PROGRESS.md (append only)
- Never break existing /ea features — they stay working throughout
- If stuck >15 min — skip, mark ⚠️, move on
- At the end — write final report in PROGRESS.md

---

## TASK 1 — Multi-user Auth (45 min)

Current auth is single-user password. Replace with proper user accounts.

### 1a. Users table
Create: `scripts/init-saas-tables.ts`

```sql
CREATE TABLE IF NOT EXISTS ea_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  password_hash TEXT NOT NULL,
  plan TEXT DEFAULT 'free',
  -- free | starter | pro
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'inactive',
  -- inactive | active | cancelled | past_due
  trial_ends_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '14 days',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ea_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES ea_users(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ea_sessions_token_idx ON ea_sessions(token);
CREATE INDEX IF NOT EXISTS ea_users_email_idx ON ea_users(email);
```

Run: `npx ts-node scripts/init-saas-tables.ts`

### 1b. Auth service
Create: `lib/auth-service.ts`

```typescript
import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function createUser(email: string, password: string, name: string) {
  const hash = await bcrypt.hash(password, 10)
  const result = await sql`
    INSERT INTO ea_users (email, password_hash, name)
    VALUES (${email}, ${hash}, ${name})
    RETURNING id, email, name, plan, trial_ends_at
  `
  return result[0]
}

export async function verifyUser(email: string, password: string) {
  const users = await sql`
    SELECT * FROM ea_users WHERE email = ${email}
  `
  if (!users.length) return null
  const user = users[0]
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) return null
  return user
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID() + '-' + crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  await sql`
    INSERT INTO ea_sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `
  return token
}

export async function getSessionUser(token: string) {
  const result = await sql`
    SELECT u.* FROM ea_users u
    JOIN ea_sessions s ON s.user_id = u.id
    WHERE s.token = ${token}
    AND s.expires_at > NOW()
  `
  return result[0] || null
}

export async function deleteSession(token: string) {
  await sql`DELETE FROM ea_sessions WHERE token = ${token}`
}

export function isOnTrial(user: any): boolean {
  return new Date(user.trial_ends_at) > new Date()
}

export function hasAccess(user: any): boolean {
  return user.subscription_status === 'active' || isOnTrial(user)
}
```

Install: `npm install bcryptjs`
Install types: `npm install -D @types/bcryptjs`

### 1c. Auth API routes
Create: `app/api/auth/signup/route.ts`
- POST { email, password, name }
- Validates: email format, password min 8 chars, name required
- Checks: email not already registered
- Creates user + session
- Sets ea_token cookie (httpOnly, secure, 30 days)
- Returns: { user: { id, email, name, plan }, redirectTo: '/ea/onboarding' }

Create: `app/api/auth/login/route.ts`
- POST { email, password }
- Verifies credentials
- Creates session, sets cookie
- Returns: { user, redirectTo: '/ea/chat' }

Create: `app/api/auth/logout/route.ts`
- POST — deletes session, clears cookie
- Returns: { loggedOut: true, redirectTo: '/login' }

Create: `app/api/auth/me/route.ts`
- GET — returns current user from session token
- Returns: { user } or 401

### 1d. Update middleware
File: `middleware.ts`
Update to use new session-based auth for /ea/* routes:
- Read ea_token cookie
- Verify via getSessionUser()
- Redirect to /login if invalid
- Keep existing password auth as fallback for now (don't break it)

---

## TASK 2 — Stripe Billing (45 min)

### 2a. Install Stripe
```bash
npm install stripe @stripe/stripe-js
```

### 2b. Stripe service
Create: `lib/stripe-service.ts`

```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20'
})

export const PLANS = {
  starter: {
    name: 'Starter',
    price: '$29/month',
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    features: [
      'Max AI assistant',
      'Google Calendar sync',
      'Voice input + output',
      '100 messages/day',
      'Meeting summaries'
    ]
  },
  pro: {
    name: 'Pro',
    price: '$79/month',
    priceId: process.env.STRIPE_PRO_PRICE_ID!,
    features: [
      'Everything in Starter',
      'Auto follow-up emails',
      'AI memory',
      'Unlimited messages',
      'Priority support'
    ]
  }
}

export async function createCheckoutSession(options: {
  userId: string
  email: string
  plan: 'starter' | 'pro'
  successUrl: string
  cancelUrl: string
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: options.email,
    line_items: [{ price: PLANS[options.plan].priceId, quantity: 1 }],
    success_url: options.successUrl,
    cancel_url: options.cancelUrl,
    metadata: { userId: options.userId, plan: options.plan }
  })
  return session
}

export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  })
}

export { stripe }
```

### 2c. Stripe webhook
Create: `app/api/webhooks/stripe/route.ts`
Handle these events:
- `checkout.session.completed` → update user plan + stripe_customer_id + subscription_id + status active
- `customer.subscription.updated` → update subscription_status
- `customer.subscription.deleted` → set status cancelled, plan free
- `invoice.payment_failed` → set status past_due

Use `stripe.webhooks.constructEvent()` to verify signature.
STRIPE_WEBHOOK_SECRET needed in env.

### 2d. Billing API
Create: `app/api/billing/checkout/route.ts`
- POST { plan: 'starter' | 'pro' }
- Creates Stripe checkout session
- Returns { checkoutUrl }

Create: `app/api/billing/portal/route.ts`
- POST — creates customer portal session
- Returns { portalUrl }

Create: `app/api/billing/status/route.ts`
- GET — returns current plan, status, trial info
- Returns { plan, status, trialEndsAt, isOnTrial }

---

## TASK 3 — Onboarding Flow (30 min)

### 3a. Onboarding page
Create: `app/ea/onboarding/page.tsx`

Multi-step onboarding (3 steps):

**Step 1 — Welcome**
- "Welcome to Max, your AI Executive Assistant"
- Show what Max can do (4 features with icons)
- "Let's set up your assistant" CTA

**Step 2 — Connect Calendar**
- "Connect Google Calendar so Max can manage your schedule"
- "Connect Google Calendar" button → existing OAuth flow
- Skip option (can do later)

**Step 3 — Meet Max**
- Show Max chat interface with a pre-loaded first message
- Max says: "Hi! I'm Max. Ask me anything — try 'What's on my calendar today?'"
- "Start using Max" button → redirects to /ea/chat

### 3b. Onboarding completion tracking
Add `onboarding_completed` boolean to ea_users table
Set to true when user reaches Step 3 or clicks "Start using Max"
Middleware check: if user logged in but onboarding not complete → redirect to /ea/onboarding

---

## TASK 4 — Public Landing Page (30 min)

Create: `app/(marketing)/page.tsx` or update root `app/page.tsx`

Landing page sections:

**Hero**
- Headline: "Your AI Executive Assistant"
- Subheadline: "Max handles scheduling, follow-ups, and meeting notes — so you can focus on the work that matters."
- CTA: "Start free trial" → /signup
- Secondary: "See how it works" → scrolls to demo

**What Max does (3 columns)**
- Calendar management
- Meeting summaries + follow-ups
- Voice-first interface

**Replacement table**
- "Instead of..." vs "Max does it automatically"
- Manual follow-up emails → Auto-generated drafts
- Checking calendar conflicts → Instant conflict detection
- Taking meeting notes → AI transcription + summary
- Scheduling back and forth → Propose slots, confirm in one click

**Pricing section**
- Free trial (14 days, no card needed)
- Starter $29/month
- Pro $79/month
- Feature comparison table

**CTA section**
- "Ready to meet Max?"
- Email input + "Start free trial" button

### 4b. Auth pages
Create: `app/(auth)/signup/page.tsx`
- Name, email, password fields
- "Create account — free 14-day trial"
- No credit card required messaging
- Links to login

Create: `app/(auth)/login/page.tsx`
- Email + password
- "Sign in to Max"
- Links to signup

---

## TASK 5 — Plan Enforcement (20 min)

### 5a. Usage limits
Create: `lib/plan-limits.ts`

```typescript
export const LIMITS = {
  free: {
    messagesPerDay: 20,
    meetingsPerMonth: 5,
    followupsPerMonth: 10,
    memoryItems: 50,
    voiceOutput: false
  },
  starter: {
    messagesPerDay: 100,
    meetingsPerMonth: 20,
    followupsPerMonth: 50,
    memoryItems: 500,
    voiceOutput: true
  },
  pro: {
    messagesPerDay: -1, // unlimited
    meetingsPerMonth: -1,
    followupsPerMonth: -1,
    memoryItems: -1,
    voiceOutput: true
  }
}

export function checkLimit(
  plan: keyof typeof LIMITS,
  feature: keyof typeof LIMITS.free,
  currentUsage: number
): { allowed: boolean, limit: number, usage: number } {
  const limit = LIMITS[plan][feature] as number
  if (limit === -1) return { allowed: true, limit: -1, usage: currentUsage }
  return {
    allowed: currentUsage < limit,
    limit,
    usage: currentUsage
  }
}
```

### 5b. Usage tracking
Create: `lib/usage-tracker.ts`
- trackMessage(userId) — increments daily message count
- getDailyUsage(userId) — returns today's count
- Uses Neon DB with date-keyed records

### 5c. Enforce in chat route
File: `app/api/ea/chat/route.ts`
Before processing:
- Get user from session
- Check daily message limit for their plan
- If exceeded → return 429 with { error: 'Daily limit reached', upgrade: true }

---

## TASK 6 — Settings Page (20 min)

Create/update: `app/ea/settings/page.tsx`

Sections:
**Account**
- Name, email (read-only)
- Change password option

**Plan & Billing**
- Current plan badge
- Usage this month (messages, meetings)
- Trial countdown if on trial
- "Upgrade plan" → Stripe checkout
- "Manage billing" → Stripe portal (if subscribed)

**Integrations**
- Google Calendar status (connected/disconnected)
- Reconnect button
- ElevenLabs voice status

**Memory**
- Memory count
- Clear all memories button

**Danger zone**
- Delete account (soft delete — mark inactive)

---

## TASK 7 — Full QA Pass (20 min)

### New checklist — P7:
- [ ] ea_users table exists with correct schema
- [ ] ea_sessions table exists
- [ ] lib/auth-service.ts exports createUser, verifyUser, createSession, getSessionUser
- [ ] POST /api/auth/signup creates user + session + sets cookie
- [ ] POST /api/auth/login verifies + creates session
- [ ] POST /api/auth/logout deletes session + clears cookie
- [ ] GET /api/auth/me returns current user
- [ ] Middleware updated for session-based auth
- [ ] stripe package installed
- [ ] lib/stripe-service.ts exports createCheckoutSession
- [ ] POST /api/billing/checkout returns checkoutUrl
- [ ] POST /api/billing/portal returns portalUrl
- [ ] Stripe webhook handler exists
- [ ] app/ea/onboarding/page.tsx loads without error
- [ ] 3-step onboarding flow complete
- [ ] Landing page (app/page.tsx) loads without error
- [ ] /signup page loads without error
- [ ] /login page loads without error
- [ ] lib/plan-limits.ts exports LIMITS and checkLimit
- [ ] Chat route enforces daily message limit
- [ ] Settings page loads without error
- [ ] npm run build passes
- [ ] npm run lint passes

---

## FINAL REPORT (append to PROGRESS.md)

```
## Build Task 5 — P7 SaaS Launch — Final Report
Date: {date}

### ✅ Completed
### 🔧 Fixed
### ⚠️ Needs human review
- Stripe account setup + price IDs needed
- STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET in .env.local
- STRIPE_STARTER_PRICE_ID, STRIPE_PRO_PRICE_ID in .env.local
- Test full signup → onboarding → checkout flow in browser
- Verify Stripe webhook with stripe CLI: stripe listen --forward-to localhost:3000/api/webhooks/stripe
- Resend domain verification for max@designbyganesh.com

### ❌ Could not complete
### 📋 Max is now SaaS-ready. Ship it.
```

---

## ENV VARS NEEDED
- ANTHROPIC_API_KEY ✅
- DATABASE_URL ✅
- GOOGLE_CLIENT_ID ✅
- GOOGLE_CLIENT_SECRET ✅
- ELEVENLABS_API_KEY ✅
- RESEND_API_KEY — resend.com
- STRIPE_SECRET_KEY — stripe.com dashboard
- STRIPE_WEBHOOK_SECRET — stripe CLI ya dashboard
- STRIPE_STARTER_PRICE_ID — Stripe product create karo
- STRIPE_PRO_PRICE_ID — Stripe product create karo
- OPENAI_API_KEY — optional