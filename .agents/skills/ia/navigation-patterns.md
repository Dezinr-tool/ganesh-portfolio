# Navigation Patterns Reference

Platform-specific navigation patterns with research-backed guidance on when and how to use each.

---

## Bottom Tab Bar (Mobile)

### When to Use
- Mobile apps with **3–5 equally important top-level sections**.
- Consumer apps where daily-use features need one-tap access.
- Primary platform is mobile (iOS/Android).

### Platform Guidelines
- **iOS HIG:** Tab bar at bottom; 3–5 tabs; use SF Symbols + labels.
- **Material Design 3:** Navigation bar (bottom) for primary destinations; badge support for notifications.
- **Maximum items:** 5 tabs (iOS hard limit); 3–4 optimal for thumb reach.

### Research
- Bottom tabs show **significantly higher discoverability** than hamburger menus (NNG: hidden nav reduces discoverability ~20%).
- One-tap section switching vs. two+ taps for drawer menus.
- Thumb zone research (Hoober): bottom screen area is easiest reach zone on phones.
- Tabs persist across screens, maintaining orientation.

### Best Practices
- Always show icon + label (see Icon + Label section).
- Use badges sparingly for actionable notifications, not decoration.
- Active tab must be visually distinct (color, weight, fill).
- Don't use tabs for actions (use FAB or toolbar buttons instead).
- "More" tab acceptable for 5th slot when you have 6+ sections.

### Anti-Patterns
- More than 5 tabs (platform breaks).
- Tabs that change based on context (breaks mental model).
- Icon-only tabs without labels (recognition suffers — see research below).

---

## Top Navigation Bar (Desktop)

### When to Use
- Marketing websites and landing pages.
- SaaS products with ≤7 top-level sections.
- Desktop-primary experiences.

### Patterns
| Pattern | Best For | Max Items |
|---------|----------|-----------|
| Horizontal links | Marketing, simple SaaS | 5–7 |
| Horizontal + dropdown | Medium complexity | 5–7 top, 5–9 per dropdown |
| Mega menu | Complex catalogs, enterprise | 5–7 top columns |
| Sticky header | Long pages, documentation | Same as above |

### Research (NNG Menu Design Checklist)
- **Never hide primary nav behind hamburger on desktop** — ample screen space means visible nav is always better.
- Sticky navigation improves access on long pages without hurting orientation.
- Mega menus should NOT cover entire screen when open.
- Highlight current section in navigation.

### Best Practices
- Logo left, primary nav center or left-of-center, utility nav right.
- CTA button visually distinct from nav links.
- Dropdowns open on hover (desktop) with click fallback.
- Active state clearly indicates current section.

---

## Hamburger Menu

### The Controversy
Hamburger menus (☰) hide navigation behind an icon. They remain ubiquitous but are widely criticized.

### Research (NNG Quantitative Study, 179 participants)
- Hidden navigation reduces content discoverability by **>20%** on both mobile and desktop.
- Task completion time increases; perceived difficulty increases.
- Desktop penalty is **larger** than mobile penalty.
- Users resort to search more when nav is hidden (signal of IA failure).

### When Hamburger Works
- **Secondary/utility items:** Settings, account, help, legal — not primary destinations.
- **5+ top-level items on mobile** where visible tabs aren't feasible.
- **Infrequent access sections** that would clutter primary nav.
- **Content-first layouts** where screen real estate is critical (reading apps, media viewers).

### When Hamburger Fails
- Primary navigation on desktop (always show links).
- Products where discoverability drives engagement (feature-rich apps).
- New user onboarding (hidden features = unknown features).
- When combined with no other navigation affordance.

### Best Practices If You Must Use It
- Pair with bottom tabs for primary sections + hamburger for secondary.
- Place hamburger top-left (convention) but consider bottom sheet on mobile for reach.
- Label it "Menu" not just the icon (improves recognition ~12% — various A/B tests).
- Show partial nav hints (e.g., visible search bar, bottom tabs for top 3 sections).

---

## Sidebar Navigation

### When to Use
- Dashboard and admin interfaces.
- Products with 8+ sections.
- Desktop-primary SaaS and enterprise tools.
- Documentation sites.

### Collapsed vs Expanded

| State | Best For | Width |
|-------|----------|-------|
| Expanded | Desktop default; new users; complex labels | 240–280px |
| Collapsed (icon-only) | Power users; narrow viewports; secondary focus on content | 48–64px |
| Responsive auto-collapse | Tablet; split-view layouts | Breakpoint-driven |

### Research & Best Practices
- Expanded sidebar improves findability for infrequent users.
- Collapsed sidebar saves space but **requires tooltips** for icon-only recognition.
- Always allow user toggle between states (persist preference).
- Group related items with section headers.
- Pin most-used items at top; settings/account at bottom.
- Highlight active item with background fill + left border accent.

### Anti-Patterns
- Sidebar + top nav duplicating same links.
- Collapsed sidebar as default for complex products with many sections.
- Sidebar that scrolls independently without indicating more items below.

---

## Mega Navigation (Desktop)

### When to Use
- E-commerce with large catalogs.
- Enterprise products with many feature categories.
- Media sites with diverse content types.

### Structure
- 5–7 top-level categories.
- Each opens a panel with 3–5 columns.
- Column headers = sub-category labels.
- 5–7 links per column maximum.
- Featured content or promotional tile optional (1 per mega menu).

### Best Practices (NNG, Baymard)
- Panel should NOT cover entire viewport.
- Show underlying page content around panel edges.
- Use descriptive column headers (not marketing copy).
- Include "View all [Category]" link in each column.
- Close on click outside or Escape key.
- Ensure keyboard navigation through all links.

---

## Contextual Navigation

Navigation that changes based on user's current context, role, or task.

### Types
- **Section sub-nav:** Tabs within a product area (e.g., Settings > Account / Privacy / Notifications).
- **Role-based nav:** Admin sees different items than end user.
- **Task-based nav:** Wizard steps, checkout flow, onboarding sequence.
- **Related content links:** "Customers also viewed," "Next in series."

### Best Practices
- Global nav stays stable; only local/contextual nav changes.
- Clearly differentiate contextual nav visually (smaller, secondary styling).
- Don't hide global nav when showing contextual nav.
- Breadcrumbs complement contextual nav for deep hierarchies.

---

## Utility Navigation

Items that support the user/account, not core product content.

### Standard Utility Items
- Profile / Account
- Settings / Preferences
- Help / Support / Documentation
- Notifications
- Search
- Sign out

### Placement Conventions
| Platform | Location |
|----------|----------|
| Desktop web | Top-right corner |
| Mobile app | Profile tab, hamburger menu, or top-right avatar |
| Dashboard | Sidebar bottom or top-right |

### Best Practices
- Visually separate from primary content navigation (lighter weight, smaller text, icon-based).
- Avatar/profile icon is recognized universally for account access.
- Help should be reachable from every screen (persistent link or ? icon).
- Don't bury sign-out more than 2 taps deep.

---

## Mobile vs Desktop Navigation Decisions

### Decision Matrix

| Factor | Mobile | Desktop |
|--------|--------|---------|
| Primary pattern | Bottom tabs (3–5) | Top nav or sidebar |
| Secondary pattern | Hamburger / More tab | Dropdown or mega menu |
| Max visible items | 3–5 tabs | 5–7 links |
| Hidden nav penalty | High (~20%) | Very high (>20%) |
| Thumb reach | Critical | Less relevant |
| Search prominence | High (top bar) | High (header) |

### Responsive Strategy
1. **Same IA, different patterns:** Labels and structure stay consistent; presentation adapts.
2. **Mobile-first IA design:** Design nav for mobile constraints first, expand for desktop.
3. **Don't duplicate:** Avoid showing both bottom tabs AND full sidebar on tablet.
4. **Test both:** Tree test and usability test on both platforms.

---

## Navigation Labeling Best Practices

### Principles
1. **User language, not internal jargon:** Use words your users use (from card sorting).
2. **Specific over generic:** "Billing History" not "Account" (when space allows).
3. **Parallel structure:** All items at same level use same grammatical form (nouns OR verbs, not mixed).
4. **Front-load keywords:** First word carries most scanning weight (NNG F-pattern).
5. **Avoid clever names:** "The Hub" means nothing to new users.

### Label Length
- Mobile tabs: 1 word ideal, 2 max.
- Desktop nav: 1–3 words.
- Sidebar: 2–4 words acceptable.
- Truncate with tooltips only as last resort.

### Testing Labels
- Card sorting for generation.
- Tree testing for validation.
- A/B test ambiguous labels when data is inconclusive.

---

## Icon + Label vs Label Only

### Research Summary

| Pattern | Recognition | Speed | Space | Recommendation |
|---------|-------------|-------|-------|----------------|
| Icon + Label | Highest | Fastest | Most space | **Default choice** |
| Label only | High | Fast | Moderate | Desktop nav, sidebar |
| Icon only | Lowest | Slowest (unless universal) | Least | Avoid except universal icons |

### Key Findings
- **Icon + label always wins** for navigation tabs and primary nav (Material Design, iOS HIG both require labels for tab bars).
- Icon-only requires learned associations; new users struggle (UXMatters icon recognition studies).
- Universal icons work without labels: Home (🏠), Search (🔍), Settings (⚙️), Close (✕), Back (←).
- Non-universal icons (Reports, Analytics, Dashboard) **need labels**.
- Tooltips on hover help for icon-only desktop sidebar but don't work on mobile (no hover).

### When Icon Only Is Acceptable
- Collapsed sidebar with tooltips (desktop only).
- Toolbar actions with universal icons (edit, delete, share).
- Space-constrained repeated actions in tables/lists.
- After users have learned the interface (still provide toggle to show labels).

---

## Sources

- https://www.nngroup.com/articles/hamburger-menus/
- https://www.nngroup.com/articles/menu-design/
- https://developer.apple.com/design/human-interface-guidelines/tab-bars
- https://m3.material.io/components/navigation-bar
- https://www.nngroup.com/articles/icon-usability/
- https://www.nngroup.com/articles/mobile-navigation-patterns/
- https://baymard.com/blog/ecommerce-navigation
