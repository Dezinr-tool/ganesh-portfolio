# Web UX Reference

Comprehensive guide to web-specific user experience patterns, layout principles, and interaction design.

---

## Visual Scanning Patterns

### F-Pattern (Nielsen Norman Group)

Users scan text-heavy pages in an F-shaped pattern:
1. **Horizontal movement** across the top of the content area.
2. **Second horizontal movement** shorter, below the first.
3. **Vertical scan** down the left side of the content.

**Design implications:**
- Place most important information in the first two paragraphs and left side.
- Front-load headings and bullet points with key terms.
- Don't expect users to read every word on text-heavy pages.
- Use headings, bold text, and bullet points to support scanning.
- First two words of headings and links receive disproportionate attention.

**Best for:** Search results, blog posts, text-heavy pages, SERP-style layouts.

### Z-Pattern

Users scan pages with less dense text in a Z-shaped path:
1. Top-left → top-right (header/brand to primary action).
2. Diagonal down to bottom-left.
3. Bottom-left → bottom-right (secondary CTA).

**Design implications:**
- Logo top-left, CTA top-right.
- Hero visual or value proposition along the diagonal.
- Secondary CTA or conversion point bottom-right.
- Minimal text; visual hierarchy drives the path.

**Best for:** Landing pages, marketing pages, hero sections, simple layouts.

### Layer-Cake Pattern (NNG, 2021)

Users scan headings and subheadings, skipping body text between — like layers of a cake.

**Design implications:**
- Headings must be self-contained and informative alone.
- Users who only read headings should still understand the page.
- Use descriptive headings, not clever/vague ones.

---

## Above the Fold

### What "Above the Fold" Means Today
The visible viewport before scrolling. With diverse screen sizes, "the fold" varies (mobile ~600px, desktop ~800–1080px height).

### Above-the-Fold Best Practices
1. **Value proposition visible immediately:** User understands what this is within 5 seconds.
2. **Primary CTA accessible:** Don't hide the main action below the fold.
3. **Navigation visible:** Users must orient themselves without scrolling.
4. **Not everything above the fold:** Scrolling is natural; don't cram everything into the viewport.
5. **Visual hierarchy:** Most important element has the most visual weight.

### Myths Debunked (NNG Research)
- **Myth:** Users don't scroll. **Reality:** Users scroll if content promises value below.
- **Myth:** Everything important must be above the fold. **Reality:** Clear scroll affordance (partial content visible) encourages exploration.
- **Myth:** Below-fold content is ignored. **Reality:** Engagement depends on content quality, not position.

### Scroll Affordance Techniques
- Show partial content cut off at fold edge.
- Subtle scroll indicator or arrow (use sparingly).
- Sticky navigation for persistent access.
- "Back to top" button on long pages.

---

## Navigation Patterns

### Global Navigation
- **Horizontal top nav:** Standard for marketing sites and SaaS (5–7 items max).
- **Sidebar navigation:** Dashboard and app interfaces with many sections.
- **Mega menu:** Large catalogs with categorized dropdowns.
- **Breadcrumbs:** Hierarchical sites with deep structure; supplement, don't replace, nav.

### Navigation Rules
1. **5±2 items** in primary navigation (Miller's Law).
2. **Current location** always indicated (highlight, underline, `aria-current="page"`).
3. **Consistent placement** across all pages.
4. **Logo links to homepage** (universal convention).
5. **Search** accessible from every page for content-heavy sites.
6. **Mobile:** Collapse to hamburger only when necessary; bottom tabs for apps.

### Sticky vs Fixed Navigation
- **Sticky header:** Appears on scroll up; hides on scroll down (saves viewport).
- **Fixed header:** Always visible; reduces content viewport but ensures persistent access.
- **Recommendation:** Sticky for content sites; fixed for apps/dashboards.

### Footer Navigation
- Secondary links (legal, support, sitemap).
- Repeat key navigation for users who scroll to bottom.
- Newsletter signup, social links, contact info.
- Not a dumping ground for orphaned pages.

---

## Web Typography

### Type Scale and Hierarchy
```
Display:    48–72px  — Hero headlines (one per page)
H1:         36–48px  — Page title (one per page)
H2:         28–36px  — Major sections
H3:         22–28px  — Subsections
H4:         18–22px  — Minor headings
Body:       16–18px  — Primary content
Small:      14px     — Captions, metadata
Tiny:       12px     — Legal, timestamps (use sparingly)
```

### Web Typography Rules
1. **16px minimum** body text (18px preferred for long-form).
2. **Line height 1.5–1.7** for body text.
3. **Line length 45–75 characters** (use `max-width: 65ch`).
4. **Maximum 2–3 typefaces** per site (one serif or sans for body, one for headings).
5. **Font weight contrast:** Minimum 2 steps between heading and body (e.g., 400 body, 700 heading).
6. **System font stack** for performance: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
7. **Web fonts:** Limit to 2 weights; use `font-display: swap`.

### Readability Factors
- Sufficient contrast (4.5:1 minimum for body text).
- Adequate paragraph spacing (1–1.5em).
- Left-aligned text (never justified on web — causes rivers).
- Adequate letter-spacing for all-caps text (+0.05–0.1em).

---

## Call-to-Action (CTA) Design

### CTA Hierarchy
| Level | Style | Usage |
|-------|-------|-------|
| Primary | Filled, high contrast | One per viewport section |
| Secondary | Outlined or tonal | Alternative actions |
| Tertiary | Text link | Low-priority actions |
| Destructive | Red/warning color | Delete, cancel subscription |

### CTA Copy Principles
- **Start with a verb:** "Get started," "Download report," "Create account."
- **Be specific:** "Start free trial" beats "Submit."
- **Communicate value:** "Save 20%" or "Get instant access."
- **Create urgency ethically:** "Limited spots" only if true.
- **Avoid generic:** Never "Click here" or "Learn more" as sole CTA without context.

### CTA Placement
- Above the fold for primary conversion action.
- End of content sections (after value is established).
- Sticky/floating CTA on long pages (use sparingly).
- After social proof or testimonials (trust established).
- One primary CTA per logical section; avoid competing CTAs.

### CTA Sizing and Touch
- Minimum 44×44px touch target.
- Padding: 12–16px vertical, 24–32px horizontal.
- Full-width CTAs on mobile for primary actions.
- Adequate spacing between adjacent buttons (8px+ gap).

---

## Web Forms

### Form Layout
- **Single column** for all forms (faster completion, fewer errors).
- **Label above field** (not placeholder-only — placeholders disappear on input).
- **Group related fields** with fieldset/legend or visual grouping.
- **Optional fields marked** (not required fields — mark fewer items).
- **Logical tab order** matching visual order.

### Field Design
| Element | Rule |
|---------|------|
| Labels | Always visible, associated with `for`/`id` |
| Placeholders | Hints only, never replace labels |
| Help text | Below field, linked via `aria-describedby` |
| Errors | Inline below field + summary for multiple errors |
| Required | Asterisk + "(required)" in label; `aria-required="true"` |
| Disabled | Visually distinct; explain why if not obvious |

### Form Validation
- **Validate on blur** (not on every keystroke except format hints).
- **Inline errors** appear next to the field, not in alert boxes.
- **Preserve data** on server-side validation failure.
- **Success feedback** for completed forms (confirmation message or redirect).
- **Password fields:** Show/hide toggle, strength meter, requirements listed.

### Multi-Step Forms
- Progress indicator (steps or percentage).
- Save and resume capability.
- Back button preserves entered data.
- Review step before submission.
- One decision per step when possible.

---

## Data Tables

### When to Use Tables
- Structured data comparison (numbers, dates, statuses).
- Users need to sort, filter, or scan specific columns.
- Data has consistent attributes across rows.

### Table UX Rules
1. **Column headers** always visible; sticky on scroll for long tables.
2. **Left-align text**, right-align numbers.
3. **Zebra striping** or row hover for scanability.
4. **Sortable columns** with clear sort direction indicator.
5. **Responsive:** Horizontal scroll, column hiding, or card transformation on mobile.
6. **Pagination** for >25 rows (or virtual scrolling for power users).
7. **Empty state** when no data matches filters.
8. **Row actions** accessible (not hover-only).

### Table Accessibility
- `<table>`, `<thead>`, `<tbody>`, `<th scope="col/row">`.
- Caption or `aria-label` describing table purpose.
- Sort buttons in headers with `aria-sort` attribute.

---

## Modals and Dialogs

### When to Use Modals
- **Confirm destructive actions** (delete, cancel subscription).
- **Focused sub-tasks** without leaving current page (quick edit, share).
- **Critical alerts** requiring acknowledgment.

### When NOT to Use Modals
- Displaying information that could be inline.
- Multi-step workflows (use dedicated page or drawer).
- Content users need to reference while interacting with background.
- On page load (interrupting and annoying).

### Modal UX Rules
1. **Focus trap:** Tab cycles within modal only.
2. **Escape to close** (unless destructive confirmation).
3. **Click overlay to close** (with same exceptions).
4. **Return focus** to trigger element on close.
5. **Clear title** describing modal purpose.
6. **One primary action** (right side); cancel/close (left side).
7. **Max width:** 500–600px for forms; up to 800px for content.
8. **Scroll:** Modal body scrolls if content exceeds viewport; header/footer fixed.
9. **`role="dialog"`** and `aria-modal="true"`.
10. **Don't stack modals** — close current before opening another.

### Modal Alternatives
| Instead of Modal | Use |
|-----------------|-----|
| Quick edit | Inline editing |
| Settings panel | Side drawer/sheet |
| Confirmation | Inline confirmation or toast with undo |
| Information | Tooltip or expandable section |
| Multi-step flow | Dedicated page or stepper |

---

## Infinite Scroll vs Pagination

### Infinite Scroll
**Pros:** Seamless browsing, engagement (social feeds, image galleries).
**Cons:** No footer access, disorienting, can't bookmark position, accessibility challenges, performance degradation.

**Use when:** Content is homogeneous and exploratory (feeds, galleries, timelines).
**Implement:** "Load more" button as fallback; maintain scroll position on back navigation; provide item count.

### Pagination
**Pros:** Predictable, bookmarkable, footer accessible, better for SEO, easier accessibility.
**Cons:** Extra click to see more, interrupts flow.

**Use when:** Users need to find specific items, compare across pages, or reference positions (search results, product catalogs, admin tables).

**Implement:** Show total count, current page, first/last/prev/next, page numbers (max 7 visible).

### Hybrid: "Load More" Button
- Combines engagement of infinite scroll with control of pagination.
- User explicitly requests more content.
- Footer remains accessible.
- Recommended default for e-commerce and content sites.

---

## Search UX

### Search Box Design
- **Visible search box** (not icon-only) for search-primary sites.
- **Placeholder text:** "Search products..." (specific to content type).
- **Minimum width:** 240px desktop; full-width on mobile.
- **Keyboard shortcut:** Cmd/Ctrl+K to focus search (power users).
- **Clear button** when text is entered.

### Search Results
- **Result count:** "42 results for 'wireless headphones'"
- **Highlight matching terms** in results.
- **Filters and sort** alongside results (category, price, date, relevance).
- **No results state:** Suggestions, popular searches, contact support.
- **Autocomplete/suggestions:** Show after 2–3 characters; recent searches first.
- **Typo tolerance:** "Did you mean...?" for zero-result queries.

### Advanced Search
- Available but not required for basic use.
- Faceted search for large catalogs.
- Search within results.
- Save search / create alert for ongoing needs.

---

## Empty States

Empty states occur when there is no content to display — first use, no results, cleared data, or errors.

### Empty State Anatomy
1. **Illustration or icon** (optional, lightweight).
2. **Heading** explaining the state ("No projects yet").
3. **Description** with context and next step ("Create your first project to get started").
4. **Primary CTA** to resolve the empty state ("Create project").
5. **Secondary action** if applicable ("Import from CSV").

### Empty State Types
| Type | Example | CTA |
|------|---------|-----|
| First use | New account, no data | "Create your first..." |
| No results | Search/filter returned nothing | "Clear filters" or "Try different terms" |
| Cleared | User deleted all items | "Add new..." |
| Error | Failed to load | "Retry" or "Contact support" |
| Permission | User lacks access | "Request access" |
| Offline | No cached data | "Connect to internet" |

### Empty State Rules
- Never show a blank white space with no explanation.
- Match tone to context (friendly for first use, helpful for errors).
- Provide a clear path forward — every empty state needs a CTA.
- Don't use empty states for loading (use skeleton screens).

---

## 404 and Error Page UX

### 404 Page Requirements
1. **Clear message:** "Page not found" (not technical error codes alone).
2. **Maintain site navigation** (header/footer present).
3. **Search box** to help user find what they wanted.
4. **Links to popular pages** or homepage.
5. **Appropriate tone** (slightly playful OK for consumer brands; professional for B2B).
6. **Correct HTTP status** (return 404, not 200 with "not found" text).
7. **Track 404s** in analytics to fix broken links.

### Error Page Hierarchy
| Code | User Message | Action |
|------|-------------|--------|
| 404 | "We can't find that page" | Search, homepage, popular links |
| 403 | "You don't have access" | Login, request access, contact admin |
| 500 | "Something went wrong on our end" | Retry, status page, contact support |
| 503 | "We're temporarily down" | Retry, estimated recovery time |
| Offline | "You're offline" | Retry when connected |

### Error Page Rules
- Never show stack traces or technical details to users.
- Always provide a way out (navigation, search, homepage link).
- Log errors server-side for debugging.
- Custom error pages for every common HTTP error.
- Maintain brand consistency (don't use generic server error pages).

---

## Web Performance UX

### Loading States
| State | Pattern | Duration |
|-------|---------|----------|
| Instant (<100ms) | No indicator needed | Button press feedback |
| Short (100ms–1s) | Button spinner or disabled state | Inline indicator |
| Medium (1–3s) | Skeleton screen or progress bar | Content area placeholder |
| Long (3s+) | Progress bar with percentage/estimate | Full loading state |
| Very long (10s+) | Background processing + notification | Email/push when done |

### Perceived Performance
- Optimistic UI updates (show result before server confirms).
- Skeleton screens over spinners for content areas.
- Lazy load below-fold images and components.
- Prefetch likely next pages on hover (with data budget awareness).

---

## Sources

- Nielsen Norman Group. *F-Shaped Pattern*. https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/
- Nielsen Norman Group. *Scrolling and Attention*. https://www.nngroup.com/articles/scrolling-and-attention/
- Nielsen Norman Group. *Layer-Cake Pattern*. https://www.nngroup.com/articles/layer-cake-pattern-scanning/
- Krug, S. *Don't Make Me Think* (3rd ed.). New Riders.
- Wroblewski, L. *Web Form Design*. Rosenfeld Media.
- Baymard Institute. *Checkout & E-Commerce UX*. https://baymard.com/
- Google. *Web Vitals*. https://web.dev/vitals/
- W3C. *WAI-ARIA Dialog Pattern*. https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Smashing Magazine. *Empty States*. https://www.smashingmagazine.com/2017/02/user-friendly-empty-states/
- HTTP Status Codes. *MDN*. https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
