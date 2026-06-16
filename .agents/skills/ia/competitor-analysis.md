# Competitor IA Analysis Guide

How to analyze competitor information architecture from screenshots and derive actionable insights.

---

## How to Analyze Competitor IA from Screenshots

### Step-by-Step Process
1. **Capture full navigation states:** Default view, expanded menus, mobile and desktop if available.
2. **Document primary nav labels:** Exact text of every top-level item.
3. **Count hierarchy depth:** How many clicks to reach key content?
4. **Identify navigation pattern:** Tabs, sidebar, hamburger, mega menu, etc.
5. **Map content hierarchy:** What's primary vs secondary on key screens?
6. **Note labeling conventions:** Formal vs casual, feature vs benefit language.
7. **Identify user flows:** How do they guide users to conversion/key actions?
8. **Spot patterns and anti-patterns:** What works, what doesn't.

### Screenshot Analysis Checklist
- [ ] Primary navigation labels (exact text)
- [ ] Number of top-level nav items
- [ ] Navigation pattern type
- [ ] Secondary/utility nav items
- [ ] Mobile vs desktop differences
- [ ] Search placement and prominence
- [ ] Content hierarchy on homepage/key screens
- [ ] CTA placement and labeling
- [ ] Breadcrumb usage
- [ ] Footer navigation structure
- [ ] Onboarding/first-run experience
- [ ] Empty states and error handling

---

## What to Look For

### Primary Nav Labels
- What language do they use? (User-centric vs feature-centric)
- How many items? (Breadth indicator)
- Are labels clear or clever/branded?
- Do labels match your target users' vocabulary?

### Depth and Breadth
| Metric | How to Measure | Good Range |
|--------|---------------|------------|
| Top-level items | Count primary nav links | 3–7 |
| Max depth | Clicks from home to deepest page | 2–4 levels |
| Breadth at level 2 | Sub-items per category | 3–9 |
| Utility nav items | Settings, help, account, etc. | 2–5 |

### Navigation Pattern
- Bottom tabs → mobile-first consumer app
- Sidebar → dashboard/enterprise tool
- Top horizontal → marketing site or simple SaaS
- Hamburger-only → content-first or feature-hidden approach
- Mega menu → complex catalog or multi-product

### Content Hierarchy Signals
- What gets hero/above-fold placement?
- How many competing CTAs on key screens?
- Visual weight distribution (what draws the eye first?)
- Use of cards, lists, or tables for content display

---

## Common Patterns by Industry

### Fintech / Banking
- **Nav pattern:** Bottom tabs (Overview, Pay, Cards, More) on mobile; sidebar on web.
- **Depth:** Shallow (2–3 levels) — users want quick access to balances/transactions.
- **Labels:** Action-oriented ("Pay," "Transfer") not feature names.
- **Security nav:** Biometric login, session timeout, hidden account numbers.

### E-commerce / D2C
- **Nav pattern:** Mega menu (desktop); category tabs + search (mobile).
- **Depth:** Moderate (3–4 levels for catalog); flat for account/checkout.
- **Labels:** Category names + promotional sections ("New Arrivals," "Sale").
- **Search:** Prominent; filters mirror category taxonomy.

### SaaS / B2B
- **Nav pattern:** Sidebar (expanded) on desktop; bottom tabs or hamburger on mobile.
- **Depth:** Moderate to deep (3–4 levels); settings often deeply nested.
- **Labels:** Feature names (industry convention) but improving toward task-based.
- **Utility:** Help docs, API, admin console separated from product nav.

### Healthcare / Wellness
- **Nav pattern:** Simple bottom tabs or top nav; minimal options.
- **Depth:** Very shallow (2 levels) — accessibility and clarity paramount.
- **Labels:** Plain language (HIPAA encourages understandable communication).
- **Trust signals:** Privacy, provider credentials in nav/footer area.

### EdTech / Learning
- **Nav pattern:** Course sidebar + global top nav; progress indicators.
- **Depth:** Deep within courses (modules > lessons > activities); shallow globally.
- **Labels:** Course names, "My Learning," "Discover," "Progress."
- **Contextual nav:** Changes dramatically inside vs outside a course.

### Social / Community
- **Nav pattern:** Bottom tabs (Home, Search, Create, Notifications, Profile).
- **Depth:** Flat globally; deep within profiles/groups.
- **Labels:** Universal icons + short labels.
- **Feed-first:** Primary nav leads to content consumption, not features.

### Marketplace
- **Nav pattern:** Search-first + category browse; filters prominent.
- **Depth:** Category tree (3–4 levels) + faceted search.
- **Labels:** Dual audience (buyers vs sellers) often separated in nav.
- **Geo/local:** Location often in nav or search scope.

### Enterprise / Admin Dashboards
- **Nav pattern:** Collapsible sidebar + breadcrumbs.
- **Depth:** Deep (4+ levels acceptable for power users).
- **Labels:** Department/feature names; role-based visibility.
- **Density:** High information density tolerated; keyboard shortcuts expected.

---

## How to Identify IA Anti-Patterns

### Red Flags in Competitor Screenshots
1. **Hamburger on desktop** with ample screen space.
2. **>7 top-level nav items** without grouping.
3. **Inconsistent labeling** (same concept, different names on different pages).
4. **Dead-end pages** with no navigation forward or back.
5. **Orphan pages** not reachable from any nav path.
6. **Mixed metaphors** (tabs inside a sidebar inside a hamburger).
7. **Hidden primary features** behind multiple taps.
8. **No search** in products with 30+ screens.
9. **Generic labels** ("Resources," "Tools," "More" without context).
10. **Navigation that changes** between pages without clear reason.

### Scoring Competitor IA (Quick Rubric)
| Dimension | 1 (Poor) | 5 (Excellent) |
|-----------|----------|---------------|
| Label clarity | Jargon, clever names | User vocabulary, specific |
| Findability | >4 clicks to key content | ≤2 clicks to key content |
| Consistency | Different patterns per page | Unified nav system |
| Discoverability | Hidden/hamburger primary nav | Visible primary destinations |
| Scalability | Already cluttered | Room to grow |
| Accessibility | Icon-only, no landmarks | Labels, landmarks, skip links |

---

## Competitive Differentiation Through IA

### Differentiation Strategies
1. **Simpler IA:** If competitors are complex, win with clarity (fewer nav items, flatter hierarchy).
2. **Task-based nav:** If competitors use feature names, organize by user goals.
3. **Better search:** If competitors bury content, make search exceptional.
4. **Role-based views:** If competitors show everything to everyone, personalize nav.
5. **Unique entry points:** Dashboard/hub approach when competitors use traditional tree.
6. **Mobile-first IA:** When competitors are desktop-centric, optimize for mobile nav.

### What NOT to Copy
- Don't copy structure blindly — your users and content differ.
- Don't adopt complexity because "the market leader does it."
- Don't copy labels — run your own card sorting.
- Don't copy anti-patterns even if they're common in the industry.

---

## Questions to Ask When Comparing Competitors

### Structure Questions
1. How many top-level nav items does each competitor have?
2. What's the deepest path to their core feature/action?
3. Do they separate buyer/seller, admin/user, or other role-based views?
4. How do they handle search vs browse balance?

### Labeling Questions
5. Do they use feature names or user-task language?
6. Are labels consistent across mobile and desktop?
7. How do they name similar concepts differently?

### Pattern Questions
8. What navigation pattern do they use on mobile vs desktop?
9. Do they use progressive disclosure or show everything?
10. How do they handle settings, help, and account?

### Opportunity Questions
11. Where do users likely get lost in their IA? (Check app store reviews mentioning "can't find")
12. What do they over-expose that we could simplify?
13. What do they hide that our users need front-and-center?
14. Can we reduce clicks to our key differentiator?

### Validation Questions
15. Does their IA reflect user mental models (from reviews, Reddit, support forums)?
16. Have they changed IA recently? (Wayback Machine, app update notes)
17. What IA choices correlate with their business model?

---

## Documenting Competitor Analysis

### Output Template
```
## Competitor: [Name]
**Screenshot date:** [Date]
**Platform:** Mobile / Desktop / Both

### Navigation Structure
- Pattern: [Bottom tabs / Sidebar / etc.]
- Top-level items (N): [List]
- Max depth: [N levels]

### What They Do Well
- [Insight 1]
- [Insight 2]

### What Could Be Improved
- [Insight 1]
- [Insight 2]

### Differentiation Opportunity
- [How our IA should differ and why]
```

---

## Sources

- https://www.nngroup.com/articles/hamburger-menus/
- https://www.nngroup.com/articles/menu-design/
- https://baymard.com/blog/ecommerce-navigation
- https://www.nngroup.com/articles/competitive-usability-evaluations/
