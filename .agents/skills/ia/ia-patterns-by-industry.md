# IA Patterns by Industry

Industry-specific information architecture patterns, typical structures, and common mistakes.

---

## Fintech / Banking Apps

### Typical Structure
```
Home (Overview/Balance)
├── Accounts
│   ├── Checking
│   ├── Savings
│   └── Credit Cards
├── Pay & Transfer
│   ├── Send Money
│   ├── Pay Bills
│   └── Scheduled Payments
├── Cards
│   ├── Manage Cards
│   └── Card Controls
└── More
    ├── Settings
    ├── Help
    └── Profile
```

### Nav Pattern
- **Mobile:** Bottom tabs (4–5): Home, Pay, Cards, Activity, More.
- **Desktop/Web:** Sidebar or top nav with account switcher.

### Depth / Breadth
- **Depth:** Shallow (2–3 levels max). Users want speed, not exploration.
- **Breadth:** 4–5 top-level items. Resist feature creep in primary nav.

### Common Mistakes
- Burying transfer/pay behind too many taps (top task must be ≤2 taps).
- Feature-heavy nav that overwhelms non-power-users.
- Inconsistent naming ("Wallet" vs "Accounts" vs "Balance").
- Missing quick-action shortcuts on home screen.
- Forgetting joint/account-switcher navigation for multi-account users.

---

## E-commerce / D2C

### Typical Structure
```
Home
├── Shop (Categories)
│   ├── Category A
│   │   ├── Subcategory
│   │   └── Products
│   └── Category B
├── New Arrivals / Sale
├── Cart
├── Account
│   ├── Orders
│   ├── Wishlist
│   ├── Addresses
│   └── Settings
└── Help
```

### Nav Pattern
- **Desktop:** Mega menu for categories + utility nav (Account, Cart, Search).
- **Mobile:** Bottom tabs (Home, Shop, Cart, Account) + search bar in header.

### Depth / Breadth
- **Depth:** 3–4 levels for catalog (Category > Subcategory > Product).
- **Breadth:** 5–7 top-level categories; use "Shop All" for overflow.

### Common Mistakes
- Category taxonomy based on internal inventory, not user mental models.
- Missing search prominence (Baymard: search users convert higher).
- Cart not accessible from every page (persistent cart icon required).
- No filters on category pages.
- Checkout IA separate from main nav (intentional but needs clear progress).

---

## SaaS / B2B Software

### Typical Structure
```
Dashboard (Hub)
├── [Core Feature A]
│   ├── List/Overview
│   ├── Detail
│   └── Create/Edit
├── [Core Feature B]
├── [Core Feature C]
├── Analytics / Reports
├── Settings
│   ├── Account
│   ├── Team / Users
│   ├── Billing
│   └── Integrations
└── Help / Docs
```

### Nav Pattern
- **Desktop:** Collapsible sidebar (primary) + top bar (search, notifications, profile).
- **Mobile:** Hamburger or bottom tabs for top 3–4 features + "More."

### Depth / Breadth
- **Depth:** 3–4 levels acceptable (power users tolerate depth).
- **Breadth:** 5–8 sidebar items; group related features under expandable sections.

### Common Mistakes
- Feature-based nav instead of task-based ("CRM" vs "Manage Contacts").
- Settings graveyard (everything unclear goes to Settings).
- No role-based nav filtering (showing admin features to all users).
- Sidebar with 15+ ungrouped items.
- Missing dashboard/hub as landing page after login.

---

## Healthcare / Wellness

### Typical Structure
```
Home
├── Appointments
│   ├── Book
│   ├── Upcoming
│   └── History
├── My Health
│   ├── Records
│   ├── Medications
│   └── Results
├── Messages
├── Resources / Education
└── Profile / Settings
```

### Nav Pattern
- **Mobile:** Bottom tabs (4): Home, Appointments, Messages, Profile.
- **Desktop:** Simple top nav or sidebar; large touch targets.

### Depth / Breadth
- **Depth:** Very shallow (2 levels). Clarity over comprehensiveness.
- **Breadth:** 4–5 items max. Plain-language labels required.

### Common Mistakes
- Medical jargon in navigation labels.
- Critical actions (book appointment, view results) buried deep.
- No emergency/urgent care path visible.
- Accessibility failures (small text, icon-only nav).
- Privacy-sensitive content not clearly separated in nav.

---

## EdTech / Learning

### Typical Structure
```
Global Nav
├── My Learning (Dashboard)
│   ├── In Progress
│   ├── Completed
│   └── Saved
├── Discover / Catalog
│   ├── Categories
│   └── Search
├── Community (optional)
└── Profile

Within a Course:
├── Course Home
├── Modules (sidebar)
│   ├── Lesson 1
│   ├── Lesson 2
│   └── Quiz
├── Discussion
└── Resources
```

### Nav Pattern
- **Global:** Top nav or bottom tabs.
- **In-course:** Left sidebar module list + progress bar.
- **Contextual nav replaces global nav** inside course player.

### Depth / Breadth
- **Global depth:** Shallow (2 levels).
- **Course depth:** Deep (3–4 levels: Course > Module > Lesson > Activity).

### Common Mistakes
- Same nav inside and outside courses (confusing context switch).
- No progress indicator in navigation.
- Course catalog IA doesn't match how learners search (topic vs skill vs level).
- Breadcrumbs missing in deep lesson hierarchies.
- "My Learning" and "Dashboard" as separate confusing entries.

---

## Social / Community

### Typical Structure
```
Home Feed
├── Discover / Explore
├── Create (+)
├── Notifications
├── Messages
└── Profile
    ├── Posts
    ├── Followers / Following
    ├── Settings
    └── Saved
```

### Nav Pattern
- **Mobile:** Bottom tabs (5): Home, Discover, Create, Notifications, Profile.
- **Desktop:** Left sidebar (Twitter/X, Reddit pattern) or top nav.

### Depth / Breadth
- **Global depth:** Flat (1–2 levels).
- **Profile/groups depth:** Moderate (2–3 levels).

### Common Mistakes
- Create action buried (should be central/prominent).
- Notifications and Messages split confusingly.
- Group/community nav inconsistent with global nav.
- Settings nested too deep in Profile.
- Feed algorithm changes making IA feel inconsistent.

---

## Marketplace (Two-Sided)

### Typical Structure
```
Buyer View:
├── Browse / Categories
├── Search
├── Orders
├── Messages
├── Saved / Wishlist
└── Account

Seller View:
├── Dashboard
├── Listings
├── Orders (Sales)
├── Analytics
├── Messages
└── Settings
```

### Nav Pattern
- **Buyer:** Search-first + category browse; bottom tabs on mobile.
- **Seller:** Sidebar dashboard (desktop); separate seller app or mode switch.
- **Mode switch:** Clear toggle between buyer/seller views.

### Depth / Breadth
- **Buyer catalog depth:** 3–4 levels + faceted search.
- **Seller dashboard depth:** 2–3 levels.
- **Breadth:** Search + 4–5 category tabs.

### Common Mistakes
- No clear buyer/seller mode separation.
- Category taxonomy doesn't match how buyers search.
- Seller tools mixed into buyer navigation.
- Location/geo not integrated into browse IA.
- Messaging IA different between buyer and seller views.

---

## Enterprise / Admin Dashboards

### Typical Structure
```
Dashboard
├── [Module A]
│   ├── Overview
│   ├── Manage
│   └── Reports
├── [Module B]
├── [Module C]
├── Users / Roles
├── Settings
│   ├── Organization
│   ├── Billing
│   ├── Integrations
│   └── API
└── Help / Docs
```

### Nav Pattern
- **Desktop:** Collapsible sidebar (always); breadcrumbs for deep pages.
- **Mobile:** Simplified; often desktop-only or limited mobile admin.
- **Role-based:** Nav items appear/hide based on permissions.

### Depth / Breadth
- **Depth:** Deep (4+ levels acceptable for power users).
- **Breadth:** 6–10 sidebar groups; use section headers and dividers.

### Common Mistakes
- No role-based nav filtering (security + clutter issue).
- Settings as catch-all for unrelated admin functions.
- Missing breadcrumbs in 4+ level hierarchies.
- Sidebar not collapsible (wastes screen space).
- No keyboard navigation or command palette for power users.
- Mobile admin IA as afterthought.

---

## Industry Selection Guide

| If the product is… | Start with… | Nav pattern | Max depth |
|-------------------|-------------|-------------|-----------|
| Consumer mobile app | Social/Community pattern | Bottom tabs | 2 levels |
| B2B SaaS tool | SaaS pattern | Sidebar | 3–4 levels |
| Online store | E-commerce pattern | Mega menu + search | 3–4 levels |
| Financial app | Fintech pattern | Bottom tabs | 2–3 levels |
| Learning platform | EdTech pattern | Global tabs + course sidebar | 2 global, 4 in-course |
| Two-sided platform | Marketplace pattern | Search + mode switch | 3–4 levels |
| Internal admin tool | Enterprise pattern | Collapsible sidebar | 4+ levels |
| Health/wellness app | Healthcare pattern | Bottom tabs (4) | 2 levels |

---

## Sources

- https://baymard.com/blog/ecommerce-navigation
- https://www.nngroup.com/articles/mobile-navigation-patterns/
- https://developer.apple.com/design/human-interface-guidelines/tab-bars
- https://m3.material.io/components/navigation-bar
- https://www.nngroup.com/articles/flat-vs-deep-hierarchy/
